# -*- coding: utf-8 -*-
"""
PVZ游戏独立运行版 Flask 应用
仅包含PVZ游戏所需的路由，无其他主程序功能

启动方式：
    python run.py
访问地址：
    http://127.0.0.1:5000/pvz/pvz_game
"""

import os
import sys
import webbrowser
import threading

from flask import Flask, render_template, send_from_directory, abort

# 路径设置：本文件位于 game/backend/app.py，项目根目录为 game/
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from .pvz_routes import pvz_bp


def create_app():
    """创建Flask应用"""
    template_dir = os.path.join(PROJECT_ROOT, 'frontend', 'templates')
    static_dir = os.path.join(PROJECT_ROOT, 'frontend', 'static')

    app = Flask(__name__,
                template_folder=template_dir,
                static_folder=static_dir,
                static_url_path='/static')

    # 安全密钥：从环境变量读取，否则随机生成
    app.config['SECRET_KEY'] = os.environ.get(
        'PVZ_GAME_SECRET_KEY',
        os.urandom(32).hex()
    )

    # 注册PVZ游戏蓝图
    app.register_blueprint(pvz_bp)

    # 根路径：跳转到游戏页面
    @app.route('/')
    def index():
        return render_template('pvz_game.html')

    return app


app = create_app()


def run_server(host='127.0.0.1', port=5000, debug=False, open_browser=True):
    """启动Flask服务器"""
    if open_browser:
        url = f'http://{host}:{port}/'
        # 延迟1秒后打开浏览器，确保服务器已启动
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    print(f'🌿 PVZ游戏独立运行版')
    print(f'📡 服务地址: http://{host}:{port}/')
    print(f'🎮 游戏入口: http://{host}:{port}/pvz/pvz_game')
    print(f'🛑 按 Ctrl+C 停止服务')
    print()

    app.run(host=host, port=port, debug=debug, use_reloader=False)
