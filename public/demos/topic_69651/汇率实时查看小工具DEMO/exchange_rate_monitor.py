#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
汇率实时监控桌面工具
功能：
1. 桌面悬浮窗显示实时汇率
2. 系统托盘图标
3. 汇率剧烈波动时弹出警告
4. 支持自定义货币对、刷新频率和波动阈值
"""

import os
import sys
import json
import time
import threading
import requests
import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import pystray

# ============ 配置管理 ============
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

DEFAULT_CONFIG = {
    "base_currency": "USD",
    "target_currency": "JPY",
    "refresh_interval": 30,       # 秒
    "alert_threshold": 0.5,       # 波动阈值（百分比）
    "window_x": 100,
    "window_y": 100,
    "always_on_top": True,
    "auto_start_alert": True
}


def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                config = json.load(f)
            # 合并默认配置
            for key, value in DEFAULT_CONFIG.items():
                if key not in config:
                    config[key] = value
            return config
        except Exception:
            pass
    return DEFAULT_CONFIG.copy()


def save_config(config):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"保存配置失败: {e}")


# ============ 汇率获取器 ============
class RateFetcher:
    def __init__(self):
        self.last_rate = None
        self.last_update = None
        self.error_count = 0

    def fetch_rate(self, base, target):
        """获取汇率，返回 (rate, error_msg)"""
        try:
            url = f"https://api.exchangerate-api.com/v4/latest/{base}"
            response = requests.get(url, timeout=10)
            data = response.json()

            if "rates" not in data or target not in data["rates"]:
                return None, f"无法获取 {base}/{target} 汇率"

            rate = data["rates"][target]
            self.last_rate = rate
            self.last_update = datetime.now()
            self.error_count = 0
            return rate, None

        except requests.exceptions.RequestException as e:
            self.error_count += 1
            return None, f"网络错误: {str(e)}"
        except Exception as e:
            self.error_count += 1
            return None, f"错误: {str(e)}"


# ============ 警报窗口 ============
class AlertWindow:
    def __init__(self, parent, base, target, old_rate, new_rate, change_pct):
        self.window = tk.Toplevel(parent)
        self.window.title("汇率波动警告")
        self.window.geometry("400x200")
        self.window.resizable(False, False)
        self.window.attributes("-topmost", True)

        # 居中显示
        self.window.update_idletasks()
        x = (self.window.winfo_screenwidth() // 2) - (400 // 2)
        y = (self.window.winfo_screenheight() // 2) - (200 // 2)
        self.window.geometry(f"+{x}+{y}")

        direction = "上涨" if change_pct > 0 else "下跌"
        color = "#e74c3c" if change_pct > 0 else "#27ae60"

        # 标题
        title_label = tk.Label(
            self.window,
            text=f"[!] 汇率剧烈{direction}！",
            font=("Microsoft YaHei", 18, "bold"),
            fg=color
        )
        title_label.pack(pady=15)

        # 详细信息
        info_text = f"{base}/{target}\n"
        info_text += f"之前: {old_rate:.4f}\n"
        info_text += f"当前: {new_rate:.4f}\n"
        info_text += f"变动: {change_pct:+.2f}%"

        info_label = tk.Label(
            self.window,
            text=info_text,
            font=("Microsoft YaHei", 14),
            justify="center"
        )
        info_label.pack(pady=10)

        # 确认按钮
        btn = tk.Button(
            self.window,
            text="我知道了",
            font=("Microsoft YaHei", 12),
            command=self.window.destroy,
            width=12
        )
        btn.pack(pady=10)

        # 自动关闭定时器（30秒后）
        self.window.after(30000, self.window.destroy)


# ============ 设置窗口 ============
class SettingsWindow:
    def __init__(self, parent, config, on_save_callback):
        self.window = tk.Toplevel(parent)
        self.window.title("设置")
        self.window.geometry("400x350")
        self.window.resizable(False, False)
        self.window.attributes("-topmost", True)
        self.config = config
        self.on_save = on_save_callback

        # 居中
        self.window.update_idletasks()
        x = (self.window.winfo_screenwidth() // 2) - (400 // 2)
        y = (self.window.winfo_screenheight() // 2) - (350 // 2)
        self.window.geometry(f"+{x}+{y}")

        frame = tk.Frame(self.window, padx=20, pady=20)
        frame.pack(fill="both", expand=True)

        # 基础货币
        tk.Label(frame, text="基础货币:", font=("Microsoft YaHei", 11)).grid(row=0, column=0, sticky="w", pady=8)
        self.base_var = tk.StringVar(value=config["base_currency"])
        base_entry = tk.Entry(frame, textvariable=self.base_var, font=("Microsoft YaHei", 11), width=15)
        base_entry.grid(row=0, column=1, sticky="w", pady=8)

        # 目标货币
        tk.Label(frame, text="目标货币:", font=("Microsoft YaHei", 11)).grid(row=1, column=0, sticky="w", pady=8)
        self.target_var = tk.StringVar(value=config["target_currency"])
        target_entry = tk.Entry(frame, textvariable=self.target_var, font=("Microsoft YaHei", 11), width=15)
        target_entry.grid(row=1, column=1, sticky="w", pady=8)

        # 刷新频率
        tk.Label(frame, text="刷新频率(秒):", font=("Microsoft YaHei", 11)).grid(row=2, column=0, sticky="w", pady=8)
        self.interval_var = tk.IntVar(value=config["refresh_interval"])
        interval_spin = tk.Spinbox(frame, from_=10, to=3600, textvariable=self.interval_var, font=("Microsoft YaHei", 11), width=15)
        interval_spin.grid(row=2, column=1, sticky="w", pady=8)

        # 波动阈值
        tk.Label(frame, text="警报阈值(%):", font=("Microsoft YaHei", 11)).grid(row=3, column=0, sticky="w", pady=8)
        self.threshold_var = tk.DoubleVar(value=config["alert_threshold"])
        threshold_spin = tk.Spinbox(frame, from_=0.1, to=10.0, increment=0.1, textvariable=self.threshold_var, font=("Microsoft YaHei", 11), width=15)
        threshold_spin.grid(row=3, column=1, sticky="w", pady=8)

        # 置顶选项
        self.topmost_var = tk.BooleanVar(value=config.get("always_on_top", True))
        topmost_check = tk.Checkbutton(frame, text="窗口始终置顶", variable=self.topmost_var, font=("Microsoft YaHei", 11))
        topmost_check.grid(row=4, column=0, columnspan=2, sticky="w", pady=8)

        # 自动启用警报
        self.alert_var = tk.BooleanVar(value=config.get("auto_start_alert", True))
        alert_check = tk.Checkbutton(frame, text="启用波动警报", variable=self.alert_var, font=("Microsoft YaHei", 11))
        alert_check.grid(row=5, column=0, columnspan=2, sticky="w", pady=8)

        # 按钮
        btn_frame = tk.Frame(frame)
        btn_frame.grid(row=6, column=0, columnspan=2, pady=20)

        save_btn = tk.Button(btn_frame, text="保存", command=self.save, font=("Microsoft YaHei", 11), width=10, bg="#3498db", fg="white")
        save_btn.pack(side="left", padx=10)

        cancel_btn = tk.Button(btn_frame, text="取消", command=self.window.destroy, font=("Microsoft YaHei", 11), width=10)
        cancel_btn.pack(side="left", padx=10)

    def save(self):
        self.config["base_currency"] = self.base_var.get().upper().strip()
        self.config["target_currency"] = self.target_var.get().upper().strip()
        self.config["refresh_interval"] = self.interval_var.get()
        self.config["alert_threshold"] = self.threshold_var.get()
        self.config["always_on_top"] = self.topmost_var.get()
        self.config["auto_start_alert"] = self.alert_var.get()
        save_config(self.config)
        self.on_save(self.config)
        self.window.destroy()


# ============ 桌面悬浮窗 ============
class FloatingWindow:
    def __init__(self):
        self.config = load_config()
        self.fetcher = RateFetcher()
        self.running = True
        self.is_alerting = False
        self.settings_window = None
        self.last_rate = None
        self.tray_icon = None

        # 主窗口
        self.root = tk.Tk()
        self.root.title("汇率监控")
        self.root.geometry(f"280x140+{self.config['window_x']}+{self.config['window_y']}")
        self.root.overrideredirect(True)  # 无边框
        self.root.attributes("-topmost", self.config.get("always_on_top", True))
        self.root.attributes("-alpha", 0.95)

        # 背景
        self.bg_color = "#2c3e50"
        self.root.configure(bg=self.bg_color)

        # 创建界面
        self._create_ui()

        # 绑定拖拽事件
        self._bind_drag()

        # 右键菜单
        self._create_context_menu()

        # 启动更新线程
        self.update_thread = threading.Thread(target=self._update_loop, daemon=True)
        self.update_thread.start()

        # 窗口关闭处理
        self.root.protocol("WM_DELETE_WINDOW", self.hide_window)

    def _create_ui(self):
        # 标题栏
        title_frame = tk.Frame(self.root, bg=self.bg_color, height=25)
        title_frame.pack(fill="x", padx=5, pady=2)
        title_frame.pack_propagate(False)

        self.title_label = tk.Label(
            title_frame,
            text=f"{self.config['base_currency']}/{self.config['target_currency']}",
            font=("Microsoft YaHei", 10, "bold"),
            fg="#ecf0f1",
            bg=self.bg_color
        )
        self.title_label.pack(side="left")

        # 关闭按钮
        close_btn = tk.Label(title_frame, text="✕", font=("Microsoft YaHei", 10), fg="#e74c3c", bg=self.bg_color, cursor="hand2")
        close_btn.pack(side="right", padx=5)
        close_btn.bind("<Button-1>", lambda e: self.hide_window())

        # 设置按钮
        settings_btn = tk.Label(title_frame, text="⚙", font=("Microsoft YaHei", 10), fg="#3498db", bg=self.bg_color, cursor="hand2")
        settings_btn.pack(side="right", padx=5)
        settings_btn.bind("<Button-1>", lambda e: self.open_settings())

        # 汇率显示
        self.rate_label = tk.Label(
            self.root,
            text="--.--",
            font=("Microsoft YaHei", 28, "bold"),
            fg="#f39c12",
            bg=self.bg_color
        )
        self.rate_label.pack(pady=5)

        # 变动显示
        self.change_label = tk.Label(
            self.root,
            text="等待更新...",
            font=("Microsoft YaHei", 10),
            fg="#bdc3c7",
            bg=self.bg_color
        )
        self.change_label.pack()

        # 更新时间
        self.time_label = tk.Label(
            self.root,
            text="",
            font=("Microsoft YaHei", 9),
            fg="#7f8c8d",
            bg=self.bg_color
        )
        self.time_label.pack(pady=2)

    def _bind_drag(self):
        self._drag_data = {"x": 0, "y": 0}

        def on_press(event):
            self._drag_data["x"] = event.x
            self._drag_data["y"] = event.y

        def on_drag(event):
            x = self.root.winfo_x() + event.x - self._drag_data["x"]
            y = self.root.winfo_y() + event.y - self._drag_data["y"]
            self.root.geometry(f"+{x}+{y}")
            self.config["window_x"] = x
            self.config["window_y"] = y

        self.root.bind("<Button-1>", on_press)
        self.root.bind("<B1-Motion>", on_drag)

    def _create_context_menu(self):
        self.menu = tk.Menu(self.root, tearoff=0)
        self.menu.add_command(label="设置", command=self.open_settings)
        self.menu.add_command(label="刷新", command=self._force_refresh)
        self.menu.add_separator()
        self.menu.add_command(label="隐藏到托盘", command=self.hide_window)
        self.menu.add_command(label="退出", command=self.quit_app)

        def show_menu(event):
            self.menu.post(event.x_root, event.y_root)

        self.root.bind("<Button-3>", show_menu)

    def _force_refresh(self):
        self.last_rate = None  # 强制重新计算变动
        self._do_update()

    def open_settings(self):
        if self.settings_window is not None and self.settings_window.window.winfo_exists():
            self.settings_window.window.lift()
            return
        self.settings_window = SettingsWindow(self.root, self.config, self._on_settings_changed)

    def _on_settings_changed(self, new_config):
        self.config = new_config
        self.title_label.config(text=f"{self.config['base_currency']}/{self.config['target_currency']}")
        self.root.attributes("-topmost", self.config.get("always_on_top", True))
        self.last_rate = None
        self._do_update()

    def _do_update(self):
        base = self.config["base_currency"]
        target = self.config["target_currency"]

        rate, error = self.fetcher.fetch_rate(base, target)

        if error:
            self.rate_label.config(text="错误", fg="#e74c3c")
            self.change_label.config(text=error, fg="#e74c3c")
            self.time_label.config(text=datetime.now().strftime("%H:%M:%S"))
            return

        # 计算变动
        change_pct = 0
        if self.last_rate is not None and self.last_rate != 0:
            change_pct = ((rate - self.last_rate) / self.last_rate) * 100

        # 更新显示
        self.rate_label.config(text=f"{rate:.4f}")

        if abs(change_pct) > 0.001:
            change_color = "#e74c3c" if change_pct > 0 else "#27ae60"
            arrow = "▲" if change_pct > 0 else "▼"
            self.change_label.config(
                text=f"{arrow} {change_pct:+.3f}%",
                fg=change_color
            )
        else:
            self.change_label.config(text="持平", fg="#bdc3c7")

        self.time_label.config(text=f"更新: {datetime.now().strftime('%H:%M:%S')}")

        # 检查是否需要警报
        threshold = self.config.get("alert_threshold", 0.5)
        if self.config.get("auto_start_alert", True) and abs(change_pct) >= threshold and self.last_rate is not None:
            self._show_alert(self.last_rate, rate, change_pct)

        self.last_rate = rate

    def _show_alert(self, old_rate, new_rate, change_pct):
        if self.is_alerting:
            return
        self.is_alerting = True
        AlertWindow(
            self.root,
            self.config["base_currency"],
            self.config["target_currency"],
            old_rate,
            new_rate,
            change_pct
        )
        # 3秒后重置警报状态
        self.root.after(3000, self._reset_alert)

    def _reset_alert(self):
        self.is_alerting = False

    def _update_loop(self):
        # 首次更新
        self.root.after(1000, self._do_update)

        while self.running:
            time.sleep(self.config["refresh_interval"])
            if self.running:
                self.root.after(0, self._do_update)

    def hide_window(self):
        self.root.withdraw()

    def show_window(self):
        self.root.deiconify()
        self.root.lift()
        self.root.attributes("-topmost", True)

    def quit_app(self):
        self.running = False
        save_config(self.config)
        if self.tray_icon:
            self.tray_icon.stop()
        self.root.quit()
        self.root.destroy()
        os._exit(0)

    def set_tray_icon(self, tray_icon):
        self.tray_icon = tray_icon

    def run(self):
        self.root.mainloop()


# ============ 系统托盘 ============
def create_tray_icon_image():
    """创建托盘图标"""
    width = 64
    height = 64
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    dc = ImageDraw.Draw(image)

    # 圆形背景
    dc.ellipse([4, 4, 60, 60], fill="#3498db", outline="#2980b9", width=2)

    # 货币符号
    try:
        font = ImageFont.truetype("msyh.ttc", 24)
    except:
        font = ImageFont.load_default()

    dc.text((width//2, height//2), "￥", fill="white", font=font, anchor="mm")

    return image


def setup_tray_icon(floating_window):
    def on_show(icon, item):
        floating_window.show_window()

    def on_exit(icon, item):
        icon.stop()
        floating_window.quit_app()

    menu = pystray.Menu(
        pystray.MenuItem("显示", on_show),
        pystray.MenuItem("退出", on_exit)
    )

    icon = pystray.Icon(
        "exchange_rate_monitor",
        create_tray_icon_image(),
        "汇率监控",
        menu
    )

    floating_window.set_tray_icon(icon)
    icon.run()


# ============ 主入口 ============
def main():
    # 检查依赖
    try:
        import requests
        import pystray
        from PIL import Image, ImageDraw, ImageFont
    except ImportError as e:
        print(f"缺少依赖: {e}")
        print("请运行: pip install -r requirements.txt")
        messagebox.showerror("错误", f"缺少依赖: {e}\n请运行: pip install -r requirements.txt")
        sys.exit(1)

    # 创建悬浮窗
    floating = FloatingWindow()

    # 在后台线程启动托盘图标
    tray_thread = threading.Thread(target=setup_tray_icon, args=(floating,), daemon=True)
    tray_thread.start()

    # 运行主界面
    floating.run()


if __name__ == "__main__":
    main()
