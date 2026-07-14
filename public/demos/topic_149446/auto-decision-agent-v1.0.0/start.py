"""
Auto-Decision Agent 一键启动脚本

用法:
    python start.py

然后打开浏览器访问 http://localhost:8000
"""
import sys
import subprocess
import os


def check_dependencies():
    """检查并安装依赖"""
    try:
        import fastapi
        import uvicorn
        import yaml
        import openai
        print("[OK] 依赖检查通过")
        return True
    except ImportError:
        print("[INFO] 依赖未安装，正在安装...")
        req_file = os.path.join(os.path.dirname(__file__), "requirements.txt")
        if os.path.exists(req_file):
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file])
            print("[OK] 依赖安装完成")
            return True
        else:
            print("[ERROR] 未找到 requirements.txt")
            return False


def main():
    print("=" * 50)
    print("  Auto-Decision Agent 启动器")
    print("=" * 50)
    print()

    # 检查依赖
    if not check_dependencies():
        sys.exit(1)

    # 检查配置
    config_path = os.path.join(os.path.dirname(__file__), "config", "config.yaml")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            content = f.read()
        if "your-api-key-here" in content:
            print("[WARNING] 检测到默认 API Key，请编辑 config/config.yaml 填写您的真实 API Key")
            print()

    # 启动服务
    print("[INFO] 启动 FastAPI 服务...")
    print("[INFO] 服务启动后，请打开浏览器访问: http://localhost:8000")
    print()

    # 将项目根目录加入 Python 路径
    project_root = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, project_root)

    try:
        from backend.main import app
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    except Exception as e:
        print(f"[ERROR] 启动失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
