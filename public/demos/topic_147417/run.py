import subprocess
import sys

def main():
    print("🏠 智能家居场景规划器启动中...")
    print("端口: 8501")
    print("访问地址: http://localhost:8501")
    print("-" * 50)
    
    subprocess.run([
        sys.executable, "-m", "streamlit", "run", 
        "app.py", "--server.port", "8501"
    ])

if __name__ == "__main__":
    main()
