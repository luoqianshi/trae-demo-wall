"""历史快照管理：保存、读取、自动清理"""

import json
import os
from datetime import datetime, timedelta

from config import SNAPSHOT_DIR, SNAPSHOT_MAX_DAYS, DATA_FILE


def save_snapshot(posts):
    """保存当天快照（如果当天已有快照则覆盖）"""
    os.makedirs(SNAPSHOT_DIR, exist_ok=True)
    today = datetime.now().strftime("%Y-%m-%d")
    filepath = os.path.join(SNAPSHOT_DIR, f"{today}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)
    print(f"  快照已保存: {filepath}")
    return filepath


def list_snapshots():
    """列出所有快照文件名（日期列表，按日期升序）"""
    if not os.path.exists(SNAPSHOT_DIR):
        return []
    dates = []
    for fname in os.listdir(SNAPSHOT_DIR):
        if fname.endswith(".json") and len(fname) == 15:  # YYYY-MM-DD.json
            dates.append(fname[:-5])  # 去掉 .json
    dates.sort()
    return dates


def load_snapshot(date_str):
    """加载指定日期的快照，返回帖子列表。文件损坏时返回 None。"""
    filepath = os.path.join(SNAPSHOT_DIR, f"{date_str}.json")
    if not os.path.exists(filepath):
        return None
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


def clean_old_snapshots():
    """清理超过保留天数的旧快照"""
    if not os.path.exists(SNAPSHOT_DIR):
        return
    cutoff = datetime.now() - timedelta(days=SNAPSHOT_MAX_DAYS)
    removed = 0
    for fname in os.listdir(SNAPSHOT_DIR):
        if not fname.endswith(".json"):
            continue
        date_str = fname[:-5]
        try:
            snap_date = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            continue
        if snap_date < cutoff:
            os.remove(os.path.join(SNAPSHOT_DIR, fname))
            removed += 1
    if removed:
        print(f"  清理了 {removed} 个过期快照。")


def has_today_snapshot():
    """检查今天是否已有快照"""
    today = datetime.now().strftime("%Y-%m-%d")
    filepath = os.path.join(SNAPSHOT_DIR, f"{today}.json")
    return os.path.exists(filepath)


def get_trend_data(topic_id=None, days=14):
    """
    从快照中提取趋势数据。
    topic_id: 指定帖子 ID，返回该帖子的 views/likes/rank 变化。
              如果为 None，返回全站总帖子数/总点赞/总浏览。
    days: 返回最近 N 天的数据。
    """
    all_dates = list_snapshots()
    if not all_dates:
        return {"dates": [], "views": [], "likes": [], "rank": []}

    # 取最近 N 天
    recent_dates = all_dates[-days:]

    dates = []
    views_list = []
    likes_list = []
    votes_list = []
    rank_list = []

    for date_str in recent_dates:
        posts = load_snapshot(date_str)
        if posts is None:
            continue

        dates.append(date_str[5:])  # MM-DD 格式

        if topic_id is not None:
            # 单帖趋势
            target = None
            for p in posts:
                if p["id"] == topic_id:
                    target = p
                    break
            views_list.append(target.get("views", 0) if target else 0)
            likes_list.append(target.get("like_count", 0) if target else 0)
            votes_list.append(target.get("vote_count", 0) if target else 0)

            # 计算排名（按浏览量降序）
            if target:
                sorted_posts = sorted(posts, key=lambda p: p.get("views", 0), reverse=True)
                rank = next((i + 1 for i, p in enumerate(sorted_posts) if p["id"] == topic_id), 0)
                rank_list.append(rank)
            else:
                rank_list.append(0)
        else:
            # 全站趋势
            total_views = sum(p.get("views", 0) for p in posts)
            total_likes = sum(p.get("like_count", 0) for p in posts)
            total_votes = sum(p.get("vote_count", 0) for p in posts)
            views_list.append(total_views)
            likes_list.append(total_likes)
            votes_list.append(total_votes)
            rank_list.append(len(posts))  # 全站时 rank 存总帖子数

    return {
        "dates": dates,
        "views": views_list,
        "likes": likes_list,
        "votes": votes_list,
        "rank": rank_list,
    }
