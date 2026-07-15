"""ReadMate 打包脚本
用法: python build.py [--onedir]
输出: dist/ReadMate.exe 或 dist/ReadMate/ReadMate.exe
"""
import subprocess
import sys
from pathlib import Path


def main():
    here = Path(__file__).parent
    dist_dir = here / "dist"
    work_dir = here / "build"

    # 默认 onefile（兼容单 exe）；加 --onedir 切到文件夹模式
    onedir = "--onedir" in sys.argv
    sys.argv = [a for a in sys.argv if a != "--onedir"]

    dist_dir.mkdir(exist_ok=True)

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", "ReadMate",
        "--windowed",
        "--distpath", str(dist_dir),
        "--workpath", str(work_dir),
        "--specpath", str(here),
        str(here / "run.py"),
    ]

    if onedir:
        cmd.insert(3, "--onedir")
        print("【打包模式】onedir（文件夹模式，更可靠）")
    else:
        cmd.insert(3, "--onefile")
        print("【打包模式】onefile（单 exe）")

    print("开始打包 ReadMate...")
    print(" ".join(cmd))
    subprocess.run(cmd, check=True)
    if onedir:
        out = dist_dir / "ReadMate" / "ReadMate.exe"
    else:
        out = dist_dir / "ReadMate.exe"
    print(f"打包完成: {out}")


if __name__ == "__main__":
    main()