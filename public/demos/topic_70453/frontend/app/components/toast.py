"""Toast 通知组件"""
import customtkinter as ctk


class Toast:
    """短暂显示在窗口底部的通知提示"""

    def __init__(self, master):
        self.master = master
        self.label = ctk.CTkLabel(
            master,
            text="",
            fg_color=("gray75", "gray28"),
            corner_radius=8,
            padx=16,
            pady=6,
        )
        self._after_id = None

    def show(self, message: str, duration_ms: int = 3000):
        """显示通知，持续 duration_ms 毫秒后自动消失"""
        self.label.configure(text=message)
        self.label.place(relx=0.5, rely=0.95, anchor="s")
        self.label.lift()

        if self._after_id:
            self.master.after_cancel(self._after_id)
        self._after_id = self.master.after(duration_ms, self._hide)

    def _hide(self):
        self.label.place_forget()
