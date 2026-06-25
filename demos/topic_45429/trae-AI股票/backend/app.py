"""
AI智股 - Flask 应用入口
启动: python app.py  →  http://127.0.0.1:5000
"""
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config


def create_app():
    app = Flask(
        __name__,
        static_folder="../frontend/static",
        template_folder="../frontend",
    )
    app.config.from_object(Config)

    # 跨域支持（前后端分离开发）
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # 确保上传目录存在
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # 注册 API 蓝图
    from api.data import data_bp
    from api.model import model_bp
    from api.visualize import visualize_bp

    app.register_blueprint(data_bp, url_prefix="/api/data")
    app.register_blueprint(model_bp, url_prefix="/api/model")
    app.register_blueprint(visualize_bp, url_prefix="/api/visualize")

    # 前端页面路由
    @app.route("/")
    def index():
        return send_from_directory(app.template_folder, "index.html")

    @app.route("/<path:path>")
    def static_files(path):
        return send_from_directory(app.static_folder, path)

    # 健康检查
    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "AI智股", "version": "0.1.0"}

    return app


if __name__ == "__main__":
    app = create_app()
    print("=" * 50)
    print("  AI智股 后端服务已启动")
    print(f"  地址: http://127.0.0.1:5000")
    print(f"  环境: {Config.__name__}")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=Config.DEBUG)
