"""节点6: 视频生成 - 故事板全部生图完成后，为每个故事板生成 5 秒图生视频。

流程：
1. 阶段1（串行）：为每个 status=done 且有 image_url 的故事板创建 Video 记录 + Agnes 视频任务
   - 5 秒间隔（20 RPM 保险）
   - 发 video_creating 事件，前端据此添加 VideoNode 到画布
2. 阶段2（并行）：轮询所有任务，每个任务独立 10 秒间隔，超时 600 秒
   - 完成时下载 mp4 保存本地，发 video_done 事件
   - 失败/超时发 video_failed 事件
3. 标记项目 done + 发 workflow_done

单任务失败不阻断其他任务。
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from app.agents.events import emit_event
from app.agents.state import VideoItem, WorkflowState
from app.config import settings
from app.database import SessionLocal
from app.models import AssetStatus, Project, Video
from app.services.storage import save_video
from app.services.video_client import create_video_task, download_video, poll_video

logger = logging.getLogger(__name__)


async def video_generator(state: WorkflowState) -> dict:
    project_id = state["project_id"]
    await emit_event(project_id, {"event": "status", "stage": "video_generating"})

    # 筛选可生成视频的故事板：status=done 且有 image_url（图生视频需要图片 URL）
    storyboards = state.get("storyboards", [])
    # 按 episode_index, index 排序确保顺序
    sorted_sbs = sorted(
        [sb for sb in storyboards if sb.get("status") == "done" and sb.get("image_url")],
        key=lambda s: (s.get("episode_index", 0), s.get("index", 0)),
    )

    if not settings.agnes_api_key:
        logger.warning("未配置 AGNES_API_KEY，跳过视频生成")
        await _finish_project(project_id)
        return {"videos": []}

    if not sorted_sbs:
        logger.info("没有可生成视频的故事板（无 image_url），直接结束工作流")
        await _finish_project(project_id)
        return {"videos": []}

    videos: list[VideoItem] = []
    # (video_item, agnes_video_id) - 用于阶段2并行轮询
    tasks_to_poll: list[tuple[VideoItem, str]] = []

    # ===== 阶段1: 串行创建视频任务 =====
    for sb in sorted_sbs:
        sb_id = sb["id"]
        video_prompt = _build_video_prompt(sb.get("prompt", ""))
        video_db_id: str | None = None

        try:
            # 1.1 在 DB 创建 Video 记录
            with SessionLocal() as db:
                video = Video(
                    project_id=project_id,
                    storyboard_id=sb_id,
                    prompt=video_prompt,
                    status=AssetStatus.generating,
                    num_frames=settings.agnes_video_num_frames,
                    frame_rate=settings.agnes_video_frame_rate,
                    width=settings.agnes_video_width,
                    height=settings.agnes_video_height,
                )
                db.add(video)
                db.commit()
                db.refresh(video)
                video_db_id = video.id

            # 1.2 发 video_creating 事件，前端添加 VideoNode
            await emit_event(project_id, {
                "event": "video_creating",
                "storyboard_id": sb_id,
                "episode_id": sb.get("episode_id"),
                "episode_index": sb.get("episode_index", 0),
                "index": sb.get("index", 0),
                "video_id": video_db_id,
                "prompt": video_prompt,
            })

            # 1.3 创建 Agnes 视频任务（图生视频）
            result = await create_video_task(video_prompt, image_url=sb["image_url"])
            task_id = result.get("task_id") or result.get("id")
            agnes_video_id = result.get("video_id") or task_id

            if not agnes_video_id:
                raise RuntimeError(f"Agnes 创建任务未返回 video_id/task_id: {result}")

            # 1.4 更新 DB 的 task_id 和 video_id
            with SessionLocal() as db:
                obj = db.get(Video, video_db_id)
                if obj:
                    obj.task_id = task_id
                    obj.video_id = agnes_video_id
                    db.commit()

            item: VideoItem = {
                "id": video_db_id,
                "storyboard_id": sb_id,
                "prompt": video_prompt,
                "task_id": task_id,
                "video_id": agnes_video_id,
                "status": "generating",
                "progress": 0,
            }
            videos.append(item)
            tasks_to_poll.append((item, agnes_video_id))

            logger.info(
                "视频任务已创建: video_id=%s, storyboard=%s, agnes_task=%s",
                video_db_id, sb_id, agnes_video_id,
            )

        except Exception as e:  # noqa: BLE001
            logger.exception("视频任务创建失败: storyboard=%s", sb_id)
            msg = str(e)
            if "余额" in msg or "金额" in msg or "balance" in msg.lower():
                msg = "视频 API 余额不足，请充值后再试"
            # 标记 Video 记录为 failed
            if video_db_id:
                with SessionLocal() as db:
                    obj = db.get(Video, video_db_id)
                    if obj:
                        obj.status = AssetStatus.failed
                        obj.error = msg
                        db.commit()
            await emit_event(project_id, {
                "event": "video_failed",
                "video_id": video_db_id,
                "storyboard_id": sb_id,
                "message": msg,
            })

    # ===== 阶段2: 并行轮询所有任务 =====
    if tasks_to_poll:
        await asyncio.gather(
            *[_poll_one(project_id, item, vid) for item, vid in tasks_to_poll],
            return_exceptions=True,
        )

    # ===== 标记项目完成 =====
    await _finish_project(project_id)

    return {"videos": videos}


async def _poll_one(project_id: str, item: VideoItem, agnes_video_id: str) -> None:
    """轮询单个视频任务直到完成/失败/超时。"""
    loop = asyncio.get_event_loop()
    deadline = loop.time() + settings.video_poll_timeout
    video_db_id = item["id"]
    last_progress = -1

    while loop.time() < deadline:
        try:
            result = await poll_video(agnes_video_id)
        except Exception as e:  # noqa: BLE001
            # 单次轮询失败，继续重试
            logger.warning("视频轮询失败 (video_id=%s): %s", agnes_video_id, e)
            await asyncio.sleep(settings.video_poll_interval)
            continue

        status = result.get("status", "")
        progress = int(result.get("progress", 0) or 0)

        # 进度更新（仅在变化时发事件，避免刷屏）
        if progress != last_progress:
            last_progress = progress
            with SessionLocal() as db:
                obj = db.get(Video, video_db_id)
                if obj:
                    obj.progress = progress
                    db.commit()
            item["progress"] = progress
            await emit_event(project_id, {
                "event": "video_progress",
                "video_id": video_db_id,
                "storyboard_id": item["storyboard_id"],
                "progress": progress,
            })

        if status == "completed":
            url = result.get("url")
            if not url:
                # 完成但无 url，视为失败
                await _mark_failed(project_id, video_db_id, item, "Agnes 返回 completed 但无 url")
                return
            try:
                mp4_bytes = await download_video(url)
                filename = f"video_{video_db_id}_{datetime.now().strftime('%H%M%S')}.mp4"
                rel_path = save_video(project_id, filename, mp4_bytes)
                seconds = result.get("seconds")

                with SessionLocal() as db:
                    obj = db.get(Video, video_db_id)
                    if obj:
                        obj.status = AssetStatus.done
                        obj.video_path = rel_path
                        obj.video_url = url
                        obj.seconds = str(seconds) if seconds is not None else None
                        db.commit()

                item["status"] = "done"
                item["video_path"] = rel_path
                item["video_url"] = url

                await emit_event(project_id, {
                    "event": "video_done",
                    "video_id": video_db_id,
                    "storyboard_id": item["storyboard_id"],
                    "video_path": rel_path,
                    "video_url": url,
                })
                logger.info("视频生成完成: video_id=%s, path=%s", video_db_id, rel_path)
            except Exception as e:  # noqa: BLE001
                logger.exception("视频下载/保存失败: video_id=%s", video_db_id)
                await _mark_failed(project_id, video_db_id, item, f"视频下载失败: {e}")
            return

        if status == "failed":
            err = result.get("error") or "Agnes 返回 failed 状态"
            await _mark_failed(project_id, video_db_id, item, str(err))
            return

        # queued / in_progress 继续轮询

    # 超时
    await _mark_failed(project_id, video_db_id, item, "视频生成超时")


async def _mark_failed(
    project_id: str,
    video_db_id: str,
    item: VideoItem,
    message: str,
) -> None:
    """标记视频为失败状态。"""
    item["status"] = "failed"
    item["error"] = message
    with SessionLocal() as db:
        obj = db.get(Video, video_db_id)
        if obj:
            obj.status = AssetStatus.failed
            obj.error = message
            db.commit()
    await emit_event(project_id, {
        "event": "video_failed",
        "video_id": video_db_id,
        "storyboard_id": item["storyboard_id"],
        "message": message,
    })


async def _finish_project(project_id: str) -> None:
    """标记项目 done + 发 workflow_done。"""
    with SessionLocal() as db:
        proj = db.get(Project, project_id)
        if proj:
            proj.status = "done"
            db.commit()
    await emit_event(project_id, {"event": "workflow_done", "project_id": project_id})


def _build_video_prompt(storyboard_prompt: str) -> str:
    """把故事板 prompt 改写为视频动效描述。"""
    # 前缀引导模型生成 5 秒自然动效 + 电影感镜头运动
    return (
        "Animate this scene with natural motion and cinematic camera movement. "
        f"{storyboard_prompt}"
    )


async def regenerate_single_video(project_id: str, video_id: str) -> None:
    """重新生成单个视频（供 API 调用，作为后台任务运行）。

    流程：重置状态 → 创建 Agnes 任务 → 轮询 → 下载保存 → 发 WS 事件
    """
    # 获取视频记录和故事板
    with SessionLocal() as db:
        video = db.get(Video, video_id)
        if not video:
            logger.error("视频记录不存在: %s", video_id)
            return
        sb = db.get(Storyboard, video.storyboard_id)
        if not sb:
            await _mark_failed(project_id, video_id, {"storyboard_id": video.storyboard_id}, "故事板不存在")
            return
        if not sb.image_url:
            await _mark_failed(project_id, video_id, {"storyboard_id": video.storyboard_id}, "故事板无 image_url，无法图生视频")
            return

        prompt = video.prompt or _build_video_prompt(sb.prompt or "")
        image_url = sb.image_url
        storyboard_id = video.storyboard_id

        # 重置状态
        video.status = AssetStatus.generating
        video.progress = 0
        video.error = None
        video.task_id = None
        video.video_id = None
        db.commit()

    # 发进度事件让前端更新
    await emit_event(project_id, {
        "event": "video_progress",
        "video_id": video_id,
        "storyboard_id": storyboard_id,
        "progress": 0,
    })

    # 创建 Agnes 视频任务
    try:
        result = await create_video_task(prompt, image_url=image_url)
        task_id = result.get("task_id") or result.get("id")
        agnes_video_id = result.get("video_id") or task_id

        if not agnes_video_id:
            raise RuntimeError(f"Agnes 创建任务未返回 video_id/task_id: {result}")

        with SessionLocal() as db:
            obj = db.get(Video, video_id)
            if obj:
                obj.task_id = task_id
                obj.video_id = agnes_video_id
                db.commit()

        logger.info("视频重生成任务已创建: video_id=%s, agnes_task=%s", video_id, agnes_video_id)
    except Exception as e:  # noqa: BLE001
        logger.exception("视频重生成创建任务失败: video_id=%s", video_id)
        msg = str(e)
        if "余额" in msg or "金额" in msg or "balance" in msg.lower():
            msg = "视频 API 余额不足，请充值后再试"
        await _mark_failed(project_id, video_id, {"storyboard_id": storyboard_id}, msg)
        return

    # 轮询
    item: VideoItem = {
        "id": video_id,
        "storyboard_id": storyboard_id,
        "prompt": prompt,
        "task_id": task_id,
        "video_id": agnes_video_id,
        "status": "generating",
        "progress": 0,
    }
    await _poll_one(project_id, item, agnes_video_id)
