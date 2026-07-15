"""统计计算模块：计算击球次数、回合数、正反手使用率、落点分布、球速、弧线类型等"""
from typing import Dict, List
from collections import defaultdict
import math

from config import (
    HIT_DISTANCE_THRESHOLD,
    RALLY_GAP_THRESHOLD,
    LOOP_ARC_THRESHOLD,
    DRIVE_ARC_THRESHOLD,
)


def calculate_statistics(
    player_tracks: Dict[int, List[dict]],
    ball_tracks_3d: List[dict],
    landing_points: List[dict],
    duration: float,
    sample_interval: float,
) -> Dict[int, dict]:
    """计算每个球员的全部统计数据

    Args:
        player_tracks: 球员轨迹数据 {player_id: [{frame_number, timestamp, x_table, y_table, ...}]}
        ball_tracks_3d: 球的 3D 轨迹数据 [{frame_number, timestamp, x_table, y_table, z_height, ball_pixel_size, ...}]
        landing_points: 落点数据 [{frame_number, timestamp, x_table, y_table, zone, rally_id}]
        duration: 视频总时长（秒）
        sample_interval: 采样间隔（秒）

    Returns:
        统计数据字典 {player_id: {统计指标}}
    """
    # 按帧号索引球位置
    ball_by_frame = {}
    for bt in ball_tracks_3d:
        if bt.get("x_table") is not None and bt.get("y_table") is not None:
            ball_by_frame[bt["frame_number"]] = bt

    # 收集所有帧的球员位置
    all_players_by_frame = defaultdict(list)  # frame -> [(player_id, x, y)]
    for pid, tracks in player_tracks.items():
        for t in tracks:
            all_players_by_frame[t["frame_number"]].append(
                (pid, t["x_table"], t["y_table"])
            )

    # 检测击球事件
    hit_events = _detect_hits(ball_by_frame, all_players_by_frame)

    # 检测回合
    rallies = _detect_rallies(hit_events, RALLY_GAP_THRESHOLD)

    # 计算弧线类型
    arc_types = _classify_arcs(ball_tracks_3d, hit_events)

    # 计算球速
    ball_speeds = _calculate_ball_speeds(ball_tracks_3d, sample_interval)

    # 统计落点区域
    landing_zones = defaultdict(int)
    for lp in landing_points:
        zone = lp.get("zone", "center")
        landing_zones[zone] += 1
    total_landings = max(1, len(landing_points))

    # 按球员分组击球事件
    hits_by_player = defaultdict(list)
    for hit in hit_events:
        hits_by_player[hit["player_id"]].append(hit)

    # 计算每个球员的统计
    stats = {}
    for pid, tracks in player_tracks.items():
        if not tracks:
            stats[pid] = _empty_stats(pid)
            continue

        sorted_tracks = sorted(tracks, key=lambda t: t["frame_number"])

        # 1. 跑动距离
        total_distance = 0.0
        speeds = []
        for i in range(1, len(sorted_tracks)):
            prev = sorted_tracks[i - 1]
            curr = sorted_tracks[i]
            dist = math.sqrt(
                (curr["x_table"] - prev["x_table"]) ** 2
                + (curr["y_table"] - prev["y_table"]) ** 2
            )
            total_distance += dist
            time_diff = curr["timestamp"] - prev["timestamp"]
            if time_diff > 0:
                speeds.append(dist / time_diff)

        avg_speed = sum(speeds) / len(speeds) if speeds else 0
        max_speed = max(speeds) if speeds else 0

        # 2. 击球次数
        player_hits = hits_by_player.get(pid, [])
        hit_count = len(player_hits)

        # 3. 回合数和回合时长
        player_rallies = set()
        rally_durations = []
        for rally in rallies:
            rally_player_ids = set(h["player_id"] for h in rally["hits"])
            if pid in rally_player_ids:
                player_rallies.add(rally["rally_id"])
                rally_durations.append(rally["duration"])
        rally_count = len(player_rallies)
        avg_rally_duration = sum(rally_durations) / len(rally_durations) if rally_durations else 0

        # 4. 击球频率（次/分钟）
        hit_frequency = (hit_count / duration * 60) if duration > 0 else 0

        # 5. 正反手使用率
        forehand_count = sum(1 for h in player_hits if h.get("stroke") == "forehand")
        backhand_count = sum(1 for h in player_hits if h.get("stroke") == "backhand")
        total_strokes = forehand_count + backhand_count
        forehand_rate = (forehand_count / total_strokes * 100) if total_strokes > 0 else 0
        backhand_rate = (backhand_count / total_strokes * 100) if total_strokes > 0 else 0

        # 6. 站位区域分布
        zone_counts = defaultdict(int)
        for t in sorted_tracks:
            from engine.coordinate_3d import get_standing_zone
            zone = get_standing_zone(t["y_table"])
            zone_counts[zone] += 1
        total_frames = len(sorted_tracks)
        near_table_rate = (zone_counts["near"] / total_frames * 100) if total_frames > 0 else 0
        mid_table_rate = (zone_counts["mid"] / total_frames * 100) if total_frames > 0 else 0
        far_table_rate = (zone_counts["far"] / total_frames * 100) if total_frames > 0 else 0

        # 7. 落点分布
        left_landing = landing_zones.get("left", 0)
        center_landing = landing_zones.get("center", 0)
        right_landing = landing_zones.get("right", 0)
        left_landing_rate = (left_landing / total_landings * 100) if total_landings > 0 else 0
        center_landing_rate = (center_landing / total_landings * 100) if total_landings > 0 else 0
        right_landing_rate = (right_landing / total_landings * 100) if total_landings > 0 else 0

        # 8. 球速
        avg_ball_speed = sum(ball_speeds) / len(ball_speeds) if ball_speeds else 0
        max_ball_speed = max(ball_speeds) if ball_speeds else 0

        # 9. 过网高度（球轨迹中 Z 高度的平均值）
        z_heights = [bt["z_height"] for bt in ball_tracks_3d if bt.get("z_height") is not None]
        avg_net_height = sum(z_heights) / len(z_heights) if z_heights else 0

        # 10. 弧线类型分布
        loop_count = sum(1 for a in arc_types if a == "loop")
        drive_count = sum(1 for a in arc_types if a == "drive")
        smash_count = sum(1 for a in arc_types if a == "smash")
        total_arcs = max(1, len(arc_types))
        loop_rate = (loop_count / total_arcs * 100) if total_arcs > 0 else 0
        drive_rate = (drive_count / total_arcs * 100) if total_arcs > 0 else 0
        smash_rate = (smash_count / total_arcs * 100) if total_arcs > 0 else 0

        # 11. 变线次数和线路偏好
        line_changes, crossline_count, straightline_count = _count_line_changes(ball_tracks_3d)
        total_lines = max(1, crossline_count + straightline_count)
        crossline_rate = (crossline_count / total_lines * 100) if total_lines > 0 else 0
        straightline_rate = (straightline_count / total_lines * 100) if total_lines > 0 else 0

        stats[pid] = {
            "player_id": pid,
            "hit_count": hit_count,
            "rally_count": rally_count,
            "avg_rally_duration": round(avg_rally_duration, 2),
            "hit_frequency": round(hit_frequency, 2),
            "forehand_rate": round(forehand_rate, 2),
            "backhand_rate": round(backhand_rate, 2),
            "total_distance": round(total_distance, 2),
            "avg_speed": round(avg_speed, 2),
            "max_speed": round(max_speed, 2),
            "near_table_rate": round(near_table_rate, 2),
            "mid_table_rate": round(mid_table_rate, 2),
            "far_table_rate": round(far_table_rate, 2),
            "left_landing_rate": round(left_landing_rate, 2),
            "center_landing_rate": round(center_landing_rate, 2),
            "right_landing_rate": round(right_landing_rate, 2),
            "avg_ball_speed": round(avg_ball_speed, 2),
            "max_ball_speed": round(max_ball_speed, 2),
            "avg_net_height": round(avg_net_height, 2),
            "loop_rate": round(loop_rate, 2),
            "drive_rate": round(drive_rate, 2),
            "smash_rate": round(smash_rate, 2),
            "line_change_count": line_changes,
            "crossline_rate": round(crossline_rate, 2),
            "straightline_rate": round(straightline_rate, 2),
        }

    return stats


def _detect_hits(ball_by_frame: dict, all_players_by_frame: dict) -> List[dict]:
    """检测击球事件

    击球定义：球与球员的距离小于阈值，且球方向发生变化

    Returns:
        击球事件列表 [{player_id, frame, timestamp, x_table, y_table, stroke}]
    """
    hits = []
    sorted_frames = sorted(ball_by_frame.keys())

    prev_ball = None
    prev_hit_player = None

    for i, frame in enumerate(sorted_frames):
        if frame not in all_players_by_frame:
            continue

        ball = ball_by_frame[frame]
        bx, by = ball["x_table"], ball["y_table"]

        # 找到离球最近的球员
        nearest_player = None
        nearest_dist = float("inf")
        for pid, px, py in all_players_by_frame[frame]:
            dist = math.sqrt((bx - px) ** 2 + (by - py) ** 2)
            if dist < nearest_dist:
                nearest_dist = dist
                nearest_player = pid

        # 距离小于阈值且与上次击球球员不同 → 击球事件
        if nearest_player is not None and nearest_dist < HIT_DISTANCE_THRESHOLD:
            if nearest_player != prev_hit_player:
                # 判断正反手：球在球员左侧还是右侧
                # 简化：通过球的 x 坐标与球员 x 坐标的差值判断
                player_pos = None
                for pid, px, py in all_players_by_frame[frame]:
                    if pid == nearest_player:
                        player_pos = (px, py)
                        break

                stroke = "forehand"
                if player_pos:
                    # 球在球员持拍侧为正手，异侧为反手（简化判断）
                    dx = bx - player_pos[0]
                    if dx < 0:
                        stroke = "backhand"

                hits.append({
                    "player_id": nearest_player,
                    "frame": frame,
                    "timestamp": ball["timestamp"],
                    "x_table": bx,
                    "y_table": by,
                    "stroke": stroke,
                })
                prev_hit_player = nearest_player

        prev_ball = ball

    return hits


def _detect_rallies(hit_events: List[dict], gap_threshold: float) -> List[dict]:
    """检测回合

    回合定义：连续的击球事件，间隔不超过阈值

    Returns:
        回合列表 [{rally_id, hits, duration, start_time, end_time}]
    """
    if not hit_events:
        return []

    rallies = []
    current_rally_hits = [hit_events[0]]
    rally_id = 0

    for i in range(1, len(hit_events)):
        prev_hit = hit_events[i - 1]
        curr_hit = hit_events[i]
        gap = curr_hit["timestamp"] - prev_hit["timestamp"]

        if gap > gap_threshold:
            # 回合结束
            rallies.append({
                "rally_id": rally_id,
                "hits": current_rally_hits,
                "duration": current_rally_hits[-1]["timestamp"] - current_rally_hits[0]["timestamp"],
                "start_time": current_rally_hits[0]["timestamp"],
                "end_time": current_rally_hits[-1]["timestamp"],
            })
            rally_id += 1
            current_rally_hits = [curr_hit]
        else:
            current_rally_hits.append(curr_hit)

    # 添加最后一个回合
    if current_rally_hits:
        rallies.append({
            "rally_id": rally_id,
            "hits": current_rally_hits,
            "duration": current_rally_hits[-1]["timestamp"] - current_rally_hits[0]["timestamp"],
            "start_time": current_rally_hits[0]["timestamp"],
            "end_time": current_rally_hits[-1]["timestamp"],
        })

    return rallies


def _classify_arcs(ball_tracks_3d: List[dict], hit_events: List[dict]) -> List[str]:
    """根据 Z 轴轨迹形状分类弧线类型

    弧线类型：
    - loop（高吊弧圈）：弧度大，抛物线顶点与两端连线的偏差 > LOOP_ARC_THRESHOLD
    - drive（前冲弧圈）：弧度中等，偏差在 DRIVE_ARC_THRESHOLD 到 LOOP_ARC_THRESHOLD 之间
    - smash（扣杀）：弧度低，偏差 < DRIVE_ARC_THRESHOLD（近似直线）

    Returns:
        弧线类型列表 ["loop", "drive", "smash", ...]
    """
    if len(ball_tracks_3d) < 3:
        return []

    # 按击球事件分段
    hit_frames = set(h["frame"] for h in hit_events)

    segments = []
    current_segment = []

    for bt in ball_tracks_3d:
        current_segment.append(bt)
        if bt["frame_number"] in hit_frames and len(current_segment) >= 3:
            segments.append(current_segment)
            current_segment = []

    if current_segment and len(current_segment) >= 3:
        segments.append(current_segment)

    arc_types = []
    for segment in segments:
        arc_type = _classify_single_arc(segment)
        arc_types.append(arc_type)

    return arc_types


def _classify_single_arc(segment: List[dict]) -> str:
    """分类单段弧线的类型

    计算抛物线顶点与两端连线之间的最大偏差
    """
    if len(segment) < 3:
        return "drive"

    # 提取 Z 高度序列
    z_values = [s.get("z_height", 0) or 0 for s in segment]
    z_start = z_values[0]
    z_end = z_values[-1]

    # 计算每个点的偏差（实际 Z 值与两端连线的差值）
    max_deviation = 0.0
    n = len(segment)
    for i in range(n):
        # 线性插值
        expected_z = z_start + (z_end - z_start) * (i / (n - 1))
        deviation = abs(z_values[i] - expected_z)
        if deviation > max_deviation:
            max_deviation = deviation

    # 根据偏差分类
    if max_deviation > LOOP_ARC_THRESHOLD:
        return "loop"
    elif max_deviation > DRIVE_ARC_THRESHOLD:
        return "drive"
    else:
        return "smash"


def _calculate_ball_speeds(ball_tracks_3d: List[dict], sample_interval: float) -> List[float]:
    """计算球速（相邻帧间距离/时间）

    Returns:
        球速列表（归一化坐标/秒）
    """
    speeds = []
    sorted_tracks = sorted(ball_tracks_3d, key=lambda t: t["frame_number"])

    for i in range(1, len(sorted_tracks)):
        prev = sorted_tracks[i - 1]
        curr = sorted_tracks[i]
        if prev.get("x_table") is None or curr.get("x_table") is None:
            continue

        # 3D 距离（含 Z 高度）
        dist = math.sqrt(
            (curr["x_table"] - prev["x_table"]) ** 2
            + (curr["y_table"] - prev["y_table"]) ** 2
            + ((curr.get("z_height", 0) or 0) - (prev.get("z_height", 0) or 0)) ** 2
        )
        time_diff = curr["timestamp"] - prev["timestamp"]
        if time_diff > 0:
            speeds.append(dist / time_diff)

    return speeds


def _count_line_changes(ball_tracks_3d: List[dict]) -> tuple:
    """统计变线次数和线路偏好

    变线：球的 X 坐标方向发生变化
    斜线：球的运动方向在 X 和 Y 上都有显著分量
    直线：球的运动方向主要在 Y 方向上

    Returns:
        (line_change_count, crossline_count, straightline_count)
    """
    if len(ball_tracks_3d) < 3:
        return 0, 0, 0

    sorted_tracks = sorted(ball_tracks_3d, key=lambda t: t["frame_number"])

    line_changes = 0
    crossline_count = 0
    straightline_count = 0

    prev_dx_sign = 0

    for i in range(1, len(sorted_tracks)):
        prev = sorted_tracks[i - 1]
        curr = sorted_tracks[i]
        if prev.get("x_table") is None or curr.get("x_table") is None:
            continue

        dx = curr["x_table"] - prev["x_table"]
        dy = curr["y_table"] - prev["y_table"]

        # 变线检测
        curr_dx_sign = 1 if dx > 1 else (-1 if dx < -1 else 0)
        if curr_dx_sign != 0 and prev_dx_sign != 0 and curr_dx_sign != prev_dx_sign:
            line_changes += 1
        if curr_dx_sign != 0:
            prev_dx_sign = curr_dx_sign

        # 线路偏好
        if abs(dx) > 2 and abs(dy) > 2:
            crossline_count += 1
        elif abs(dy) > 2:
            straightline_count += 1

    return line_changes, crossline_count, straightline_count


def _empty_stats(player_id: int) -> dict:
    """返回空统计数据"""
    return {
        "player_id": player_id,
        "hit_count": 0,
        "rally_count": 0,
        "avg_rally_duration": 0,
        "hit_frequency": 0,
        "forehand_rate": 0,
        "backhand_rate": 0,
        "total_distance": 0,
        "avg_speed": 0,
        "max_speed": 0,
        "near_table_rate": 0,
        "mid_table_rate": 0,
        "far_table_rate": 0,
        "left_landing_rate": 0,
        "center_landing_rate": 0,
        "right_landing_rate": 0,
        "avg_ball_speed": 0,
        "max_ball_speed": 0,
        "avg_net_height": 0,
        "loop_rate": 0,
        "drive_rate": 0,
        "smash_rate": 0,
        "line_change_count": 0,
        "crossline_rate": 0,
        "straightline_rate": 0,
    }


def generate_report(stats: Dict[int, dict], duration: float) -> str:
    """生成文字报告，只引用客观数据

    Args:
        stats: 统计数据
        duration: 视频时长

    Returns:
        文字报告字符串
    """
    if not stats:
        return "无统计数据可用。"

    lines = []
    lines.append(f"比赛时长：{duration:.1f} 秒")
    lines.append("")

    for pid, s in stats.items():
        lines.append(f"【球员 {pid}】")
        lines.append(f"  击球次数：{s['hit_count']} 次")
        lines.append(f"  回合数：{s['rally_count']} 个")
        lines.append(f"  平均回合时长：{s['avg_rally_duration']:.1f} 秒")
        lines.append(f"  击球频率：{s['hit_frequency']:.1f} 次/分钟")
        lines.append(f"  正手使用率：{s['forehand_rate']:.1f}%")
        lines.append(f"  反手使用率：{s['backhand_rate']:.1f}%")
        lines.append(f"  跑动距离：{s['total_distance']:.1f} 单位")
        lines.append(f"  平均速度：{s['avg_speed']:.1f}，最高速度：{s['max_speed']:.1f}")
        lines.append(f"  站位分布：近台 {s['near_table_rate']:.1f}%，中台 {s['mid_table_rate']:.1f}%，远台 {s['far_table_rate']:.1f}%")
        lines.append(f"  落点分布：左 {s['left_landing_rate']:.1f}%，中 {s['center_landing_rate']:.1f}%，右 {s['right_landing_rate']:.1f}%")
        lines.append(f"  球速：平均 {s['avg_ball_speed']:.1f}，最高 {s['max_ball_speed']:.1f}")
        lines.append(f"  过网高度：平均 {s['avg_net_height']:.1f} cm")
        lines.append(f"  弧线类型：高吊弧圈 {s['loop_rate']:.1f}%，前冲弧圈 {s['drive_rate']:.1f}%，扣杀 {s['smash_rate']:.1f}%")
        lines.append(f"  变线次数：{s['line_change_count']} 次")
        lines.append(f"  线路偏好：斜线 {s['crossline_rate']:.1f}%，直线 {s['straightline_rate']:.1f}%")
        lines.append("")

    return "\n".join(lines)
