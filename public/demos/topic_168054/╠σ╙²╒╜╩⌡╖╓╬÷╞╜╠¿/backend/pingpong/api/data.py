"""数据 API：返回分析结果（球员轨迹、球3D轨迹、落点、统计、报告）"""
from typing import List
from fastapi import APIRouter, HTTPException

from storage.database import execute_query, execute_single
from engine.statistics import generate_report

router = APIRouter()


@router.get("/api/pingpong/data/{task_id}")
async def get_full_analysis(task_id: str):
    """获取完整分析结果

    Returns:
        包含球员数据、球的3D轨迹、落点、统计数据和文字报告的完整结果
    """
    # 检查任务是否存在
    task = execute_single("SELECT * FROM pingpong_tasks WHERE id = ?", (task_id,))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    if task["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"任务尚未完成，当前状态: {task['status']}",
        )

    # 获取球员统计
    stats = execute_query(
        "SELECT * FROM pingpong_player_stats WHERE task_id = ?",
        (task_id,),
    )

    # 构建球员数据（含统计和轨迹）
    players = []
    stats_dict = {}
    for s in stats:
        pid = s["player_id"]
        stats_dict[pid] = s
        # 获取该球员的轨迹
        trajectory = execute_query(
            """
            SELECT frame_number, timestamp, x_table, y_table, x_pixel, y_pixel
            FROM pingpong_player_tracks
            WHERE task_id = ? AND player_id = ?
            ORDER BY frame_number
            """,
            (task_id, pid),
        )
        players.append({
            "player_id": pid,
            "stats": s,
            "trajectory": trajectory,
        })

    # 获取球的 3D 轨迹
    ball_3d = execute_query(
        """
        SELECT frame_number, timestamp, x_table, y_table, z_height, x_pixel, y_pixel, ball_pixel_size
        FROM pingpong_ball_tracks_3d
        WHERE task_id = ?
        ORDER BY frame_number
        """,
        (task_id,),
    )

    # 获取落点数据
    landing_points = execute_query(
        """
        SELECT frame_number, timestamp, x_table, y_table, zone, rally_id
        FROM pingpong_landing_points
        WHERE task_id = ?
        ORDER BY frame_number
        """,
        (task_id,),
    )

    # 生成文字报告
    report = generate_report(stats_dict, task["duration_seconds"])

    return {
        "task_id": task_id,
        "status": task["status"],
        "players": players,
        "ball_3d": ball_3d,
        "landing_points": landing_points,
        "stats": stats,
        "report": report,
        "filtered_frames": task.get("filtered_frames", 0),
    }


@router.get("/api/pingpong/data/{task_id}/players")
async def get_players(task_id: str):
    """获取球员列表（含统计信息，不含轨迹）"""
    task = execute_single("SELECT * FROM pingpong_tasks WHERE id = ?", (task_id,))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    stats = execute_query(
        "SELECT * FROM pingpong_player_stats WHERE task_id = ?",
        (task_id,),
    )

    return {"task_id": task_id, "players": stats}


@router.get("/api/pingpong/data/{task_id}/ball")
async def get_ball_trajectory(task_id: str):
    """获取球的 3D 轨迹"""
    task = execute_single("SELECT * FROM pingpong_tasks WHERE id = ?", (task_id,))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    ball_3d = execute_query(
        """
        SELECT frame_number, timestamp, x_table, y_table, z_height, x_pixel, y_pixel, ball_pixel_size
        FROM pingpong_ball_tracks_3d
        WHERE task_id = ?
        ORDER BY frame_number
        """,
        (task_id,),
    )

    return {"task_id": task_id, "ball_3d": ball_3d}


@router.get("/api/pingpong/data/{task_id}/landings")
async def get_landing_points(task_id: str):
    """获取落点数据"""
    task = execute_single("SELECT * FROM pingpong_tasks WHERE id = ?", (task_id,))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    landing_points = execute_query(
        """
        SELECT frame_number, timestamp, x_table, y_table, zone, rally_id
        FROM pingpong_landing_points
        WHERE task_id = ?
        ORDER BY frame_number
        """,
        (task_id,),
    )

    return {"task_id": task_id, "landing_points": landing_points}
