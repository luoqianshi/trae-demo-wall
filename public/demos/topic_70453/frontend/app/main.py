"""Chat Platform — 桌面 GUI 入口"""
import warnings

# 屏蔽 libpng iCCP 警告（customtkinter 内置素材触发，不影响功能）
warnings.filterwarnings("ignore", message=".*iCCP.*")

import customtkinter as ctk
from .utils.config import APP_TITLE, WINDOW_WIDTH, WINDOW_HEIGHT
from .views.login_view import LoginView
from .views.register_view import RegisterView
from .views.main_view import MainView

# CustomTkinter 外观设置 — 浅色主题
ctk.set_appearance_mode("light")
ctk.set_default_color_theme("green")


class App(ctk.CTk):
    """聊天平台主应用"""

    def __init__(self):
        super().__init__()
        self.title(APP_TITLE)
        self.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
        self.minsize(800, 500)

        # 配置窗口背景色
        self.configure(fg_color="#f5f5f5")

        # 当前显示的页面
        self.current_view = None

        # 先显示登录页
        self._show_login()

    def _clear_view(self):
        """清空当前页面"""
        if self.current_view:
            self.current_view.destroy()
            self.current_view = None

    def _show_login(self):
        self._clear_view()
        self.current_view = LoginView(
            self,
            on_login_success=self._show_main,
            on_go_register=self._show_register,
        )
        self.current_view.pack(fill="both", expand=True)

    def _show_register(self):
        self._clear_view()
        self.current_view = RegisterView(
            self,
            on_register_success=self._show_login,
            on_go_login=self._show_login,
        )
        self.current_view.pack(fill="both", expand=True)

    def _show_main(self):
        self._clear_view()
        self.current_view = MainView(
            self,
            on_logout=self._show_login,
        )
        self.current_view.pack(fill="both", expand=True)
        # 刷新联系人列表
        self.current_view.on_show()


def main():
    app = App()
    app.mainloop()


if __name__ == "__main__":
    main()
