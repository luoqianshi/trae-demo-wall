"""分析流水线模块：串联所有引擎模块，异步执行乒乓球分析任务"""
import asyncio
from datetime import datetime
from typing import Callable, Optional, Dict, List
from collections import defaultdict

from config import SAMPLE_FPS
from engine.frame_extraction import extract_frames, get_video_info, count_sampled_frames
from engine.detection import PingPongDetector
from engine.tracking import PingPongTracker
from engine.scene_filter import SceneFilter
from engine.coordinate_3d import pixel_to_table, estimate_z_height, is_landing_point, get_landing_zone
from engine.statistics import calculate_statistics, generate_report
from storage.database import execute_update, execute_single, get_connection


class PingPongAnalysisPipeline:
    """乒乓球分析流水线：执行完整的视频分析流程"""

    def __init__(self):
        """初始化流水线"""
        self.detector = None  # 延迟加载，避免启动时加载模型
        self.tracker = None
        self.scene_filter = SceneFilter()

    def _ensure_models(self):
        """延迟加载模型（首次使用时加载）"""
        if self.detector is None:
            self.detector = PingPongDetector()
        if self.tracker is None:
            self.tracker = PingPongTracker()

    async def run(
        self,
        task_id: str,
        video_path: str,
        progress_callback: Optional[Callable] = None,
    ) -> None:
        """执行完整的分析流程

        流程：帧提取 → 检测 → 比赛画面过滤 → 跟踪 → 3D坐标提取 → 统计计算 → 存储

        Args:
            task_id: 任务ID
            video_path: 视频文件路径
            progress_callback: 进度回调函数，接收 (processed, total, percentage, filtered)
        """
        try:
            # 在线程池中加载模型
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._ensure_models)

            # 更新任务状态为处理中
            execute_update(
                "UPDATE pingpong_tasks SET status = 'processing' WHERE id = ?",
                (task_id,),
            )

            # 获取视频信息
            video_info = await loop.run_in_executor(None, get_video_info, video_path)
            frame_width = video_info["width"]
            frame_height = video_info["height"]
            duration = video_info["duration"]

            # 计算预计采样帧数
            total_frames = await loop.run_in_executor(
                None, count_sampled_frames, video_path, SAMPLE_FPS
            )

            # 更新任务的总帧数和时长
            execute_update(
                "UPDATE pingpong_tasks SET total_frames = ?, duration_seconds = ? WHERE id = ?",
                (total_frames, duration, task_id),
            )

            # 重置跟踪器
            self.tracker.reset()

            # 采样间隔（秒）
            sample_interval = 1.0 / SAMPLE_FPS

            # 存储所有球员轨迹（按 player_id 分组）
            player_tracks = defaultdict(list)
            # 存储所有球的 3D 轨迹
            ball_tracks_3d = []
            # 存储落点
            landing_points = []

            processed = 0
            filtered_frames = 0

            # 帧提取生成器
            frame_gen = extract_frames(video_path, fps=SAMPLE_FPS)

            # 批量插入数据库的缓冲区
            player_batch = []
            ball_batch = []
            landing_batch = []
            BATCH_SIZE = 50

            for frame, frame_number, timestamp in frame_gen:
                # 在线程池中处理帧
                result = await loop.run_in_executor(
                    None, self._process_frame, frame, frame_number, timestamp,
                    frame_width, frame_height,
                )

                # 比赛画面过滤
                is_match, reason = self.scene_filter.is_match_scene(result["detections"])
                if not is_match:
                    filtered_frames += 1
                    processed += 1

                    # 更新进度
                    execute_update(
                        "UPDATE pingpong_tasks SET processed_frames = ?, filtered_frames = ? WHERE id = ?",
                        (processed, filtered_frames, task_id),
                    )
                    if progress_callback and total_frames > 0:
                        percentage = round(processed / total_frames * 100, 1)
                        await progress_callback(processed, total_frames, percentage, filtered_frames)
                    continue

                # 收集球员轨迹
                for player_data in result["players"]:
                    player_tracks[player_data["player_id"]].append(player_data)
                    player_batch.append(
                        (
                            task_id,
                            player_data["player_id"],
                            player_data["frame_number"],
                            player_data["timestamp"],
                            player_data["x_table"],
                            player_data["y_table"],
                            player_data["x_pixel"],
                            player_data["y_pixel"],
                        )
                    )

                # 收集球的 3D 轨迹
                for ball_data in result["balls"]:
                    ball_tracks_3d.append(ball_data)
                    ball_batch.append(
                        (
                            task_id,
                            ball_data["frame_number"],
                            ball_data["timestamp"],
                            ball_data["x_table"],
                            ball_data["y_table"],
                            ball_data["z_height"],
                            ball_data["x_pixel"],
                            ball_data["y_pixel"],
                            ball_data["ball_pixel_size"],
                        )
                    )

                    # 检测落点
                    if is_landing_point(ball_data["z_height"], ball_data["x_table"], ball_data["y_table"]):
                        zone = get_landing_zone(ball_data["x_table"], ball_data["y_table"])
                        landing = {
                            "frame_number": ball_data["frame_number"],
                            "timestamp": ball_data["timestamp"],
                            "x_table": ball_data["x_table"],
                            "y_table": ball_data["y_table"],
                            "zone": zone,
                            "rally_id": 0,
                        }
                        landing_points.append(landing)
                        landing_batch.append(
                            (
                                task_id,
                                landing["frame_number"],
                                landing["timestamp"],
                                landing["x_table"],
                                landing["y_table"],
                                landing["zone"],
                                landing["rally_id"],
                            )
                        )

                processed += 1

                # 批量插入数据库
                if processed % BATCH_SIZE == 0:
                    await self._batch_insert(player_batch, ball_batch, landing_batch)
                    player_batch = []
                    ball_batch = []
                    landing_batch = []

                # 更新进度
                execute_update(
                    "UPDATE pingpong_tasks SET processed_frames = ?, filtered_frames = ? WHERE id = ?",
                    (processed, filtered_frames, task_id),
                )
                if progress_callback and total_frames > 0:
                    percentage = round(processed / total_frames * 100, 1)
                    await progress_callback(processed, total_frames, percentage, filtered_frames)

            # 插入剩余的批量数据
            if player_batch or ball_batch or landing_batch:
                await self._batch_insert(player_batch, ball_batch, landing_batch)

            # 计算统计数据
            stats = calculate_statistics(
                dict(player_tracks), ball_tracks_3d, landing_points, duration, sample_interval
            )

            # 保存统计数据到数据库
            for pid, s in stats.items():
                execute_update(
                    """
                    INSERT INTO pingpong_player_stats
                    (task_id, player_id, hit_count, rally_count, avg_rally_duration, hit_frequency,
                     forehand_rate, backhand_rate, total_distance, avg_speed, max_speed,
                     near_table_rate, mid_table_rate, far_table_rate,
                     left_landing_rate, center_landing_rate, right_landing_rate,
                     avg_ball_speed, max_ball_speed, avg_net_height,
                     loop_rate, drive_rate, smash_rate, line_change_count, crossline_rate, straightline_rate)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        task_id, pid,
                        s["hit_count"], s["rally_count"], s["avg_rally_duration"], s["hit_frequency"],
                        s["forehand_rate"], s["backhand_rate"], s["total_distance"], s["avg_speed"], s["max_speed"],
                        s["near_table_rate"], s["mid_table_rate"], s["far_table_rate"],
                        s["left_landing_rate"], s["center_landing_rate"], s["right_landing_rate"],
                        s["avg_ball_speed"], s["max_ball_speed"], s["avg_net_height"],
                        s["loop_rate"], s["drive_rate"], s["smash_rate"], s["line_change_count"],
                        s["crossline_rate"], s["straightline_rate"],
                    ),
                )

            # 更新任务状态为完成
            execute_update(
                "UPDATE pingpong_tasks SET status = 'completed', completed_at = ? WHERE id = ?",
                (datetime.now().isoformat(), task_id),
            )

            # 推送完成消息
            if progress_callback:
                await progress_callback(processed, total_frames, 100.0, filtered_frames)

        except Exception as e:
            error_msg = str(e)
            execute_update(
                "UPDATE pingpong_tasks SET status = 'failed', error_message = ? WHERE id = ?",
                (error_msg, task_id),
            )
            if progress_callback:
                await progress_callback(0, 0, 0, 0, error=error_msg)
            raise

    def _process_frame(self, frame, frame_number, timestamp, frame_width, frame_height):
        """处理单帧：检测 → 跟踪 → 坐标提取"""
        # 检测
        detections = self.detector.detect(frame)

        # 跟踪
        tracked_objects = self.tracker.update(detections, frame)

        frame_results = {"detections": detections, "players": [], "balls": []}

        for obj in tracked_objects:
            if obj.class_name == "player":
                x_table, y_table = pixel_to_table(
                    (obj.bbox[0] + obj.bbox[2]) / 2,
                    (obj.bbox[1] + obj.bbox[3]) / 2,
                    frame_width, frame_height,
                )
                player_data = {
                    "player_id": obj.track_id,
                    "frame_number": frame_number,
                    "timestamp": timestamp,
                    "x_table": x_table,
                    "y_table": y_table,
                    "x_pixel": (obj.bbox[0] + obj.bbox[2]) / 2,
                    "y_pixel": (obj.bbox[1] + obj.bbox[3]) / 2,
                }
                frame_results["players"].append(player_data)

            elif obj.class_name == "ball":
                x_table, y_table = pixel_to_table(
                    (obj.bbox[0] + obj.bbox[2]) / 2,
                    (obj.bbox[1] + obj.bbox[3]) / 2,
                    frame_width, frame_height,
                )
                # 估算 Z 轴高度
                z_height = estimate_z_height(obj.ball_pixel_size, frame_height)
                ball_data = {
                    "frame_number": frame_number,
                    "timestamp": timestamp,
                    "x_table": x_table,
                    "y_table": y_table,
                    "z_height": z_height,
                    "x_pixel": (obj.bbox[0] + obj.bbox[2]) / 2,
                    "y_pixel": (obj.bbox[1] + obj.bbox[3]) / 2,
                    "ball_pixel_size": obj.ball_pixel_size,
                }
                frame_results["balls"].append(ball_data)

        return frame_results

    async def _batch_insert(self, player_batch: list, ball_batch: list, landing_batch: list):
        """批量插入轨迹数据到数据库"""
        conn = get_connection()
        try:
            cursor = conn.cursor()
            if player_batch:
                cursor.executemany(
                    """
                    INSERT INTO pingpong_player_tracks
                    (task_id, player_id, frame_number, timestamp, x_table, y_table, x_pixel, y_pixel)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    player_batch,
                )
            if ball_batch:
                cursor.executemany(
                    """
                    INSERT INTO pingpong_ball_tracks_3d
                    (task_id, frame_number, timestamp, x_table, y_table, z_height, x_pixel, y_pixel, ball_pixel_size)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    ball_batch,
                )
            if landing_batch:
                cursor.executemany(
                    """
                    INSERT INTO pingpong_landing_points
                    (task_id, frame_number, timestamp, x_table, y_table, zone, rally_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    landing_batch,
                )
            conn.commit()
        finally:
            conn.close()
