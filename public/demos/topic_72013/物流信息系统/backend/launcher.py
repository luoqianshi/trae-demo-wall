#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
物流信息管理系统 - 可视化启动器
"""

import tkinter as tk
from tkinter import ttk, messagebox
import subprocess
import threading
import time
import webbrowser
import os
import sys

class LIMSLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("物流信息管理系统 - 启动器")
        self.root.geometry("500x350")
        self.root.resizable(False, False)
        self.root.iconbitmap(default=None)
        
        # 服务器进程
        self.server_process = None
        self.is_running = False
        
        # 创建UI
        self.create_widgets()
    
    def create_widgets(self):
        # 标题区域
        title_frame = ttk.Frame(self.root, padding=20)
        title_frame.pack(fill=tk.X)
        
        title_label = ttk.Label(title_frame, text="物流信息管理系统", font=('微软雅黑', 20, 'bold'))
        title_label.pack()
        
        subtitle_label = ttk.Label(title_frame, text="Logistics Information Management System", font=('微软雅黑', 10))
        subtitle_label.pack(pady=(5, 0))
        
        # 状态区域
        status_frame = ttk.Frame(self.root, padding=20)
        status_frame.pack(fill=tk.X)
        
        self.status_label = ttk.Label(status_frame, text="状态: 未启动", font=('微软雅黑', 12))
        self.status_label.pack()
        
        self.status_bar = ttk.Progressbar(status_frame, mode='indeterminate')
        self.status_bar.pack(fill=tk.X, pady=(10, 0))
        self.status_bar.stop()
        
        # 信息区域
        info_frame = ttk.Frame(self.root, padding=20)
        info_frame.pack(fill=tk.X)
        
        info_text = """
        服务端口: 5000
        默认账号: admin / 123456
        访问地址: http://localhost:5000
        """
        
        info_label = ttk.Label(info_frame, text=info_text, font=('微软雅黑', 10), justify=tk.LEFT)
        info_label.pack()
        
        # 按钮区域
        button_frame = ttk.Frame(self.root, padding=20)
        button_frame.pack(fill=tk.X)
        
        self.start_btn = ttk.Button(button_frame, text="启动服务", command=self.start_server, width=20)
        self.start_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        self.stop_btn = ttk.Button(button_frame, text="停止服务", command=self.stop_server, width=20, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        self.browser_btn = ttk.Button(button_frame, text="打开浏览器", command=self.open_browser, width=20, state=tk.DISABLED)
        self.browser_btn.pack(side=tk.LEFT)
        
        # 日志区域
        log_frame = ttk.Frame(self.root, padding=10)
        log_frame.pack(fill=tk.BOTH, expand=True)
        
        log_label = ttk.Label(log_frame, text="运行日志:")
        log_label.pack(anchor=tk.W)
        
        self.log_text = tk.Text(log_frame, height=5, font=('Consolas', 9))
        self.log_text.pack(fill=tk.BOTH, expand=True)
        self.log_text.insert(tk.END, "欢迎使用物流信息管理系统启动器\n")
        self.log_text.config(state=tk.DISABLED)
    
    def log(self, message):
        """添加日志"""
        self.log_text.config(state=tk.NORMAL)
        self.log_text.insert(tk.END, f"[{time.strftime('%H:%M:%S')}] {message}\n")
        self.log_text.see(tk.END)
        self.log_text.config(state=tk.DISABLED)
    
    def start_server(self):
        """启动服务"""
        if self.is_running:
            messagebox.showinfo("提示", "服务已在运行中")
            return
        
        self.log("正在启动Flask服务...")
        self.status_label.config(text="状态: 启动中...")
        self.status_bar.start()
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)
        self.browser_btn.config(state=tk.DISABLED)
        
        # 在后台启动服务
        def run_server():
            try:
                os.chdir(os.path.dirname(os.path.abspath(__file__)))
                self.server_process = subprocess.Popen(
                    [sys.executable, 'run.py'],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True
                )
                
                self.is_running = True
                self.status_bar.stop()
                self.status_label.config(text="状态: 运行中")
                self.browser_btn.config(state=tk.NORMAL)
                self.log("服务启动成功")
                self.log("访问地址: http://localhost:5000")
                
                # 读取输出
                for line in self.server_process.stdout:
                    if line.strip():
                        self.log(line.strip())
                
            except Exception as e:
                self.log(f"启动失败: {str(e)}")
                self.status_bar.stop()
                self.status_label.config(text="状态: 启动失败")
                self.start_btn.config(state=tk.NORMAL)
                self.stop_btn.config(state=tk.DISABLED)
                messagebox.showerror("错误", f"启动失败: {str(e)}")
        
        threading.Thread(target=run_server, daemon=True).start()
    
    def stop_server(self):
        """停止服务"""
        if not self.is_running:
            return
        
        self.log("正在停止服务...")
        self.status_label.config(text="状态: 停止中...")
        
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait()
        
        self.is_running = False
        self.status_label.config(text="状态: 已停止")
        self.start_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)
        self.browser_btn.config(state=tk.DISABLED)
        self.log("服务已停止")
    
    def open_browser(self):
        """打开浏览器"""
        webbrowser.open('http://localhost:5000')
        self.log("已打开浏览器")

def main():
    root = tk.Tk()
    app = LIMSLauncher(root)
    
    # 关闭窗口时停止服务
    def on_closing():
        app.stop_server()
        root.destroy()
    
    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()

if __name__ == '__main__':
    main()
