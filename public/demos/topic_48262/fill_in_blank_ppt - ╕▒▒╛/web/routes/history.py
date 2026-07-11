"""任务历史路由"""
from flask import Blueprint, render_template, current_app, abort, redirect, url_for

history_bp = Blueprint("history", __name__)


@history_bp.route("/")
def index():
    """任务历史列表"""
    tm = current_app.extensions["task_manager"]
    tasks = tm.get_all_tasks()
    return render_template("history.html", tasks=tasks)


@history_bp.route("/<task_id>")
def detail(task_id):
    """查看任务详情"""
    tm = current_app.extensions["task_manager"]
    task_info = tm.get_task(task_id)
    if task_info is None:
        abort(404)

    # 根据任务类型跳转到对应的任务页面
    if task_info.task_type == "generate":
        return redirect(url_for("generate.task", task_id=task_id))
    else:
        return redirect(url_for("extract.task", task_id=task_id))


@history_bp.route("/<task_id>/delete", methods=["POST"])
def delete(task_id):
    """删除任务"""
    tm = current_app.extensions["task_manager"]
    tm.delete_task(task_id)
    return redirect(url_for("history.index"))
