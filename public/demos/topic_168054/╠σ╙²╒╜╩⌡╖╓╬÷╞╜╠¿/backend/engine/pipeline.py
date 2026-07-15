"""分析流水线模块：串联所有引擎模块，异步执行分析任务"""
import asyncio
import uuid
from datetime import datetime
from typing import Callable, Optional, Dict, List
from collections import defaultdict

from config import SAMPLE_FPS
from engine.frame_extraction import extract_frames, get_video_info, count_sampled_frames
from engine.detection import PlayerBallDetector
from engine.tracking import MultiObjectTracker
from engine.coordinate import bbox_center_to_field
from engine.statistics import calculate_statistics, generate_report
from storage.database import execute_update, execute_single, execute_query


class AnalysisPipeline:
    """分析流水线：执行完整的视频分析流程"""

    def __init__(self):
        """初始化流水线"""
        self.detector = None  # 延迟加载，避免启动时加载模型
        self.tracker = None

    def _ensure_models(self):
        """延迟加载模型（首次使用时加载）"""
        if self.detector is None:
            self.detector = PlayerBallDetector()
        if self.tracker is None:
            self.tracker = MultiObjectTracker()

    async def run(
        self,
        task_id: str,
        video_path: str,
        progress_callback: Optional[Callable] = None,
    ) -> None:
        """执行完整的分析流程

        Args:
            task_id: 任务ID
            video_path: 视频文件路径
            progress_callback: 进度回调函数，接收 (processed, total, percentage)
        """
        try:
            # 在线程池中加载模型（耗时操作）
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._ensure_models)

            # 更新任务状态为处理中
            execute_update(
                "UPDATE tasks SET status = 'processing' WHERE id = ?",
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
                "UPDATE tasks SET total_frames = ?, duration_seconds = ? WHERE id = ?",
                (total_frames, duration, task_id),
            )

            # 重置跟踪器
            self.tracker.reset()

            # 采样间隔（秒）
            sample_interval = 1.0 / SAMPLE_FPS

            # 存储所有球员轨迹（按 player_id 分组）
            player_tracks = defaultdict(list)
            # 存储所有足球轨迹
            ball_tracks = []
            # 记录球员所属球队（简化：按 track_id 奇偶分配）
            player_teams = {}

            processed = 0

            # 在线程池中执行帧提取和检测
            def process_frame(frame, frame_number, timestamp):
                """处理单帧"""
                # 检测球员和足球
                detections = self.detector.detect_all(frame)

                # 跟踪
                tracked_objects = self.tracker.update(detections, frame)

                frame_results = {"players": [], "balls": []}

                for obj in tracked_objects:
                    if obj.class_name == "player":
                        # 计算球场坐标
                        x_field, y_field = bbox_center_to_field(
                            obj.bbox[0], obj.bbox[1], obj.bbox[2], obj.bbox[3],
                            frame_width, frame_height,
                        )
                        # 简化球队分配：track_id 为偶数 -> team_a，奇数 -> team_b
                        # 前3个ID的球员标记为裁判
                        if obj.track_id <= 3:
                            team = "referee"
                        elif obj.track_id % 2 == 0:
                            team = "team_a"
                        else:
                            team = "team_b"

                        player_teams[obj.track_id] = team

                        track_data = {
                            "player_id": obj.track_id,
                            "team": team,
                            "frame_number": frame_number,
                            "timestamp": timestamp,
                            "x_field": x_field,
                            "y_field": y_field,
                            "x_pixel": (obj.bbox[0] + obj.bbox[2]) / 2,
                            "y_pixel": (obj.bbox[1] + obj.bbox[3]) / 2,
                        }
                        frame_results["players"].append(track_data)
                        player_tracks[obj.track_id].append(track_data)

                    elif obj.class_name == "ball":
                        x_field, y_field = bbox_center_to_field(
                            obj.bbox[0], obj.bbox[1], obj.bbox[2], obj.bbox[3],
                            frame_width, frame_height,
                        )
                        ball_data = {
                            "frame_number": frame_number,
                            "timestamp": timestamp,
                            "x_field": x_field,
                            "y_field": y_field,
                            "x_pixel": (obj.bbox[0] + obj.bbox[2]) / 2,
                            "y_pixel": (obj.bbox[1] + obj.bbox[3]) / 2,
                        }
                        frame_results["balls"].append(ball_data)
                        ball_tracks.append(ball_data)

                return frame_results

            # 帧提取生成器
            frame_gen = extract_frames(video_path, fps=SAMPLE_FPS)

            # 批量插入数据库的缓冲区
            player_batch = []
            ball_batch = []
            BATCH_SIZE = 50  # 每50帧批量插入一次

            for frame, frame_number, timestamp in frame_gen:
                # 在线程池中处理帧
                result = await loop.run_in_executor(
                    None, process_frame, frame, frame_number, timestamp
                )

                # 收集数据用于批量插入
                for player_data in result["players"]:
                    player_batch.append(
                        (
                            task_id,
                            player_data["player_id"],
                            player_data["team"],
                            player_data["frame_number"],
                            player_data["timestamp"],
                            player_data["x_field"],
                            player_data["y_field"],
                            player_data["x_pixel"],
                            player_data["y_pixel"],
                        )
                    )

                for ball_data in result["balls"]:
                    ball_batch.append(
                        (
                            task_id,
                            ball_data["frame_number"],
                            ball_data["timestamp"],
                            ball_data["x_field"],
                            ball_data["y_field"],
                            ball_data["x_pixel"],
                            ball_data["y_pixel"],
                        )
                    )

                processed += 1

                # 批量插入数据库
                if processed % BATCH_SIZE == 0:
                    await self._batch_insert_tracks(player_batch, ball_batch)
                    player_batch = []
                    ball_batch = []

                # 更新数据库中的进度
                execute_update(
                    "UPDATE tasks SET processed_frames = ? WHERE id = ?",
                    (processed, task_id),
                )

                # 推送进度
                if progress_callback and total_frames > 0:
                    percentage = round(processed / total_frames * 100, 1)
                    await progress_callback(processed, total_frames, percentage)

            # 插入剩余的批量数据
            if player_batch or ball_batch:
                await self._batch_insert_tracks(player_batch, ball_batch)

            # 计算统计数据
            stats = calculate_statistics(
                dict(player_tracks), ball_tracks, duration, sample_interval
            )

            # 保存统计数据到数据库
            for pid, s in stats.items():
                execute_update(
                    """
                    INSERT INTO player_stats
                    (task_id, player_id, team, total_distance, possession_time,
                     possession_rate, pass_count, pass_success_count, pass_success_rate,
                     shot_count, avg_speed, max_speed, main_zone)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        task_id,
                        pid,
                        s["team"],
                        s["total_distance"],
                        s["possession_time"],
                        s["possession_rate"],
                        s["pass_count"],
                        s["pass_success_count"],
                        s["pass_success_rate"],
                        s["shot_count"],
                        s["avg_speed"],
                        s["max_speed"],
                        s["main_zone"],
                    ),
                )

            # 更新任务状态为完成
            execute_update(
                "UPDATE tasks SET status = 'completed', completed_at = ? WHERE id = ?",
                (datetime.now().isoformat(), task_id),
            )

            # 推送完成消息
            if progress_callback:
                await progress_callback(processed, total_frames, 100.0)

        except Exception as e:
            # 更新任务状态为失败
            error_msg = str(e)
            execute_update(
                "UPDATE tasks SET status = 'failed', error_message = ? WHERE id = ?",
                (error_msg, task_id),
            )
            if progress_callback:
                await progress_callback(0, 0, 0, error=error_msg)
            raise

    async def _batch_insert_tracks(self, player_batch: list, ball_batch: list):
        """批量插入轨迹数据到数据库"""
        from storage.database import get_connection

        conn = get_connection()
        try:
            cursor = conn.cursor()
            if player_batch:
                cursor.executemany(
                    """
                    INSERT INTO player_tracks
                    (task_id, player_id, team, frame_number, timestamp,
                     x_field, y_field, x_pixel, y_pixel)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    player_batch,
                )
            if ball_batch:
                cursor.executemany(
                    """
                    INSERT INTO ball_tracks
                    (task_id, frame_number, timestamp, x_field, y_field, x_pixel, y_pixel)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    ball_batch,
                )
            conn.commit()
        finally:
            conn.close()
