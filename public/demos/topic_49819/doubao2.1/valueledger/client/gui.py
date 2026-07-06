import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
import threading
import json
import os
from valueledger.client.api_client import APIClient
from valueledger.config import DEFAULT_SERVER_URL

CONFIG_PATH = os.path.join(os.path.expanduser("~"), ".valueledger_client.json")


def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return {"server_url": DEFAULT_SERVER_URL, "token": None}


def save_config(config):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


class ValueLedgerGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("ValueLedger 创值账本")
        self.geometry("1000x700")
        self.minsize(900, 600)

        self.config_data = load_config()
        self.api = APIClient(self.config_data["server_url"])
        self.api.token = self.config_data.get("token")
        self.current_user = None
        self.current_sidebar_btns = []
        self.active_btn = None

        self.colors = {
            "primary": "#2563eb",
            "success": "#10b981",
            "warning": "#f59e0b",
            "danger": "#ef4444",
            "bg": "#f8fafc",
            "sidebar": "#1e293b",
            "sidebar_hover": "#334155",
            "text": "#1e293b",
            "text_light": "#f8fafc",
            "border": "#e2e8f0"
        }

        self.configure(bg=self.colors["bg"])

        self._setup_styles()

        self.container = ttk.Frame(self)
        self.container.pack(fill="both", expand=True)

        self.show_login_or_register()

    def _setup_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")

        style.configure("TFrame", background=self.colors["bg"])
        style.configure("Sidebar.TFrame", background=self.colors["sidebar"])
        style.configure("Card.TFrame", background="white", relief="solid", borderwidth=1)

        style.configure("TLabel", background=self.colors["bg"], foreground=self.colors["text"], font=("Microsoft YaHei UI", 10))
        style.configure("Title.TLabel", background=self.colors["bg"], foreground=self.colors["text"], font=("Microsoft YaHei UI", 20, "bold"))
        style.configure("Subtitle.TLabel", background=self.colors["bg"], foreground="#64748b", font=("Microsoft YaHei UI", 11))
        style.configure("CardTitle.TLabel", background="white", foreground=self.colors["text"], font=("Microsoft YaHei UI", 12, "bold"))
        style.configure("SidebarTitle.TLabel", background=self.colors["sidebar"], foreground=self.colors["text_light"], font=("Microsoft YaHei UI", 14, "bold"))
        style.configure("Sidebar.TLabel", background=self.colors["sidebar"], foreground="#cbd5e1", font=("Microsoft YaHei UI", 11))
        style.configure("SidebarActive.TLabel", background=self.colors["primary"], foreground="white", font=("Microsoft YaHei UI", 11, "bold"))
        style.configure("Success.TLabel", background=self.colors["bg"], foreground=self.colors["success"], font=("Microsoft YaHei UI", 10, "bold"))
        style.configure("Danger.TLabel", background=self.colors["bg"], foreground=self.colors["danger"], font=("Microsoft YaHei UI", 10, "bold"))

        style.configure("TButton", font=("Microsoft YaHei UI", 10), padding=(12, 6))
        style.configure("Primary.TButton", background=self.colors["primary"], foreground="white", borderwidth=0)
        style.map("Primary.TButton", background=[("active", "#1d4ed8"), ("pressed", "#1e40af")])
        style.configure("Success.TButton", background=self.colors["success"], foreground="white", borderwidth=0)
        style.map("Success.TButton", background=[("active", "#059669"), ("pressed", "#047857")])
        style.configure("Danger.TButton", background=self.colors["danger"], foreground="white", borderwidth=0)
        style.map("Danger.TButton", background=[("active", "#dc2626"), ("pressed", "#b91c1c")])
        style.configure("Secondary.TButton", background="#e2e8f0", foreground=self.colors["text"], borderwidth=0)
        style.map("Secondary.TButton", background=[("active", "#cbd5e1"), ("pressed", "#94a3b8")])

        style.configure("TEntry", fieldbackground="white", borderwidth=1, relief="solid", padding=8)
        style.map("TEntry", bordercolor=[("focus", self.colors["primary"])])

        style.configure("Treeview", background="white", fieldbackground="white", foreground=self.colors["text"], font=("Microsoft YaHei UI", 10), rowheight=36)
        style.configure("Treeview.Heading", background="#f1f5f9", foreground=self.colors["text"], font=("Microsoft YaHei UI", 10, "bold"), relief="flat")
        style.map("Treeview", background=[("selected", self.colors["primary"])], foreground=[("selected", "white")])

        style.configure("TNotebook", background=self.colors["bg"], borderwidth=0)
        style.configure("TNotebook.Tab", padding=(16, 8), font=("Microsoft YaHei UI", 10))

        style.configure("Horizontal.TProgressbar", background=self.colors["primary"], troughcolor="#e2e8f0", borderwidth=0)

    def clear_container(self):
        for widget in self.container.winfo_children():
            widget.destroy()

    def check_has_users(self):
        success, result = self.api.has_users()
        if not success:
            messagebox.showerror("错误", f"无法连接服务端：{result.get('error', '未知错误')}")
            return False
        return result.get("has_users", False)

    def show_login_or_register(self, mode="login"):
        self.clear_container()
        self.current_user = None
        self.api.token = None
        self.config_data["token"] = None
        save_config(self.config_data)

        has_users = self.check_has_users()

        if not has_users:
            mode = "register"
            is_first_user = True
        else:
            is_first_user = False

        center_frame = ttk.Frame(self.container, style="TFrame")
        center_frame.place(relx=0.5, rely=0.5, anchor="center")

        card = ttk.Frame(center_frame, style="Card.TFrame", padding=40)
        card.pack()

        ttk.Label(card, text="ValueLedger 创值账本", style="Title.TLabel").pack(pady=(0, 8))
        if mode == "login":
            ttk.Label(card, text="用户登录", style="Subtitle.TLabel").pack(pady=(0, 24))
        else:
            if is_first_user:
                ttk.Label(card, text="创建第一个账号（自动成为BOSS）", style="Subtitle.TLabel").pack(pady=(0, 24))
            else:
                ttk.Label(card, text="注册新账号", style="Subtitle.TLabel").pack(pady=(0, 24))

        form_frame = ttk.Frame(card, style="Card.TFrame")
        form_frame.pack(fill="x")

        ttk.Label(form_frame, text="用户名", style="TLabel").pack(anchor="w", pady=(0, 6))
        self.username_entry = ttk.Entry(form_frame, font=("Microsoft YaHei UI", 11), width=30)
        self.username_entry.pack(fill="x", pady=(0, 16))

        ttk.Label(form_frame, text="密码", style="TLabel").pack(anchor="w", pady=(0, 6))
        self.password_entry = ttk.Entry(form_frame, font=("Microsoft YaHei UI", 11), width=30, show="*")
        self.password_entry.pack(fill="x", pady=(0, 16))

        if mode == "register":
            ttk.Label(form_frame, text="确认密码", style="TLabel").pack(anchor="w", pady=(0, 6))
            self.confirm_password_entry = ttk.Entry(form_frame, font=("Microsoft YaHei UI", 11), width=30, show="*")
            self.confirm_password_entry.pack(fill="x", pady=(0, 16))
        else:
            self.confirm_password_entry = None

        if mode == "login":
            ttk.Button(form_frame, text="登录", style="Primary.TButton", command=self.do_login).pack(fill="x", pady=(8, 8))
            switch_frame = ttk.Frame(form_frame, style="Card.TFrame")
            switch_frame.pack(fill="x", pady=(0, 8))
            ttk.Label(switch_frame, text="还没有账号？", style="Subtitle.TLabel").pack(side="left")
            switch_btn = tk.Label(switch_frame, text="立即注册", fg=self.colors["primary"], bg="white",
                                 font=("Microsoft YaHei UI", 10, "underline"), cursor="hand2")
            switch_btn.pack(side="left", padx=(4, 0))
            switch_btn.bind("<Button-1>", lambda e: self.show_login_or_register(mode="register"))
        else:
            ttk.Button(form_frame, text="注册并登录", style="Primary.TButton", command=self.do_register).pack(fill="x", pady=(8, 8))
            if not is_first_user:
                switch_frame = ttk.Frame(form_frame, style="Card.TFrame")
                switch_frame.pack(fill="x", pady=(0, 8))
                ttk.Label(switch_frame, text="已有账号？", style="Subtitle.TLabel").pack(side="left")
                switch_btn = tk.Label(switch_frame, text="返回登录", fg=self.colors["primary"], bg="white",
                                     font=("Microsoft YaHei UI", 10, "underline"), cursor="hand2")
                switch_btn.pack(side="left", padx=(4, 0))
                switch_btn.bind("<Button-1>", lambda e: self.show_login_or_register(mode="login"))

        bottom_frame = ttk.Frame(card, style="Card.TFrame")
        bottom_frame.pack(fill="x", pady=(16, 0))

        server_url = self.api.base_url
        ttk.Label(bottom_frame, text=f"服务端地址: {server_url}", style="Subtitle.TLabel").pack(side="left")
        ttk.Button(bottom_frame, text="设置", style="Secondary.TButton", command=self.show_server_settings).pack(side="right")

        self.username_entry.focus_set()
        if mode == "login":
            self.bind("<Return>", lambda e: self.do_login())
        else:
            self.bind("<Return>", lambda e: self.do_register())

    def show_server_settings(self):
        dialog = tk.Toplevel(self)
        dialog.title("设置服务端地址")
        dialog.geometry("400x180")
        dialog.transient(self)
        dialog.grab_set()
        dialog.configure(bg=self.colors["bg"])
        dialog.resizable(False, False)

        frame = ttk.Frame(dialog, padding=24)
        frame.pack(fill="both", expand=True)

        ttk.Label(frame, text="服务端地址", style="TLabel").pack(anchor="w", pady=(0, 8))
        entry = ttk.Entry(frame, font=("Microsoft YaHei UI", 11))
        entry.insert(0, self.api.base_url)
        entry.pack(fill="x", pady=(0, 16))
        entry.focus_set()

        def save_server():
            new_url = entry.get().strip()
            if not new_url.startswith("http://") and not new_url.startswith("https://"):
                messagebox.showerror("错误", "地址必须以 http:// 或 https:// 开头", parent=dialog)
                return
            self.api.base_url = new_url
            self.config_data["server_url"] = new_url
            save_config(self.config_data)
            messagebox.showinfo("成功", "服务端地址已保存", parent=dialog)
            dialog.destroy()
            self.show_login_or_register()

        btn_frame = ttk.Frame(frame)
        btn_frame.pack(fill="x")
        ttk.Button(btn_frame, text="取消", style="Secondary.TButton", command=dialog.destroy).pack(side="right", padx=(8, 0))
        ttk.Button(btn_frame, text="保存", style="Primary.TButton", command=save_server).pack(side="right")

        dialog.bind("<Return>", lambda e: save_server())

    def do_login(self):
        username = self.username_entry.get().strip()
        password = self.password_entry.get()
        if not username or not password:
            messagebox.showerror("错误", "请输入用户名和密码")
            return
        self._do_auth(self.api.login(username, password))

    def do_register(self):
        username = self.username_entry.get().strip()
        password = self.password_entry.get()
        confirm = self.confirm_password_entry.get() if self.confirm_password_entry else ""

        if not username:
            messagebox.showerror("错误", "请输入用户名")
            return
        if len(password) < 6:
            messagebox.showerror("错误", "密码长度至少6位")
            return
        if password != confirm:
            messagebox.showerror("错误", "两次输入的密码不一致")
            return

        self._do_auth(self.api.register(username, password))

    def _do_auth(self, result_pair, is_register=False):
        success, result = result_pair
        if not success:
            messagebox.showerror("失败", result.get("error", "登录失败"))
            return

        self.current_user = result["user"]
        self.api.token = result["token"]
        self.config_data["token"] = result["token"]
        save_config(self.config_data)
        self.show_main_workspace()

    def show_main_workspace(self):
        self.clear_container()

        main_paned = ttk.PanedWindow(self.container, orient="horizontal")
        main_paned.pack(fill="both", expand=True)

        sidebar = ttk.Frame(main_paned, style="Sidebar.TFrame", width=200)
        main_paned.add(sidebar, weight=0)

        content_area = ttk.Frame(main_paned, style="TFrame")
        main_paned.add(content_area, weight=1)

        self.content_area = content_area
        self.sidebar_buttons = []

        ttk.Label(sidebar, text="📊 ValueLedger", style="SidebarTitle.TLabel").pack(pady=(24, 8), padx=16)

        role_name = {"usr": "价值创造者", "manager": "管理者", "boss": "BOSS"}.get(self.current_user["role"], self.current_user["role"])
        ttk.Label(sidebar, text=f"欢迎，{self.current_user['username']}", style="Sidebar.TLabel").pack(pady=(0, 4), padx=16)
        ttk.Label(sidebar, text=f"角色：{role_name}", style="Sidebar.TLabel").pack(pady=(0, 24), padx=16)

        menus = self._get_menus_by_role()
        self.current_sidebar_btns = []
        for menu_key, menu_text in menus:
            btn = tk.Label(sidebar, text=menu_text, bg=self.colors["sidebar"], fg="#cbd5e1",
                           font=("Microsoft YaHei UI", 11), anchor="w", padx=20, pady=10, cursor="hand2")
            btn.pack(fill="x", pady=2)
            btn.bind("<Enter>", lambda e, b=btn: self._on_sidebar_hover(b, True))
            btn.bind("<Leave>", lambda e, b=btn: self._on_sidebar_hover(b, False))
            btn.bind("<Button-1>", lambda e, k=menu_key, b=btn: self.switch_menu(k, b))
            self.sidebar_buttons.append((btn, menu_key))
            self.current_sidebar_btns.append(btn)

        ttk.Frame(sidebar, style="Sidebar.TFrame").pack(fill="y", expand=True)

        logout_btn = tk.Label(sidebar, text="🚪 退出登录", bg=self.colors["sidebar"], fg="#f87171",
                              font=("Microsoft YaHei UI", 11), anchor="w", padx=20, pady=10, cursor="hand2")
        logout_btn.pack(fill="x", pady=(0, 16), side="bottom")
        logout_btn.bind("<Button-1>", lambda e: self.show_login_or_register())

        self.active_btn = None
        first_menu = menus[0][0]
        first_btn = self.sidebar_buttons[0][0]
        self.switch_menu(first_menu, first_btn)

    def _get_menus_by_role(self):
        role = self.current_user["role"]
        if role == "usr":
            return [
                ("my_tasks", "📋 我的任务"),
                ("submit_code", "📤 提交代码"),
                ("confirm_review", "✅ 确认评价"),
                ("my_submissions", "📜 提交历史"),
                ("change_password", "🔒 修改密码"),
            ]
        elif role == "manager":
            return [
                ("create_project", "📁 创建项目"),
                ("project_list", "📋 项目列表"),
                ("create_task", "📝 创建任务"),
                ("view_tasks", "📊 查看任务"),
                ("change_password", "🔒 修改密码"),
            ]
        elif role == "boss":
            return [
                ("project_progress", "📈 项目进度"),
                ("contributions", "🏆 贡献度排行"),
                ("user_list", "👥 用户列表"),
                ("manage_users", "⚙️ 用户任免"),
                ("change_password", "🔒 修改密码"),
            ]
        return []

    def _safe_config(self, widget, **kwargs):
        try:
            if widget.winfo_exists():
                widget.config(**kwargs)
        except Exception:
            pass

    def _on_sidebar_hover(self, btn, entering):
        if btn == self.active_btn:
            return
        if entering:
            self._safe_config(btn, bg=self.colors["sidebar_hover"], fg="#e2e8f0")
        else:
            self._safe_config(btn, bg=self.colors["sidebar"], fg="#cbd5e1")

    def switch_menu(self, menu_key, btn):
        if hasattr(self, "current_sidebar_btns"):
            for old_btn in self.current_sidebar_btns:
                self._safe_config(old_btn, bg=self.colors["sidebar"], fg="#cbd5e1", font=("Microsoft YaHei UI", 11))
        self._safe_config(btn, bg=self.colors["primary"], fg="white", font=("Microsoft YaHei UI", 11, "bold"))
        self.active_btn = btn

        for widget in self.content_area.winfo_children():
            widget.destroy()

        page_methods = {
            "my_tasks": self.page_my_tasks,
            "submit_code": self.page_submit_code,
            "confirm_review": self.page_confirm_review,
            "my_submissions": self.page_my_submissions,
            "change_password": self.page_change_password,
            "create_project": self.page_create_project,
            "project_list": self.page_project_list,
            "create_task": self.page_create_task,
            "view_tasks": self.page_view_tasks,
            "project_progress": self.page_project_progress,
            "contributions": self.page_contributions,
            "user_list": self.page_user_list,
            "manage_users": self.page_manage_users,
        }
        if menu_key in page_methods:
            page_methods[menu_key]()

    def _show_loading(self, parent, text="加载中..."):
        loading_frame = ttk.Frame(parent, style="TFrame")
        loading_frame.place(relx=0.5, rely=0.5, anchor="center")
        ttk.Label(loading_frame, text=text, style="Subtitle.TLabel").pack()
        return loading_frame

    def _threaded_request(self, func, callback=None):
        loading = self._show_loading(self.content_area)

        def run():
            result = func()
            self.after(0, lambda: self._after_request(loading, result, callback))

        threading.Thread(target=run, daemon=True).start()

    def _after_request(self, loading, result, callback):
        loading.destroy()
        if callback:
            callback(*result)

    def page_change_password(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="🔒 修改密码", style="Title.TLabel").pack(anchor="w", pady=(0, 24))

        card = ttk.Frame(wrapper, style="Card.TFrame", padding=24)
        card.pack(fill="x")

        form = ttk.Frame(card, style="Card.TFrame")
        form.pack(fill="x")

        ttk.Label(form, text="旧密码", style="TLabel").grid(row=0, column=0, sticky="w", pady=(0, 8))
        old_pwd = ttk.Entry(form, font=("Microsoft YaHei UI", 11), show="*", width=40)
        old_pwd.grid(row=1, column=0, sticky="ew", pady=(0, 16))

        ttk.Label(form, text="新密码", style="TLabel").grid(row=2, column=0, sticky="w", pady=(0, 8))
        new_pwd = ttk.Entry(form, font=("Microsoft YaHei UI", 11), show="*", width=40)
        new_pwd.grid(row=3, column=0, sticky="ew", pady=(0, 16))

        ttk.Label(form, text="确认新密码", style="TLabel").grid(row=4, column=0, sticky="w", pady=(0, 8))
        confirm_pwd = ttk.Entry(form, font=("Microsoft YaHei UI", 11), show="*", width=40)
        confirm_pwd.grid(row=5, column=0, sticky="ew", pady=(0, 24))

        form.columnconfigure(0, weight=1)

        def do_change():
            old = old_pwd.get()
            new = new_pwd.get()
            confirm = confirm_pwd.get()
            if not old or not new or not confirm:
                messagebox.showerror("错误", "请填写所有密码字段")
                return
            if len(new) < 6:
                messagebox.showerror("错误", "新密码长度至少6位")
                return
            if new != confirm:
                messagebox.showerror("错误", "两次输入的新密码不一致")
                return

            def callback(success, result):
                if success:
                    messagebox.showinfo("成功", "密码修改成功")
                    old_pwd.delete(0, tk.END)
                    new_pwd.delete(0, tk.END)
                    confirm_pwd.delete(0, tk.END)
                else:
                    messagebox.showerror("失败", result.get("error", "修改失败"))

            self._threaded_request(lambda: self.api.change_password(old, new), callback)

        btn_frame = ttk.Frame(card, style="Card.TFrame")
        btn_frame.pack(fill="x")
        ttk.Button(btn_frame, text="确认修改", style="Primary.TButton", command=do_change).pack()

        old_pwd.focus_set()

    def page_my_tasks(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="📋 我的任务", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="查看分配给你的所有任务", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        columns = ("id", "project", "title", "description", "status", "created_at")
        tree_frame = ttk.Frame(wrapper, style="Card.TFrame", padding=1)
        tree_frame.pack(fill="both", expand=True)

        tree = ttk.Treeview(tree_frame, columns=columns, show="headings", selectmode="browse")
        tree.heading("id", text="ID")
        tree.heading("project", text="所属项目")
        tree.heading("title", text="任务标题")
        tree.heading("description", text="任务描述")
        tree.heading("status", text="状态")
        tree.heading("created_at", text="创建时间")

        tree.column("id", width=60, anchor="center")
        tree.column("project", width=150, anchor="w")
        tree.column("title", width=200, anchor="w")
        tree.column("description", width=250, anchor="w")
        tree.column("status", width=100, anchor="center")
        tree.column("created_at", width=160, anchor="center")

        vsb = ttk.Scrollbar(tree_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set)
        tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        status_map = {
            "todo": ("待开始", "#64748b"),
            "submitted": ("待确认", self.colors["warning"]),
            "confirmed": ("已完成", self.colors["success"]),
        }

        def callback(success, result):
            if not success:
                messagebox.showerror("错误", result.get("error", "获取任务失败"))
                return
            tasks = result.get("tasks", [])
            for item in tree.get_children():
                tree.delete(item)
            for t in tasks:
                status_text, status_color = status_map.get(t["status"], (t["status"], "black"))
                iid = tree.insert("", "end", values=(
                    t["id"],
                    t.get("project_name", ""),
                    t["title"],
                    t.get("description", "")[:50] + ("..." if t.get("description", "") and len(t["description"]) > 50 else ""),
                    status_text,
                    t["created_at"]
                ))
                tree.tag_configure(f"status_{t['status']}", foreground=status_color)
                tree.item(iid, tags=(f"status_{t['status']}",))

        self._threaded_request(self.api.get_my_tasks, callback)

    def page_submit_code(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="📤 提交代码", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="上传你的Python代码，AI将自动进行评审", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        card = ttk.Frame(wrapper, style="Card.TFrame", padding=24)
        card.pack(fill="both", expand=True)

        form = ttk.Frame(card, style="Card.TFrame")
        form.pack(fill="both", expand=True)

        ttk.Label(form, text="选择任务", style="CardTitle.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 8))
        task_var = tk.StringVar()
        task_combo = ttk.Combobox(form, textvariable=task_var, state="readonly", font=("Microsoft YaHei UI", 11))
        task_combo.grid(row=1, column=0, columnspan=2, sticky="ew", pady=(0, 16))

        ttk.Label(form, text="代码文件", style="CardTitle.TLabel").grid(row=2, column=0, sticky="w", pady=(0, 8))
        file_frame = ttk.Frame(form, style="Card.TFrame")
        file_frame.grid(row=3, column=0, columnspan=2, sticky="ew", pady=(0, 16))
        file_path_var = tk.StringVar()
        file_entry = ttk.Entry(file_frame, textvariable=file_path_var, font=("Microsoft YaHei UI", 11), state="readonly")
        file_entry.pack(side="left", fill="x", expand=True, padx=(0, 8))
        code_content = {"content": "", "filename": ""}

        def select_file():
            path = filedialog.askopenfilename(
                title="选择Python代码文件",
                filetypes=[("Python文件", "*.py"), ("所有文件", "*.*")]
            )
            if path:
                file_path_var.set(path)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        code_content["content"] = f.read()
                    code_content["filename"] = os.path.basename(path)
                except Exception as e:
                    messagebox.showerror("错误", f"读取文件失败: {e}")

        ttk.Button(file_frame, text="选择文件", style="Secondary.TButton", command=select_file).pack(side="right")

        ttk.Label(form, text="代码预览", style="CardTitle.TLabel").grid(row=4, column=0, sticky="w", pady=(0, 8))
        preview_frame = ttk.Frame(form, style="Card.TFrame", borderwidth=1, relief="solid")
        preview_frame.grid(row=5, column=0, columnspan=2, sticky="nsew", pady=(0, 16))
        code_preview = tk.Text(preview_frame, font=("Consolas", 10), wrap="none", height=15, bg="#f8fafc", padx=12, pady=12)
        preview_ysb = ttk.Scrollbar(preview_frame, orient="vertical", command=code_preview.yview)
        preview_xsb = ttk.Scrollbar(preview_frame, orient="horizontal", command=code_preview.xview)
        code_preview.configure(yscrollcommand=preview_ysb.set, xscrollcommand=preview_xsb.set)
        code_preview.pack(side="top", fill="both", expand=True)
        preview_ysb.pack(side="right", fill="y")
        preview_xsb.pack(side="bottom", fill="x")

        def update_preview(*args):
            code_preview.delete("1.0", tk.END)
            code_preview.insert("1.0", code_content["content"])

        file_path_var.trace_add("write", update_preview)

        form.columnconfigure(0, weight=1)
        form.rowconfigure(5, weight=1)

        tasks_data = {"tasks": []}

        def load_tasks(success, result):
            if not success:
                messagebox.showerror("错误", result.get("error", "获取任务失败"))
                return
            tasks_data["tasks"] = [t for t in result.get("tasks", []) if t["status"] != "confirmed"]
            task_combo["values"] = [f"[ID:{t['id']}] {t['title']} ({t.get('project_name', '')})" for t in tasks_data["tasks"]]
            if tasks_data["tasks"]:
                task_combo.current(0)

        self._threaded_request(self.api.get_my_tasks, load_tasks)

        btn_frame = ttk.Frame(card, style="Card.TFrame")
        btn_frame.pack(fill="x")

        def do_submit():
            idx = task_combo.current()
            if idx < 0:
                messagebox.showerror("错误", "请选择任务")
                return
            if not code_content["content"]:
                messagebox.showerror("错误", "请选择代码文件")
                return
            task = tasks_data["tasks"][idx]

            def submit_callback(success, result):
                if success:
                    sub = result["submission"]
                    ai_score = sub.get("ai_score", 0) or 0
                    ai_comment = sub.get("ai_comment", "")
                    messagebox.showinfo("提交成功", f"AI评审完成！\n\nAI评分: {ai_score:.1f}分\n\nAI评价:\n{ai_comment}")
                    file_path_var.set("")
                    code_content["content"] = ""
                    code_content["filename"] = ""
                    self.switch_menu("confirm_review", self.active_btn)
                else:
                    messagebox.showerror("提交失败", result.get("error", "提交失败"))

            self._threaded_request(
                lambda: self.api.submit_code(task["id"], code_content["filename"], code_content["content"]),
                submit_callback
            )

        ttk.Button(btn_frame, text="提交代码进行AI评审", style="Primary.TButton", command=do_submit).pack()

    def page_confirm_review(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="✅ 确认评价", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="查看AI评审结果，确认或修正评价", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        list_frame = ttk.Frame(wrapper, style="Card.TFrame", padding=1)
        list_frame.pack(fill="both", expand=True)

        columns = ("id", "task", "filename", "ai_score", "submitted_at", "status")
        tree = ttk.Treeview(list_frame, columns=columns, show="headings", selectmode="browse")
        tree.heading("id", text="ID")
        tree.heading("task", text="任务")
        tree.heading("filename", text="文件名")
        tree.heading("ai_score", text="AI评分")
        tree.heading("submitted_at", text="提交时间")
        tree.heading("status", text="状态")

        tree.column("id", width=60, anchor="center")
        tree.column("task", width=200, anchor="w")
        tree.column("filename", width=180, anchor="w")
        tree.column("ai_score", width=80, anchor="center")
        tree.column("submitted_at", width=160, anchor="center")
        tree.column("status", width=100, anchor="center")

        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set)
        tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        subs_data = {"submissions": []}

        def callback(success, result):
            if not success:
                messagebox.showerror("错误", result.get("error", "获取提交记录失败"))
                return
            subs_data["submissions"] = result.get("submissions", [])
            for item in tree.get_children():
                tree.delete(item)
            for s in subs_data["submissions"]:
                is_confirmed = s.get("confirmed_at") is not None
                status_text = "已确认" if is_confirmed else "待确认"
                score = s.get("ai_score", 0) or 0
                iid = tree.insert("", "end", values=(
                    s["id"],
                    s.get("task_title", ""),
                    s["filename"],
                    f"{score:.1f}" if score else "-",
                    s["submitted_at"],
                    status_text
                ))
                tree.tag_configure("confirmed", foreground=self.colors["success"])
                tree.tag_configure("pending", foreground=self.colors["warning"])
                tree.item(iid, tags=("confirmed" if is_confirmed else "pending",))

        self._threaded_request(self.api.get_my_submissions, callback)

        def open_confirm_dialog(event):
            sel = tree.selection()
            if not sel:
                return
            item = tree.item(sel[0])
            sub_id = int(item["values"][0])
            sub = next((s for s in subs_data["submissions"] if s["id"] == sub_id), None)
            if not sub:
                return
            if sub.get("confirmed_at"):
                messagebox.showinfo("提示", "该提交已经确认过了")
                return
            self._show_confirm_dialog(sub, lambda: self.switch_menu("confirm_review", self.active_btn))

        tree.bind("<Double-1>", open_confirm_dialog)

        ttk.Label(wrapper, text="提示：双击待确认的提交记录可以查看AI评价并确认/修正", style="Subtitle.TLabel").pack(anchor="w", pady=(12, 0))

    def _show_confirm_dialog(self, submission, on_done=None):
        dialog = tk.Toplevel(self)
        dialog.title(f"确认评价 - 提交ID:{submission['id']}")
        dialog.geometry("700x600")
        dialog.transient(self)
        dialog.grab_set()
        dialog.configure(bg=self.colors["bg"])

        frame = ttk.Frame(dialog, padding=24)
        frame.pack(fill="both", expand=True)

        ttk.Label(frame, text=f"任务: {submission.get('task_title', '')}", style="CardTitle.TLabel").pack(anchor="w", pady=(0, 12))
        ttk.Label(frame, text=f"文件: {submission['filename']}", style="TLabel").pack(anchor="w", pady=(0, 24))

        ttk.Label(frame, text="AI原始评分 (0-100)", style="CardTitle.TLabel").pack(anchor="w", pady=(0, 8))
        ai_score = submission.get("ai_score", 60) or 60
        score_var = tk.DoubleVar(value=ai_score)
        score_frame = ttk.Frame(frame)
        score_frame.pack(fill="x", pady=(0, 16))
        score_scale = ttk.Scale(score_frame, from_=0, to=100, variable=score_var, orient="horizontal")
        score_scale.pack(side="left", fill="x", expand=True, padx=(0, 12))
        score_label = ttk.Label(score_frame, text=f"{score_var.get():.1f}", style="Title.TLabel")
        score_label.pack(side="right")

        def update_score_label(*args):
            score_label.config(text=f"{score_var.get():.1f}")
        score_var.trace_add("write", update_score_label)

        ttk.Label(frame, text="AI原始评价", style="CardTitle.TLabel").pack(anchor="w", pady=(0, 8))
        comment_text = tk.Text(frame, font=("Microsoft YaHei UI", 10), wrap="word", height=8, padx=12, pady=12)
        comment_text.pack(fill="both", expand=True, pady=(0, 16))
        comment_text.insert("1.0", submission.get("ai_comment", ""))

        modified_note = ttk.Label(frame, text="* 修改后系统会自动记录你修改过AI评价", style="Subtitle.TLabel")
        modified_note.pack(anchor="w", pady=(0, 16))

        def do_confirm():
            final_score = round(score_var.get(), 1)
            final_comment = comment_text.get("1.0", tk.END).strip()
            if not final_comment:
                messagebox.showerror("错误", "评价内容不能为空", parent=dialog)
                return

            def callback(success, result):
                if success:
                    messagebox.showinfo("成功", "评价已确认！", parent=dialog)
                    dialog.destroy()
                    if on_done:
                        on_done()
                else:
                    messagebox.showerror("失败", result.get("error", "确认失败"), parent=dialog)

            self._threaded_request(lambda: self.api.confirm_submission(submission["id"], final_score, final_comment), callback)

        btn_frame = ttk.Frame(frame)
        btn_frame.pack(fill="x")
        ttk.Button(btn_frame, text="取消", style="Secondary.TButton", command=dialog.destroy).pack(side="right", padx=(8, 0))
        ttk.Button(btn_frame, text="确认评价", style="Success.TButton", command=do_confirm).pack(side="right")

    def page_my_submissions(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="📜 我的提交历史", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="查看你所有的代码提交记录", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        list_frame = ttk.Frame(wrapper, style="Card.TFrame", padding=1)
        list_frame.pack(fill="both", expand=True)

        columns = ("id", "project", "task", "filename", "final_score", "is_modified", "confirmed_at")
        tree = ttk.Treeview(list_frame, columns=columns, show="headings", selectmode="browse")
        tree.heading("id", text="ID")
        tree.heading("project", text="项目")
        tree.heading("task", text="任务")
        tree.heading("filename", text="文件名")
        tree.heading("final_score", text="最终得分")
        tree.heading("is_modified", text="是否修改")
        tree.heading("confirmed_at", text="确认时间")

        tree.column("id", width=60, anchor="center")
        tree.column("project", width=150, anchor="w")
        tree.column("task", width=180, anchor="w")
        tree.column("filename", width=160, anchor="w")
        tree.column("final_score", width=90, anchor="center")
        tree.column("is_modified", width=90, anchor="center")
        tree.column("confirmed_at", width=160, anchor="center")

        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set)
        tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        def callback(success, result):
            if not success:
                messagebox.showerror("错误", result.get("error", "获取提交历史失败"))
                return
            subs = result.get("submissions", [])
            for item in tree.get_children():
                tree.delete(item)
            for s in subs:
                score = s.get("final_score") or s.get("ai_score") or 0
                is_modified = "是" if s.get("is_modified") else "否"
                iid = tree.insert("", "end", values=(
                    s["id"],
                    s.get("project_name", ""),
                    s.get("task_title", ""),
                    s["filename"],
                    f"{score:.1f}" if score else "-",
                    is_modified,
                    s.get("confirmed_at") or "待确认"
                ))
                if s.get("is_modified"):
                    tree.tag_configure("modified", foreground=self.colors["warning"])
                    tree.item(iid, tags=("modified",))

        self._threaded_request(self.api.get_my_submissions, callback)

    def page_create_project(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="📁 创建项目", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="创建一个新的研发项目", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        card = ttk.Frame(wrapper, style="Card.TFrame", padding=24)
        card.pack(fill="x")

        form = ttk.Frame(card, style="Card.TFrame")
        form.pack(fill="x")

        ttk.Label(form, text="项目名称", style="TLabel").grid(row=0, column=0, sticky="w", pady=(0, 8))
        name_entry = ttk.Entry(form, font=("Microsoft YaHei UI", 11), width=50)
        name_entry.grid(row=1, column=0, sticky="ew", pady=(0, 16))

        ttk.Label(form, text="项目描述", style="TLabel").grid(row=2, column=0, sticky="w", pady=(0, 8))
        desc_text = tk.Text(form, font=("Microsoft YaHei UI", 11), wrap="word", height=6, padx=8, pady=8)
        desc_text.grid(row=3, column=0, sticky="ew", pady=(0, 24))

        form.columnconfigure(0, weight=1)

        def do_create():
            name = name_entry.get().strip()
            desc = desc_text.get("1.0", tk.END).strip()
            if not name:
                messagebox.showerror("错误", "请输入项目名称")
                return

            def callback(success, result):
                if success:
                    messagebox.showinfo("成功", f"项目「{name}」创建成功！")
                    name_entry.delete(0, tk.END)
                    desc_text.delete("1.0", tk.END)
                    self.switch_menu("project_list", self.active_btn)
                else:
                    messagebox.showerror("失败", result.get("error", "创建失败"))

            self._threaded_request(lambda: self.api.create_project(name, desc), callback)

        btn_frame = ttk.Frame(card, style="Card.TFrame")
        btn_frame.pack(fill="x")
        ttk.Button(btn_frame, text="创建项目", style="Primary.TButton", command=do_create).pack()

        name_entry.focus_set()

    def page_project_list(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="📋 项目列表", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="查看所有项目", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        list_frame = ttk.Frame(wrapper, style="Card.TFrame", padding=1)
        list_frame.pack(fill="both", expand=True)

        columns = ("id", "name", "description", "progress", "created_at")
        tree = ttk.Treeview(list_frame, columns=columns, show="headings", selectmode="browse")
        tree.heading("id", text="ID")
        tree.heading("name", text="项目名称")
        tree.heading("description", text="项目描述")
        tree.heading("progress", text="进度")
        tree.heading("created_at", text="创建时间")

        tree.column("id", width=60, anchor="center")
        tree.column("name", width=180, anchor="w")
        tree.column("description", width=300, anchor="w")
        tree.column("progress", width=150, anchor="center")
        tree.column("created_at", width=160, anchor="center")

        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set)
        tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        projects_data = {"projects": []}

        def callback(success, result):
            if not success:
                messagebox.showerror("错误", result.get("error", "获取项目列表失败"))
                return
            projects_data["projects"] = result.get("projects", [])
            for item in tree.get_children():
                tree.delete(item)
            for p in projects_data["projects"]:
                progress = p.get("progress", 0)
                iid = tree.insert("", "end", values=(
                    p["id"],
                    p["name"],
                    p.get("description", "")[:60] + ("..." if p.get("description") and len(p["description"]) > 60 else ""),
                    f"{progress}% ({p.get('completed_tasks', 0)}/{p.get('total_tasks', 0)} 任务)",
                    p["created_at"]
                ))
                if progress == 100:
                    tree.tag_configure("done", foreground=self.colors["success"])
                    tree.item(iid, tags=("done",))

        self._threaded_request(self.api.get_projects, callback)

    def page_create_task(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="📝 创建任务", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="创建任务并分配给开发者", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        card = ttk.Frame(wrapper, style="Card.TFrame", padding=24)
        card.pack(fill="x")

        form = ttk.Frame(card, style="Card.TFrame")
        form.pack(fill="x")

        ttk.Label(form, text="所属项目", style="TLabel").grid(row=0, column=0, sticky="w", pady=(0, 8))
        project_var = tk.StringVar()
        project_combo = ttk.Combobox(form, textvariable=project_var, state="readonly", font=("Microsoft YaHei UI", 11))
        project_combo.grid(row=1, column=0, columnspan=2, sticky="ew", pady=(0, 16))

        ttk.Label(form, text="任务标题", style="TLabel").grid(row=2, column=0, sticky="w", pady=(0, 8))
        title_entry = ttk.Entry(form, font=("Microsoft YaHei UI", 11))
        title_entry.grid(row=3, column=0, columnspan=2, sticky="ew", pady=(0, 16))

        ttk.Label(form, text="任务描述", style="TLabel").grid(row=4, column=0, sticky="w", pady=(0, 8))
        desc_text = tk.Text(form, font=("Microsoft YaHei UI", 11), wrap="word", height=5, padx=8, pady=8)
        desc_text.grid(row=5, column=0, columnspan=2, sticky="ew", pady=(0, 16))

        ttk.Label(form, text="分配给用户", style="TLabel").grid(row=6, column=0, sticky="w", pady=(0, 8))
        user_var = tk.StringVar()
        user_combo = ttk.Combobox(form, textvariable=user_var, state="readonly", font=("Microsoft YaHei UI", 11))
        user_combo.grid(row=7, column=0, columnspan=2, sticky="ew", pady=(0, 24))

        form.columnconfigure(0, weight=1)

        projects_data = {"projects": []}
        users_data = {"users": []}

        def load_projects(success, result):
            if not success:
                messagebox.showerror("错误", result.get("error", "获取项目失败"))
                return
            projects_data["projects"] = result.get("projects", [])
            project_combo["values"] = [f"[ID:{p['id']}] {p['name']}" for p in projects_data["projects"]]
            if projects_data["projects"]:
                project_combo.current(0)

        role_display = {"usr": "开发者", "manager": "管理者"}

        def load_users(success, result):
            if not success:
                messagebox.showerror("错误", result.get("error", "获取用户失败"))
                return
            users_data["users"] = [u for u in result.get("users", []) 
                                  if u["role"] in ("usr", "manager") and u.get("status", "active") == "active"]
            user_combo["values"] = [f"[ID:{u['id']}] {u['username']} ({role_display.get(u['role'], u['role'])})" for u in users_data["users"]]
            if users_data["users"]:
                user_combo.current(0)

        self._threaded_request(self.api.get_projects, load_projects)
        self._threaded_request(self.api.get_all_users, load_users)

        def do_create():
            p_idx = project_combo.current()
            u_idx = user_combo.current()
            title = title_entry.get().strip()
            desc = desc_text.get("1.0", tk.END).strip()

            if p_idx < 0:
                messagebox.showerror("错误", "请选择项目")
                return
            if u_idx < 0:
                messagebox.showerror("错误", "请选择要分配的用户")
                return
            if not title:
                messagebox.showerror("错误", "请输入任务标题")
                return

            project = projects_data["projects"][p_idx]
            user = users_data["users"][u_idx]

            def callback(success, result):
                if success:
                    messagebox.showinfo("成功", f"任务「{title}」创建成功，已分配给 {user['username']}")
                    title_entry.delete(0, tk.END)
                    desc_text.delete("1.0", tk.END)
                    self.switch_menu("view_tasks", self.active_btn)
                else:
                    messagebox.showerror("失败", result.get("error", "创建失败"))

            self._threaded_request(lambda: self.api.create_task(project["id"], title, desc, user["id"]), callback)

        btn_frame = ttk.Frame(card, style="Card.TFrame")
        btn_frame.pack(fill="x")
        ttk.Button(btn_frame, text="创建并分配任务", style="Primary.TButton", command=do_create).pack()

        title_entry.focus_set()

    def page_view_tasks(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="📊 查看任务", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="选择项目查看任务列表", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        top_frame = ttk.Frame(wrapper)
        top_frame.pack(fill="x", pady=(0, 16))

        ttk.Label(top_frame, text="选择项目:", style="TLabel").pack(side="left", padx=(0, 8))
        project_var = tk.StringVar()
        project_combo = ttk.Combobox(top_frame, textvariable=project_var, state="readonly", font=("Microsoft YaHei UI", 11), width=40)
        project_combo.pack(side="left", padx=(0, 8))

        list_frame = ttk.Frame(wrapper, style="Card.TFrame", padding=1)
        list_frame.pack(fill="both", expand=True)

        columns = ("id", "title", "assignee", "status", "created_at")
        tree = ttk.Treeview(list_frame, columns=columns, show="headings", selectmode="browse")
        tree.heading("id", text="ID")
        tree.heading("title", text="任务标题")
        tree.heading("assignee", text="负责人")
        tree.heading("status", text="状态")
        tree.heading("created_at", text="创建时间")

        tree.column("id", width=60, anchor="center")
        tree.column("title", width=280, anchor="w")
        tree.column("assignee", width=150, anchor="w")
        tree.column("status", width=100, anchor="center")
        tree.column("created_at", width=160, anchor="center")

        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set)
        tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        projects_data = {"projects": []}
        status_map = {
            "todo": ("待开始", "#64748b"),
            "submitted": ("待确认", self.colors["warning"]),
            "confirmed": ("已完成", self.colors["success"]),
        }

        def load_projects(success, result):
            if not success:
                return
            projects_data["projects"] = result.get("projects", [])
            project_combo["values"] = [f"[ID:{p['id']}] {p['name']}" for p in projects_data["projects"]]
            if projects_data["projects"]:
                project_combo.current(0)
                load_tasks(0)

        def load_tasks(idx):
            if idx < 0 or idx >= len(projects_data["projects"]):
                return
            project = projects_data["projects"][idx]

            def callback(success, result):
                if not success:
                    messagebox.showerror("错误", result.get("error", "获取任务失败"))
                    return
                tasks = result.get("tasks", [])
                for item in tree.get_children():
                    tree.delete(item)
                for t in tasks:
                    status_text, status_color = status_map.get(t["status"], (t["status"], "black"))
                    iid = tree.insert("", "end", values=(
                        t["id"],
                        t["title"],
                        t.get("assignee_name", ""),
                        status_text,
                        t["created_at"]
                    ))
                    tree.tag_configure(f"status_{t['status']}", foreground=status_color)
                    tree.item(iid, tags=(f"status_{t['status']}",))

            self._threaded_request(lambda: self.api.get_project_tasks(project["id"]), callback)

        def on_project_select(event):
            idx = project_combo.current()
            load_tasks(idx)

        project_combo.bind("<<ComboboxSelected>>", on_project_select)
        self._threaded_request(self.api.get_projects, load_projects)

    def page_project_progress(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="📈 项目进度", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="查看所有项目整体进度", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        list_frame = ttk.Frame(wrapper, style="Card.TFrame", padding=1)
        list_frame.pack(fill="both", expand=True)

        columns = ("id", "name", "description", "progress_bar", "progress_text", "created_at")
        tree = ttk.Treeview(list_frame, columns=columns, show="headings", selectmode="browse")
        tree.heading("id", text="ID")
        tree.heading("name", text="项目名称")
        tree.heading("description", text="项目描述")
        tree.heading("progress_bar", text="进度")
        tree.heading("progress_text", text="完成情况")
        tree.heading("created_at", text="创建时间")

        tree.column("id", width=60, anchor="center")
        tree.column("name", width=180, anchor="w")
        tree.column("description", width=280, anchor="w")
        tree.column("progress_bar", width=200, anchor="w")
        tree.column("progress_text", width=120, anchor="center")
        tree.column("created_at", width=160, anchor="center")

        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set)
        tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        def callback(success, result):
            if not success:
                messagebox.showerror("错误", result.get("error", "获取项目进度失败"))
                return
            projects = result.get("projects", [])
            for item in tree.get_children():
                tree.delete(item)
            for p in projects:
                progress = p.get("progress", 0)
                filled = int(progress / 5)
                bar = "█" * filled + "░" * (20 - filled)
                iid = tree.insert("", "end", values=(
                    p["id"],
                    p["name"],
                    p.get("description", "")[:50] + ("..." if p.get("description") and len(p["description"]) > 50 else ""),
                    bar,
                    f"{progress}% ({p.get('completed_tasks', 0)}/{p.get('total_tasks', 0)})",
                    p["created_at"]
                ))
                if progress == 100:
                    tree.tag_configure("done", foreground=self.colors["success"])
                    tree.item(iid, tags=("done",))
                elif progress > 0:
                    tree.tag_configure("progress", foreground=self.colors["primary"])
                    tree.item(iid, tags=("progress",))

        self._threaded_request(self.api.get_boss_projects, callback)

    def page_contributions(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="🏆 贡献度排行", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="查看开发者贡献度排名", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        list_frame = ttk.Frame(wrapper, style="Card.TFrame", padding=1)
        list_frame.pack(fill="both", expand=True)

        columns = ("rank", "id", "username", "submission_count", "completed_tasks", "avg_score")
        tree = ttk.Treeview(list_frame, columns=columns, show="headings", selectmode="browse")
        tree.heading("rank", text="排名")
        tree.heading("id", text="ID")
        tree.heading("username", text="用户名")
        tree.heading("submission_count", text="提交次数")
        tree.heading("completed_tasks", text="完成任务")
        tree.heading("avg_score", text="平均得分")

        tree.column("rank", width=80, anchor="center")
        tree.column("id", width=60, anchor="center")
        tree.column("username", width=200, anchor="w")
        tree.column("submission_count", width=120, anchor="center")
        tree.column("completed_tasks", width=120, anchor="center")
        tree.column("avg_score", width=120, anchor="center")

        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set)
        tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        medals = ["🥇", "🥈", "🥉"]

        def callback(success, result):
            if not success:
                messagebox.showerror("错误", result.get("error", "获取贡献度失败"))
                return
            contributions = result.get("contributions", [])
            for item in tree.get_children():
                tree.delete(item)
            for idx, c in enumerate(contributions):
                rank = medals[idx] if idx < 3 else str(idx + 1)
                avg_score = c.get("avg_score") or 0
                iid = tree.insert("", "end", values=(
                    rank,
                    c["id"],
                    c["username"],
                    c.get("submission_count", 0),
                    c.get("completed_tasks", 0),
                    f"{avg_score:.1f}" if avg_score else "-"
                ))
                if idx == 0:
                    tree.tag_configure("gold", foreground="#d97706", font=("Microsoft YaHei UI", 10, "bold"))
                    tree.item(iid, tags=("gold",))
                elif idx == 1:
                    tree.tag_configure("silver", foreground="#64748b", font=("Microsoft YaHei UI", 10, "bold"))
                    tree.item(iid, tags=("silver",))
                elif idx == 2:
                    tree.tag_configure("bronze", foreground="#92400e", font=("Microsoft YaHei UI", 10, "bold"))
                    tree.item(iid, tags=("bronze",))

        self._threaded_request(self.api.get_boss_contributions, callback)

    def page_user_list(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="👥 用户列表", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="查看系统所有用户信息", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        list_frame = ttk.Frame(wrapper, style="Card.TFrame", padding=1)
        list_frame.pack(fill="both", expand=True)

        columns = ("id", "username", "role", "status", "ip_address", "mac_address", "created_at")
        tree = ttk.Treeview(list_frame, columns=columns, show="headings", selectmode="browse")
        tree.heading("id", text="ID")
        tree.heading("username", text="用户名")
        tree.heading("role", text="角色")
        tree.heading("status", text="状态")
        tree.heading("ip_address", text="注册IP")
        tree.heading("mac_address", text="MAC地址")
        tree.heading("created_at", text="注册时间")

        tree.column("id", width=60, anchor="center")
        tree.column("username", width=150, anchor="w")
        tree.column("role", width=100, anchor="center")
        tree.column("status", width=100, anchor="center")
        tree.column("ip_address", width=120, anchor="center")
        tree.column("mac_address", width=160, anchor="center")
        tree.column("created_at", width=160, anchor="center")

        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set)
        tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        role_map = {"usr": "开发者", "manager": "管理者", "boss": "BOSS"}
        status_map = {"active": "在职", "dismissed": "已免职"}

        def callback(success, result):
            if not success:
                messagebox.showerror("错误", result.get("error", "获取用户列表失败"))
                return
            users = result.get("users", [])
            for item in tree.get_children():
                tree.delete(item)
            for u in users:
                status_text = status_map.get(u.get("status", "active"), u.get("status", "在职"))
                iid = tree.insert("", "end", values=(
                    u["id"],
                    u["username"],
                    role_map.get(u["role"], u["role"]),
                    status_text,
                    u.get("ip_address", "-"),
                    u.get("mac_address", "-"),
                    u["created_at"]
                ))
                if u.get("status") == "dismissed":
                    tree.tag_configure("dismissed", foreground=self.colors["danger"])
                    tree.item(iid, tags=("dismissed",))
                elif u["role"] == "boss":
                    tree.tag_configure("boss", foreground=self.colors["danger"], font=("Microsoft YaHei UI", 10, "bold"))
                    tree.item(iid, tags=("boss",))
                elif u["role"] == "manager":
                    tree.tag_configure("manager", foreground=self.colors["primary"])
                    tree.item(iid, tags=("manager",))

        self._threaded_request(self.api.get_all_users, callback)

    def page_manage_users(self):
        wrapper = ttk.Frame(self.content_area, padding=32)
        wrapper.pack(fill="both", expand=True)

        ttk.Label(wrapper, text="⚙️ 用户任免", style="Title.TLabel").pack(anchor="w", pady=(0, 8))
        ttk.Label(wrapper, text="管理用户角色、免职/复职用户", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 24))

        btn_frame = ttk.Frame(wrapper)
        btn_frame.pack(fill="x", pady=(0, 16))

        list_frame = ttk.Frame(wrapper, style="Card.TFrame", padding=1)
        list_frame.pack(fill="both", expand=True, pady=(0, 16))

        columns = ("id", "username", "role", "status")
        tree = ttk.Treeview(list_frame, columns=columns, show="headings", selectmode="browse")
        tree.heading("id", text="ID")
        tree.heading("username", text="用户名")
        tree.heading("role", text="当前角色")
        tree.heading("status", text="状态")

        tree.column("id", width=80, anchor="center")
        tree.column("username", width=250, anchor="w")
        tree.column("role", width=150, anchor="center")
        tree.column("status", width=150, anchor="center")

        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set)
        tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")

        users_data = {"users": []}
        role_map = {"usr": "开发者", "manager": "管理者", "boss": "BOSS"}
        status_map = {"active": "在职", "dismissed": "已免职"}

        def refresh():
            def callback(success, result):
                if not success:
                    messagebox.showerror("错误", result.get("error", "获取用户列表失败"))
                    return
                users_data["users"] = result.get("users", [])
                for item in tree.get_children():
                    tree.delete(item)
                for u in users_data["users"]:
                    status_text = status_map.get(u.get("status", "active"), "在职")
                    iid = tree.insert("", "end", values=(
                        u["id"],
                        u["username"],
                        role_map.get(u["role"], u["role"]),
                        status_text
                    ))
                    if u.get("status") == "dismissed":
                        tree.tag_configure("dismissed_row", foreground=self.colors["danger"])
                        tree.item(iid, tags=("dismissed_row",))
                    elif u["role"] == "boss":
                        tree.tag_configure("boss_row", foreground="#94a3b8")
                        tree.item(iid, tags=("boss_row",))
            self._threaded_request(self.api.get_all_users, callback)

        def do_toggle_role():
            sel = tree.selection()
            if not sel:
                messagebox.showwarning("提示", "请先选择一个用户")
                return
            item = tree.item(sel[0])
            user_id = int(item["values"][0])
            user = next((u for u in users_data["users"] if u["id"] == user_id), None)
            if not user or user["role"] == "boss":
                messagebox.showwarning("提示", "不能修改BOSS的角色")
                return
            if user.get("status") == "dismissed":
                messagebox.showwarning("提示", "该用户已被免职，请先复职")
                return

            new_role = "manager" if user["role"] == "usr" else "usr"
            action = "提拔为管理者" if new_role == "manager" else "撤销管理者角色"
            if not messagebox.askyesno("确认", f"确定要{action}用户「{user['username']}」吗？"):
                return

            def callback(success, result):
                if success:
                    messagebox.showinfo("成功", f"已{action}")
                    refresh()
                else:
                    messagebox.showerror("失败", result.get("error", "操作失败"))

            self._threaded_request(lambda: self.api.update_user_role(user_id, new_role), callback)

        def do_dismiss():
            sel = tree.selection()
            if not sel:
                messagebox.showwarning("提示", "请先选择一个用户")
                return
            item = tree.item(sel[0])
            user_id = int(item["values"][0])
            user = next((u for u in users_data["users"] if u["id"] == user_id), None)
            if not user or user["role"] == "boss":
                messagebox.showwarning("提示", "不能免职BOSS")
                return
            if user.get("status") == "dismissed":
                messagebox.showwarning("提示", "该用户已被免职")
                return

            if not messagebox.askyesno("确认", f"确定要免职用户「{user['username']}」吗？免职后该用户将无法登录。"):
                return

            def callback(success, result):
                if success:
                    messagebox.showinfo("成功", "免职成功")
                    refresh()
                else:
                    messagebox.showerror("失败", result.get("error", "操作失败"))

            self._threaded_request(lambda: self.api.dismiss_user(user_id), callback)

        def do_restore():
            sel = tree.selection()
            if not sel:
                messagebox.showwarning("提示", "请先选择一个用户")
                return
            item = tree.item(sel[0])
            user_id = int(item["values"][0])
            user = next((u for u in users_data["users"] if u["id"] == user_id), None)
            if not user:
                return
            if user.get("status") != "dismissed":
                messagebox.showwarning("提示", "该用户未被免职")
                return

            if not messagebox.askyesno("确认", f"确定要复职用户「{user['username']}」吗？"):
                return

            def callback(success, result):
                if success:
                    messagebox.showinfo("成功", "复职成功")
                    refresh()
                else:
                    messagebox.showerror("失败", result.get("error", "操作失败"))

            self._threaded_request(lambda: self.api.restore_user(user_id), callback)

        ttk.Button(btn_frame, text="切换角色", style="Primary.TButton", command=do_toggle_role).pack(side="left", padx=(0, 8))
        ttk.Button(btn_frame, text="免职用户", style="Danger.TButton", command=do_dismiss).pack(side="left", padx=(0, 8))
        ttk.Button(btn_frame, text="复职用户", style="Success.TButton", command=do_restore).pack(side="left")

        ttk.Label(wrapper, text="提示：选择用户后点击按钮进行操作，已免职用户无法登录和被分配任务", style="Subtitle.TLabel").pack(anchor="w")
        refresh()


def run_gui():
    app = ValueLedgerGUI()
    app.mainloop()

