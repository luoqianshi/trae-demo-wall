"""
玫瑰时光 - 打包脚本
使用 PyInstaller 将项目打包为单个 exe 安装包
"""
import os
import sys
import shutil
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(SCRIPT_DIR, "dist", "RoseBloom")
EXE_NAME = "RoseBloom"

def check_pyinstaller():
    """检查并安装 PyInstaller"""
    try:
        import PyInstaller
        print(f"[OK] PyInstaller {PyInstaller.__version__} 已安装")
    except ImportError:
        print("[...] 正在安装 PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        print("[OK] PyInstaller 安装完成")

def build_exe():
    """使用 PyInstaller 打包为单文件 exe"""
    print("[...] 正在打包 RoseBloom.exe ...")
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",                    # 单文件模式
        "--windowed",                   # 无控制台窗口
        "--name", EXE_NAME,             # 输出文件名
        "--distpath", os.path.join(SCRIPT_DIR, "dist"),
        "--workpath", os.path.join(SCRIPT_DIR, "build"),
        "--specpath", SCRIPT_DIR,
        "--clean",
        os.path.join(SCRIPT_DIR, "rose_bloom.py")
    ]
    subprocess.check_call(cmd)
    print("[OK] RoseBloom.exe 打包完成")

def collect_resources():
    """收集所有资源文件到 dist 目录"""
    print("[...] 正在收集资源文件...")

    # 创建发布目录
    os.makedirs(DIST_DIR, exist_ok=True)

    # 复制 exe
    exe_src = os.path.join(SCRIPT_DIR, "dist", EXE_NAME + ".exe")
    exe_dst = os.path.join(DIST_DIR, EXE_NAME + ".exe")
    shutil.copy2(exe_src, exe_dst)

    # 复制 HTML
    html_src = os.path.join(SCRIPT_DIR, "rose_bloom.html")
    if os.path.exists(html_src):
        shutil.copy2(html_src, DIST_DIR)

    # 复制所有 MP3 和 LRC 文件
    for f in os.listdir(SCRIPT_DIR):
        ext = os.path.splitext(f)[1].lower()
        if ext in ('.mp3', '.lrc', '.txt'):
            src = os.path.join(SCRIPT_DIR, f)
            dst = os.path.join(DIST_DIR, f)
            shutil.copy2(src, dst)
            print(f"  复制: {f}")

    # 复制配置文件（如果存在）
    config_src = os.path.join(SCRIPT_DIR, "playlist_config.json")
    if os.path.exists(config_src):
        shutil.copy2(config_src, DIST_DIR)

    print("[OK] 资源文件收集完成")

def create_launcher():
    """创建启动脚本"""
    launcher_path = os.path.join(DIST_DIR, "启动玫瑰时光.bat")
    with open(launcher_path, "w", encoding="utf-8") as f:
        f.write("@echo off\n")
        f.write("chcp 65001 >nul\n")
        f.write("title 玫瑰时光 - Rose Bloom\n")
        f.write("echo 正在启动玫瑰时光...\n")
        f.write("start \"\" \"%~dp0RoseBloom.exe\"\n")
        f.write("exit\n")
    print("[OK] 启动脚本创建完成")

def create_readme():
    """创建说明文件"""
    readme_path = os.path.join(DIST_DIR, "使用说明.txt")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write("╔══════════════════════════════════════╗\n")
        f.write("║       玫瑰时光 - Rose Bloom          ║\n")
        f.write("╚══════════════════════════════════════╝\n\n")
        f.write("【启动方式】\n")
        f.write("  双击 RoseBloom.exe 或 启动玫瑰时光.bat\n")
        f.write("  启动后浏览器会自动打开 http://localhost:8765/\n\n")
        f.write("【添加音乐】\n")
        f.write("  将 MP3 文件放入本目录，在网页中点击\"+ 添加歌曲\"\n")
        f.write("  或直接将 MP3 文件复制到 exe 同级目录下\n\n")
        f.write("【添加歌词】\n")
        f.write("  将同名 .lrc 文件放入本目录即可自动匹配\n")
        f.write("  例如：La Vie en Rose.mp3 → La Vie en Rose.lrc\n\n")
        f.write("【关闭服务】\n")
        f.write("  关闭浏览器标签页后，在任务管理器中结束 RoseBloom.exe\n\n")
        f.write("【文件说明】\n")
        f.write("  RoseBloom.exe    - 主程序（HTTP服务器）\n")
        f.write("  rose_bloom.html  - 网页文件\n")
        f.write("  *.mp3            - 音乐文件\n")
        f.write("  *.lrc            - 歌词文件\n")
        f.write("  playlist_config.json - 播放列表配置（自动生成）\n")
    print("[OK] 说明文件创建完成")

def main():
    print("=" * 50)
    print("  玫瑰时光 - 打包工具")
    print("=" * 50)
    print()

    # 步骤1：检查 PyInstaller
    check_pyinstaller()

    # 步骤2：打包 exe
    build_exe()

    # 步骤3：收集资源
    collect_resources()

    # 步骤4：创建启动脚本
    create_launcher()

    # 步骤5：创建说明文件
    create_readme()

    print()
    print("=" * 50)
    print(f"  打包完成！输出目录：{DIST_DIR}")
    print("  将整个 RoseBloom 文件夹复制到其他电脑即可使用")
    print("=" * 50)

if __name__ == "__main__":
    main()
