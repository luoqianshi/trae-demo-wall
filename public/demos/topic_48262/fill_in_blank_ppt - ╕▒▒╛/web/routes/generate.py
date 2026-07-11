"""生成挖空 PPT 路由"""
import os
import uuid

from flask import (
    Blueprint, render_template, request, redirect, url_for,
    jsonify, current_app, send_file, abort,
)

from web.web_config import UPLOAD_DIR, ALLOWED_TEXT_EXT

generate_bp = Blueprint("generate", __name__)


def _allowed_file(filename, allowed_ext):
    """检查文件扩展名是否允许"""
    ext = os.path.splitext(filename)[1].lower()
    return ext in allowed_ext


@generate_bp.route("/")
def index():
    """生成页面"""
    return render_template("generate.html")


@generate_bp.route("/start", methods=["POST"])
def start():
    """上传文件并启动生成任务

    表单字段:
        - file: 上传的文本文件
        - ai_mode: manual / ai / mixed
        - ai_model: AI 模型名（可选）
        - ai_provider: AI 提供商（可选）
        - ai_api_key: API key（可选）
        - chars_per_page: 每页字符数（空=自动）
        - max_blanks_per_paragraph: 每段最大挖空数
        - max_retries: 最大重试次数
    """
    # 检查文件
    if "file" not in request.files:
        return render_template("generate.html", error="请选择文件")

    file = request.files["file"]
    if file.filename == "":
        return render_template("generate.html", error="请选择文件")

    if not _allowed_file(file.filename, ALLOWED_TEXT_EXT):
        return render_template("generate.html",
                               error=f"不支持的文件类型，请上传 {', '.join(ALLOWED_TEXT_EXT)} 格式")

    # 生成 task_id
    task_id = uuid.uuid4().hex[:12]

    # 保存上传文件
    upload_dir = os.path.join(UPLOAD_DIR, task_id)
    os.makedirs(upload_dir, exist_ok=True)

    # 安全的文件名
    safe_name = f"input{os.path.splitext(file.filename)[1]}"
    input_path = os.path.join(upload_dir, safe_name)
    file.save(input_path)

    # 收集参数
    params = {
        "input_path": input_path,
        "ai_mode": request.form.get("ai_mode", "mixed"),
        "ai_model": request.form.get("ai_model", ""),
        "ai_provider": request.form.get("ai_provider", "openai"),
        "ai_api_key": request.form.get("ai_api_key", ""),
        "chars_per_page": request.form.get("chars_per_page", ""),
        "max_blanks_per_paragraph": request.form.get("max_blanks_per_paragraph", "3"),
        "max_retries": request.form.get("max_retries", "3"),
    }

    # 提交任务
    tm = current_app.extensions["task_manager"]
    tm.submit_generate(task_id, params)

    return redirect(url_for("generate.task", task_id=task_id))


@generate_bp.route("/task/<task_id>")
def task(task_id):
    """任务进度页面"""
    tm = current_app.extensions["task_manager"]
    task_info = tm.get_task(task_id)
    if task_info is None:
        abort(404)
    return render_template("task.html", task=task_info)


@generate_bp.route("/task/<task_id>/status")
def task_status(task_id):
    """AJAX 轮询获取任务状态"""
    tm = current_app.extensions["task_manager"]
    task_info = tm.get_task(task_id)
    if task_info is None:
        return jsonify({"error": "task not found"}), 404
    return jsonify(task_info.to_dict())


@generate_bp.route("/task/<task_id>/download")
def download(task_id):
    """下载生成的 PPT"""
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
        download_name=task_info.result_filename or f"{task_id}.pptx",
    )
