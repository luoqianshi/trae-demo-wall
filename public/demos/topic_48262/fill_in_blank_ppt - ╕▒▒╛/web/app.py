"""Flask 应用工厂"""
import os
import sys

# 确保项目根目录在 sys.path 中
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from web.web_config import MAX_CONTENT_LENGTH
from web.task_manager import TaskManager


def create_app() -> Flask:
    """创建并配置 Flask 应用"""
    app = Flask(__name__,
                template_folder="templates",
                static_folder="static")

    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
    app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "fill-blank-ppt-dev-key")

    # 初始化 TaskManager
    task_manager = TaskManager()
    app.extensions["task_manager"] = task_manager

    # 注册蓝图
    from web.routes.home import home_bp
    from web.routes.generate import generate_bp
    from web.routes.extract import extract_bp
    from web.routes.history import history_bp

    app.register_blueprint(home_bp)
    app.register_blueprint(generate_bp, url_prefix="/generate")
    app.register_blueprint(extract_bp, url_prefix="/extract")
    app.register_blueprint(history_bp, url_prefix="/history")

    # 错误处理
    @app.errorhandler(404)
    def page_not_found(e):
        from flask import render_template
        return render_template("error.html", code=404, message="页面不存在"), 404

    @app.errorhandler(413)
    def request_too_large(e):
        from flask import render_template
        return render_template("error.html", code=413, message="上传文件过大（最大 10 MB）"), 413

    @app.errorhandler(500)
    def internal_error(e):
        from flask import render_template
        return render_template("error.html", code=500, message="服务器内部错误"), 500

    @app.teardown_appcontext
    def shutdown_task_manager(exception=None):
        tm = app.extensions.get("task_manager")
        if tm:
            tm.shutdown()

    return app
