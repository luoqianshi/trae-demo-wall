"""数据 API：返回分析结果（轨迹、统计、报告）"""
from typing import List
from fastapi import APIRouter, HTTPException

from storage.database import execute_query, execute_single
from engine.statistics import generate_report

router = APIRouter()


@router.get("/api/data/{task_id}")
async def get_full_analysis(task_id: str):
    """获取完整分析结果

    Returns:
        包含球员数据、足球轨迹和分析报告的完整结果
    """
    # 检查任务是否存在
    task = execute_single("SELECT * FROM tasks WHERE id = ?", (task_id,))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    if task["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"任务尚未完成，当前状态: {task['status']}",
        )

    # 获取球员统计
    stats = execute_query(
        "SELECT * FROM player_stats WHERE task_id = ?",
        (task_id,),
    )

    # 获取所有球员ID和球队
    player_ids = []
    player_teams = {}
    for s in stats:
        pid = s["player_id"]
        player_ids.append(pid)
        player_teams[pid] = s["team"]

    # 构建球员数据（含统计）
    players = []
    for s in stats:
        # 获取该球员的轨迹
        trajectory = execute_query(
            """
            SELECT frame_number, timestamp, x_field, y_field, x_pixel, y_pixel
            FROM player_tracks
            WHERE task_id = ? AND player_id = ?
            ORDER BY frame_number
            """,
            (task_id, s["player_id"]),
        )
        players.append(
            {
                "player_id": s["player_id"],
                "team": s["team"],
                "stats": {
                    "total_distance": s["total_distance"],
                    "possession_time": s["possession_time"],
                    "possession_rate": s["possession_rate"],
                    "pass_count": s["pass_count"],
                    "pass_success_count": s["pass_success_count"],
                    "pass_success_rate": s["pass_success_rate"],
                    "shot_count": s["shot_count"],
                    "avg_speed": s["avg_speed"],
                    "max_speed": s["max_speed"],
                    "main_zone": s["main_zone"],
                },
                "trajectory": trajectory,
            }
        )

    # 获取足球轨迹
    ball = execute_query(
        """
        SELECT frame_number, timestamp, x_field, y_field, x_pixel, y_pixel
        FROM ball_tracks
        WHERE task_id = ?
        ORDER BY frame_number
        """,
        (task_id,),
    )

    # 生成分析报告
    stats_dict = {s["player_id"]: s for s in stats}
    report = generate_report(stats_dict, task["duration_seconds"], player_teams)

    return {
        "task_id": task_id,
        "status": task["status"],
        "players": players,
        "ball": {"trajectory": ball},
        "report": report,
    }


@router.get("/api/data/{task_id}/players")
async def get_players(task_id: str):
    """获取球员列表

    Returns:
        球员列表（含统计信息，不含轨迹）
    """
    task = execute_single("SELECT * FROM tasks WHERE id = ?", (task_id,))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    stats = execute_query(
        "SELECT * FROM player_stats WHERE task_id = ?",
        (task_id,),
    )

    players = []
    for s in stats:
        players.append(
            {
                "player_id": s["player_id"],
                "team": s["team"],
                "stats": {
                    "total_distance": s["total_distance"],
                    "possession_time": s["possession_time"],
                    "possession_rate": s["possession_rate"],
                    "pass_count": s["pass_count"],
                    "pass_success_count": s["pass_success_count"],
                    "pass_success_rate": s["pass_success_rate"],
                    "shot_count": s["shot_count"],
                    "avg_speed": s["avg_speed"],
                    "max_speed": s["max_speed"],
                    "main_zone": s["main_zone"],
                },
            }
        )

    return {"task_id": task_id, "players": players}


@router.get("/api/data/{task_id}/trajectory/{player_id}")
async def get_player_trajectory(task_id: str, player_id: int):
    """获取指定球员的轨迹

    Args:
        task_id: 任务ID
        player_id: 球员ID

    Returns:
        球员的完整轨迹数据
    """
    task = execute_single("SELECT * FROM tasks WHERE id = ?", (task_id,))
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    # 获取球员信息
    player_stat = execute_single(
        "SELECT * FROM player_stats WHERE task_id = ? AND player_id = ?",
        (task_id, player_id),
    )

    if not player_stat:
        raise HTTPException(status_code=404, detail="球员不存在")

    # 获取轨迹
    trajectory = execute_query(
        """
        SELECT frame_number, timestamp, x_field, y_field, x_pixel, y_pixel
        FROM player_tracks
        WHERE task_id = ? AND player_id = ?
        ORDER BY frame_number
        """,
        (task_id, player_id),
    )

    return {
        "task_id": task_id,
        "player_id": player_id,
        "team": player_stat["team"],
        "trajectory": trajectory,
    }
