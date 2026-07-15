"""
阿里云百炼 Paraformer 实时语音识别模块
- WebSocket 实时边说边出字
- 只需要一个百炼 API Key，不需要 AccessKey/AppKey
- 新用户免费试用
"""
import json
import os
import threading
import time
import uuid
from typing import Optional

try:
    import websocket
    _websocket_available = True
except ImportError:
    websocket = None
    _websocket_available = False


class AliyunASR:
    """阿里云百炼 Paraformer 实时语音识别"""

    # 百炼 WebSocket 地址
    WS_URL = "wss://dashscope.aliyuncs.com/api-ws/v1/inference"
    MODEL = "paraformer-realtime-v2"

    def __init__(self):
        self.api_key: str = ""
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
        self._task_id = ""

        self._load_credentials()

    def _load_credentials(self):
        """从环境变量或配置文件加载凭据"""
        self.api_key = os.environ.get("ALIYUN_API_KEY", "")
        if not self.api_key:
            cfg_file = os.path.join(os.path.expanduser("~"), ".banban", "aliyun_config.json")
            if os.path.exists(cfg_file):
                with open(cfg_file, "r") as f:
                    cfg = json.load(f)
                self.api_key = cfg.get("api_key", "")

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    # ========= 流式识别 =========

    def start(self) -> bool:
        """开始识别"""
        if not self.is_configured:
            self._error = "未配置阿里云百炼 API Key"
            return False

        self._result_text = ""
        self._partial_text = ""
        self._error = None
        self._done = False
        self._ready = False
        self._task_id = uuid.uuid4().hex

        self._ws = websocket.WebSocketApp(
            self.WS_URL,
            header={"Authorization": f"Bearer {self.api_key}"},
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close,
        )
        self._ws_thread = threading.Thread(target=self._ws.run_forever, daemon=True)
        self._ws_thread.start()

        # 等待连接建立
        for _ in range(50):
            if self._ready:
                break
            time.sleep(0.1)

        if not self._ready:
            self._error = "连接阿里云语音服务超时"
            return False

        # 开始录音
        threading.Thread(target=self._record_and_send, daemon=True).start()
        return True

    def _on_open(self, ws):
        """连接建立后发送 run-task"""
        msg = {
            "header": {
                "action": "run-task",
                "task_id": self._task_id,
                "streaming": "duplex",
            },
            "payload": {
                "task_group": "audio",
                "task": "asr",
                "function": "recognition",
                "model": self.MODEL,
                "input": {},
                "parameters": {
                    "format": "pcm",
                    "sample_rate": 16000,
                    "disfluency_removal_enabled": False,
                    "semantic_punctuation_enabled": False,
                    "max_sentence_silence": 800,
                    "punctuation_prediction_enabled": True,
                    "inverse_text_normalization_enabled": True,
                },
            },
        }
        ws.send(json.dumps(msg))

    def _on_message(self, ws, message):
        """接收识别结果"""
        try:
            result = json.loads(message)
            header = result.get("header", {})
            event = header.get("event", "")
            error_code = header.get("error_code", "")

            if error_code:
                self._error = f"阿里云错误 {error_code}: {header.get('error_message', '')}"
                return

            if event == "task-started":
                self._ready = True

            elif event == "result-generated":
                payload = result.get("payload", {})
                output = payload.get("output", {})
                sentence = output.get("sentence", {})
                text = sentence.get("text", "")
                is_end = sentence.get("sentence_end", False)
                is_heartbeat = sentence.get("heartbeat", False)

                if is_heartbeat:
                    return

                if text:
                    if is_end:
                        # 句子结束：追加到最终结果
                        with self._lock:
                            self._result_text = self._result_text + text
                            self._partial_text = ""
                    else:
                        # 中间结果
                        self._partial_text = text

            elif event == "task-finished":
                self._done = True

            elif event == "task-failed":
                self._error = f"任务失败: {header.get('error_message', '')}"
                self._done = True

        except Exception as e:
            print(f"[阿里云] 解析消息失败: {e}")

    def _on_error(self, ws, error):
        self._error = str(error)

    def _on_close(self, ws, close_status_code, close_msg):
        self._done = True

    def _record_and_send(self):
        """录音线程：用 pyaudio 录音并用二进制帧发送"""
        try:
            import pyaudio
            self._pa = pyaudio.PyAudio()
            self._pyaudio_stream = self._pa.open(
                format=self._pa.get_format_from_width(2),  # 16bit
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=1280,
            )
        except Exception as e:
            self._error = f"麦克风启动失败: {e}"
            return

        chunk_size = 640  # 每 40ms = 640 samples at 16kHz
        total_duration = 0

        while not self._done and self._ws and self._ws.sock and self._ws.sock.connected:
            try:
                data = self._pyaudio_stream.read(chunk_size, exception_on_overflow=False)
                total_duration += len(data) / 2 / 16000

                # 发送二进制音频帧
                self._ws.send(data, opcode=websocket.ABNF.OPCODE_BINARY)

                # 最长 60 秒自动停止
                if total_duration > 55:
                    self._done = True
                    break

            except (websocket.WebSocketConnectionClosedException, BrokenPipeError, OSError):
                break
            except Exception as e:
                print(f"[阿里云] 发送音频失败: {e}")
                break

        # 清理音频设备
        if self._pyaudio_stream:
            self._pyaudio_stream.stop_stream()
            self._pyaudio_stream.close()
            self._pyaudio_stream = None
        if self._pa:
            self._pa.terminate()
            self._pa = None

        # 发送 finish-task
        try:
            if self._ws and self._ws.sock and self._ws.sock.connected:
                msg = {
                    "header": {
                        "action": "finish-task",
                        "task_id": self._task_id,
                        "streaming": "duplex",
                    },
                    "payload": {"input": {}},
                }
                self._ws.send(json.dumps(msg))
        except Exception:
            pass

    def stop(self) -> dict:
        """停止识别，返回最终文本"""
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

        if self._ws_thread:
            self._ws_thread.join(timeout=3)

        if self._ws:
            try:
                self._ws.close()
            except Exception:
                pass

        text = (self._result_text + self._partial_text).strip()
        if text:
            return {"ok": True, "text": text, "engine": "aliyun-paraformer"}
        if self._error:
            return {"ok": False, "error": self._error}
        return {"ok": False, "error": "未识别到语音"}

    def status(self) -> dict:
        return {
            "recording": not self._done and self._ready,
            "text": self._result_text,
            "partial": self._partial_text,
            "engine": "aliyun-paraformer",
            "error": self._error,
        }


# 全局单例
aliyun_asr = AliyunASR()
