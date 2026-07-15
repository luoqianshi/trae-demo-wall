#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
云端部署入口 - 适配生产环境
- 使用应用目录下的 data 文件夹存储所有数据
- 适配 Gunicorn
- 支持环境变量配置
"""
import os
import sys

# 设置应用根目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# 关键：将 HOME 指向 data 目录，这样所有 ~/.banban 路径都会指向 data/.banban
# 这是最简单的兼容方式，不需要修改每个模块的路径
os.environ["HOME"] = DATA_DIR
os.environ["BANBAN_DATA_DIR"] = os.path.join(DATA_DIR, ".banban")

# 确保日志目录存在
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# 导入 Flask 应用
sys.path.insert(0, BASE_DIR)

from web_ui import app as application

# 生产环境配置
application.config["ENV"] = "production"
application.config["DEBUG"] = False
application.config["PROPAGATE_EXCEPTIONS"] = True

app = application

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
