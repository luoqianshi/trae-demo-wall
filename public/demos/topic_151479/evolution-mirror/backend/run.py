"""
启动脚本
使用 uvicorn 运行 FastAPI 应用
"""

import uvicorn
from app.config import get_config

if __name__ == "__main__":
    config = get_config()
    uvicorn.run("app.main:app", host=config.HOST, port=config.PORT, reload=True)