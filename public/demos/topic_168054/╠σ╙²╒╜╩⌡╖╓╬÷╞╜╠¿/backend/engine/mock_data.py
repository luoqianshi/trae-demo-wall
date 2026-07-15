"""模拟数据生成器：生成假的球员轨迹和统计数据，用于测试和演示"""
import random
import math
from typing import Dict, List
from storage.database import execute_update, execute_query, get_connection
from engine.statistics import calculate_statistics, generate_report

def generate_mock_task(task_id: str, duration: int = 2400):
    """生成模拟分析任务数据

    Args:
        task_id: 任务ID
        duration: 比赛时长（秒），默认2400（40分钟）
    """
    # 更新任务状态
    execute_update(
        "UPDATE tasks SET status = 'completed', total_frames = ?, processed_frames = ?, duration_seconds = ?, completed_at = datetime('now') WHERE id = ?",
        (200, 200, duration, task_id)
    )

    # 生成10个球员的模拟数据
    players = [
        {"id": 1, "team": "team_a", "center_x": 5, "center_y": 50, "radius": 10, "position": "守门员"},
        {"id": 2, "team": "team_a", "center_x": 25, "center_y": 75, "radius": 20, "position": "左后卫"},
        {"id": 3, "team": "team_a", "center_x": 25, "center_y": 40, "radius": 18, "position": "中后卫"},
        {"id": 4, "team": "team_a", "center_x": 25, "center_y": 25, "radius": 20, "position": "右后卫"},
        {"id": 5, "team": "team_a", "center_x": 50, "center_y": 50, "radius": 25, "position": "中场"},
        {"id": 6, "team": "team_a", "center_x": 75, "center_y": 50, "radius": 22, "position": "前锋"},
        {"id": 7, "team": "team_b", "center_x": 95, "center_y": 50, "radius": 10, "position": "守门员"},
        {"id": 8, "team": "team_b", "center_x": 75, "center_y": 30, "radius": 20, "position": "后卫"},
        {"id": 9, "team": "team_b", "center_x": 55, "center_y": 60, "radius": 25, "position": "中场"},
        {"id": 10, "team": "team_b", "center_x": 30, "center_y": 45, "radius": 22, "position": "前锋"},
    ]

    sample_interval = duration / 200  # 200个采样点
    player_tracks = {}
    ball_tracks = []

    conn = get_connection()
    cursor = conn.cursor()

    # 生成每个球员的轨迹
    for player in players:
        pid = player["id"]
        tracks = []

        for i in range(200):
            timestamp = i * sample_interval
            frame = i

            # 围绕活动中心生成坐标，加入正弦波和随机扰动
            base_x = player["center_x"]
            base_y = player["center_y"]
            radius = player["radius"]

            # 使用正弦波模拟跑动模式
            t = i / 200.0 * math.pi * 4  # 4个周期
            x = base_x + radius * 0.5 * math.sin(t + pid) + random.uniform(-3, 3)
            y = base_y + radius * 0.3 * math.cos(t * 1.3 + pid) + random.uniform(-3, 3)

            # 限制在0-100范围内
            x = max(0, min(100, x))
            y = max(0, min(100, y))

            # 像素坐标（假设1280x720视频）
            x_pixel = x / 100 * 1280
            y_pixel = y / 100 * 720

            track = {
                "player_id": pid,
                "team": player["team"],
                "frame_number": frame,
                "timestamp": timestamp,
                "x_field": round(x, 2),
                "y_field": round(y, 2),
                "x_pixel": round(x_pixel, 1),
                "y_pixel": round(y_pixel, 1),
            }
            tracks.append(track)

            # 批量插入
            cursor.execute(
                "INSERT INTO player_tracks (task_id, player_id, team, frame_number, timestamp, x_field, y_field, x_pixel, y_pixel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (task_id, pid, player["team"], frame, timestamp, track["x_field"], track["y_field"], track["x_pixel"], track["y_pixel"])
            )

        player_tracks[pid] = tracks

    # 生成足球轨迹（300个点，在球员之间移动）
    for i in range(300):
        timestamp = i * (duration / 300)
        frame = int(i * 200 / 300)

        # 足球在球场中随机移动，但偏向中场
        t = i / 300.0 * math.pi * 6
        x = 50 + 30 * math.sin(t) + random.uniform(-5, 5)
        y = 50 + 20 * math.cos(t * 1.5) + random.uniform(-5, 5)
        x = max(0, min(100, x))
        y = max(0, min(100, y))

        x_pixel = x / 100 * 1280
        y_pixel = y / 100 * 720

        ball_tracks.append({
            "frame_number": frame,
            "timestamp": timestamp,
            "x_field": round(x, 2),
            "y_field": round(y, 2),
            "x_pixel": round(x_pixel, 1),
            "y_pixel": round(y_pixel, 1),
        })

        cursor.execute(
            "INSERT INTO ball_tracks (task_id, frame_number, timestamp, x_field, y_field, x_pixel, y_pixel) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (task_id, frame, timestamp, round(x, 2), round(y, 2), round(x_pixel, 1), round(y_pixel, 1))
        )

    conn.commit()
    conn.close()

    # 计算统计数据
    stats = calculate_statistics(player_tracks, ball_tracks, duration, sample_interval)

    # 保存统计数据
    conn = get_connection()
    cursor = conn.cursor()
    for pid, s in stats.items():
        cursor.execute(
            """INSERT INTO player_stats
            (task_id, player_id, team, total_distance, possession_time, possession_rate,
             pass_count, pass_success_count, pass_success_rate, shot_count, avg_speed, max_speed, main_zone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (task_id, pid, s["team"], s["total_distance"], s["possession_time"], s["possession_rate"],
             s["pass_count"], s["pass_success_count"], s["pass_success_rate"], s["shot_count"],
             s["avg_speed"], s["max_speed"], s["main_zone"])
        )
    conn.commit()
    conn.close()

    return {"status": "ok", "players": len(players), "frames": 200}
