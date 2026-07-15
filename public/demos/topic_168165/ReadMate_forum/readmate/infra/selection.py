"""全局选区监听 - 监听鼠标抬起事件，通过剪贴板获取选区文本

设计思路（v4）：
1. 鼠标按下时记录起点坐标，并判断是否点击在 ReadMate 自己窗口上
2. 鼠标抬起时：
   - 如果按下或抬起在 ReadMate 自己窗口上 → 完全忽略（不干扰自己 UI 的交互）
   - 距离 < 5px → 单击（无选区）→ 立即触发 on_deselection
   - 距离 >= 5px → 可能是选区 → 延迟 150ms 模拟 Ctrl+C 读文本
3. 关键：点击 ReadMate 自己的浮动按钮/答案面板时，pynput 不做任何处理，
   让 Qt 自己处理 clicked 信号，避免"点击按钮反而关闭了自己"的循环 bug
"""
import ctypes
import os
import threading
import time
from typing import Callable, Optional

import pynput.mouse

from ..core.logger import get_logger

logger = get_logger(__name__)

INPUT_KEYBOARD = 1
KEYEVENTF_KEYUP = 0x0002
VK_CONTROL = 0x11
VK_C = 0x43
VK_SHIFT = 0x10

DRAG_THRESHOLD = 5
DOUBLE_CLICK_WINDOW = 0.4


class POINT(ctypes.Structure):
    _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]


class KEYBDINPUT(ctypes.Structure):
    _fields_ = [
        ("wVk", ctypes.c_ushort),
        ("wScan", ctypes.c_ushort),
        ("dwFlags", ctypes.c_ulong),
        ("time", ctypes.c_ulong),
        ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong)),
    ]


class INPUT(ctypes.Structure):
    _fields_ = [
        ("type", ctypes.c_ulong),
        ("ki", KEYBDINPUT),
    ]


def _is_click_on_self_window(x: int, y: int) -> bool:
    """判断物理像素坐标 (x, y) 是否落在当前 Python 进程的窗口上。

    用 WindowFromPoint 获取点击位置的窗口句柄，再用 GetWindowThreadProcessId
    获取该窗口所属进程 PID，与当前进程 PID 比较。

    PyQt6 默认是 Per-Monitor DPI Aware，WindowFromPoint 接收物理像素坐标，
    与 pynput 提供的坐标一致，无需额外转换。
    """
    try:
        pt = POINT(int(x), int(y))
        hwnd = ctypes.windll.user32.WindowFromPoint(pt)
        if not hwnd:
            return False
        pid = ctypes.c_ulong()
        ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        return pid.value == os.getpid()
    except Exception:
        return False


class SelectionMonitor:
    """监听全局鼠标抬起 → 检测选区 → 有选区时模拟 Ctrl+C 读文本

    v4 关键修复：点击 ReadMate 自己的窗口（浮动按钮、答案面板）时，
    pynput 完全忽略，不触发 selection 也不触发 deselection，
    让 Qt 自己处理按钮点击事件，从根本上避免"点按钮反而关闭自己"。
    """

    def __init__(
        self,
        on_selection: Callable[[str, int, int], None],
        on_deselection: Optional[Callable[[], None]] = None,
    ):
        self.on_selection = on_selection
        self.on_deselection = on_deselection
        self._listener: Optional[pynput.mouse.Listener] = None
        self._clipboard_lock = threading.Lock()
        self._self_triggered = False
        self._has_active_selection = False
        self._press_x = 0
        self._press_y = 0
        self._press_on_self = False  # 按下时是否在自己窗口上
        self._last_click_time = 0.0

    def start(self):
        try:
            self._listener = pynput.mouse.Listener(
                on_click=self._on_click,
            )
            self._listener.daemon = True
            self._listener.start()
            logger.info("选区监听已启动")
        except Exception as e:
            logger.error(f"选区监听启动失败: {e}")

    def stop(self):
        if self._listener:
            try:
                self._listener.stop()
                logger.info("选区监听已停止")
            except Exception as e:
                logger.error(f"选区监听停止失败: {e}")

    def _on_click(self, x, y, button, pressed):
        if button != pynput.mouse.Button.left:
            return
        if self._self_triggered:
            return

        if pressed:
            self._press_x = x
            self._press_y = y
            # 关键：记录按下时是否在自己窗口上
            self._press_on_self = _is_click_on_self_window(x, y)
            return

        # 鼠标抬起：如果按下或抬起在自己窗口上 → 完全忽略
        if self._press_on_self or _is_click_on_self_window(x, y):
            return

        dx = x - self._press_x
        dy = y - self._press_y
        distance = (dx * dx + dy * dy) ** 0.5

        shift_pressed = self._is_shift_pressed()

        now = time.time()
        is_multi_click = (now - self._last_click_time) < DOUBLE_CLICK_WINDOW
        self._last_click_time = now

        is_possible_selection = (
            distance >= DRAG_THRESHOLD or shift_pressed or is_multi_click
        )

        if is_possible_selection:
            threading.Thread(
                target=self._handle_possible_selection, args=(x, y), daemon=True
            ).start()
        else:
            threading.Thread(target=self._handle_click_no_drag, daemon=True).start()

    @staticmethod
    def _is_shift_pressed() -> bool:
        try:
            result = ctypes.windll.user32.GetAsyncKeyState(VK_SHIFT)
            return bool(result & 0x8000)
        except Exception:
            return False

    def _handle_click_no_drag(self):
        """处理单击（无拖动）：立即触发取消选择"""
        self._trigger_deselection()

    def _handle_possible_selection(self, x, y):
        """处理可能的选区操作：延迟模拟 Ctrl+C 读文本"""
        with self._clipboard_lock:
            try:
                time.sleep(0.15)
                text = self._try_clipboard()

                if text and len(text.strip()) >= 2:
                    logger.info(f"检测到选区 ({len(text)}字): {text[:40]}...")
                    self._has_active_selection = True
                    self.on_selection(text.strip(), x, y)
                else:
                    self._trigger_deselection()
            except Exception as e:
                logger.error(f"选区检测异常: {e}")

    def _trigger_deselection(self):
        """触发取消选择回调（仅在之前有选区时才触发）"""
        if self._has_active_selection:
            self._has_active_selection = False
            if self.on_deselection:
                logger.debug("选区消失，触发取消选择回调")
                self.on_deselection()

    def _try_clipboard(self) -> str:
        """模拟 Ctrl+C 读剪贴板获取选区文本，尽量不影响系统剪贴板"""
        import pyperclip
        old = ""
        new = ""
        restored = False
        try:
            old = pyperclip.paste() or ""
        except Exception:
            old = ""

        self._self_triggered = True
        try:
            time.sleep(0.03)
            ctypes.windll.user32.keybd_event(VK_CONTROL, 0, 0, 0)
            time.sleep(0.015)
            ctypes.windll.user32.keybd_event(VK_C, 0, 0, 0)
            time.sleep(0.015)
            ctypes.windll.user32.keybd_event(VK_C, 0, 2, 0)
            time.sleep(0.015)
            ctypes.windll.user32.keybd_event(VK_CONTROL, 0, 2, 0)
            time.sleep(0.15)
            for _ in range(3):
                try:
                    new = pyperclip.paste() or ""
                    break
                except Exception:
                    time.sleep(0.05)
        except Exception as e:
            logger.error(f"模拟 Ctrl+C 失败: {e}")
        finally:
            try:
                ctypes.windll.user32.keybd_event(VK_C, 0, 2, 0)
                ctypes.windll.user32.keybd_event(VK_CONTROL, 0, 2, 0)
            except Exception:
                pass
            # 无论old是否为空都尝试恢复，避免破坏用户剪贴板
            for _ in range(3):
                try:
                    pyperclip.copy(old)
                    restored = True
                    break
                except Exception:
                    time.sleep(0.05)
            self._self_triggered = False
            if not restored:
                logger.debug("剪贴板内容恢复可能失败")

        if new and new != old and len(new.strip()) >= 2:
            return new
        return ""
