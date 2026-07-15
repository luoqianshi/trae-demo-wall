"""分析 API：触发分析任务和查询任务状态"""
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks

from storage.database import execute_single, execute_update
from engine.pipeline import PingPongAnalysisPipeline
from api.websocket import progress_manager

router = APIRouter()

# 全局流水线实例
pipeline = PingPongAnalysisPipeline()


@router.post("/api/pingpong/analyze/{task_id}")
async def analyze_task(task_id: str, background_tasks: BackgroundTasks):
    """触发异步分析任务

    Args:
        task_id: 任务ID

    Returns:
        {"task_id": "xxx", "message": "分析任务已启动"}
    """
    # 查询任务是否存在
    task = execute_single("SELECT * FROM pingpong_tasks WHERE id = ?", (task_id,))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    if task["status"] == "processing":
        raise HTTPException(status_code=400, detail="任务正在处理中")

    if task["status"] == "completed":
        raise HTTPException(status_code=400, detail="任务已完成分析")

    # 更新任务状态为处理中
    execute_update(
        "UPDATE pingpong_tasks SET status = 'processing' WHERE id = ?",
        (task_id,),
    )

    # 在后台任务中执行分析
    async def run_analysis():
        """异步执行分析任务"""
        async def progress_callback(processed, total, percentage, filtered=0, error=None):
            """进度回调：通过 WebSocket 推送进度"""
            if error:
                await progress_manager.broadcast(
                    task_id,
                    {"type": "error", "message": error},
                )
            else:
                await progress_manager.broadcast(
                    task_id,
                    {
                        "type": "progress",
                        "processed": processed,
                        "total": total,
                        "percentage": percentage,
                        "filtered_frames": filtered,
                    },
                )
                if percentage >= 100.0:
                    await progress_manager.broadcast(
                        task_id,
                        {"type": "completed", "message": "分析完成", "filtered_frames": filtered},
                    )

        try:
            await pipeline.run(task_id, task["video_path"], progress_callback)
        except Exception as e:
            await progress_manager.broadcast(
                task_id,
                {"type": "error", "message": str(e)},
            )

    background_tasks.add_task(run_analysis)

    return {"task_id": task_id, "message": "分析任务已启动"}


@router.post("/api/pingpong/analyze/{task_id}/mock")
async def mock_analysis(task_id: str):
    """使用模拟数据生成分析结果（无需真实视频）"""
    from engine.mock_data import generate_mock_task

    task = execute_single("SELECT * FROM pingpong_tasks WHERE id = ?", (task_id,))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    result = generate_mock_task(task_id)
    return {"message": "模拟分析完成", "detail": result}


@router.get("/api/pingpong/status/{task_id}")
async def get_task_status(task_id: str):
    """查询任务状态

    Args:
        task_id: 任务ID

    Returns:
        任务状态和进度信息
    """
    task = execute_single("SELECT * FROM pingpong_tasks WHERE id = ?", (task_id,))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    total = task["total_frames"] or 0
    processed = task["processed_frames"] or 0
    filtered = task["filtered_frames"] or 0
    percentage = round(processed / total * 100, 1) if total > 0 else 0

    return {
        "task_id": task_id,
        "status": task["status"],
        "total_frames": total,
        "processed_frames": processed,
        "filtered_frames": filtered,
        "percentage": percentage,
        "duration_seconds": task["duration_seconds"],
        "error_message": task.get("error_message"),
        "created_at": task["created_at"],
        "completed_at": task.get("completed_at"),
    }
