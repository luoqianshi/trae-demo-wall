import os
from datetime import datetime, timedelta

from core.history_store import (
    create_push_notification,
    get_push_notifications,
    get_user_settings,
    get_trend_data,
    get_analysis_history,
    get_daily_summary_by_date,
)
from core.periodic_analysis import generate_morning_greeting


async def send_morning_greeting(user_id: str = "default_user"):
    settings = get_user_settings(user_id)
    if not settings.get("push_enabled", 1):
        return None

    greeting = await generate_morning_greeting(user_id)

    notif_id = create_push_notification(
        user_id=user_id,
        notif_type="morning_greeting",
        title=greeting["title"],
        content=greeting["content"],
        insight=greeting.get("insight", ""),
        priority="normal",
        related_date=datetime.now().strftime("%Y-%m-%d"),
    )

    return {"id": notif_id, "type": "morning_greeting", **greeting}


async def send_evening_summary(user_id: str = "default_user", summary_data: dict = None):
    settings = get_user_settings(user_id)
    if not settings.get("push_enabled", 1):
        return None

    from core.periodic_analysis import generate_daily_summary

    if summary_data is None:
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        summary_data = get_daily_summary_by_date(user_id, yesterday)

    if not summary_data:
        return None

    avg_score = summary_data.get("avg_discrepancy_score", 50)
    label = summary_data.get("emotion_label", "今日总结")

    if avg_score > 70:
        title = f"今日总结：{label} 💙"
        content = f"今天你的偏差值是{avg_score:.0f}分，镜灵看到了你的努力。深夜了，记得好好休息，明天又是新的开始。"
        priority = "high"
    elif avg_score < 40:
        title = f"今日总结：{label} ✨"
        content = f"今天状态很棒！偏差值{avg_score:.0f}分，继续保持这份轻盈和通透吧。晚安，做个好梦。"
        priority = "normal"
    else:
        title = f"今日总结：{label} 🌙"
        content = f"今天是充实的一天，偏差值{avg_score:.0f}分。你在以自己的节奏成长着，这样就很好。晚安。"
        priority = "normal"

    notif_id = create_push_notification(
        user_id=user_id,
        notif_type="evening_summary",
        title=title,
        content=content,
        insight=summary_data.get("mirror_insight", ""),
        priority=priority,
        related_date=datetime.now().strftime("%Y-%m-%d"),
    )

    return {"id": notif_id, "type": "evening_summary", "title": title, "content": content}


def check_and_send_crisis_alert(user_id: str = "default_user"):
    settings = get_user_settings(user_id)
    if not settings.get("push_enabled", 1):
        return None

    today_notifs = get_push_notifications(user_id, limit=20)
    today_count = sum(
        1 for n in today_notifs
        if n.get("type") == "crisis_alert"
        and n.get("created_at", "").startswith(datetime.now().strftime("%Y-%m-%d"))
    )
    if today_count >= 2:
        return None

    analyses = get_analysis_history(limit=10)
    if len(analyses) < 3:
        return None

    recent_scores = [a.get("discrepancy_score", 50) for a in analyses[:3]]
    avg_recent = sum(recent_scores) / len(recent_scores)

    if avg_recent > 80:
        title = "镜灵想和你聊聊 💛"
        content = f"最近三天你的偏差值都偏高（平均{avg_recent:.0f}分），镜灵有些担心你。要不要来和我说说话？有时候，说出来就好了一半。"
        insight = "你不需要独自承担一切。"

        notif_id = create_push_notification(
            user_id=user_id,
            notif_type="crisis_alert",
            title=title,
            content=content,
            insight=insight,
            priority="high",
            related_date=datetime.now().strftime("%Y-%m-%d"),
        )

        return {"id": notif_id, "type": "crisis_alert", "title": title, "content": content}

    return None


def check_and_send_milestone(user_id: str = "default_user"):
    settings = get_user_settings(user_id)
    if not settings.get("push_enabled", 1):
        return None

    trend_data = get_trend_data(14)
    scores = [s for s in trend_data.get("scores", []) if s is not None]

    if len(scores) < 7:
        return None

    first_week = scores[:7]
    second_week = scores[7:]

    if not first_week or not second_week:
        return None

    avg_first = sum(first_week) / len(first_week)
    avg_second = sum(second_week) / len(second_week)
    improvement = avg_first - avg_second

    today = datetime.now().strftime("%Y-%m-%d")
    today_notifs = get_push_notifications(user_id, limit=30)
    has_milestone = any(
        n.get("type") == "milestone" and n.get("related_date") == today
        for n in today_notifs
    )
    if has_milestone:
        return None

    if improvement > 15:
        title = "恭喜你！里程碑达成 🎉"
        content = f"过去两周，你的偏差值从{avg_first:.0f}分下降到了{avg_second:.0f}分，进步了{improvement:.0f}分！这是你努力成长的证明。继续加油，你值得更好的自己。"
        insight = "成长不是一蹴而就的，但每一步都算数。"

        notif_id = create_push_notification(
            user_id=user_id,
            notif_type="milestone",
            title=title,
            content=content,
            insight=insight,
            priority="normal",
            related_date=today,
        )

        return {"id": notif_id, "type": "milestone", "title": title, "content": content}

    return None


def get_daily_push_count(user_id: str = "default_user"):
    today = datetime.now().strftime("%Y-%m-%d")
    notifs = get_push_notifications(user_id, limit=50)
    return sum(1 for n in notifs if n.get("created_at", "").startswith(today))


def can_push_now(user_id: str = "default_user"):
    settings = get_user_settings(user_id)
    if not settings.get("push_enabled", 1):
        return False

    now = datetime.now()
    current_time = now.strftime("%H:%M")

    quiet_start = settings.get("quiet_hours_start", "23:00")
    quiet_end = settings.get("quiet_hours_end", "07:00")

    if quiet_start <= current_time or current_time < quiet_end:
        return False

    daily_count = get_daily_push_count(user_id)
    max_daily = settings.get("max_daily_pushes", 5)
    if daily_count >= max_daily:
        return False

    return True
