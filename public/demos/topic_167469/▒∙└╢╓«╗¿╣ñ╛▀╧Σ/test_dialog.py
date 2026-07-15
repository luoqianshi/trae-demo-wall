# -*- coding: utf-8 -*-
import sys
import io
import tkinter as tk
from tkinter import messagebox

sys.path.insert(0, r'D:\User\Users\Desktop\冰蓝之花工具箱')

# 重定向stderr来捕获错误
old_stderr = sys.stderr
sys.stderr = io.StringIO()

try:
    from main import BlockDialog
    
    root = tk.Tk()
    root.withdraw()
    
    colors = {
        'primary': '#0984e3', 'secondary': '#74b9ff',
        'dark': '#0c2461', 'white': '#ffffff',
        'light_bg': '#f5faff', 'card_bg': '#eef6ff',
        'card_border': '#d4e9ff', 'text': '#2d3436',
        'text_light': '#636e72', 'text_hint': '#a0aec0',
        'transparent': '#0c2461', 'hover': '#0873c9',
        'danger': '#e17055', 'danger_hover': '#d63031',
        'success': '#00b894', 'disabled_bg': '#f1f2f6',
        'disabled_text': '#b2bec3', 'time_color': '#5f9ea0',
    }
    
    print("Creating BlockDialog...")
    dlg = BlockDialog(root, "测试", colors, 1920, 1080)
    print("Dialog created successfully!")
    print(f"Result: {dlg.result}")
    
except Exception as e:
    print(f"Exception: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
finally:
    # 获取stderr内容
    stderr_output = sys.stderr.getvalue()
    sys.stderr = old_stderr
    
    if stderr_output:
        print("\n=== STDERR OUTPUT ===")
        print(stderr_output)
    
    if 'root' in dir():
        root.destroy()
    
    print("\nTest complete!")
