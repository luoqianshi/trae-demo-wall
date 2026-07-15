"""
伴伴 - 截图分析模块
后台定时截屏 + OCR 文字提取 + AI 视觉分析
静默运行，不打扰用户
- 图片无变化时自动跳过，避免重复分析和浪费 API 调用
"""
import hashlib
import threading
import time as _time
import io
import os
from datetime import datetime
from pathlib import Path
from typing import Callable, Optional
from companion_db import Database, ScreenshotRecord
from ai_client import AIClient

# 截图保存目录
SCREENSHOT_DIR = str(Path.home() / ".banban" / "screenshots")


class ScreenshotAnalyzer:
    """截图分析器 - 后台定时截屏 + AI 分析

    两种模式：
    - 标准模式（默认）：每5分钟截一张，每张视觉模型分析
    - 快速模式：每1-3分钟截一张，每张视觉模型分析（视觉模型不花钱），
                并且每积累几张图，DeepSeek 做一次连续性判断，
                用于在交互界面给出实时反馈。
    """

    def __init__(self, db: Database = None, ai: AIClient = None,
                 interval_minutes: int = 5,
                 on_analysis: Callable[[ScreenshotRecord], None] = None,
                 on_continuity_check: Callable[[dict], None] = None):
        self.db = db or Database()
        self.ai = ai or AIClient(self.db)
        self.interval = interval_minutes * 60  # 转秒
        self.on_analysis = on_analysis
        self.on_continuity_check = on_continuity_check  # 连续性判断回调
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._capture_fn = None
        self._ocr_fn = None
        self._get_window_fn = None
        # 图片变化检测
        self._last_hash: str = ""
        self._skip_count: int = 0

        # === 快速模式配置 ===
        self.fast_mode = False              # 快速模式开关
        self.fast_interval_min = 1          # 快速模式最短间隔（分钟）
        self.fast_interval_max = 3          # 快速模式最长间隔（分钟）
        self.continuity_check_every = 2     # 每几张图做一次连续性判断
        self.continuity_min_interval = 2    # 连续性判断最短间隔（分钟）

        # 快速模式：用于连续性判断的历史记录
        self._continuity_history = []       # 最近的截图分析记录
        self._last_continuity_time = 0      # 上次连续性判断时间
        self._continuity_lock = threading.Lock()

        self._init_capture()

    def _init_capture(self):
        """初始化截图和 OCR 方法"""
        Path(SCREENSHOT_DIR).mkdir(parents=True, exist_ok=True)

        # 优先用 mss（跨平台、快速）
        try:
            import mss
            self._capture_fn = self._capture_mss
            print("[Screenshot] 使用 mss 截图")
            return
        except ImportError:
            pass

        # 回退到 Pillow ImageGrab（Windows）
        try:
            from PIL import ImageGrab
            self._capture_fn = self._capture_pil
            print("[Screenshot] 使用 Pillow ImageGrab 截图")
            return
        except ImportError:
            pass

        # Windows GDI 回退
        try:
            import ctypes
            self._capture_fn = self._capture_gdi
            print("[Screenshot] 使用 Windows GDI 截图")
            return
        except Exception:
            pass

        print("[Screenshot] 截图不可用，请安装 mss 或 Pillow")
        self._capture_fn = None

    def _capture_mss(self) -> Optional[str]:
        """用 mss 截图"""
        import mss
        from PIL import Image

        filepath = os.path.join(SCREENSHOT_DIR, f"screen_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
        with mss.mss() as sct:
            monitor = sct.monitors[1]  # 主显示器
            shot = sct.grab(monitor)
            img = Image.frombytes("RGB", shot.size, shot.bgra, "raw", "BGRX")
            # 压缩到合理大小
            if img.width > 1920:
                ratio = 1920 / img.width
                img = img.resize((1920, int(img.height * ratio)))
            img.save(filepath, "PNG", optimize=True)
        return filepath

    def _capture_pil(self) -> Optional[str]:
        """用 Pillow ImageGrab 截图"""
        from PIL import ImageGrab

        filepath = os.path.join(SCREENSHOT_DIR, f"screen_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
        img = ImageGrab.grab()
        if img.width > 1920:
            ratio = 1920 / img.width
            img = img.resize((1920, int(img.height * ratio)))
        img.save(filepath, "PNG", optimize=True)
        return filepath

    def _capture_gdi(self) -> Optional[str]:
        """Windows GDI 截图（最后回退）"""
        import ctypes
        from ctypes import wintypes

        user32 = ctypes.windll.user32
        gdi32 = ctypes.windll.gdi32

        width = user32.GetSystemMetrics(0)
        height = user32.GetSystemMetrics(1)

        hdc = user32.GetDC(0)
        hdc_mem = gdi32.CreateCompatibleDC(hdc)
        hbmp = gdi32.CreateCompatibleBitmap(hdc, width, height)
        gdi32.SelectObject(hdc_mem, hbmp)
        gdi32.BitBlt(hdc_mem, 0, 0, width, height, hdc, 0, 0, 0x00CC0020)  # SRCCOPY

        # 保存为 BMP
        filepath = os.path.join(SCREENSHOT_DIR, f"screen_{datetime.now().strftime('%Y%m%d_%H%M%S')}.bmp")
        BMP_HEADER_SIZE = 14
        BITMAPINFOHEADER_SIZE = 40

        bi = (wintypes.BITMAPINFOHEADER * 1)()
        bi[0].biSize = BITMAPINFOHEADER_SIZE
        bi[0].biWidth = width
        bi[0].biHeight = height
        bi[0].biPlanes = 1
        bi[0].biBitCount = 24
        bi[0].biCompression = 0

        pixel_data_size = width * height * 3
        pixel_data = (ctypes.c_ubyte * pixel_data_size)()
        gdi32.GetDIBits(hdc_mem, hbmp, 0, height, pixel_data, ctypes.byref(bi), 0)

        file_size = BMP_HEADER_SIZE + BITMAPINFOHEADER_SIZE + pixel_data_size
        with open(filepath, "wb") as f:
            # BMP Header
            f.write(b"BM")
            f.write(file_size.to_bytes(4, "little"))
            f.write((0).to_bytes(4, "little"))
            f.write((BMP_HEADER_SIZE + BITMAPINFOHEADER_SIZE).to_bytes(4, "little"))
            # DIB Header
            f.write(BITMAPINFOHEADER_SIZE.to_bytes(4, "little"))
            f.write(width.to_bytes(4, "little", signed=True))
            f.write(height.to_bytes(4, "little", signed=True))
            f.write((1).to_bytes(2, "little"))  # planes
            f.write((24).to_bytes(2, "little"))  # bitcount
            f.write((0).to_bytes(4, "little"))  # compression
            f.write(pixel_data_size.to_bytes(4, "little"))
            f.write((2835).to_bytes(4, "little"))  # x ppm
            f.write((2835).to_bytes(4, "little"))  # y ppm
            f.write((0).to_bytes(4, "little"))
            f.write((0).to_bytes(4, "little"))
            # Pixel data
            f.write(bytearray(pixel_data))

        gdi32.DeleteObject(hbmp)
        gdi32.DeleteDC(hdc_mem)
        user32.ReleaseDC(0, hdc)

        return filepath

    def _extract_ocr(self, image_path: str) -> str:
        """OCR 文字提取（可选）"""
        # 尝试 Windows.Media.Ocr
        try:
            return self._ocr_windows(image_path)
        except Exception:
            pass

        # 尝试 pytesseract
        try:
            import pytesseract
            from PIL import Image
            img = Image.open(image_path)
            return pytesseract.image_to_string(img, lang="chi_sim+eng")
        except ImportError:
            pass
        except Exception:
            pass

        return ""

    def _ocr_windows(self, image_path: str) -> str:
        """Windows 原生 OCR (Windows.Media.Ocr)"""
        import asyncio
        from pathlib import Path

        async def _do_ocr():
            # 使用 winrt 调用 Windows.Media.Ocr
            try:
                from winsdk.windows.media.ocr import OcrEngine
                from winsdk.windows.graphics.imaging import BitmapDecoder
                from winsdk.windows.storage import StorageFile, FileAccessMode
            except ImportError:
                return ""

            file = await StorageFile.get_file_from_path_async(image_path)
            stream = await file.open_async(FileAccessMode.READ)
            decoder = await BitmapDecoder.create_async(stream)
            bitmap = await decoder.get_software_bitmap_async()
            engine = OcrEngine.try_create_from_userprofile_languages()
            if engine is None:
                return ""
            result = await engine.recognize_async(bitmap)
            return result.text

        try:
            return asyncio.run(_do_ocr())
        except Exception:
            return ""

    def _get_foreground_window(self) -> tuple:
        """获取当前前台窗口信息 (app_name, window_title)"""
        try:
            import ctypes
            from ctypes import wintypes

            user32 = ctypes.windll.user32
            hwnd = user32.GetForegroundWindow()
            if not hwnd:
                return ("", "")

            # 窗口标题
            length = user32.GetWindowTextLengthW(hwnd)
            buf = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buf, length + 1)
            window_title = buf.value

            # 进程名
            pid = wintypes.DWORD()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            app_name = self._get_process_name(pid.value)

            return (app_name, window_title)
        except Exception:
            return ("", "")

    def _get_process_name(self, pid: int) -> str:
        """通过 PID 获取进程名"""
        try:
            import ctypes
            from ctypes import wintypes

            PROCESS_QUERY_INFORMATION = 0x0400
            PROCESS_VM_READ = 0x0010

            kernel32 = ctypes.windll.kernel32
            psapi = ctypes.windll.psapi

            handle = kernel32.OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, False, pid)
            if not handle:
                return ""

            buf = ctypes.create_unicode_buffer(260)
            psapi.GetModuleBaseNameW(handle, None, buf, 260)
            kernel32.CloseHandle(handle)
            return buf.value
        except Exception:
            return ""

    def _compute_hash(self, image_path: str) -> str:
        """计算图片的 MD5 哈希，用于判断画面是否变化"""
        hasher = hashlib.md5()
        with open(image_path, "rb") as f:
            # 分块读取，避免大文件一次性加载
            for chunk in iter(lambda: f.read(8192), b""):
                hasher.update(chunk)
        return hasher.hexdigest()

    def _image_changed(self, image_path: str) -> bool:
        """判断图片是否与上一次不同"""
        current_hash = self._compute_hash(image_path)
        if current_hash == self._last_hash:
            self._skip_count += 1
            return False
        self._last_hash = current_hash
        return True

    def capture_and_analyze(self) -> Optional[ScreenshotRecord]:
        """触发一次截图分析

        标准模式和快速模式下，每张截图都会立即用视觉模型分析（视觉模型不花钱）。
        快速模式额外增加：每积累几张图，DeepSeek 做一次连续性判断。
        """
        if not self._capture_fn:
            print("[Screenshot] 截图功能不可用")
            return None

        # 1. 截图
        image_path = self._capture_fn()
        if not image_path or not os.path.exists(image_path):
            print("[Screenshot] 截图失败")
            return None

        # 2. 画面变化检测：与上次截图相同则跳过
        if not self._image_changed(image_path):
            if self._skip_count % 10 == 0:
                print(f"[Screenshot] 画面无变化，已跳过 {self._skip_count} 次")
            try:
                os.remove(image_path)
            except Exception:
                pass
            return None

        if self._skip_count > 0:
            print(f"[Screenshot] 画面有变化，之前跳过了 {self._skip_count} 次")
            self._skip_count = 0

        # 3. 获取窗口信息
        app_name, window_title = self._get_foreground_window()

        # 4. OCR 提取
        ocr_text = self._extract_ocr(image_path)

        # 5. 视觉模型 AI 分析（每张都分析，视觉模型不花钱）
        ai_analysis = ""
        try:
            ai_analysis = self.ai.analyze_screenshot(
                image_path=image_path,
                ocr_text=ocr_text,
                app_name=app_name,
                window_title=window_title,
            )
        except Exception as e:
            ai_analysis = f'{{"description": "分析失败", "insight": "没关系，稍后再看看"}}'

        # 6. 保存记录
        record = ScreenshotRecord(
            image_path=image_path,
            ocr_text=ocr_text,
            ai_analysis=ai_analysis,
            app_name=app_name,
            window_title=window_title,
        )
        record.id = self.db.add_screenshot(record)
        print(f"[Screenshot] 分析完成 #{record.id}: {window_title}")

        # 7. 回调
        if self.on_analysis:
            self.on_analysis(record)

        # 8. 快速模式：检查是否触发连续性判断
        if self.fast_mode:
            self._maybe_continuity_check(record)

        # 9. 清理旧截图（保留最近 100 张）
        self._cleanup_old_screenshots()

        return record

    def _maybe_continuity_check(self, record: ScreenshotRecord):
        """快速模式：积累足够截图后，触发 DeepSeek 连续性判断"""
        now = _time.time()

        with self._continuity_lock:
            self._continuity_history.append({
                "id": record.id,
                "app_name": record.app_name,
                "window_title": record.window_title,
                "ai_analysis": record.ai_analysis,
                "created_at": record.created_at,
            })
            # 只保留最近 N 条
            max_keep = max(self.continuity_check_every * 2, 6)
            if len(self._continuity_history) > max_keep:
                self._continuity_history = self._continuity_history[-max_keep:]

            # 判断是否该做一次连续性检查
            count_since_last = len(self._continuity_history)
            time_since_last = now - self._last_continuity_time

            should_check = (
                count_since_last >= self.continuity_check_every
                and time_since_last >= self.continuity_min_interval * 60
            )

            if not should_check:
                return

            # 取最近 N 条做判断
            recent = self._continuity_history[-self.continuity_check_every:]
            self._last_continuity_time = now

        # 放到后台线程做，不阻塞截图循环
        threading.Thread(
            target=self._do_continuity_check,
            args=(recent,),
            daemon=True,
        ).start()

    def _do_continuity_check(self, recent_records: list):
        """DeepSeek 连续性判断：用户是否在持续做同一件事？

        返回格式：
        {
          "is_continuing": bool,
          "activity": "当前在做的事情",
          "duration_minutes": 连续时长估算,
          "trend": "focus_building" | "maintaining" | "distracting" | "switching",
          "feedback": "给交互界面的简短反馈文案（15字以内）",
          "suggestion": "建议伴伴说的话（可选，空字符串则不说）"
        }
        """
        try:
            result = self.ai.check_activity_continuity(recent_records)
            print(f"[Screenshot] 连续性判断：{result.get('activity', '?')} "
                  f"- {result.get('trend', '?')} "
                  f"- 反馈: {result.get('feedback', '?')}")

            # 触发回调，供交互界面更新
            if self.on_continuity_check:
                try:
                    self.on_continuity_check(result)
                except Exception as e:
                    print(f"[Screenshot] 连续性回调出错: {e}")

        except Exception as e:
            print(f"[Screenshot] 连续性判断失败: {e}")

    def _cleanup_old_screenshots(self, keep: int = 100):
        """清理旧截图文件"""
        try:
            files = sorted(
                [os.path.join(SCREENSHOT_DIR, f) for f in os.listdir(SCREENSHOT_DIR)
                 if f.endswith((".png", ".bmp"))],
                key=os.path.getmtime,
                reverse=True,
            )
            for old_file in files[keep:]:
                os.remove(old_file)
        except Exception:
            pass

    def start(self):
        """启动后台定时截图分析"""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True, name="screenshot-analyzer")
        self._thread.start()
        print(f"[Screenshot] 已启动，间隔 {self.interval // 60} 分钟")

    def stop(self):
        self._running = False
        self._last_hash = ""  # 重置哈希，下次启动重新判断
        self._skip_count = 0
        if self._thread:
            self._thread.join(timeout=2)
        print("[Screenshot] 已停止")

    def _loop(self):
        """主循环"""
        import random
        while self._running:
            try:
                self.capture_and_analyze()
            except Exception as e:
                print(f"[Screenshot] 分析出错: {e}")

            # 计算本次等待间隔
            if self.fast_mode:
                # 快速模式：1-3 分钟随机
                wait_sec = random.randint(
                    self.fast_interval_min * 60,
                    self.fast_interval_max * 60,
                )
            else:
                # 标准模式：固定间隔
                wait_sec = self.interval

            # 等待间隔（可被中断）
            for _ in range(wait_sec):
                if not self._running:
                    break
                _time.sleep(1)

    def set_interval(self, minutes: int):
        """设置截图间隔（分钟）"""
        self.interval = minutes * 60
        print(f"[Screenshot] 间隔改为 {minutes} 分钟")

    def set_fast_mode(self, enabled: bool, **kwargs):
        """设置快速模式

        Args:
            enabled: 是否开启快速模式
            **kwargs: 可选配置：
                - fast_interval_min: 最短截图间隔（分钟）
                - fast_interval_max: 最长截图间隔（分钟）
                - continuity_check_every: 每几张图做一次连续性判断
                - continuity_min_interval: 连续性判断最短间隔（分钟）
        """
        self.fast_mode = enabled

        # 应用可选配置
        if 'fast_interval_min' in kwargs:
            self.fast_interval_min = max(1, int(kwargs['fast_interval_min']))
        if 'fast_interval_max' in kwargs:
            self.fast_interval_max = max(self.fast_interval_min, int(kwargs['fast_interval_max']))
        if 'continuity_check_every' in kwargs:
            self.continuity_check_every = max(1, int(kwargs['continuity_check_every']))
        if 'continuity_min_interval' in kwargs:
            self.continuity_min_interval = max(1, int(kwargs['continuity_min_interval']))

        # 开启时清空历史，重新积累
        if enabled:
            with self._continuity_lock:
                self._continuity_history = []
                self._last_continuity_time = 0
            print(f"[Screenshot] 快速模式已开启：{self.fast_interval_min}-{self.fast_interval_max}分钟截图，"
                  f"每{self.continuity_check_every}张做连续性判断")
        else:
            print("[Screenshot] 快速模式已关闭，使用标准模式")

    def get_status(self) -> dict:
        """获取当前状态"""
        return {
            "running": self._running,
            "fast_mode": self.fast_mode,
            "interval_minutes": self.interval // 60,
            "fast_interval_min": self.fast_interval_min,
            "fast_interval_max": self.fast_interval_max,
            "continuity_check_every": self.continuity_check_every,
            "continuity_min_interval": self.continuity_min_interval,
            "continuity_history_count": len(self._continuity_history),
            "skip_count": self._skip_count,
        }

    def get_history(self, limit: int = 20) -> list[ScreenshotRecord]:
        return self.db.get_screenshots(limit=limit)


# ============================================================
# 快速测试
# ============================================================
if __name__ == "__main__":
    analyzer = ScreenshotAnalyzer(interval_minutes=1)

    print("手动测试一次截图分析...")
    record = analyzer.capture_and_analyze()
    if record:
        print(f"截图: {record.image_path}")
        print(f"应用: {record.app_name} - {record.window_title}")
        print(f"OCR: {record.ocr_text[:200]}...")
        print(f"AI: {record.ai_analysis[:200]}...")

    print("\n历史记录:")
    for r in analyzer.get_history(5):
        print(f"  #{r.id} {r.created_at[:16]} {r.app_name} - {r.window_title}")
