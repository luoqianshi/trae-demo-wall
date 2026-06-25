#!/usr/bin/env python3
"""
启动园林设计意图预测系统
"""
import subprocess
import sys
import os

def main():
    print("="*60)
    print("🎯 园林智意 - 中国园林设计意图量化与推理系统")
    print("="*60)
    
    # 安装依赖
    print("\n[*] 检查并安装依赖...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "flask", "flask-cors"], 
                      check=True, capture_output=True)
        print("[OK] 依赖安装成功")
    except subprocess.CalledProcessError as e:
        print(f"[WARN] 依赖安装警告: {e.stderr.decode()[:200]}")
    
    # 启动后端服务
    print("\n[*] 启动后端服务...")
    backend_path = os.path.join(os.path.dirname(__file__), 'backend', 'app.py')
    
    if os.name == 'nt':
        # Windows
        subprocess.Popen([sys.executable, backend_path])
    else:
        # Linux/Mac
        subprocess.Popen([sys.executable, backend_path])
    
    print("[OK] 后端服务已启动")
    print("\n[*] 服务访问地址:")
    print("    - API服务: http://localhost:5000")
    print("    - 前端页面: 直接打开 index.html")
    print("\n[*] 使用说明:")
    print("    1. 打开浏览器访问 index.html")
    print("    2. 选择模型（75W点或500W点）")
    print("    3. 点击园林元素")
    print("    4. 拖动滑块调整位置")
    print("    5. 查看AI预测结果")
    print("\n[*] 按 Ctrl+C 停止服务")
    
    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("\n[*] 服务已停止")

if __name__ == '__main__':
    main()