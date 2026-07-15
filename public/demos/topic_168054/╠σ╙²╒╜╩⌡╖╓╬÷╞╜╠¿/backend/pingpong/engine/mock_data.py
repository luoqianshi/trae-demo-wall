"""模拟数据生成器：生成乒乓球比赛模拟数据（无需真实视频可测试）

生成内容包括：
- 2个球员（单打）的模拟轨迹
- 球的 3D 轨迹（含抛物线弧度）
- 落点数据
- 统计数据
"""
import random
import math
from typing import Dict, List
from storage.database import execute_update, execute_query, get_connection
from engine.statistics import calculate_statistics, generate_report
from engine.coordinate_3d import get_landing_zone


def generate_mock_task(task_id: str, duration: int = 120):
    """生成模拟分析任务数据

    Args:
        task_id: 任务ID
        duration: 比赛时长（秒），默认120秒
    """
    sample_fps = 10
    total_frames = duration * sample_fps

    # 更新任务状态
    execute_update(
        "UPDATE pingpong_tasks SET status = 'completed', total_frames = ?, processed_frames = ?, filtered_frames = ?, duration_seconds = ?, completed_at = datetime('now') WHERE id = ?",
        (total_frames, total_frames, int(total_frames * 0.1), duration, task_id)
    )

    # 2个球员（单打），分别站在球桌两端
    players = [
        {"id": 1, "center_x": 30, "center_y": 20, "side": "left"},
        {"id": 2, "center_x": 70, "center_y": 80, "side": "right"},
    ]

    sample_interval = 1.0 / sample_fps
    player_tracks = {}
    ball_tracks_3d = []
    landing_points = []

    conn = get_connection()
    cursor = conn.cursor()

    # 生成球员轨迹
    for player in players:
        pid = player["id"]
        tracks = []

        for i in range(total_frames):
            timestamp = i * sample_interval
            frame = i

            # 球员围绕活动中心移动，加入正弦波模拟步伐
            base_x = player["center_x"]
            base_y = player["center_y"]

            t = i / total_frames * math.pi * 8  # 8个周期
            x = base_x + 8 * math.sin(t + pid) + random.uniform(-2, 2)
            y = base_y + 5 * math.cos(t * 1.3 + pid) + random.uniform(-2, 2)

            x = max(0, min(100, x))
            y = max(0, min(100, y))

            # 像素坐标（假设 1280x720）
            x_pixel = x / 100 * 1280
            y_pixel = y / 100 * 720

            track = {
                "player_id": pid,
                "frame_number": frame,
                "timestamp": round(timestamp, 3),
                "x_table": round(x, 2),
                "y_table": round(y, 2),
                "x_pixel": round(x_pixel, 1),
                "y_pixel": round(y_pixel, 1),
            }
            tracks.append(track)

            cursor.execute(
                "INSERT INTO pingpong_player_tracks (task_id, player_id, frame_number, timestamp, x_table, y_table, x_pixel, y_pixel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (task_id, pid, frame, track["timestamp"], track["x_table"], track["y_table"], track["x_pixel"], track["y_pixel"])
            )

        player_tracks[pid] = tracks

    # 生成球的 3D 轨迹（模拟多个回合，每个回合是一段抛物线）
    rally_count = 15  # 15个回合
    frames_per_rally = total_frames // rally_count

    rally_id = 0
    for r in range(rally_count):
        start_frame = r * frames_per_rally
        end_frame = min((r + 1) * frames_per_rally, total_frames)
        rally_length = end_frame - start_frame

        # 每个回合：球从一方打到另一方，有抛物线弧度
        # 随机决定方向
        if r % 2 == 0:
            start_x, start_y = 30, 25
            end_x, end_y = 70, 75
        else:
            start_x, start_y = 70, 75
            end_x, end_y = 30, 25

        # 随机弧线高度
        max_height = random.uniform(10, 40)  # 最高点高度（厘米）

        for i in range(rally_length):
            frame = start_frame + i
            timestamp = frame * sample_interval
            progress = i / max(1, rally_length - 1)

            # 线性插值 X, Y
            x = start_x + (end_x - start_x) * progress
            y = start_y + (end_y - start_y) * progress

            # 抛物线 Z 高度：z = 4 * max_height * p * (1 - p)
            z = 4 * max_height * progress * (1 - progress)

            # 添加随机扰动
            x += random.uniform(-1, 1)
            y += random.uniform(-1, 1)
            z += random.uniform(-1, 1)
            x = max(0, min(100, x))
            y = max(0, min(100, y))
            z = max(0, z)

            # 像素坐标
            x_pixel = x / 100 * 1280
            y_pixel = y / 100 * 720

            # 球的像素大小（Z越高，球离镜头越远，像素越小）
            # 基准像素大小 15，随高度递减
            ball_pixel_size = 15 - z * 0.1 + random.uniform(-1, 1)
            ball_pixel_size = max(3, ball_pixel_size)

            ball_track = {
                "frame_number": frame,
                "timestamp": round(timestamp, 3),
                "x_table": round(x, 2),
                "y_table": round(y, 2),
                "z_height": round(z, 2),
                "x_pixel": round(x_pixel, 1),
                "y_pixel": round(y_pixel, 1),
                "ball_pixel_size": round(ball_pixel_size, 2),
            }
            ball_tracks_3d.append(ball_track)

            cursor.execute(
                "INSERT INTO pingpong_ball_tracks_3d (task_id, frame_number, timestamp, x_table, y_table, z_height, x_pixel, y_pixel, ball_pixel_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (task_id, frame, ball_track["timestamp"], ball_track["x_table"], ball_track["y_table"], ball_track["z_height"], ball_track["x_pixel"], ball_track["y_pixel"], ball_track["ball_pixel_size"])
            )

            # 检测落点（Z 接近 0 且在回合开始/结束处）
            if (i == 0 or i == rally_length - 1) or z < 3:
                zone = get_landing_zone(x, y)
                landing = {
                    "frame_number": frame,
                    "timestamp": ball_track["timestamp"],
                    "x_table": round(x, 2),
                    "y_table": round(y, 2),
                    "zone": zone,
                    "rally_id": rally_id,
                }
                landing_points.append(landing)

                cursor.execute(
                    "INSERT INTO pingpong_landing_points (task_id, frame_number, timestamp, x_table, y_table, zone, rally_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (task_id, frame, landing["timestamp"], landing["x_table"], landing["y_table"], landing["zone"], landing["rally_id"])
                )

        rally_id += 1

    conn.commit()
    conn.close()

    # 计算统计数据
    stats = calculate_statistics(player_tracks, ball_tracks_3d, landing_points, duration, sample_interval)

    # 保存统计数据
    conn = get_connection()
    cursor = conn.cursor()
    for pid, s in stats.items():
        cursor.execute(
            """INSERT INTO pingpong_player_stats
            (task_id, player_id, hit_count, rally_count, avg_rally_duration, hit_frequency,
             forehand_rate, backhand_rate, total_distance, avg_speed, max_speed,
             near_table_rate, mid_table_rate, far_table_rate,
             left_landing_rate, center_landing_rate, right_landing_rate,
             avg_ball_speed, max_ball_speed, avg_net_height,
             loop_rate, drive_rate, smash_rate, line_change_count, crossline_rate, straightline_rate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (task_id, pid, s["hit_count"], s["rally_count"], s["avg_rally_duration"], s["hit_frequency"],
             s["forehand_rate"], s["backhand_rate"], s["total_distance"], s["avg_speed"], s["max_speed"],
             s["near_table_rate"], s["mid_table_rate"], s["far_table_rate"],
             s["left_landing_rate"], s["center_landing_rate"], s["right_landing_rate"],
             s["avg_ball_speed"], s["max_ball_speed"], s["avg_net_height"],
             s["loop_rate"], s["drive_rate"], s["smash_rate"], s["line_change_count"],
             s["crossline_rate"], s["straightline_rate"])
        )
    conn.commit()
    conn.close()

    return {"status": "ok", "players": len(players), "ball_points": len(ball_tracks_3d), "landings": len(landing_points), "rallies": rally_count}
