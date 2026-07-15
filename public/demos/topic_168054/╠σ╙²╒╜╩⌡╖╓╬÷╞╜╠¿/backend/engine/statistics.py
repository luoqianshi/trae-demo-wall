"""统计计算模块：计算跑动距离、持球率、传球次数等"""
from typing import Dict, List, Tuple
from collections import defaultdict
import math
from config import (
    POSSESSION_DISTANCE_THRESHOLD,
    PASS_DISTANCE_THRESHOLD,
    SHOT_SPEED_THRESHOLD,
    PENALTY_AREA_DEPTH,
    FIELD_NORMALIZED_MAX,
)
from engine.coordinate import get_zone


def calculate_statistics(
    player_tracks: Dict[int, List[dict]],
    ball_tracks: List[dict],
    duration: float,
    sample_interval: float,
) -> Dict[int, dict]:
    """计算每个球员的统计数据

    Args:
        player_tracks: 球员轨迹数据 {player_id: [{frame_number, timestamp, x_field, y_field, ...}]}
        ball_tracks: 足球轨迹数据 [{frame_number, timestamp, x_field, y_field, ...}]
        duration: 视频总时长（秒）
        sample_interval: 采样间隔（秒）

    Returns:
        统计数据字典 {player_id: {统计指标}}
    """
    stats = {}

    # 按帧号索引足球位置
    ball_by_frame = {}
    for bt in ball_tracks:
        if bt.get("x_field") is not None and bt.get("y_field") is not None:
            ball_by_frame[bt["frame_number"]] = (bt["x_field"], bt["y_field"])

    # 收集所有帧的球员位置（用于传球判定）
    all_players_by_frame = defaultdict(list)  # frame -> [(player_id, x, y, team)]
    for pid, tracks in player_tracks.items():
        for t in tracks:
            all_players_by_frame[t["frame_number"]].append(
                (pid, t["x_field"], t["y_field"], t.get("team", "team_a"))
            )

    # 计算每个球员的持球帧
    possession_frames = defaultdict(set)  # player_id -> set of frame_numbers
    for frame_num, ball_pos in ball_by_frame.items():
        bx, by = ball_pos
        if frame_num not in all_players_by_frame:
            continue
        # 找到离球最近的球员
        nearest_player = None
        nearest_dist = float("inf")
        for pid, px, py, team in all_players_by_frame[frame_num]:
            dist = math.sqrt((bx - px) ** 2 + (by - py) ** 2)
            if dist < nearest_dist:
                nearest_dist = dist
                nearest_player = pid
        # 如果距离小于阈值，认为该球员持球
        if nearest_player is not None and nearest_dist < POSSESSION_DISTANCE_THRESHOLD:
            possession_frames[nearest_player].add(frame_num)

    # 计算传球序列
    pass_events = _detect_passes(ball_by_frame, all_players_by_frame, possession_frames)

    # 统计每个球员的传球数据
    pass_count = defaultdict(int)
    pass_success_count = defaultdict(int)
    for pass_event in pass_events:
        from_pid = pass_event["from_player"]
        to_pid = pass_event["to_player"]
        from_team = pass_event["from_team"]
        to_team = pass_event["to_team"]
        pass_count[from_pid] += 1
        if from_team == to_team:
            pass_success_count[from_pid] += 1

    # 射门次数统计
    shot_counts = _detect_shots(ball_by_frame, sample_interval)

    # 计算每个球员的各项统计
    for pid, tracks in player_tracks.items():
        if not tracks:
            stats[pid] = _empty_stats(pid)
            continue

        # 按帧号排序
        sorted_tracks = sorted(tracks, key=lambda t: t["frame_number"])

        # 1. 跑动总距离
        total_distance = 0.0
        speeds = []
        for i in range(1, len(sorted_tracks)):
            prev = sorted_tracks[i - 1]
            curr = sorted_tracks[i]
            dist = math.sqrt(
                (curr["x_field"] - prev["x_field"]) ** 2
                + (curr["y_field"] - prev["y_field"]) ** 2
            )
            total_distance += dist
            # 计算速度（归一化坐标/秒）
            time_diff = curr["timestamp"] - prev["timestamp"]
            if time_diff > 0:
                speed = dist / time_diff
                speeds.append(speed)

        # 2. 持球时间
        possession_frame_count = len(possession_frames.get(pid, set()))
        possession_time = possession_frame_count * sample_interval

        # 3. 持球率
        possession_rate = (possession_time / duration * 100) if duration > 0 else 0

        # 4. 传球次数和成功率
        p_count = pass_count.get(pid, 0)
        p_success = pass_success_count.get(pid, 0)
        p_success_rate = (p_success / p_count * 100) if p_count > 0 else 0

        # 5. 射门次数
        shots = shot_counts.get(pid, 0)

        # 6. 平均/最高速度
        avg_speed = sum(speeds) / len(speeds) if speeds else 0
        max_speed = max(speeds) if speeds else 0

        # 7. 主要活动区域
        zone_counts = defaultdict(int)
        for t in sorted_tracks:
            zone = get_zone(t["x_field"], t["y_field"])
            zone_counts[zone] += 1
        main_zone = max(zone_counts, key=zone_counts.get) if zone_counts else "未知"

        # 球队信息
        team = sorted_tracks[0].get("team", "team_a")

        stats[pid] = {
            "player_id": pid,
            "team": team,
            "total_distance": round(total_distance, 2),
            "possession_time": round(possession_time, 2),
            "possession_rate": round(possession_rate, 2),
            "pass_count": p_count,
            "pass_success_count": p_success,
            "pass_success_rate": round(p_success_rate, 2),
            "shot_count": shots,
            "avg_speed": round(avg_speed, 2),
            "max_speed": round(max_speed, 2),
            "main_zone": main_zone,
        }

    return stats


def _detect_passes(
    ball_by_frame: dict,
    all_players_by_frame: dict,
    possession_frames: dict,
) -> List[dict]:
    """检测传球事件

    传球定义：足球从一个球员附近移动到另一个球员附近

    Returns:
        传球事件列表 [{from_player, to_player, from_team, to_team, frame}]
    """
    passes = []
    sorted_frames = sorted(ball_by_frame.keys())

    # 记录持球球员的变化
    last_possessor = None
    last_team = None

    for frame in sorted_frames:
        if frame not in all_players_by_frame:
            continue
        bx, by = ball_by_frame[frame]

        # 找到当前帧离球最近的球员
        nearest_player = None
        nearest_dist = float("inf")
        nearest_team = None
        for pid, px, py, team in all_players_by_frame[frame]:
            dist = math.sqrt((bx - px) ** 2 + (by - py) ** 2)
            if dist < nearest_dist:
                nearest_dist = dist
                nearest_player = pid
                nearest_team = team

        # 如果球员在持球范围内
        if nearest_dist < POSSESSION_DISTANCE_THRESHOLD:
            if last_possessor is not None and nearest_player != last_possessor:
                # 持球人发生变化，记录一次传球
                passes.append(
                    {
                        "from_player": last_possessor,
                        "to_player": nearest_player,
                        "from_team": last_team,
                        "to_team": nearest_team,
                        "frame": frame,
                    }
                )
            last_possessor = nearest_player
            last_team = nearest_team

    return passes


def _detect_shots(ball_by_frame: dict, sample_interval: float) -> Dict[int, int]:
    """检测射门事件

    射门定义：足球朝球门方向高速移动且在禁区附近

    Returns:
        球员ID -> 射门次数
    """
    shot_counts = defaultdict(int)
    sorted_frames = sorted(ball_by_frame.keys())

    for i in range(1, len(sorted_frames)):
        prev_frame = sorted_frames[i - 1]
        curr_frame = sorted_frames[i]
        prev_pos = ball_by_frame[prev_frame]
        curr_pos = ball_by_frame[curr_frame]

        # 计算球速
        dist = math.sqrt(
            (curr_pos[0] - prev_pos[0]) ** 2 + (curr_pos[1] - prev_pos[1]) ** 2
        )
        speed = dist / sample_interval if sample_interval > 0 else 0

        # 判断是否在禁区附近（靠近球场两端）
        in_penalty_area = (
            curr_pos[0] < PENALTY_AREA_DEPTH
            or curr_pos[0] > FIELD_NORMALIZED_MAX - PENALTY_AREA_DEPTH
        )

        # 速度快且在禁区附近，判定为射门
        if speed > SHOT_SPEED_THRESHOLD and in_penalty_area:
            # 射门归因于离球最近的球员（此处简化处理）
            # 由于此处没有球员信息，统一记到 player_id 0（将在外部处理）
            shot_counts[0] += 1

    return shot_counts


def _empty_stats(player_id: int) -> dict:
    """返回空统计数据"""
    return {
        "player_id": player_id,
        "team": "team_a",
        "total_distance": 0,
        "possession_time": 0,
        "possession_rate": 0,
        "pass_count": 0,
        "pass_success_count": 0,
        "pass_success_rate": 0,
        "shot_count": 0,
        "avg_speed": 0,
        "max_speed": 0,
        "main_zone": "未知",
    }


def generate_report(
    stats: Dict[int, dict],
    duration: float,
    player_teams: Dict[int, str] = None,
) -> dict:
    """生成文字分析报告

    Args:
        stats: 统计数据
        duration: 视频时长
        player_teams: 球员ID到球队的映射（可选）

    Returns:
        报告字典
    """
    if player_teams is None:
        player_teams = {}

    # 计算球队持球率
    team_a_possession = 0
    team_b_possession = 0
    total_possession = 0

    for pid, s in stats.items():
        team = player_teams.get(pid, s.get("team", "team_a"))
        total_possession += s["possession_time"]
        if team == "team_a":
            team_a_possession += s["possession_time"]
        else:
            team_b_possession += s["possession_time"]

    if total_possession > 0:
        team_a_rate = round(team_a_possession / total_possession * 100, 1)
        team_b_rate = round(team_b_possession / total_possession * 100, 1)
    else:
        team_a_rate = 50.0
        team_b_rate = 50.0

    # 总传球数和射门数
    total_passes = sum(s["pass_count"] for s in stats.values())
    total_shots = sum(s["shot_count"] for s in stats.values())

    # 跑动最多的球员
    top_runner = None
    max_distance = 0
    for pid, s in stats.items():
        if s["total_distance"] > max_distance:
            max_distance = s["total_distance"]
            top_runner = {"player_id": pid, "distance": max_distance}

    # 关键发现
    findings = []
    if team_a_rate > team_b_rate:
        findings.append(f"A队控球率占优（{team_a_rate}% vs {team_b_rate}%）")
    elif team_b_rate > team_a_rate:
        findings.append(f"B队控球率占优（{team_b_rate}% vs {team_a_rate}%）")
    else:
        findings.append(f"双方控球率持平（各{team_a_rate}%）")

    if top_runner:
        findings.append(
            f"跑动距离最长的球员是 {top_runner['player_id']} 号，共跑动 {top_runner['distance']} 单位"
        )

    if total_passes > 0:
        findings.append(f"全场共发生 {total_passes} 次传球")

    if total_shots > 0:
        findings.append(f"全场共发生 {total_shots} 次射门")

    # 汇总文字
    summary = (
        f"本场比赛时长 {duration:.1f} 秒。"
        f"A队控球率 {team_a_rate}%，B队控球率 {team_b_rate}%。"
        f"总传球 {total_passes} 次，总射门 {total_shots} 次。"
    )

    return {
        "summary": summary,
        "team_a_possession": team_a_rate,
        "team_b_possession": team_b_rate,
        "total_passes": total_passes,
        "total_shots": total_shots,
        "top_runner": top_runner,
        "key_findings": findings,
    }
