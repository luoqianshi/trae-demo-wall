"""FastAPI 路由定义 — MVP 阶段 API。"""

import asyncio
from functools import partial
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json as _json
import uuid as _uuid
from pydantic import BaseModel, Field
from loguru import logger

from app.api.schemas import (
    BatchCreateRequest,
    ErrorResponse,
    ParseRequest,
    ParseResponse,
    TaskCreateRequest,
    TaskListResponse,
    TaskResponse,
)
from app.models.video import VideoTaskStatus
from app.services.task_queue import task_queue
from app.services.deduplicator import DedupConfig, VideoDeduplicator, get_progress, clear_progress
from app.services.dedup_filters import get_available_filters
from app.services.downloader import VideoDownloader
from app.services.task_manager import task_manager

router = APIRouter(prefix="/api/v1")

downloader = VideoDownloader()
deduplicator = VideoDeduplicator()


def _task_to_response(task) -> TaskResponse:
    # 获取队列状态
    q_info = task_queue.get_task_position(task.id)
    q_status = q_info.get("status", "") if q_info.get("in_queue") else ""
    q_pos = q_info.get("position", 0) if q_info.get("in_queue") else 0

    return TaskResponse(
        id=task.id,
        url=task.source.url,
        platform=task.source.platform.value,
        title=task.source.title,
        status=task.status.value,
        local_path=task.local_path,
        output_path=task.output_path,
        error_message=task.error_message,
        publish_result=task.publish_result,
        created_at=task.created_at.isoformat(),
        updated_at=task.updated_at.isoformat(),
        started_at=task.started_at.isoformat() if task.started_at else "",
        completed_at=task.completed_at.isoformat() if task.completed_at else "",
        queue_status=q_status,
        queue_position=q_pos,
    )


# ---- 滤镜列表 ----

@router.get("/filters")
async def list_filters():
    """获取所有可用的去重滤镜。"""
    return {"filters": get_available_filters()}


# ---- 视频解析 ----

@router.post("/parse", response_model=ParseResponse, responses={400: {"model": ErrorResponse}})
async def parse_video(req: ParseRequest):
    """解析视频链接，返回源信息（不下载）。"""
    try:
        source = await downloader.parse_url(req.url)
        return ParseResponse(
            platform=source.platform.value,
            title=source.title,
            video_url=source.video_url,
            cover_url=source.cover_url,
            duration=source.duration,
            author=source.author,
            tags=source.tags,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---- 任务管理 ----

@router.post("/tasks", response_model=TaskResponse, responses={400: {"model": ErrorResponse}})
async def create_task(req: TaskCreateRequest):
    """创建视频处理任务：解析 → 下载 → 去重（异步执行）。"""
    task = task_manager.create_task(req.url)

    # 提交到任务队列（限制并发）
    await task_queue.submit(task.id, lambda: _process_pipeline(task.id, req))

    return _task_to_response(task)


async def _process_pipeline(task_id: str, req: TaskCreateRequest):
    """后台处理流水线：下载 → 去重。"""
    task = task_manager.get_task(task_id)
    if not task:
        return

    try:
        # 1. 解析 + 下载
        task_manager.update_status(task_id, VideoTaskStatus.DOWNLOADING)
        source = await downloader.parse_url(req.url)
        task.source = source
        local_path = await downloader.download(source)
        task.local_path = str(local_path)
        task_manager.update_status(task_id, VideoTaskStatus.DOWNLOADED)

        # 2. 去重处理
        if req.dedup:
            task_manager.update_status(task_id, VideoTaskStatus.PROCESSING)
            config = DedupConfig(
                change_speed=True,
                speed_min=req.speed_min,
                speed_max=req.speed_max,
                change_framerate=req.change_framerate,
                change_resolution=req.change_resolution,
                custom_filters=req.custom_filters if req.custom_filters else None,
                filter_level=req.filter_level,
            )
            dedup = VideoDeduplicator(config, task_id=task_id)
            result = await asyncio.to_thread(dedup.process, local_path)
            if result.success:
                task.output_path = result.output_path
                task_manager.update_task(
                    task_id,
                    output_path=result.output_path,
                    publish_result={
                        "operations": result.operations,
                        "verified": result.verified,
                        "original_md5": result.original_md5[:12],
                        "output_md5": result.output_md5[:12],
                        "input_size": result.input_size,
                        "output_size": result.output_size,
                    },
                )
                task_manager.update_status(task_id, VideoTaskStatus.PROCESSED)
            else:
                task_manager.update_status(task_id, VideoTaskStatus.FAILED, result.error)
                return
        else:
            task.output_path = str(local_path)
            task_manager.update_status(task_id, VideoTaskStatus.PROCESSED)

    except Exception as e:
        logger.error("任务处理失败: id={} error={}", task_id, e)
        task_manager.update_status(task_id, VideoTaskStatus.FAILED, str(e))


@router.get("/tasks", response_model=TaskListResponse)
async def list_tasks(status: str | None = None):
    """获取任务列表。"""
    filter_status = None
    if status:
        try:
            filter_status = VideoTaskStatus(status)
        except ValueError:
            raise HTTPException(400, f"无效状态: {status}")

    tasks = task_manager.list_tasks(filter_status)
    return TaskListResponse(
        total=len(tasks),
        tasks=[_task_to_response(t) for t in tasks],
    )


@router.post("/tasks/batch")
async def batch_create_tasks(req: BatchCreateRequest):
    """批量创建任务，全部提交到队列。"""
    if not req.urls:
        raise HTTPException(400, "链接列表不能为空")

    created = []
    errors = []
    for url in req.urls:
        url = url.strip()
        if not url:
            continue
        try:
            task = task_manager.create_task(url)
            pipeline_req = TaskCreateRequest(
                url=url,
                dedup=req.dedup,
                speed_min=req.speed_min,
                speed_max=req.speed_max,
                change_framerate=req.change_framerate,
                change_resolution=req.change_resolution,
                custom_filters=req.custom_filters,
                filter_level=req.filter_level,
            )
            await task_queue.submit(task.id, partial(_process_pipeline, task.id, pipeline_req))
            created.append({"id": task.id, "url": url})
        except Exception as e:
            errors.append({"url": url, "error": str(e)})

    return {
        "created": len(created),
        "errors": len(errors),
        "tasks": created,
        "error_details": errors,
    }


@router.delete("/tasks")
async def clear_all_tasks(delete_files: bool = False):
    """清空所有任务。delete_files=true 时同时删除本地文件。"""
    import shutil
    tasks = task_manager.list_tasks()
    deleted_files = 0
    for t in tasks:
        # 删除视频文件
        if delete_files:
            for p in [t.output_path, t.local_path]:
                if p:
                    try:
                        pp = Path(p)
                        if pp.exists():
                            pp.unlink()
                            deleted_files += 1
                    except Exception:
                        pass
            # 删除任务目录
            if t.local_path:
                try:
                    folder = Path(t.local_path).parent
                    if folder.exists() and folder.name.startswith("task_"):
                        shutil.rmtree(folder, ignore_errors=True)
                except Exception:
                    pass
        task_manager.delete_task(t.id)

    # 清理任务队列
    from app.services.task_queue import task_queue
    for tid in list(task_queue._queue.keys()):
        await task_queue.cancel(tid)

    return {"message": f"已清空 {len(tasks)} 个任务", "deleted_files": deleted_files}


@router.get("/queue/status")
async def queue_status():
    """获取任务队列状态。"""
    return task_queue.get_queue_status()


@router.get("/tasks/{task_id}/queue")
async def task_queue_position(task_id: str):
    """获取指定任务在队列中的位置。"""
    return task_queue.get_task_position(task_id)


@router.post("/tasks/{task_id}/cancel")
async def cancel_task(task_id: str):
    """取消排队中或运行中的任务。"""
    success = await task_queue.cancel(task_id)
    if not success:
        raise HTTPException(400, "无法取消任务（可能已完成或不存在）")
    from app.services.task_manager import task_manager as tm
    tm.update_status(task_id, VideoTaskStatus.FAILED, "用户取消")
    return {"message": "已取消", "task_id": task_id}


@router.get("/tasks/{task_id}/progress")
async def get_task_progress(task_id: str):
    """获取任务实时进度。"""
    progress = get_progress(task_id)
    if not progress:
        task = task_manager.get_task(task_id)
        if not task:
            raise HTTPException(404, f"任务不存在: {task_id}")
        if task.status.value in ("processed", "published", "failed"):
            return {"task_id": task_id, "percent": 100, "complete": True, "step_name": "完成"}
        return {"task_id": task_id, "percent": 0, "complete": False, "step_name": "等待中"}
    return progress


@router.get("/tasks/stream")
async def task_stream():
    """SSE 端点：推送任务列表变更（替代前端轮询）。"""
    import asyncio as _aio

    q = task_manager.subscribe()

    async def event_stream():
        try:
            # 先推一次全量
            tasks = task_manager.list_tasks()
            data = _json.dumps({
                "type": "snapshot",
                "total": len(tasks),
                "tasks": [_task_to_response(t).model_dump(mode="json") for t in tasks],
            }, ensure_ascii=False)
            yield f"data: {data}\n\n"

            while True:
                try:
                    event = await asyncio.wait_for(q.get(), timeout=15)
                    tasks = task_manager.list_tasks()
                    payload = {
                        "type": "update",
                        "event": event["type"],
                        "task_id": event["task_id"],
                        "total": len(tasks),
                        "tasks": [_task_to_response(t).model_dump(mode="json") for t in tasks],
                    }
                    yield f"data: {_json.dumps(payload, ensure_ascii=False)}\n\n"
                except _aio.TimeoutError:
                    yield ": keepalive\n\n"  # 心跳
        except asyncio.CancelledError:
            pass
        finally:
            task_manager.unsubscribe(q)

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """获取单个任务详情。"""
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(404, f"任务不存在: {task_id}")
    return _task_to_response(task)


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """删除任务。"""
    if not task_manager.delete_task(task_id):
        raise HTTPException(404, f"任务不存在: {task_id}")
    return {"message": "已删除"}


@router.post("/tasks/{task_id}/open-folder")
async def open_task_folder(task_id: str):
    """在 Finder 中打开任务文件所在文件夹。"""
    import subprocess
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(404, f"任务不存在: {task_id}")

    # 优先打开输出文件夹，否则打开本地文件夹
    file_path = Path(task.output_path) if task.output_path else Path(task.local_path) if task.local_path else None
    if not file_path or not file_path.exists():
        raise HTTPException(400, "文件不存在")

    folder = file_path.parent
    subprocess.Popen(["open", str(folder)])
    return {"message": f"已打开文件夹: {folder}", "path": str(folder)}


# ---- 字幕替换 ----

class SubtitleReplaceRequest(BaseModel):
    task_id: str
    new_texts: list[str] = Field(default_factory=list, description="新字幕文字列表，为空则用 OCR/语音识别结果")
    blur_level: str = Field(default="medium", description="模糊强度: light/medium/heavy")
    use_audio: bool = Field(default=False, description="是否用 Whisper 从音频生成字幕")
    whisper_model: str = Field(default="base", description="Whisper 模型: tiny/base/small/medium")


@router.post("/subtitle/replace")
async def subtitle_replace(req: SubtitleReplaceRequest):
    """检测字幕区域 → 模糊原字幕 → 叠加新字幕。"""
    from app.services.subtitle_processor import process_subtitle_replace
    from app.models.video import VideoTaskStatus

    task = task_manager.get_task(req.task_id)
    if not task:
        raise HTTPException(404, f"任务不存在: {req.task_id}")

    input_path = Path(task.output_path) if task.output_path else Path(task.local_path)
    if not input_path.exists():
        raise HTTPException(400, f"视频文件不存在: {input_path}")

    # 输出路径
    stem = input_path.stem
    output_path = input_path.parent / f"{stem}_sub.mp4"

    try:
        # 生成进度追踪 ID
        prog_id = _uuid.uuid4().hex[:12]
        result = await asyncio.to_thread(
            process_subtitle_replace,
            input_path,
            output_path,
            req.new_texts if req.new_texts else None,
            req.blur_level,
            req.use_audio,
            req.whisper_model,
            prog_id,
        )
        return {
            "success": result["success"],
            "progress_id": prog_id,
            "output_path": result["output_path"],
            "region": result["region"],
            "original_texts": result["original_texts"],
            "segments": result.get("segments", []),
        }
    except Exception as e:
        logger.error("字幕替换失败: {}", e)
        from app.services.subtitle_processor import _finish
        _finish(prog_id, False, f"❌ 失败: {e}")
        raise HTTPException(500, f"字幕替换失败: {e}")



@router.get("/subtitle/progress/{progress_id}")
async def subtitle_progress(progress_id: str):
    """SSE 端点：实时推送字幕替换进度。"""
    from app.services.subtitle_processor import get_progress, clear_progress

    async def event_stream():
        import asyncio as _aio
        for _ in range(300):  # 最多等 5 分钟
            prog = get_progress(progress_id)
            if prog:
                yield f"data: {_json.dumps(prog, ensure_ascii=False)}\n\n"
                if prog.get("done"):
                    clear_progress(progress_id)
                    return
            else:
                yield f"data: {_json.dumps({'pct': 0, 'step': '等待中...'})}\n\n"
            await _aio.sleep(0.5)
        yield f"data: {_json.dumps({'pct': 0, 'step': '超时', 'done': True, 'success': False})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")




