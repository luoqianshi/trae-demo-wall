"""
S3D建库数据自动生成软件 V3.0 - 入口脚本
"""

import sys
import os

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 预加载依赖模块，提前发现缺失
try:
    import xlwt
    import xlrd
    import xlutils
except ImportError as e:
    print(f"错误: 缺少必要的Excel处理库 - {e}")
    print("请运行: pip install xlwt xlrd xlutils")
    sys.exit(1)

try:
    import PyQt5
except ImportError as e:
    print(f"错误: 缺少PyQt5库 - {e}")
    print("请运行: pip install PyQt5")
    sys.exit(1)

from main_window import main

if __name__ == '__main__':
    main()
