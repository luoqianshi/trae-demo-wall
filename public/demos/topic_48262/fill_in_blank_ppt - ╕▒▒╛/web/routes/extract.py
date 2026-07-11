"""从 PPT 提取挖空文本路由"""
import os
import uuid

from flask import (
    Blueprint, render_template, request, redirect, url_for,
    jsonify, current_app, send_file, abort,
)

from web.web_config import UPLOAD_DIR, ALLOWED_PPTX_EXT

extract_bp = Blueprint("extract", __name__)


def _allowed_file(filename, allowed_ext):
    ext = os.path.splitext(filename)[1].lower()
    return ext in allowed_ext


@extract_bp.route("/")
def index():
    """提取页面"""
    return render_template("extract.html")


@extract_bp.route("/start", methods=["POST"])
def start():
    """上传 PPT 并启动提取任务"""
    if "file" not in request.files:
        return render_template("extract.html", error="请选择文件")

    file = request.files["file"]
    if file.filename == "":
        return render_template("extract.html", error="请选择文件")

    if not _allowed_file(file.filename, ALLOWED_PPTX_EXT):
        return render_template("extract.html",
                               error=f"不支持的文件类型，请上传 {', '.join(ALLOWED_PPTX_EXT)} 格式")

    task_id = uuid.uuid4().hex[:12]

    upload_dir = os.path.join(UPLOAD_DIR, task_id)
    os.makedirs(upload_dir, exist_ok=True)

    safe_name = "input.pptx"
    input_path = os.path.join(upload_dir, safe_name)
    file.save(input_path)

    params = {
        "input_path": input_path,
    }

    tm = current_app.extensions["task_manager"]
    tm.submit_extract(task_id, params)

    return redirect(url_for("extract.task", task_id=task_id))


@extract_bp.route("/task/<task_id>")
def task(task_id):
    """任务进度页面"""
    tm = current_app.extensions["task_manager"]
    task_info = tm.get_task(task_id)
    if task_info is None:
        abort(404)
    return render_template("task.html", task=task_info)


@extract_bp.route("/task/<task_id>/status")
def task_status(task_id):
    """AJAX 轮询获取任务状态"""
    tm = current_app.extensions["task_manager"]
    task_info = tm.get_task(task_id)
    if task_info is None:
        return jsonify({"error": "task not found"}), 404
    return jsonify(task_info.to_dict())


@extract_bp.route("/task/<task_id>/download")
def download(task_id):
    """下载提取的文本"""
    tm = current_app.extensions["task_manager"]
    task_info = tm.get_task(task_id)
    if task_info is None:
        abort(404)
    if task_info.status != "success" or not task_info.result_file:
        abort(404)
    if not os.path.exists(task_info.result_file):
        abort(404)
    return send_file(
        task_info.result_file,
        as_attachment=True,
        download_name=task_info.result_filename or f"{task_id}.txt",
    )


@extract_bp.route("/task/<task_id>/preview")
def preview(task_id):
    """预览提取的文本内容"""
    tm = current_app.extensions["task_manager"]
    task_info = tm.get_task(task_id)
    if task_info is None:
        abort(404)
    if task_info.status != "success" or not task_info.result_file:
        abort(404)
    if not os.path.exists(task_info.result_file):
        abort(404)

    with open(task_info.result_file, "r", encoding="utf-8") as f:
        content = f.read()

    return render_template("extract_preview.html", content=content, task=task_info)
