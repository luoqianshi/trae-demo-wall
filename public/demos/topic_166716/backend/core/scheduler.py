import asyncio
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = None


def init_scheduler():
    global scheduler
    if scheduler and scheduler.running:
        return scheduler

    scheduler = BackgroundScheduler(timezone="Asia/Shanghai")

    from core.periodic_analysis import generate_daily_summary
    from core.push_engine import send_morning_greeting, send_evening_summary
    from core.history_store import get_daily_summary_by_date

    def job_daily_summary():
        from core.history_store import get_user_settings
        settings = get_user_settings("default_user")
        if not settings.get("push_enabled", 1):
            return

        yesterday = (datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)).strftime("%Y-%m-%d")
        existing = get_daily_summary_by_date("default_user", yesterday)
        if existing:
            return

        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(generate_daily_summary("default_user", yesterday))
        finally:
            loop.close()

    def job_morning_greeting():
        from core.history_store import get_user_settings
        settings = get_user_settings("default_user")
        if not settings.get("push_enabled", 1):
            return

        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(send_morning_greeting("default_user"))
        finally:
            loop.close()

    def job_evening_push():
        from core.history_store import get_user_settings
        settings = get_user_settings("default_user")
        if not settings.get("push_enabled", 1):
            return

        yesterday = (datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)).strftime("%Y-%m-%d")
        summary = get_daily_summary_by_date("default_user", yesterday)
        if not summary:
            return

        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(send_evening_summary("default_user", summary))
        finally:
            loop.close()

    def job_crisis_check():
        from core.push_engine import check_and_send_crisis_alert
        check_and_send_crisis_alert("default_user")

    def job_milestone_check():
        from core.push_engine import check_and_send_milestone
        check_and_send_milestone("default_user")

    scheduler.add_job(
        job_daily_summary,
        CronTrigger(hour=21, minute=30, timezone="Asia/Shanghai"),
        id="daily_summary",
        replace_existing=True,
    )

    scheduler.add_job(
        job_morning_greeting,
        CronTrigger(hour=8, minute=0, timezone="Asia/Shanghai"),
        id="morning_greeting",
        replace_existing=True,
    )

    scheduler.add_job(
        job_evening_push,
        CronTrigger(hour=22, minute=0, timezone="Asia/Shanghai"),
        id="evening_push",
        replace_existing=True,
    )

    scheduler.add_job(
        job_crisis_check,
        CronTrigger(hour="*/4", timezone="Asia/Shanghai"),
        id="crisis_check",
        replace_existing=True,
    )

    scheduler.add_job(
        job_milestone_check,
        CronTrigger(day_of_week="sun", hour=20, minute=0, timezone="Asia/Shanghai"),
        id="milestone_check",
        replace_existing=True,
    )

    scheduler.start()
    print(f"[Scheduler] Started with {len(scheduler.get_jobs())} jobs")
    for job in scheduler.get_jobs():
        print(f"  - {job.id}: next run at {job.next_run_time}")

    return scheduler


def get_scheduler():
    return scheduler


def shutdown_scheduler():
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown()
        scheduler = None
        print("[Scheduler] Shutdown complete")
