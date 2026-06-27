"""首页路由"""
from flask import Blueprint, render_template, current_app

home_bp = Blueprint("home", __name__)


@home_bp.route("/")
def index():
    """首页"""
    tm = current_app.extensions["task_manager"]
    tasks = tm.get_all_tasks()
    # 统计
    stats = {
        "total": len(tasks),
        "success": sum(1 for t in tasks if t.status == "success"),
        "running": sum(1 for t in tasks if t.status in ("pending", "running")),
        "failed": sum(1 for t in tasks if t.status in ("failed", "timeout")),
    }
    # 最近 5 个任务
    recent = tasks[:5]
    return render_template("home.html", stats=stats, recent_tasks=recent)
