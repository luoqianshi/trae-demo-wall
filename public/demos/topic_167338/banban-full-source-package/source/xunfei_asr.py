"""
讯飞语音听写流式 API 模块
- WebSocket 实时边说边出字
- 每天免费 500 次，付费版也不贵
- 支持 23 种方言
"""
import base64
import hashlib
import hmac
import json
import os
import threading
import time
from datetime import datetime
from typing import Optional
from urllib.parse import urlencode, urlparse

try:
    import websocket
    _websocket_available = True
except ImportError:
    websocket = None
    _websocket_available = False


class XunfeiASR:
    """讯飞语音听写流式识别"""

    IAT_URL = "wss://iat-api.xfyun.cn/v2/iat"

    def __init__(self):
        self.app_id: str = ""
        self.api_key: str = ""
        self.api_secret: str = ""
        self._ws: Optional[websocket.WebSocketApp] = None
        self._ws_thread: Optional[threading.Thread] = None
        self._result_text = ""
        self._partial_text = ""
        self._error: Optional[str] = None
        self._done = False
        self._ready = False
        self._lock = threading.Lock()
        self._pyaudio_stream = None
        self._pa = None

        # 加载凭据
        self._load_credentials()

    def _load_credentials(self):
        """从环境变量或配置文件加载凭据"""
        self.app_id = os.environ.get("XF_APP_ID", "")
        self.api_key = os.environ.get("XF_API_KEY", "")
        self.api_secret = os.environ.get("XF_API_SECRET", "")

        if not self.app_id:
            cfg_file = os.path.join(os.path.expanduser("~"), ".banban", "xf_config.json")
            if os.path.exists(cfg_file):
                with open(cfg_file, "r") as f:
                    cfg = json.load(f)
                self.app_id = cfg.get("app_id", "")
                self.api_key = cfg.get("api_key", "")
                self.api_secret = cfg.get("api_secret", "")

    @property
    def is_configured(self) -> bool:
        return bool(self.app_id and self.api_key and self.api_secret)

    def _build_auth_url(self) -> str:
        """构建带鉴权签名的 WebSocket URL"""
        host = urlparse(self.IAT_URL).hostname or "iat-api.xfyun.cn"
        path = "/v2/iat"

        # 当前时间 RFC1123
        now = datetime.utcnow()
        date = now.strftime("%a, %d %b %Y %H:%M:%S GMT")

        # signature
        signature_origin = f"host: {host}\ndate: {date}\nGET {path} HTTP/1.1"
        signature_sha = hmac.new(
            self.api_secret.encode(),
            signature_origin.encode(),
            digestmod=hashlib.sha256,
        ).digest()
        signature = base64.b64encode(signature_sha).decode()

        # authorization
        authorization_origin = (
            f'api_key="{self.api_key}", algorithm="hmac-sha256", '
            f'headers="host date request-line", signature="{signature}"'
        )
        authorization = base64.b64encode(authorization_origin.encode()).decode()

        params = {
            "authorization": authorization,
            "date": date,
            "host": host,
        }
        return f"{self.IAT_URL}?{urlencode(params)}"

    # ========= 流式识别 =========

    def start(self) -> bool:
        """开始识别（阻塞式建立连接后立即返回）"""
        if not self.is_configured:
            self._error = "未配置讯飞凭据，请先设置 XF_APP_ID, XF_API_KEY, XF_API_SECRET"
            return False

        self._result_text = ""
        self._partial_text = ""
        self._error = None
        self._done = False
        self._ready = False

        url = self._build_auth_url()
        self._ws = websocket.WebSocketApp(
            url,
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close,
        )
        self._ws_thread = threading.Thread(target=self._ws.run_forever, daemon=True)
        self._ws_thread.start()

        # 等待 WebSocket 连接建立
        for _ in range(50):  # 最多等 5 秒
            if self._ready:
                break
            time.sleep(0.1)

        if not self._ready:
            self._error = "连接讯飞服务超时"
            return False

        # 开始录音线程
        threading.Thread(target=self._record_and_send, daemon=True).start()
        return True

    def _on_open(self, ws):
        """WebSocket 连接建立后，发送首帧参数"""
        params = {
            "common": {"app_id": self.app_id},
            "business": {
                "language": "zh_cn",
                "domain": "iat",
                "accent": "mandarin",
                "dwa": "wpgs",     # 动态修正，颗粒度更小
                "ptt": 1,           # 标点符号
                "vinfo": 0,
                "nunum": 1,         # 数字转阿拉伯
                "eos": 5000,        # 5 秒静音判停
            },
            "data": {
                "status": 0,
                "format": "audio/L16;rate=16000",
                "encoding": "raw",
                "audio": "",        # 首帧发送空音频
            },
        }
        ws.send(json.dumps(params))
        self._ready = True

    def _on_message(self, ws, message):
        """接收识别结果"""
        try:
            result = json.loads(message)
            if result.get("code") != 0:
                self._error = f"讯飞错误 {result.get('code')}: {result.get('message')}"
                return

            data = result.get("data", {})
            if not data or not data.get("result"):
                return

            r = data["result"]
            text = ""
            for ws_item in r.get("ws", []):
                for cw in ws_item.get("cw", []):
                    text += cw.get("w", "")

            pgs = r.get("pgs", "")

            if pgs == "rpl":
                # 动态修正：替换模式
                rg = r.get("rg", [0, 1])
                self._result_text = text  # 简化处理：直接用最新结果
                self._partial_text = text
            else:
                # 追加模式
                self._result_text = (self._result_text + text)
                self._partial_text = text

            if r.get("ls", False):
                self._done = True

        except Exception as e:
            print(f"[讯飞] 解析消息失败: {e}")

    def _on_error(self, ws, error):
        self._error = str(error)

    def _on_close(self, ws, close_status_code, close_msg):
        self._done = True

    def _record_and_send(self):
        """录音线程：从麦克风读音频并发送到讯飞"""
        try:
            import pyaudio
            self._pa = pyaudio.PyAudio()
            self._pyaudio_stream = self._pa.open(
                format=self._pa.get_format_from_width(2),
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=1280,  # 80ms x 16kHz x 2bytes = 2560 -> but 1280 samples
            )
        except Exception as e:
            self._error = f"麦克风启动失败: {e}"
            return

        # 发送音频数据
        frames_sent = 0
        while not self._done and self._ws and self._ws.sock and self._ws.sock.connected:
            try:
                data = self._pyaudio_stream.read(640, exception_on_overflow=False)
                frames_sent += len(data) // 2
                audio_b64 = base64.b64encode(data).decode()

                # 判断是否是最后一帧（超过 55 秒或识别完成）
                duration = frames_sent / 16000
                status = 2 if (duration > 55 or self._done) else 1

                frame = {
                    "data": {
                        "status": status,
                        "format": "audio/L16;rate=16000",
                        "encoding": "raw",
                        "audio": audio_b64,
                    }
                }
                self._ws.send(json.dumps(frame))

                if status == 2:
                    break

            except (websocket.WebSocketConnectionClosedException, BrokenPipeError, OSError):
                break
            except Exception as e:
                print(f"[讯飞] 发送音频失败: {e}")
                break

        # 清理
        if self._pyaudio_stream:
            self._pyaudio_stream.stop_stream()
            self._pyaudio_stream.close()
            self._pyaudio_stream = None
        if self._pa:
            self._pa.terminate()
            self._pa = None

        # 发送结束标识
        try:
            if self._ws and self._ws.sock and self._ws.sock.connected:
                self._ws.send(json.dumps({
                    "data": {"status": 2, "format": "audio/L16;rate=16000", "encoding": "raw", "audio": ""}
                }))
        except Exception:
            pass

    def stop(self) -> dict:
        """停止识别"""
        self._done = True
        if self._pyaudio_stream:
            try:
                self._pyaudio_stream.stop_stream()
                self._pyaudio_stream.close()
            except Exception:
                pass
        if self._pa:
            try:
                self._pa.terminate()
            except Exception:
                pass

        # 等 WebSocket 关闭
        if self._ws_thread:
            self._ws_thread.join(timeout=3)

        if self._ws:
            try:
                self._ws.close()
            except Exception:
                pass

        text = self._result_text.strip()
        if text:
            return {"ok": True, "text": text, "engine": "xunfei"}
        if self._error:
            return {"ok": False, "error": self._error}
        return {"ok": False, "error": "未识别到语音"}

    def status(self) -> dict:
        return {
            "recording": not self._done and self._ready,
            "text": self._result_text,
            "partial": self._partial_text,
            "engine": "xunfei",
            "error": self._error,
        }


# 全局单例
xunfei_asr = XunfeiASR()
