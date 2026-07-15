# -*- coding: utf-8 -*-
"""
冰蓝之花工具箱 - 桌面悬浮工具箱
纯 Python / tkinter 实现，支持5种功能类型
"""

import tkinter as tk
from tkinter import messagebox, filedialog, ttk
from datetime import datetime, timedelta
import sys
import os
import json
import socket
import subprocess
import webbrowser
import threading
import time
import ctypes


class IceBlueToolbox:
    """主程序：悬浮球 → 弹出面板 → 6 槽位 → 更多设置"""

    WEEKDAYS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("冰蓝之花工具箱")

        try:
            self._lock_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self._lock_sock.bind(('127.0.0.1', 23456))
            self._lock_sock.listen(1)
        except OSError:
            messagebox.showwarning("提示", "冰蓝之花工具箱已在运行中。")
            sys.exit(0)

        self.C = {
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

        sw = self.root.winfo_screenwidth()
        sh = self.root.winfo_screenheight()
        self.sw, self.sh = sw, sh
        self.FS = 65
        self.PW, self.PH = 400, 550

        self._data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "冰蓝工具箱数据.json")

        self.blocks = []
        self.slots = [None] * 6
        self._load_data()

        self._drag = False
        self._wx = sw - self.FS - 40
        self._wy = sh // 2 - self.FS // 2
        self.popup = None
        self._clock_id = None
        self._timer_ids = {}
        self._slot_labels = {}

        self._build_floating_ball()
        self.root.mainloop()

    def _build_floating_ball(self):
        r = self.root
        r.geometry(f"{self.FS}x{self.FS}+{self._wx}+{self._wy}")
        r.overrideredirect(True)
        r.attributes('-topmost', True)
        r.configure(bg=self.C['transparent'])
        r.attributes('-transparentcolor', self.C['transparent'])

        cv = tk.Canvas(r, width=self.FS, height=self.FS,
                       bg=self.C['transparent'], highlightthickness=0, bd=0)
        cv.pack()
        cv.create_oval(2, 2, self.FS - 2, self.FS - 2,
                       fill=self.C['primary'], outline=self.C['secondary'],
                       width=2, tags='b')
        cv.create_oval(8, 8, self.FS - 8, self.FS - 8,
                       fill=self.C['secondary'], outline='', tags='b')
        cv.create_text(self.FS // 2 - 1, self.FS // 2 - 1,
                       text="❄", font=("Segoe UI Symbol", 22, "bold"),
                       fill=self.C['white'], tags='b')

        for tag in ('b',):
            cv.tag_bind(tag, '<Button-1>', self._on_press)
            cv.tag_bind(tag, '<B1-Motion>', self._on_drag)
            cv.tag_bind(tag, '<ButtonRelease-1>', self._on_release)
        r.bind('<Escape>', lambda e: self.exit())

    def _on_press(self, e):
        self._drag = False
        self._sx, self._sy = e.x_root, e.y_root
        self._wx, self._wy = self.root.winfo_x(), self.root.winfo_y()

    def _on_drag(self, e):
        if abs(e.x_root - self._sx) > 3 or abs(e.y_root - self._sy) > 3:
            self._drag = True
        self.root.geometry(f"+{self._wx + e.x_root - self._sx}"
                           f"+{self._wy + e.y_root - self._sy}")

    def _on_release(self, e):
        if not self._drag:
            self._close_popup() if self.popup else self._open_popup()

    def _start_clock(self, lbl):
        self._tick_clock(lbl)

    def _tick_clock(self, lbl):
        if not self.popup:
            return
        now = datetime.now()
        lbl.config(text=f"{now:%H:%M:%S}  |  {now.year}年{now.month}月{now.day}日 {self.WEEKDAYS[now.weekday()]}")
        self._update_slot_labels()
        self._clock_id = self.popup.after(1000, lambda: self._tick_clock(lbl))

    def _update_slot_labels(self):
        for idx, slot_data in self._slot_labels.items():
            if slot_data is None:
                continue
            block_idx = slot_data['block_idx']
            if 0 <= block_idx < len(self.blocks):
                block = self.blocks[block_idx]
                info_text = self._get_slot_info(block)
                slot_data['label'].config(text=info_text)

    def _stop_clock(self):
        if self._clock_id:
            try:
                self.popup.after_cancel(self._clock_id)
            except:
                pass
            self._clock_id = None

    def _open_popup(self):
        if self.popup:
            return
        fx, fy = self.root.winfo_x(), self.root.winfo_y()
        px = max(10, min(fx - self.PW - 15, self.sw - self.PW - 10))
        py = max(10, min(fy - 50, self.sh - self.PH - 10))

        p = tk.Toplevel(self.root)
        p.title("冰蓝之花工具箱")
        p.geometry(f"{self.PW}x{self.PH}+{px}+{py}")
        p.overrideredirect(True)
        p.attributes('-topmost', True)
        p.configure(bg=self.C['white'])
        self.popup = p

        main = tk.Frame(p, bg=self.C['white'],
                        highlightbackground=self.C['secondary'], highlightthickness=2)
        main.pack(fill=tk.BOTH, expand=True, padx=3, pady=3)

        clk = tk.Label(main, text="", font=("Microsoft YaHei", 11, "bold"),
                       fg=self.C['time_color'], bg=self.C['white'])
        clk.pack(anchor='w', padx=20, pady=(14, 0))
        self._start_clock(clk)

        tk.Label(main, text="❄  冰蓝之花工具箱",
                 font=("Microsoft YaHei", 15, "bold"),
                 fg=self.C['dark'], bg=self.C['white']
                 ).pack(anchor='w', padx=20, pady=(4, 0))
        tk.Label(main, text='点击 "+" 添加你的快捷功能',
                 font=("Microsoft YaHei", 9),
                 fg=self.C['text_light'], bg=self.C['white']
                 ).pack(anchor='w', padx=20, pady=(1, 0))

        ln = tk.Canvas(main, height=3, bg=self.C['white'], highlightthickness=0)
        ln.pack(fill=tk.X, padx=20, pady=(6, 8))
        ln.create_line(0, 1, self.PW - 40, 1, fill=self.C['primary'], width=2)
        ln.create_oval(self.PW - 52, 0, self.PW - 44, 4,
                       fill=self.C['secondary'], outline='')

        g = tk.Frame(main, bg=self.C['white'])
        g.pack(padx=16, pady=2, fill=tk.BOTH, expand=True)
        for i in range(6):
            c = self._make_slot(g, i)
            c.grid(row=i // 3, column=i % 3, padx=5, pady=5, sticky='nsew')
            g.grid_rowconfigure(i // 3, weight=1)
            g.grid_columnconfigure(i % 3, weight=1)

        b = tk.Frame(main, bg=self.C['white'])
        b.pack(fill=tk.X, padx=20, pady=(6, 16))
        tk.Button(b, text="📋  更多设置",
                  font=("Microsoft YaHei", 10, "bold"),
                  bg=self.C['primary'], fg=self.C['white'],
                  relief='flat', bd=0, cursor='hand2',
                  command=self._open_settings
                  ).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 6), ipady=8)
        tk.Button(b, text="✕  退出",
                  font=("Microsoft YaHei", 10, "bold"),
                  bg=self.C['danger'], fg=self.C['white'],
                  relief='flat', bd=0, cursor='hand2',
                  command=self.exit
                  ).pack(side=tk.RIGHT, padx=(6, 0), ipady=8, ipadx=8)

        p.bind('<FocusOut>', lambda e: self.root.after(150, self._check_focus))

    def _check_focus(self):
        if self.popup and self.popup.winfo_exists():
            if not self.popup.focus_get():
                self._close_popup()

    def _make_slot(self, parent, idx):
        val = self.slots[idx]
        card = tk.Frame(parent, bg=self.C['card_bg'],
                        highlightbackground=self.C['card_border'],
                        highlightthickness=1, relief='flat', cursor='hand2')

        if val is not None and 0 <= val < len(self.blocks):
            b = self.blocks[val]
            is_enabled = b.get('enabled', True)
            
            if not is_enabled:
                card.config(bg=self.C['disabled_bg'])
                card.config(cursor='arrow')

            tk.Label(card, text=b['icon'], font=("Segoe UI Symbol", 20),
                     bg=card.cget('bg'), fg=self.C['text'] if is_enabled else self.C['disabled_text']
                     ).pack(pady=(6, 0))
            tk.Label(card, text=b['name'], font=("Microsoft YaHei", 9, "bold"),
                     bg=card.cget('bg'), fg=self.C['text'] if is_enabled else self.C['disabled_text'], 
                     wraplength=110
                     ).pack(pady=(2, 0))

            info_text = self._get_slot_info(b)
            info_lbl = tk.Label(card, text=info_text, font=("Microsoft YaHei", 7),
                                bg=card.cget('bg'), fg=self.C['text_light'] if is_enabled else self.C['disabled_text'],
                                wraplength=110, justify='center')
            info_lbl.pack(pady=(2, 6))
            
            self._slot_labels[idx] = {'label': info_lbl, 'block_idx': val, 'enabled': is_enabled}

            if is_enabled:
                card.bind('<Button-1>', lambda e, blk=b: self._execute_block(blk))
                for ch in card.winfo_children():
                    ch.bind('<Button-1>', lambda e, blk=b: self._execute_block(blk))
            else:
                for ch in card.winfo_children():
                    ch.bind('<Button-1>', lambda e: None)
        else:
            tk.Label(card, text="+", font=("Segoe UI Symbol", 28, "bold"),
                     bg=self.C['card_bg'], fg=self.C['secondary']
                     ).pack(pady=(10, 0))
            tk.Label(card, text="点击更多设置\n可以新建功能块哦",
                     font=("Microsoft YaHei", 8),
                     bg=self.C['card_bg'], fg=self.C['text_hint'], justify='center'
                     ).pack(pady=(4, 10))
            card.bind('<Button-1>', lambda e: self._add_block_direct())
            for ch in card.winfo_children():
                ch.bind('<Button-1>', lambda e: self._add_block_direct())
            self._slot_labels[idx] = None
        return card

    def _get_slot_info(self, block):
        """获取槽位卡片显示的简要信息"""
        btype = block.get('type', '')
        
        if btype == "应用启动":
            apps = block.get('apps', [])
            if apps:
                names = [os.path.basename(a).split('.')[0] for a in apps[:2]]
                return '\n'.join(names) + (f"\n+{len(apps)-2}" if len(apps) > 2 else "")
        
        elif btype == "网络搜索":
            urls = block.get('urls', [])
            if urls:
                names = []
                for url in urls[:2]:
                    url = url.strip()
                    if url.startswith('http://'):
                        url = url[7:]
                    elif url.startswith('https://'):
                        url = url[8:]
                    if url.startswith('www.'):
                        url = url[4:]
                    if '/' in url:
                        url = url.split('/')[0]
                    names.append(url)
                return '\n'.join(names) + (f"\n+{len(urls)-2}" if len(urls) > 2 else "")
        
        elif btype == "任务安排":
            days = block.get('timer_days', 0)
            hours = block.get('timer_hours', 0)
            if days > 0 or hours > 0:
                total = days * 86400 + hours * 3600
                d = total // 86400
                h = (total % 86400) // 3600
                m = (total % 3600) // 60
                if d > 0:
                    return f"⏳ {d}天{h}小时"
                elif h > 0:
                    return f"⏳ {h}小时{m}分"
            tasks = block.get('tasks', [])
            if tasks:
                return f"📝 {len(tasks)}个任务"
        
        elif btype == "定时提醒":
            time_str = block.get('reminder_time', '')
            weekdays = block.get('reminder_weekdays', [])
            if time_str:
                if weekdays:
                    wd_names = [self.WEEKDAYS[i] for i in weekdays]
                    return f"⏰ {time_str}\n{','.join(wd_names)[:15]}..."
                else:
                    return f"⏰ {time_str}"
        
        elif btype == "日历安排":
            next_plan = self._get_next_calendar_plan(block)
            if next_plan:
                return f"📅 {next_plan}"
        
        return ""

    def _get_next_calendar_plan(self, block):
        """获取下一次日历计划"""
        now = datetime.now()
        week_plan = block.get('week_plan', [])
        month_plan = block.get('month_plan', [])
        
        upcoming = []
        
        for item in week_plan:
            day_idx = item.get('day', 0)
            target = now + timedelta(days=(day_idx - now.weekday()) % 7)
            upcoming.append(target)
        
        for item in month_plan:
            day = item.get('day', 1)
            try:
                target = datetime(now.year, now.month, day)
                if target < now:
                    try:
                        target = datetime(now.year, now.month + 1, day)
                    except:
                        target = datetime(now.year + 1, 1, day)
                upcoming.append(target)
            except:
                pass
        
        if upcoming:
            upcoming.sort()
            next_date = upcoming[0]
            return f"{next_date.month}/{next_date.day} {self.WEEKDAYS[next_date.weekday()]}"
        return None

    def _close_popup(self):
        self._stop_clock()
        if self.popup:
            try:
                self.popup.destroy()
            except:
                pass
            self.popup = None

    def _execute_block(self, block):
        """根据功能块类型执行相应操作"""
        if not block.get('enabled', True):
            messagebox.showinfo("提示", "该功能块未启用", parent=self.popup)
            return
            
        btype = block.get('type', '')
        
        if btype == "应用启动":
            self._launch_apps(block)
        elif btype == "网络搜索":
            self._web_search(block)
        elif btype == "任务安排":
            self._open_tasks(block)
        elif btype == "定时提醒":
            self._setup_reminder(block)
        elif btype == "日历安排":
            self._open_calendar(block)

    def _launch_apps(self, block):
        apps = block.get('apps', [])
        if not apps:
            messagebox.showinfo("提示", "未配置应用程序", parent=self.popup)
            return
        for path in apps:
            try:
                subprocess.Popen(path, shell=True)
            except Exception as e:
                print(f"[启动失败] {path}: {e}")

    def _web_search(self, block):
        urls = block.get('urls', [])
        if not urls:
            messagebox.showinfo("提示", "未配置网址或搜索内容", parent=self.popup)
            return
        for url in urls:
            url = url.strip()
            if not url:
                continue
            if '.' in url and not url.startswith('http'):
                url = 'https://' + url
            elif not url.startswith('http'):
                url = 'https://www.baidu.com/s?wd=' + url
            try:
                webbrowser.open(url)
            except Exception as e:
                print(f"[打开失败] {url}: {e}")

    def _open_tasks(self, block):
        tasks = block.get('tasks', [])
        days = block.get('timer_days', 0)
        hours = block.get('timer_hours', 0)

        win = tk.Toplevel(self.root)
        win.title(f"任务安排 - {block['name']}")
        w, h = 500, 450
        win.geometry(f"{w}x{h}+{self.sw//2-w//2}+{self.sh//2-h//2}")
        win.configure(bg=self.C['white'])

        tk.Label(win, text=f"📋 {block['name']}",
                 font=("Microsoft YaHei", 14, "bold"),
                 fg=self.C['dark'], bg=self.C['white']
                 ).pack(anchor='w', padx=20, pady=(16, 4))
        if block.get('desc'):
            tk.Label(win, text=block['desc'],
                     font=("Microsoft YaHei", 9),
                     fg=self.C['text_light'], bg=self.C['white']
                     ).pack(anchor='w', padx=20, pady=(0, 8))

        self._setup_countdown(win, days, hours)

        cv = tk.Canvas(win, bg=self.C['white'], highlightthickness=0)
        sb = tk.Scrollbar(win, orient=tk.VERTICAL, command=cv.yview)
        inner = tk.Frame(cv, bg=self.C['white'])

        inner.bind('<Configure>', lambda e: cv.configure(scrollregion=cv.bbox('all')))
        cv.create_window((0, 0), window=inner, anchor='nw', tags='inner')
        cv.configure(yscrollcommand=sb.set)

        cv.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=20, pady=(0, 20))
        sb.pack(side=tk.RIGHT, fill=tk.Y, pady=(0, 20))

        if tasks:
            for i, t in enumerate(tasks):
                row = tk.Frame(inner, bg=self.C['card_bg'],
                               highlightbackground=self.C['card_border'],
                               highlightthickness=1)
                row.pack(fill=tk.X, pady=3)

                var = tk.BooleanVar(value=t.get('done', False))
                cb = tk.Checkbutton(row, variable=var,
                                    bg=self.C['card_bg'], fg=self.C['text'],
                                    command=lambda idx=i, v=var: self._toggle_task(block, idx, v.get()))
                cb.pack(side=tk.LEFT, padx=8, pady=6)

                txt = t.get('text', '')
                fg = self.C['text_light'] if t.get('done') else self.C['text']
                font = ("Microsoft YaHei", 10, "overstrike") if t.get('done') else ("Microsoft YaHei", 10)
                tk.Label(row, text=txt, font=font, fg=fg,
                         bg=self.C['card_bg'], anchor='w').pack(side=tk.LEFT, fill=tk.X, expand=True, pady=6)
        else:
            tk.Label(inner, text="暂无任务", font=("Microsoft YaHei", 10),
                     fg=self.C['text_hint'], bg=self.C['white']).pack(pady=20)

    def _toggle_task(self, block, idx, done):
        tasks = block.get('tasks', [])
        if 0 <= idx < len(tasks):
            tasks[idx]['done'] = done
            self._save_data()

    def _setup_countdown(self, parent, days, hours):
        total_seconds = days * 86400 + hours * 3600
        if total_seconds <= 0:
            return

        lbl = tk.Label(parent, text="", font=("Microsoft YaHei", 12, "bold"),
                       fg=self.C['danger'], bg=self.C['white'])
        lbl.pack(anchor='w', padx=20, pady=(0, 8))

        def update():
            nonlocal total_seconds
            if total_seconds <= 0:
                self._show_notification("倒计时结束", f"{parent.title()} 倒计时已结束！")
                return
            d = total_seconds // 86400
            h = (total_seconds % 86400) // 3600
            m = (total_seconds % 3600) // 60
            s = total_seconds % 60
            lbl.config(text=f"⏳ 倒计时：{d}天 {h:02d}:{m:02d}:{s:02d}")
            total_seconds -= 1
            parent.after(1000, update)

        update()

    def _setup_reminder(self, block):
        title = block.get('reminder_title', '')
        time_str = block.get('reminder_time', '')
        weekdays = block.get('reminder_weekdays', [])
        pre_countdown = block.get('pre_countdown', 0)

        if not title or not time_str:
            messagebox.showinfo("提示", "请配置提醒事项和时间", parent=self.popup)
            return

        try:
            rem_time = datetime.strptime(time_str, '%H:%M').time()
            now = datetime.now()
            
            if weekdays:
                day_diffs = [(d - now.weekday()) % 7 for d in weekdays]
                min_diff = min(day_diffs)
                if min_diff == 0 and rem_time <= now.time():
                    min_diff = 7
                target = datetime.combine(now.date() + timedelta(days=min_diff), rem_time)
            else:
                target = datetime.combine(now.date(), rem_time)
                if target < now:
                    target += timedelta(days=1)
            
            wait_seconds = (target - now).total_seconds()

            if pre_countdown > 0:
                wait_seconds -= pre_countdown * 60

            if wait_seconds < 0:
                self._show_reminder(block)
            else:
                def _remind():
                    self._show_reminder(block)
                self.root.after(int(wait_seconds * 1000), _remind)
                messagebox.showinfo("提示", f"提醒已设置，将在 {time_str} 提醒", parent=self.popup)
        except:
            messagebox.showwarning("提示", "时间格式错误", parent=self.popup)

    def _show_reminder(self, block):
        title = block.get('reminder_title', '')
        apps = block.get('reminder_apps', [])
        
        self._show_notification("定时提醒", title)
        
        for app in apps:
            app = app.strip()
            if app:
                if '.' in app and not app.startswith('http'):
                    try:
                        webbrowser.open('https://' + app)
                    except:
                        pass
                elif app.startswith('http'):
                    try:
                        webbrowser.open(app)
                    except:
                        pass
                elif os.path.exists(app):
                    try:
                        subprocess.Popen(app, shell=True)
                    except:
                        pass

    def _show_notification(self, title, message):
        """显示Windows通知"""
        try:
            ctypes.windll.user32.MessageBoxW(0, message, title, 0x40 | 0x1)
        except:
            messagebox.showwarning(title, message)

    def _open_calendar(self, block):
        week_plan = block.get('week_plan', [])
        month_plan = block.get('month_plan', [])

        win = tk.Toplevel(self.root)
        win.title(f"日历安排 - {block['name']}")
        w, h = 600, 500
        win.geometry(f"{w}x{h}+{self.sw//2-w//2}+{self.sh//2-h//2}")
        win.configure(bg=self.C['white'])

        tk.Label(win, text=f"📅 {block['name']}",
                 font=("Microsoft YaHei", 14, "bold"),
                 fg=self.C['dark'], bg=self.C['white']
                 ).pack(anchor='w', padx=20, pady=(16, 4))
        if block.get('desc'):
            tk.Label(win, text=block['desc'],
                     font=("Microsoft YaHei", 9),
                     fg=self.C['text_light'], bg=self.C['white']
                     ).pack(anchor='w', padx=20, pady=(0, 8))

        nb = ttk.Notebook(win)
        nb.pack(fill=tk.BOTH, expand=True, padx=20, pady=(0, 20))

        week_frame = tk.Frame(nb, bg=self.C['white'])
        nb.add(week_frame, text="周计划")
        month_frame = tk.Frame(nb, bg=self.C['white'])
        nb.add(month_frame, text="月计划")

        self._build_week_plan(week_frame, week_plan)
        self._build_month_plan(month_frame, month_plan)

    def _build_week_plan(self, parent, plan):
        days = self.WEEKDAYS
        now = datetime.now()
        start_of_week = now - timedelta(days=now.weekday())

        for i, day in enumerate(days):
            date = start_of_week + timedelta(days=i)
            frame = tk.Frame(parent, bg=self.C['card_bg'],
                             highlightbackground=self.C['card_border'],
                             highlightthickness=1)
            frame.pack(fill=tk.X, pady=3, padx=5)

            date_str = f"{date.month}/{date.day}"
            is_today = date.date() == now.date()
            fg = self.C['primary'] if is_today else self.C['text']
            
            tk.Label(frame, text=f"{day} ({date_str})",
                     font=("Microsoft YaHei", 10, "bold"),
                     fg=fg, bg=self.C['card_bg']
                     ).pack(anchor='w', padx=10, pady=(6, 2))

            items = [p for p in plan if p.get('day') == i]
            if items:
                for item in items:
                    tk.Label(frame, text=f"  • {item.get('time', '')} - {item.get('text', '')}",
                             font=("Microsoft YaHei", 9),
                             fg=self.C['text'], bg=self.C['card_bg']
                             ).pack(anchor='w', padx=15, pady=(0, 2))
            else:
                tk.Label(frame, text="  暂无安排",
                         font=("Microsoft YaHei", 8),
                         fg=self.C['text_hint'], bg=self.C['card_bg']
                         ).pack(anchor='w', padx=15, pady=(0, 6))

    def _build_month_plan(self, parent, plan):
        now = datetime.now()
        year, month = now.year, now.month
        first_day = datetime(year, month, 1)
        last_day = (datetime(year, month + 1, 1) - timedelta(days=1)).day

        header = tk.Frame(parent, bg=self.C['white'])
        header.pack(fill=tk.X, pady=(0, 5))
        days = ["日", "一", "二", "三", "四", "五", "六"]
        for day in days:
            tk.Label(header, text=day, font=("Microsoft YaHei", 9),
                     fg=self.C['text_light'], bg=self.C['white'], width=4).pack(side=tk.LEFT, padx=2)

        grid = tk.Frame(parent, bg=self.C['white'])
        grid.pack(fill=tk.BOTH, expand=True)

        for i in range(first_day.weekday()):
            tk.Label(grid, text="", bg=self.C['white'], width=6, height=2).grid(row=0, column=i)

        day_count = 1
        row = 0
        col = first_day.weekday()
        
        while day_count <= last_day:
            is_today = day_count == now.day and month == now.month
            bg = self.C['secondary'] if is_today else self.C['card_bg']
            fg = self.C['white'] if is_today else self.C['text']
            
            cell = tk.Frame(grid, bg=bg, highlightbackground=self.C['card_border'],
                            highlightthickness=1)
            cell.grid(row=row, column=col, padx=2, pady=2, sticky='nsew')
            
            tk.Label(cell, text=str(day_count), font=("Microsoft YaHei", 10),
                     fg=fg, bg=bg).pack(padx=4, pady=(2, 0))

            items = [p for p in plan if p.get('day') == day_count]
            if items:
                for item in items:
                    tk.Label(cell, text=f"•{item.get('text', '')[:5]}",
                             font=("Microsoft YaHei", 6),
                             fg=self.C['text'] if is_today else self.C['text_light'],
                             bg=bg, wraplength=40).pack(pady=(1, 0))

            day_count += 1
            col += 1
            if col == 7:
                col = 0
                row += 1

        for i in range(7):
            grid.grid_columnconfigure(i, weight=1)

    def _open_settings(self):
        with open(r'D:\User\Users\Desktop\冰蓝之花工具箱\debug_log.txt', 'a', encoding='utf-8') as f:
            f.write("[DEBUG] _open_settings called\n")
        self._close_popup()
        win = tk.Toplevel(self.root)
        win.title("冰蓝之花工具箱 - 更多设置")
        w, h = 680, 560
        win.geometry(f"{w}x{h}+{self.sw // 2 - w // 2}+{self.sh // 2 - h // 2}")
        win.configure(bg=self.C['white'])
        win.resizable(False, False)

        tk.Label(win, text="❄ 冰蓝之花工具箱 - 更多设置",
                 font=("Microsoft YaHei", 18, "bold"),
                 fg=self.C['dark'], bg=self.C['white']
                 ).pack(anchor='w', padx=30, pady=(20, 2))
        tk.Label(win, text="在这里管理你的具体功能块",
                 font=("Microsoft YaHei", 9),
                 fg=self.C['text_light'], bg=self.C['white']
                 ).pack(anchor='w', padx=30, pady=(0, 0))

        ln = tk.Canvas(win, height=3, bg=self.C['white'], highlightthickness=0)
        ln.pack(fill=tk.X, padx=30, pady=(6, 8))
        ln.create_line(0, 1, w - 60, 1, fill=self.C['primary'], width=2)

        bar = tk.Frame(win, bg=self.C['white'])
        bar.pack(fill=tk.X, padx=30, pady=(0, 6))
        btn = tk.Button(bar, text="+ 新建功能块",
                  font=("Microsoft YaHei", 10, "bold"),
                  bg=self.C['secondary'], fg=self.C['white'],
                  relief='flat', bd=0, cursor='hand2',
                  command=lambda w=win: self._add_block(w)
                  )
        btn.pack(side=tk.LEFT, ipady=4, ipadx=10)
        with open(r'D:\User\Users\Desktop\冰蓝之花工具箱\debug_log.txt', 'a', encoding='utf-8') as f:
            f.write(f"[DEBUG] Button created: {btn}\n")
        self._count_lbl = tk.Label(bar, text=f"共 {len(self.blocks)} 个功能块",
                                    font=("Microsoft YaHei", 9),
                                    fg=self.C['text_light'], bg=self.C['white'])
        self._count_lbl.pack(side=tk.RIGHT, pady=4)

        cont = tk.Frame(win, bg=self.C['white'])
        cont.pack(padx=30, pady=2, fill=tk.BOTH, expand=True)

        cv = tk.Canvas(cont, bg=self.C['white'], highlightthickness=0, bd=0)
        sb = tk.Scrollbar(cont, orient=tk.VERTICAL, command=cv.yview)
        inner = tk.Frame(cv, bg=self.C['white'])

        inner.bind('<Configure>', lambda e: cv.configure(scrollregion=cv.bbox('all')))
        cv.create_window((0, 0), window=inner, anchor='nw', tags='inner')
        cv.configure(yscrollcommand=sb.set)
        cv.bind('<Configure>', lambda e: cv.itemconfig('inner', width=e.width))

        cv.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        sb.pack(side=tk.RIGHT, fill=tk.Y)

        def _mw(e):
            cv.yview_scroll(-1 * (e.delta // 120), 'units')
        cv.bind('<Enter>', lambda e: cv.bind_all('<MouseWheel>', _mw))
        win.bind('<Destroy>', lambda e: cv.unbind_all('<MouseWheel>'))

        self._settings_inner = inner
        self._settings_win = win
        self._refresh_list()

        b = tk.Frame(win, bg=self.C['white'])
        b.pack(fill=tk.X, padx=30, pady=(10, 18))
        tk.Button(b, text="收起",
                  font=("Microsoft YaHei", 10, "bold"),
                  bg=self.C['primary'], fg=self.C['white'],
                  relief='flat', bd=0, cursor='hand2',
                  command=win.destroy
                  ).pack(side=tk.LEFT, ipady=6, ipadx=20)
        tk.Button(b, text="✕  退出程序",
                  font=("Microsoft YaHei", 10, "bold"),
                  bg=self.C['danger'], fg=self.C['white'],
                  relief='flat', bd=0, cursor='hand2',
                  command=self.exit
                  ).pack(side=tk.RIGHT, ipady=6)

    def _refresh_list(self):
        p = self._settings_inner
        for w in p.winfo_children():
            w.destroy()

        for idx, blk in enumerate(self.blocks):
            row = tk.Frame(p, bg=self.C['card_bg'],
                           highlightbackground=self.C['card_border'],
                           highlightthickness=1, relief='flat')
            row.pack(fill=tk.X, pady=3, ipady=2)

            tk.Label(row, text=blk['icon'], font=("Segoe UI Symbol", 18),
                     bg=self.C['card_bg'], fg=self.C['primary']
                     ).pack(side=tk.LEFT, padx=(10, 6), pady=8)

            tf = tk.Frame(row, bg=self.C['card_bg'])
            tf.pack(side=tk.LEFT, fill=tk.X, expand=True, pady=6)

            tk.Label(tf, text=blk['name'],
                     font=("Microsoft YaHei", 10, "bold"),
                     fg=self.C['text'], bg=self.C['card_bg'], anchor='w'
                     ).pack(fill=tk.X)
            tk.Label(tf, text=blk['desc'],
                     font=("Microsoft YaHei", 8),
                     fg=self.C['text_light'], bg=self.C['card_bg'], anchor='w'
                     ).pack(fill=tk.X)

            bt = blk.get('type', '')
            if bt:
                status = "【启用】" if blk.get('enabled', True) else "【禁用】"
                tk.Label(tf, text=f"【{bt}】{status}",
                         font=("Microsoft YaHei", 8),
                         fg=self.C['primary'] if blk.get('enabled', True) else self.C['danger'], 
                         bg=self.C['card_bg'], anchor='w'
                         ).pack(fill=tk.X, pady=(1, 0))

            count = 0
            if bt == "应用启动":
                count = len(blk.get('apps', []))
            elif bt == "网络搜索":
                count = len(blk.get('urls', []))
            elif bt == "任务安排":
                count = len(blk.get('tasks', []))
            
            if count > 0:
                tk.Label(tf, text=f"已配置 {count} 项",
                         font=("Microsoft YaHei", 7),
                         fg=self.C['text_light'], bg=self.C['card_bg'], anchor='w'
                         ).pack(fill=tk.X)

            assigned = [i for i, s in enumerate(self.slots) if s == idx]
            if assigned:
                tk.Button(row, text="－ 移除",
                          font=("Microsoft YaHei", 8, "bold"),
                          bg=self.C['danger'], fg=self.C['white'],
                          relief='flat', bd=0, cursor='hand2',
                          command=lambda i=idx: self._remove_slot(i)
                          ).pack(side=tk.RIGHT, padx=(2, 4), ipadx=4, ipady=3)
            else:
                tk.Button(row, text="＋ 添加",
                          font=("Microsoft YaHei", 8, "bold"),
                          bg=self.C['success'], fg=self.C['white'],
                          relief='flat', bd=0, cursor='hand2',
                          command=lambda i=idx: self._add_slot(i)
                          ).pack(side=tk.RIGHT, padx=(2, 4), ipadx=4, ipady=3)

            tk.Button(row, text="编辑",
                      font=("Microsoft YaHei", 8),
                      bg=self.C['secondary'], fg=self.C['white'],
                      relief='flat', bd=0, cursor='hand2',
                      command=lambda i=idx: self._edit_block(i)
                      ).pack(side=tk.RIGHT, padx=(0, 2), ipadx=6, ipady=3)

            tk.Button(row, text="×",
                      font=("Segoe UI", 10, "bold"),
                      bg=self.C['danger'], fg=self.C['white'],
                      relief='flat', bd=0, cursor='hand2', width=2,
                      command=lambda i=idx: self._delete_block(i)
                      ).pack(side=tk.RIGHT, padx=(0, 8), ipady=3)

            sf = tk.Frame(row, bg=self.C['card_bg'])
            sf.pack(side=tk.RIGHT, padx=(0, 4))
            if assigned:
                for si in assigned:
                    tk.Label(sf, text=f"槽{si + 1}",
                             font=("Microsoft YaHei", 7),
                             bg=self.C['primary'], fg=self.C['white'],
                             ).pack(side=tk.LEFT, padx=1)
            else:
                tk.Label(sf, text="未分配",
                         font=("Microsoft YaHei", 7),
                         fg=self.C['text_hint'], bg=self.C['card_bg']
                         ).pack(side=tk.LEFT, padx=2)

            tk.Button(sf, text="+",
                      font=("Segoe UI", 10, "bold"),
                      bg=self.C['secondary'], fg=self.C['white'],
                      relief='flat', bd=0, cursor='hand2', width=2,
                      command=lambda i=idx: self._add_slot(i)
                      ).pack(side=tk.LEFT, padx=1)
            if assigned:
                tk.Button(sf, text="−",
                          font=("Segoe UI", 10, "bold"),
                          bg=self.C['danger'], fg=self.C['white'],
                          relief='flat', bd=0, cursor='hand2', width=2,
                          command=lambda i=idx: self._remove_slot(i)
                          ).pack(side=tk.LEFT, padx=1)

        self._count_lbl.config(text=f"共 {len(self.blocks)} 个功能块")

    def _add_block_direct(self):
        self._close_popup()
        dlg = BlockDialog(self.root, "新建功能块", self.C, self.sw, self.sh)
        if dlg.result:
            block_data = dlg.result
            has_empty_slot = None in self.slots
            block_data['enabled'] = has_empty_slot
            self.blocks.append(block_data)
            self._save_data()
            self._open_popup()
    
    def _add_block_wrapper(self, win):
        return lambda: self._add_block(win)
    
    def _add_block(self, win):
        try:
            import traceback
            log_file = r'D:\User\Users\Desktop\冰蓝之花工具箱\debug_log.txt'
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"[DEBUG] _add_block called, win={win}\n")
            
            dlg = BlockDialog(win, "新建功能块", self.C, self.sw, self.sh)
            
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"[DEBUG] Dialog closed, result={dlg.result}\n")
            
            if dlg.result:
                block_data = dlg.result
                has_empty_slot = None in self.slots
                block_data['enabled'] = has_empty_slot
                self.blocks.append(block_data)
                self._save_data()
                self._refresh_list()
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"[DEBUG] Block added successfully, count={len(self.blocks)}, enabled={has_empty_slot}\n")
            else:
                with open(log_file, 'a', encoding='utf-8') as f:
                    f.write(f"[DEBUG] Dialog cancelled, result is None\n")
        except Exception as e:
            import traceback
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"[DEBUG] Error: {e}\n")
                f.write(f"[DEBUG] Traceback: {traceback.format_exc()}\n")
            messagebox.showerror("错误", f"新建功能块失败: {str(e)}\n\n{traceback.format_exc()}", parent=win)

    def _edit_block(self, idx):
        try:
            blk = self.blocks[idx]
            dlg = BlockDialog(self._settings_win, "编辑功能块", self.C, self.sw, self.sh, block=blk)
            if dlg.result:
                self.blocks[idx] = dlg.result
                self._save_data()
                self._refresh_list()
        except Exception as e:
            messagebox.showerror("错误", f"编辑功能块失败: {str(e)}", parent=self._settings_win)

    def _delete_block(self, idx):
        if not messagebox.askyesno("确认删除",
                                    f"确定删除功能块「{self.blocks[idx]['name']}」吗？",
                                    parent=self._settings_win):
            return
        for i in range(6):
            if self.slots[i] == idx:
                self.slots[i] = None
            elif self.slots[i] is not None and self.slots[i] > idx:
                self.slots[i] -= 1
        self.blocks.pop(idx)
        self._save_data()
        self._refresh_list()

    def _add_slot(self, blk_idx):
        for i in range(6):
            if self.slots[i] is None:
                self.slots[i] = blk_idx
                self._save_data()
                self._refresh_list()
                return

    def _remove_slot(self, blk_idx):
        changed = False
        for i in range(6):
            if self.slots[i] == blk_idx:
                self.slots[i] = None
                changed = True
        if changed:
            self._save_data()
            self._refresh_list()

    def exit(self):
        self._stop_clock()
        self.root.quit()
        self.root.destroy()
        sys.exit(0)

    def _save_data(self):
        try:
            data = {
                "blocks": self.blocks,
                "slots": self.slots,
            }
            with open(self._data_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[保存失败] {e}")

    def _load_data(self):
        if not os.path.exists(self._data_path):
            return
        try:
            with open(self._data_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.blocks = data.get("blocks", [])
            raw = data.get("slots", [])
            self.slots = [None] * 6
            for i, v in enumerate(raw):
                if i < 6 and v is not None:
                    self.slots[i] = v
        except Exception as e:
            print(f"[加载失败] {e}")


class BlockDialog:
    ICONS = ["📚", "💻", "📅", "📝", "⏳", "🔍", "🌎", "✏️", "💬", "🎯",
             "⚙️", "🛠️", "📂", "🎓", "🏫", "📖", "🎵", "🖼️", "📊", "🔬"]
    TYPES = ["应用启动", "任务安排", "定时提醒", "日历安排", "网络搜索"]
    WEEKDAYS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
    HOURS = [f"{h:02d}" for h in range(24)]
    MINUTES = [f"{m:02d}" for m in range(0, 60, 5)]
    MAX_APPS = 20
    MAX_URLS = 20
    MAX_TASKS = 10
    MAX_REMINDER_APPS = 5
    MAX_CALENDAR_APPS = 5
    PAD = 22

    def __init__(self, parent, title, colors, sw, sh, block=None):
        self.result = None
        self.colors = colors
        self.block = block or {}
        
        self._apps = list(block.get('apps', [])) if block else []
        self._urls = list(block.get('urls', [])) if block else []
        self._tasks = list(block.get('tasks', [])) if block else []
        self._week_plan = list(block.get('week_plan', [])) if block else []
        self._month_plan = list(block.get('month_plan', [])) if block else []
        self._reminder_title = block.get('reminder_title', '') if block else ''
        self._reminder_time = block.get('reminder_time', '') if block else ''
        self._reminder_weekdays = list(block.get('reminder_weekdays', [])) if block else []
        self._pre_countdown = block.get('pre_countdown', 0) if block else 0
        self._reminder_apps = list(block.get('reminder_apps', [])) if block else []
        self._calendar_apps = list(block.get('calendar_apps', [])) if block else []
        self._timer_enabled = block.get('timer', '') if block else ''
        self._timer_days = block.get('timer_days', 0) if block else 0
        self._timer_hours = block.get('timer_hours', 0) if block else 0
        self._enabled = block.get('enabled', True) if block else True

        dlg = tk.Toplevel(parent)
        dlg.title(title)
        self.dlg = dlg
        dlg.geometry(f"500x800+{sw // 2 - 250}+{sh // 2 - 400}")
        dlg.configure(bg=colors['white'])
        dlg.resizable(False, False)
        dlg.grab_set()
        dlg.focus_set()

        cv = tk.Canvas(dlg, bg=colors['white'], highlightthickness=0, bd=0)
        sb = tk.Scrollbar(dlg, orient=tk.VERTICAL, command=cv.yview)
        main = tk.Frame(cv, bg=colors['white'])

        main.bind('<Configure>', lambda e: cv.configure(scrollregion=cv.bbox('all')))
        cv.create_window((0, 0), window=main, anchor='nw', tags='inner')
        cv.configure(yscrollcommand=sb.set)
        cv.bind('<Configure>', lambda e: cv.itemconfig('inner', width=e.width))

        cv.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        sb.pack(side=tk.RIGHT, fill=tk.Y)

        def _mw(e):
            cv.yview_scroll(-1 * (e.delta // 120), 'units')
        cv.bind('<Enter>', lambda e: cv.bind_all('<MouseWheel>', _mw))
        dlg.bind('<Destroy>', lambda e: cv.unbind_all('<MouseWheel>'))

        try:
            tk.Label(main, text=title,
                     font=("Microsoft YaHei", 14, "bold"),
                     fg=colors['dark'], bg=colors['white']
                     ).pack(anchor='w', padx=self.PAD, pady=(16, 10))

            nv, dv, tv = self._build_form(main)
            tv.trace('w', lambda *a: self._toggle_section(tv))

            self._build_sections(main)
            
            if tv.get():
                self._show_section(tv.get())

            iv = self._build_icons(main)
            self._build_enabled_check(main)
            self._build_buttons(main, nv, dv, tv, iv, dlg)

            dlg.update_idletasks()
            cv.configure(scrollregion=cv.bbox('all'))
        except Exception as e:
            messagebox.showerror("错误", f"创建对话框失败: {str(e)}")
            dlg.destroy()
            return

        dlg.wait_window()

    def _build_form(self, parent):
        c = self.colors
        name = self.block.get('name', '')
        desc = self.block.get('desc', '')
        btype = self.block.get('type', '')

        tk.Label(parent, text="功能块名称（最多10字）",
                 font=("Microsoft YaHei", 9), fg=c['text'], bg=c['white']
                 ).pack(anchor='w', padx=self.PAD, pady=(0, 2))
        nv = tk.StringVar(value=name[:10] if name else '')
        vcmd = parent.register(lambda s: len(s) <= 10)
        tk.Entry(parent, textvariable=nv, font=("Microsoft YaHei", 10),
                 relief='sunken', bd=2, bg=c['light_bg'],
                 validate='key', validatecommand=(vcmd, '%P')
                 ).pack(fill=tk.X, padx=self.PAD, pady=(0, 6), ipady=4)

        tk.Label(parent, text="功能块简介",
                 font=("Microsoft YaHei", 9), fg=c['text'], bg=c['white']
                 ).pack(anchor='w', padx=self.PAD, pady=(0, 2))
        dv = tk.StringVar(value=desc)
        tk.Entry(parent, textvariable=dv, font=("Microsoft YaHei", 10),
                 relief='sunken', bd=2, bg=c['light_bg']
                 ).pack(fill=tk.X, padx=self.PAD, pady=(0, 6), ipady=4)

        tk.Label(parent, text="功能块类型",
                 font=("Microsoft YaHei", 9), fg=c['text'], bg=c['white']
                 ).pack(anchor='w', padx=self.PAD, pady=(0, 2))
        init = btype if btype in self.TYPES else self.TYPES[0]
        tv = tk.StringVar(value=init)
        frm = tk.Frame(parent, bg=c['white'])
        frm.pack(fill=tk.X, padx=self.PAD, pady=(0, 6))
        m = tk.OptionMenu(frm, tv, *self.TYPES)
        m.config(font=("Microsoft YaHei", 10), bg=c['card_bg'], fg=c['text'],
                 relief='solid', bd=1, indicatoron=True, highlightthickness=0)
        m.pack(fill=tk.X, ipady=2)
        m['menu'].config(font=("Microsoft YaHei", 10))
        return nv, dv, tv

    def _build_sections(self, parent):
        c = self.colors
        self._sections = {}

        try:
            app_sec = tk.Frame(parent, bg=c['white'])
            self._sections["应用启动"] = app_sec
            self._build_app_section(app_sec)
        except Exception as e:
            print(f"[ERROR] _build_app_section: {e}")

        try:
            web_sec = tk.Frame(parent, bg=c['white'])
            self._sections["网络搜索"] = web_sec
            self._build_web_section(web_sec)
        except Exception as e:
            print(f"[ERROR] _build_web_section: {e}")

        try:
            task_sec = tk.Frame(parent, bg=c['white'])
            self._sections["任务安排"] = task_sec
            self._build_task_section(task_sec)
        except Exception as e:
            print(f"[ERROR] _build_task_section: {e}")

        try:
            remind_sec = tk.Frame(parent, bg=c['white'])
            self._sections["定时提醒"] = remind_sec
            self._build_reminder_section(remind_sec)
        except Exception as e:
            print(f"[ERROR] _build_reminder_section: {e}")

        try:
            cal_sec = tk.Frame(parent, bg=c['white'])
            self._sections["日历安排"] = cal_sec
            self._build_calendar_section(cal_sec)
        except Exception as e:
            print(f"[ERROR] _build_calendar_section: {e}")

        self._icon_anchor = None

    def _toggle_section(self, tv):
        self._hide_all_sections()
        self._show_section(tv.get())

    def _hide_all_sections(self):
        for sec in self._sections.values():
            sec.pack_forget()

    def _show_section(self, btype):
        if btype in self._sections:
            sec = self._sections[btype]
            if self._icon_anchor and self._icon_anchor.winfo_exists():
                sec.pack(fill=tk.X, padx=self.PAD, pady=(0, 6), before=self._icon_anchor)
            else:
                sec.pack(fill=tk.X, padx=self.PAD, pady=(0, 6))

    def _build_app_section(self, parent):
        c = self.colors
        tk.Label(parent, text="启动的应用列表",
                 font=("Microsoft YaHei", 9, "bold"),
                 fg=c['text'], bg=c['white']
                 ).pack(anchor='w')
        self._acv = tk.StringVar(value=f"0/{self.MAX_APPS}")
        tk.Label(parent, textvariable=self._acv,
                 font=("Microsoft YaHei", 8), fg=c['text_light'], bg=c['white']
                 ).pack(anchor='w')

        lf = tk.Frame(parent, bg=c['white'])
        lf.pack(fill=tk.X, pady=(4, 4))
        self._app_lb = tk.Listbox(lf, height=5, font=("Microsoft YaHei", 9),
                                   relief='solid', bd=1,
                                   selectbackground=c['secondary'],
                                   selectforeground=c['white'])
        self._app_lb.pack(side=tk.LEFT, fill=tk.X, expand=True)
        s = tk.Scrollbar(lf, orient=tk.VERTICAL, command=self._app_lb.yview)
        s.pack(side=tk.RIGHT, fill=tk.Y)
        self._app_lb.config(yscrollcommand=s.set)
        self._refresh_app_lb()

        bf = tk.Frame(parent, bg=c['white'])
        bf.pack(fill=tk.X)
        tk.Button(bf, text="从文件夹选择", font=("Microsoft YaHei", 8, "bold"),
                  bg=c['primary'], fg=c['white'], relief='flat', bd=0, cursor='hand2',
                  command=self._browse_app
                  ).pack(side=tk.LEFT, padx=(0, 4), ipady=2, ipadx=6)
        tk.Button(bf, text="移除选中", font=("Microsoft YaHei", 8),
                  bg=c['danger'], fg=c['white'], relief='flat', bd=0, cursor='hand2',
                  command=self._remove_app_sel
                  ).pack(side=tk.LEFT, padx=(0, 4), ipady=2, ipadx=6)
        tk.Button(bf, text="清空", font=("Microsoft YaHei", 8),
                  bg=c['text_light'], fg=c['white'], relief='flat', bd=0, cursor='hand2',
                  command=self._clear_apps
                  ).pack(side=tk.LEFT, ipady=2, ipadx=6)

    def _refresh_app_lb(self):
        self._app_lb.delete(0, tk.END)
        for p in self._apps:
            self._app_lb.insert(tk.END, f"  {os.path.basename(p)}")
        self._acv.set(f"{len(self._apps)}/{self.MAX_APPS}")

    def _browse_app(self):
        files = filedialog.askopenfilename(
            title="选择应用程序或脚本",
            filetypes=[("可执行文件", "*.exe *.lnk *.bat *.cmd *.py *.js *.ps1 *.vbs"),
                       ("所有文件", "*.*")],
            parent=self.dlg
        )
        if files:
            self._add_app_paths([files] if isinstance(files, str) else files)

    def _add_app_paths(self, paths):
        for p in paths:
            p = p.strip()
            if not p or len(self._apps) >= self.MAX_APPS:
                if len(self._apps) >= self.MAX_APPS:
                    messagebox.showinfo("提示", f"最多添加 {self.MAX_APPS} 个应用", parent=self.dlg)
                break
            if p not in self._apps:
                ext = os.path.splitext(p)[1].lower()
                if ext in ('.exe', '.lnk', '.bat', '.cmd', '.py', '.js', '.ps1', '.vbs'):
                    self._apps.append(p)
                else:
                    messagebox.showwarning("提示", "不支持的文件类型", parent=self.dlg)
        self._refresh_app_lb()

    def _remove_app_sel(self):
        sel = self._app_lb.curselection()
        for i in reversed(sel):
            if 0 <= i < len(self._apps):
                self._apps.pop(i)
        self._refresh_app_lb()

    def _clear_apps(self):
        self._apps.clear()
        self._refresh_app_lb()

    def _build_web_section(self, parent):
        c = self.colors
        tk.Label(parent, text="网址/搜索内容列表",
                 font=("Microsoft YaHei", 9, "bold"),
                 fg=c['text'], bg=c['white']
                 ).pack(anchor='w')
        self._wcv = tk.StringVar(value=f"0/{self.MAX_URLS}")
        tk.Label(parent, textvariable=self._wcv,
                 font=("Microsoft YaHei", 8), fg=c['text_light'], bg=c['white']
                 ).pack(anchor='w')

        self._url_input = tk.Entry(parent, font=("Microsoft YaHei", 10),
                                   relief='sunken', bd=2, bg=c['light_bg'])
        self._url_input.pack(fill=tk.X, pady=(4, 4), ipady=3)

        lf = tk.Frame(parent, bg=c['white'])
        lf.pack(fill=tk.X, pady=(0, 4))
        self._url_lb = tk.Listbox(lf, height=5, font=("Microsoft YaHei", 9),
                                   relief='solid', bd=1,
                                   selectbackground=c['secondary'],
                                   selectforeground=c['white'])
        self._url_lb.pack(side=tk.LEFT, fill=tk.X, expand=True)
        s = tk.Scrollbar(lf, orient=tk.VERTICAL, command=self._url_lb.yview)
        s.pack(side=tk.RIGHT, fill=tk.Y)
        self._url_lb.config(yscrollcommand=s.set)
        self._refresh_url_lb()

        bf = tk.Frame(parent, bg=c['white'])
        bf.pack(fill=tk.X)
        tk.Button(bf, text="添加", font=("Microsoft YaHei", 8, "bold"),
                  bg=c['primary'], fg=c['white'], relief='flat', bd=0, cursor='hand2',
                  command=self._add_url
                  ).pack(side=tk.LEFT, padx=(0, 4), ipady=2, ipadx=6)
        tk.Button(bf, text="移除选中", font=("Microsoft YaHei", 8),
                  bg=c['danger'], fg=c['white'], relief='flat', bd=0, cursor='hand2',
                  command=self._remove_url_sel
                  ).pack(side=tk.LEFT, padx=(0, 4), ipady=2, ipadx=6)
        tk.Button(bf, text="清空", font=("Microsoft YaHei", 8),
                  bg=c['text_light'], fg=c['white'], relief='flat', bd=0, cursor='hand2',
                  command=self._clear_urls
                  ).pack(side=tk.LEFT, ipady=2, ipadx=6)

        self._url_input.bind('<Return>', lambda e: self._add_url())

    def _refresh_url_lb(self):
        self._url_lb.delete(0, tk.END)
        for url in self._urls:
            self._url_lb.insert(tk.END, f"  {url}")
        self._wcv.set(f"{len(self._urls)}/{self.MAX_URLS}")

    def _add_url(self):
        url = self._url_input.get().strip()
        if url:
            if len(self._urls) >= self.MAX_URLS:
                messagebox.showinfo("提示", f"最多添加 {self.MAX_URLS} 条", parent=self.dlg)
            elif url not in self._urls:
                self._urls.append(url)
                self._url_input.delete(0, tk.END)
                self._refresh_url_lb()

    def _remove_url_sel(self):
        sel = self._url_lb.curselection()
        for i in reversed(sel):
            if 0 <= i < len(self._urls):
                self._urls.pop(i)
        self._refresh_url_lb()

    def _clear_urls(self):
        self._urls.clear()
        self._refresh_url_lb()

    def _build_task_section(self, parent):
        c = self.colors

        timer_frame = tk.Frame(parent, bg=c['white'])
        timer_frame.pack(fill=tk.X, pady=(0, 8))
        
        tk.Label(timer_frame, text="倒计时设置", font=("Microsoft YaHei", 9, "bold"),
                 fg=c['text'], bg=c['white']).pack(anchor='w', pady=(0, 4))
        
        timer_inner = tk.Frame(timer_frame, bg=c['white'])
        timer_inner.pack(fill=tk.X)
        
        tk.Label(timer_inner, text="天数:", font=("Microsoft YaHei", 9),
                 fg=c['text_light'], bg=c['white']).pack(side=tk.LEFT, padx=(0, 4))
        days_options = [str(i) for i in range(0, 31)]
        self._days_var = tk.StringVar(value=str(self._timer_days))
        days_menu = tk.OptionMenu(timer_inner, self._days_var, *days_options)
        days_menu.config(font=("Microsoft YaHei", 9), bg=c['card_bg'], fg=c['text'],
                         relief='solid', bd=1)
        days_menu.pack(side=tk.LEFT, padx=(0, 10))
        
        tk.Label(timer_inner, text="小时:", font=("Microsoft YaHei", 9),
                 fg=c['text_light'], bg=c['white']).pack(side=tk.LEFT, padx=(0, 4))
        hours_options = [str(i) for i in range(0, 24)]
        self._hours_var = tk.StringVar(value=str(self._timer_hours))
        hours_menu = tk.OptionMenu(timer_inner, self._hours_var, *hours_options)
        hours_menu.config(font=("Microsoft YaHei", 9), bg=c['card_bg'], fg=c['text'],
                          relief='solid', bd=1)
        hours_menu.pack(side=tk.LEFT)

        tk.Label(parent, text="代办任务列表（最多10条）",
                 font=("Microsoft YaHei", 9, "bold"),
                 fg=c['text'], bg=c['white']
                 ).pack(anchor='w')
        self._tcv = tk.StringVar(value=f"0/{self.MAX_TASKS}")
        tk.Label(parent, textvariable=self._tcv,
                 font=("Microsoft YaHei", 8), fg=c['text_light'], bg=c['white']
                 ).pack(anchor='w')

        self._task_input = tk.Entry(parent, font=("Microsoft YaHei", 10),
                                    relief='sunken', bd=2, bg=c['light_bg'])
        self._task_input.pack(fill=tk.X, pady=(4, 4), ipady=3)

        lf = tk.Frame(parent, bg=c['white'])
        lf.pack(fill=tk.X, pady=(0, 4))
        self._task_lb = tk.Listbox(lf, height=5, font=("Microsoft YaHei", 9),
                                    relief='solid', bd=1,
                                    selectbackground=c['secondary'],
                                    selectforeground=c['white'])
        self._task_lb.pack(side=tk.LEFT, fill=tk.X, expand=True)
        s = tk.Scrollbar(lf, orient=tk.VERTICAL, command=self._task_lb.yview)
        s.pack(side=tk.RIGHT, fill=tk.Y)
        self._task_lb.config(yscrollcommand=s.set)
        self._refresh_task_lb()

        bf = tk.Frame(parent, bg=c['white'])
        bf.pack(fill=tk.X)
        tk.Button(bf, text="添加任务", font=("Microsoft YaHei", 8, "bold"),
                  bg=c['primary'], fg=c['white'], relief='flat', bd=0, cursor='hand2',
                  command=self._add_task
                  ).pack(side=tk.LEFT, padx=(0, 4), ipady=2, ipadx=6)
        tk.Button(bf, text="移除选中", font=("Microsoft YaHei", 8),
                  bg=c['danger'], fg=c['white'], relief='flat', bd=0, cursor='hand2',
                  command=self._remove_task_sel
                  ).pack(side=tk.LEFT, padx=(0, 4), ipady=2, ipadx=6)
        tk.Button(bf, text="清空", font=("Microsoft YaHei", 8),
                  bg=c['text_light'], fg=c['white'], relief='flat', bd=0, cursor='hand2',
                  command=self._clear_tasks
                  ).pack(side=tk.LEFT, ipady=2, ipadx=6)

        self._task_input.bind('<Return>', lambda e: self._add_task())

    def _refresh_task_lb(self):
        self._task_lb.delete(0, tk.END)
        for t in self._tasks:
            done = "✓ " if t.get('done') else ""
            self._task_lb.insert(tk.END, f"  {done}{t.get('text', '')}")
        self._tcv.set(f"{len(self._tasks)}/{self.MAX_TASKS}")

    def _add_task(self):
        txt = self._task_input.get().strip()
        if txt:
            if len(self._tasks) >= self.MAX_TASKS:
                messagebox.showinfo("提示", f"最多添加 {self.MAX_TASKS} 条任务", parent=self.dlg)
            elif txt not in [t.get('text', '') for t in self._tasks]:
                self._tasks.append({'text': txt, 'done': False})
                self._task_input.delete(0, tk.END)
                self._refresh_task_lb()

    def _remove_task_sel(self):
        sel = self._task_lb.curselection()
        for i in reversed(sel):
            if 0 <= i < len(self._tasks):
                self._tasks.pop(i)
        self._refresh_task_lb()

    def _clear_tasks(self):
        self._tasks.clear()
        self._refresh_task_lb()

    def _build_reminder_section(self, parent):
        c = self.colors
        
        tk.Label(parent, text="提醒事项", font=("Microsoft YaHei", 9, "bold"),
                 fg=c['text'], bg=c['white']).pack(anchor='w')
        self._reminder_title_var = tk.StringVar(value=self._reminder_title)
        tk.Entry(parent, textvariable=self._reminder_title_var, font=("Microsoft YaHei", 10),
                 relief='sunken', bd=2, bg=c['light_bg']).pack(fill=tk.X, pady=(4, 6), ipady=3)
        
        tk.Label(parent, text="提醒时间", font=("Microsoft YaHei", 9, "bold"),
                 fg=c['text'], bg=c['white']).pack(anchor='w')
        time_frame = tk.Frame(parent, bg=c['white'])
        time_frame.pack(fill=tk.X, pady=(4, 6))
        
        hour_var = tk.StringVar(value=self._reminder_time.split(':')[0] if self._reminder_time else '09')
        tk.OptionMenu(time_frame, hour_var, *self.HOURS).pack(side=tk.LEFT, padx=(0, 4))
        tk.Label(time_frame, text=":", font=("Microsoft YaHei", 10), bg=c['white']).pack(side=tk.LEFT, padx=(0, 4))
        minute_var = tk.StringVar(value=self._reminder_time.split(':')[1] if self._reminder_time else '00')
        tk.OptionMenu(time_frame, minute_var, *self.MINUTES).pack(side=tk.LEFT)
        
        self._reminder_time_vars = (hour_var, minute_var)
        
        tk.Label(parent, text="提醒星期（多选）", font=("Microsoft YaHei", 9, "bold"),
                 fg=c['text'], bg=c['white']).pack(anchor='w')
        weekday_frame = tk.Frame(parent, bg=c['white'])
        weekday_frame.pack(fill=tk.X, pady=(4, 6))
        
        self._weekday_vars = []
        for i, day in enumerate(self.WEEKDAYS):
            var = tk.BooleanVar(value=i in self._reminder_weekdays)
            self._weekday_vars.append(var)
            cb = tk.Checkbutton(weekday_frame, text=day, variable=var,
                                bg=c['white'], fg=c['text'], font=("Microsoft YaHei", 8))
            cb.pack(side=tk.LEFT, padx=(0, 2))
        
        tk.Label(parent, text="提前提醒（分钟）", font=("Microsoft YaHei", 9, "bold"),
                 fg=c['text'], bg=c['white']).pack(anchor='w')
        pre_options = ['0', '5', '10', '15', '30', '60']
        self._pre_countdown_var = tk.StringVar(value=str(self._pre_countdown))
        tk.OptionMenu(parent, self._pre_countdown_var, *pre_options).pack(fill=tk.X, pady=(4, 6))

    def _build_calendar_section(self, parent):
        c = self.colors
        
        week_frame = tk.Frame(parent, bg=c['white'])
        week_frame.pack(fill=tk.X, pady=(0, 8))
        tk.Label(week_frame, text="周计划", font=("Microsoft YaHei", 9, "bold"),
                 fg=c['text'], bg=c['white']).pack(anchor='w', pady=(0, 4))
        
        self._week_plan_input_day = tk.StringVar()
        self._week_plan_input_time = tk.StringVar(value='09:00')
        self._week_plan_input_text = tk.StringVar()
        
        wp_frame = tk.Frame(week_frame, bg=c['white'])
        wp_frame.pack(fill=tk.X)
        
        tk.OptionMenu(wp_frame, self._week_plan_input_day, *self.WEEKDAYS).pack(side=tk.LEFT, padx=(0, 4))
        
        time_frame = tk.Frame(wp_frame, bg=c['white'])
        time_frame.pack(side=tk.LEFT, padx=(0, 4))
        hour_var = tk.StringVar(value='09')
        tk.OptionMenu(time_frame, hour_var, *self.HOURS).pack(side=tk.LEFT)
        tk.Label(time_frame, text=":", bg=c['white']).pack(side=tk.LEFT)
        minute_var = tk.StringVar(value='00')
        tk.OptionMenu(time_frame, minute_var, *self.MINUTES).pack(side=tk.LEFT)
        self._week_plan_time_vars = (hour_var, minute_var)
        
        tk.Entry(wp_frame, textvariable=self._week_plan_input_text, font=("Microsoft YaHei", 9),
                 relief='sunken', bd=2, bg=c['light_bg'], width=20).pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        tk.Button(wp_frame, text="添加", font=("Microsoft YaHei", 8),
                  bg=c['primary'], fg=c['white'], relief='flat', bd=0,
                  command=self._add_week_plan).pack(side=tk.LEFT, padx=(4, 0))
        
        self._week_plan_lb = tk.Listbox(week_frame, height=3, font=("Microsoft YaHei", 8),
                                         relief='solid', bd=1)
        self._week_plan_lb.pack(fill=tk.X, pady=(4, 0))
        self._refresh_week_plan_lb()
        
        month_frame = tk.Frame(parent, bg=c['white'])
        month_frame.pack(fill=tk.X)
        tk.Label(month_frame, text="月计划", font=("Microsoft YaHei", 9, "bold"),
                 fg=c['text'], bg=c['white']).pack(anchor='w', pady=(0, 4))
        
        self._month_plan_input_day = tk.StringVar()
        self._month_plan_input_text = tk.StringVar()
        
        mp_frame = tk.Frame(month_frame, bg=c['white'])
        mp_frame.pack(fill=tk.X)
        
        day_options = [str(i) for i in range(1, 32)]
        tk.OptionMenu(mp_frame, self._month_plan_input_day, *day_options).pack(side=tk.LEFT, padx=(0, 4))
        tk.Entry(mp_frame, textvariable=self._month_plan_input_text, font=("Microsoft YaHei", 9),
                 relief='sunken', bd=2, bg=c['light_bg'], width=20).pack(side=tk.LEFT, fill=tk.X, expand=True)
        tk.Button(mp_frame, text="添加", font=("Microsoft YaHei", 8),
                  bg=c['primary'], fg=c['white'], relief='flat', bd=0,
                  command=self._add_month_plan).pack(side=tk.LEFT, padx=(4, 0))
        
        self._month_plan_lb = tk.Listbox(month_frame, height=3, font=("Microsoft YaHei", 8),
                                          relief='solid', bd=1)
        self._month_plan_lb.pack(fill=tk.X, pady=(4, 0))
        self._refresh_month_plan_lb()

    def _refresh_week_plan_lb(self):
        self._week_plan_lb.delete(0, tk.END)
        for item in self._week_plan:
            day_name = self.WEEKDAYS[item.get('day', 0)]
            self._week_plan_lb.insert(tk.END, f"  {day_name} {item.get('time', '')} - {item.get('text', '')}")

    def _add_week_plan(self):
        day_name = self._week_plan_input_day.get()
        if not day_name:
            messagebox.showinfo("提示", "请选择星期", parent=self.dlg)
            return
        day_idx = self.WEEKDAYS.index(day_name)
        hour = self._week_plan_time_vars[0].get()
        minute = self._week_plan_time_vars[1].get()
        time_str = f"{hour}:{minute}"
        text = self._week_plan_input_text.get().strip()
        if not text:
            messagebox.showinfo("提示", "请输入计划内容", parent=self.dlg)
            return
        self._week_plan.append({'day': day_idx, 'time': time_str, 'text': text})
        self._week_plan_input_text.set('')
        self._refresh_week_plan_lb()

    def _refresh_month_plan_lb(self):
        self._month_plan_lb.delete(0, tk.END)
        for item in self._month_plan:
            self._month_plan_lb.insert(tk.END, f"  {item.get('day', 0)}日 - {item.get('text', '')}")

    def _add_month_plan(self):
        day = self._month_plan_input_day.get()
        if not day:
            messagebox.showinfo("提示", "请选择日期", parent=self.dlg)
            return
        text = self._month_plan_input_text.get().strip()
        if not text:
            messagebox.showinfo("提示", "请输入计划内容", parent=self.dlg)
            return
        self._month_plan.append({'day': int(day), 'text': text})
        self._month_plan_input_text.set('')
        self._refresh_month_plan_lb()

    def _build_icons(self, parent):
        c = self.colors
        self._icon_anchor = tk.Frame(parent, bg=c['white'])
        self._icon_anchor.pack(fill=tk.X, padx=self.PAD, pady=(0, 6))
        
        tk.Label(self._icon_anchor, text="选择图标", font=("Microsoft YaHei", 9),
                 fg=c['text'], bg=c['white']).pack(anchor='w', pady=(0, 4))
        
        self._icon_var = tk.StringVar(value=self.block.get('icon', self.ICONS[0]))
        icon_frame = tk.Frame(self._icon_anchor, bg=c['white'])
        icon_frame.pack(fill=tk.X)
        
        for icon in self.ICONS:
            rb = tk.Radiobutton(icon_frame, text=icon, variable=self._icon_var, value=icon,
                                bg=c['white'], font=("Segoe UI Symbol", 12),
                                relief='flat', bd=0)
            rb.pack(side=tk.LEFT, padx=2)
        
        return self._icon_var

    def _build_enabled_check(self, parent):
        c = self.colors
        self._enabled_var = tk.BooleanVar(value=self._enabled)
        tk.Checkbutton(parent, text="启用功能块", variable=self._enabled_var,
                       bg=c['white'], fg=c['text'], font=("Microsoft YaHei", 9, "bold")).pack(anchor='w', padx=self.PAD, pady=(0, 10))

    def _build_buttons(self, parent, nv, dv, tv, iv, dlg):
        c = self.colors
        btn_frame = tk.Frame(parent, bg=c['white'])
        btn_frame.pack(fill=tk.X, padx=self.PAD, pady=(6, 16))
        
        tk.Button(btn_frame, text="取消", font=("Microsoft YaHei", 10, "bold"),
                  bg=c['text_light'], fg=c['white'], relief='flat', bd=0, cursor='hand2',
                  command=dlg.destroy).pack(side=tk.RIGHT, padx=(4, 0), ipady=4, ipadx=12)
        
        tk.Button(btn_frame, text="确定", font=("Microsoft YaHei", 10, "bold"),
                  bg=c['primary'], fg=c['white'], relief='flat', bd=0, cursor='hand2',
                  command=lambda: self._on_ok(nv, dv, tv, iv)).pack(side=tk.RIGHT, ipady=4, ipadx=12)

    def _on_ok(self, nv, dv, tv, iv):
        name = nv.get().strip()
        if not name:
            messagebox.showinfo("提示", "请输入功能块名称", parent=self.dlg)
            return
        
        block_data = {
            'name': name,
            'desc': dv.get().strip(),
            'type': tv.get(),
            'icon': iv.get(),
            'enabled': self._enabled_var.get(),
        }
        
        btype = tv.get()
        if btype == "应用启动":
            block_data['apps'] = self._apps
        elif btype == "网络搜索":
            block_data['urls'] = self._urls
        elif btype == "任务安排":
            block_data['tasks'] = self._tasks
            block_data['timer_days'] = int(self._days_var.get())
            block_data['timer_hours'] = int(self._hours_var.get())
        elif btype == "定时提醒":
            block_data['reminder_title'] = self._reminder_title_var.get()
            block_data['reminder_time'] = f"{self._reminder_time_vars[0].get()}:{self._reminder_time_vars[1].get()}"
            block_data['reminder_weekdays'] = [i for i, var in enumerate(self._weekday_vars) if var.get()]
            block_data['pre_countdown'] = int(self._pre_countdown_var.get())
        elif btype == "日历安排":
            block_data['week_plan'] = self._week_plan
            block_data['month_plan'] = self._month_plan
        
        self.result = block_data
        self.dlg.destroy()


if __name__ == '__main__':
    IceBlueToolbox()