"""ReadMate 启动脚本"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from readmate.app import main

if __name__ == "__main__":
    main()
