"""定时任务调度 + 更新并发锁"""

import threading
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler

from config import (
    SCHEDULED_UPDATE_HOUR,
    SCHEDULED_UPDATE_MINUTE,
    EVENT_END_DATE,
)
from scraper import run_incremental_update, write_status, append_update_log
from snapshot import save_snapshot, clean_old_snapshots, has_today_snapshot


# 全局更新锁
_update_lock = threading.Lock()


def _try_acquire_lock():
    """尝试获取更新锁，返回是否成功"""
    return _update_lock.acquire(blocking=False)


def _release_lock():
    """释放更新锁"""
    try:
        _update_lock.release()
    except RuntimeError:
        pass


def get_update_state():
    """获取当前是否正在更新"""
    return _update_lock.locked()


def _do_update():
    """执行更新任务的实际逻辑（在后台线程中运行）"""
    started_at = datetime.now().isoformat()
    try:
        posts, new_count = run_incremental_update()

        # 保存快照（每天只保存一份）
        if not has_today_snapshot():
            save_snapshot(posts)

        # 清理旧快照
        clean_old_snapshots()

    except Exception as e:
        print(f"  ✗ 更新失败: {e}")
        write_status("error", f"更新失败: {e}", started_at=started_at)
        append_update_log({
            "time": started_at,
            "elapsed_seconds": 0,
            "new_posts": 0,
            "total_posts": 0,
            "status": "error",
            "error": str(e),
        })
    finally:
        _release_lock()


def trigger_update():
    """
    触发增量更新（线程安全）。
    返回 (success, message)。
    """
    # 检查赛事是否已结束
    if datetime.now().strftime("%Y-%m-%d") > EVENT_END_DATE:
        return False, "赛事已结束，自动更新已暂停"

    if not _try_acquire_lock():
        return False, "正在更新中，请稍后再试"

    # 在后台线程中执行更新
    thread = threading.Thread(target=_do_update, daemon=True)
    thread.start()
    return True, "更新任务已启动"


def _scheduled_update():
    """定时任务回调"""
    print(f"[{datetime.now()}] 定时更新任务触发...")

    # 检查赛事是否已结束
    if datetime.now().strftime("%Y-%m-%d") > EVENT_END_DATE:
        print("  赛事已结束，跳过自动更新。")
        return

    if not _try_acquire_lock():
        print("  上次更新尚未完成，跳过本次执行。")
        return

    thread = threading.Thread(target=_do_update, daemon=True)
    thread.start()


def init_scheduler(app):
    """初始化后台定时任务调度器"""
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        _scheduled_update,
        trigger="cron",
        hour=SCHEDULED_UPDATE_HOUR,
        minute=SCHEDULED_UPDATE_MINUTE,
        id="daily_update",
        replace_existing=True,
    )
    scheduler.start()
    print(f"  定时任务已启动：每天 {SCHEDULED_UPDATE_HOUR:02d}:{SCHEDULED_UPDATE_MINUTE:02d} 自动更新")

    # 在应用关闭时停止调度器
    import atexit
    atexit.register(lambda: scheduler.shutdown(wait=False))

    return scheduler
