"""
伴伴 - 火山引擎豆包流式语音识别 2.0 (v3 API)

接口地址: wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async (双向流式优化版)
鉴权方式: HTTP Header (X-Api-App-Key / X-Api-Access-Key / X-Api-Resource-Id)
Resource ID: volc.seedasr.sauc.duration (2.0 小时版)

二进制协议:
  Full Client Request (msg_type=0x1, flags=0x0): Header(4B) + PayloadSize(4B) + Payload(JSON)
  Audio Only Request  (msg_type=0x2, flags=0x0): Header(4B) + PayloadSize(4B) + Payload(PCM)
  End Frame           (msg_type=0x2, flags=0x2): Header(4B) + PayloadSize(4B=0)
  Server Response     (msg_type=0x9, flags=0x0): Header(4B) + PayloadSize(4B) + Payload(JSON)
  Server Final Resp   (msg_type=0x9, flags=0x3): Header(4B) + Sequence(4B) + PayloadSize(4B) + Payload(JSON)
  Error Response      (msg_type=0xF, flags=0x0): Header(4B) + PayloadSize(4B) + Payload(JSON)
  注: 服务器自动分配序列号，客户端音频帧不需要传sequence
"""
from __future__ import annotations
import json
import os
import struct
import threading
import time
import uuid
from typing import Optional

# 可选依赖，缺失时降级
try:
    import websocket
    _websocket_available = True
except ImportError:
    websocket = None
    _websocket_available = False

try:
    import pyaudio
    _pyaudio_available = True
except ImportError:
    pyaudio = None
    _pyaudio_available = False

# ============================================================
# 配置
# ============================================================
WS_URL = "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async"
RESOURCE_ID = "volc.seedasr.sauc.duration"  # 豆包流式语音识别2.0 小时版

CFG_FILE = os.path.join(os.path.expanduser("~"), ".banban", "doubao_config.json")


def _load_config() -> dict:
    if not os.path.exists(CFG_FILE):
        return {}
    with open(CFG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


class DoubaoASR:
    """火山引擎豆包流式语音识别 2.0"""

    def __init__(self):
        cfg = _load_config()
        self.app_id = cfg.get("app_id", "")
        self.token = cfg.get("token", "") or cfg.get("access_token", "")
        self.cluster = cfg.get("cluster", "")  # 兼容旧配置
        self.is_configured = bool(self.app_id and self.token and _websocket_available and _pyaudio_available)

        self._ws = None
        self._ws_thread: Optional[threading.Thread] = None
        self._rec_thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

        self._started = False
        self._is_recording = False
        self._text = ""
        self._error: Optional[str] = None
        self._connect_id: Optional[str] = None
        self._log_id: Optional[str] = None

    # ============================================================
    # WebSocket 事件回调
    # ============================================================
    def _on_open(self, ws):
        """连接成功，发送 full client request（配置帧）"""
        self._connect_id = str(uuid.uuid4())
        print(f"[豆包2.0] WebSocket 连接成功，connect_id={self._connect_id[:8]}")

        payload = {
            "user": {"uid": "banban_user"},
            "audio": {
                "format": "pcm",
                "rate": 16000,
                "bits": 16,
                "channel": 1,
            },
            "request": {
                "model_name": "bigmodel",
                "enable_itn": True,
                "enable_punc": True,
                "show_utterances": True,
                "result_type": "full",
            },
        }
        payload_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")

        # Full Client Request: header(4B) + payload_size(4B) + payload
        # byte0: protocol=1(4b), header_size=1(4b) → 0x11
        # byte1: msg_type=0x1(full client request, 4b), flags=0x0(4b) → 0x10
        # byte2: serialization=0x1(JSON, 4b), compression=0x0(4b) → 0x10
        # byte3: reserved → 0x00
        header = bytes([0x11, 0x10, 0x10, 0x00])
        frame = header + struct.pack(">I", len(payload_bytes)) + payload_bytes
        ws.send(frame, opcode=websocket.ABNF.OPCODE_BINARY)
        print(f"[豆包2.0] 配置帧已发送 ({len(frame)} bytes)")
        self._started = True

    def _on_message(self, ws, data):
        """收到服务器消息"""
        if not isinstance(data, bytes) or len(data) < 4:
            return

        msg_type = (data[1] >> 4) & 0x0F
        flags = data[1] & 0x0F

        if msg_type == 0x0F:  # Error
            parsed = self._parse_response(data)
            if parsed and parsed.get("_server_error"):
                self._error = f"豆包 {parsed.get('code', '?')}: {parsed.get('message', '')}"
                print(f"[豆包2.0] 服务器错误: {self._error}")
            else:
                self._error = f"未知错误: {data[:40].hex()}"
                print(f"[豆包2.0] 未知错误帧: {data[:40].hex()}")
            self._started = True  # 让 start() 不再等待
            return

        if msg_type == 0x09:  # Full Server Response
            parsed = self._parse_response(data)
            if parsed and not parsed.get("_server_error"):
                # 提取识别结果
                # bigmodel_async 返回格式: {"result": {"text": "...", "utterances": [...]}, ...}
                result = parsed.get("result", {})
                
                # 情况1: result 是 dict，里面有 text 字段
                if isinstance(result, dict):
                    text = result.get("text", "")
                    if text:
                        self._text = text
                # 情况2: result 是列表（utterance 列表）
                elif isinstance(result, list) and result:
                    texts = []
                    for utt in result:
                        text = utt.get("text", "") if isinstance(utt, dict) else str(utt)
                        if text:
                            texts.append(text)
                    if texts:
                        self._text = "".join(texts)
                # 情况3: result 是字符串
                elif isinstance(result, str):
                    self._text = result

                # 也检查 payload 顶层的 text 字段
                if not self._text and "text" in parsed:
                    self._text = parsed["text"]

                # 调试日志
                if self._text:
                    print(f"[豆包2.0] 识别中: {self._text[:60]}")

    def _on_error(self, ws, error):
        err_str = str(error)
        # WebSocket 正常关闭（finish last sequence / opcode=8）不是错误
        if "finish last sequence" in err_str or "opcode=8" in err_str:
            print(f"[豆包2.0] WebSocket 正常关闭: {err_str}")
            self._is_recording = False
            self._started = True
            return
        # 连接丢失但在录音中也不算致命错误（可能是 stop() 关闭的）
        if "Connection to remote host was lost" in err_str and not self._is_recording:
            print(f"[豆包2.0] 连接已关闭（录音已停止）")
            self._started = True
            return
        self._error = err_str
        print(f"[豆包2.0] WebSocket 错误: {error}")
        self._started = True

    def _on_close(self, ws, code, msg):
        print(f"[豆包2.0] WebSocket 关闭: code={code}")
        self._is_recording = False

    # ============================================================
    # 响应解析
    # ============================================================
    @staticmethod
    def _parse_response(data: bytes) -> Optional[dict]:
        if len(data) < 8:
            return None
        msg_type = (data[1] >> 4) & 0x0F
        flags = data[1] & 0x0F

        if msg_type == 0x0F:  # Error
            # 错误帧: header(4B) + payload_size(4B) + payload(JSON)
            # 或可能带 sequence: header(4B) + sequence(4B) + payload_size(4B) + payload
            # 尝试从 offset=4 (无sequence) 和 offset=8 (有sequence) 解析
            for offset in [4, 8]:
                if len(data) >= offset + 4:
                    size = struct.unpack(">I", data[offset:offset+4])[0]
                    if 0 < size < 10000 and len(data) >= offset + 4 + size:
                        try:
                            payload = data[offset+4:offset+4+size].decode("utf-8", errors="replace")
                            parsed = json.loads(payload)
                            return {"_server_error": True, "code": parsed.get("code", 0), "message": parsed.get("message", payload)}
                        except:
                            pass
            # 最后尝试直接从 data[8:] 解析
            try:
                payload = data[8:].decode("utf-8", errors="replace")
                parsed = json.loads(payload)
                return {"_server_error": True, "code": parsed.get("code", 0), "message": parsed.get("message", payload)}
            except:
                return {"_server_error": True, "code": 0, "message": data.hex()[:100]}

        if msg_type == 0x09:  # Full Server Response
            # 响应格式: header(4B) + sequence(4B) + payload_size(4B) + payload(JSON)
            # flags=0x1 时 sequence 为正数
            if flags & 0x01:
                # 有 sequence 字段
                if len(data) >= 12:
                    seq = struct.unpack(">I", data[4:8])[0]
                    size = struct.unpack(">I", data[8:12])[0]
                    if len(data) >= 12 + size:
                        try:
                            payload = data[12:12+size].decode("utf-8", errors="replace")
                            return json.loads(payload)
                        except:
                            pass
            else:
                # 无 sequence 字段
                if len(data) >= 8:
                    size = struct.unpack(">I", data[4:8])[0]
                    if len(data) >= 8 + size:
                        try:
                            payload = data[8:8+size].decode("utf-8", errors="replace")
                            return json.loads(payload)
                        except:
                            pass
            # Fallback: 尝试从 data[8:] 或 data[12:] 解析
            for start in [12, 8]:
                try:
                    payload = data[start:].decode("utf-8", errors="replace")
                    return json.loads(payload)
                except:
                    pass

        return None

    # ============================================================
    # 录音线程
    # ============================================================
    def _record_audio(self):
        """录音并发送音频帧 - 自动选择可用麦克风设备"""
        try:
            import sounddevice as sd
            import numpy as np
            import queue
            
            TARGET_RATE = 16000
            
            # 自动查找可用麦克风：逐个尝试 WASAPI 输入设备
            mic_dev = None
            native_rate = 48000  # 大多数麦克风原生采样率
            
            # 1. 先尝试系统默认输入设备
            try:
                default_dev = sd.query_devices(kind='input')
                if default_dev:
                    mic_dev = default_dev['index'] if 'index' in default_dev else None
                    # 如果没有index，用None表示默认
                    if mic_dev is None:
                        mic_dev = None
                    else:
                        print(f"[豆包2.0] 系统默认输入: [{mic_dev}] {default_dev['name']}")
            except:
                pass
            
            # 2. 尝试用默认设备录音，如果失败则遍历所有设备
            audio_queue = queue.Queue()
            
            def audio_callback(indata, frames, time_info, status):
                if status:
                    pass
                audio_queue.put(indata.copy())
            
            # 尝试打开设备（可能需要不同的采样率）
            stream = None
            tried_devices = []
            
            # 候选设备列表：默认设备 + 所有WASAPI输入设备
            candidates = []
            # 策略：MME Microsoft 声音映射器[0]会跟随系统默认设备，最可靠
            # 然后尝试跳过虚拟设备的WASAPI设备
            VIRTUAL_KEYWORDS = ['智音', 'Loopback', '虚拟', 'Virtual', 'YY AI', '网易', 'NetEase', '立体声混音', 'Stereo']
            
            # 1. 优先 MME 后端的 Microsoft 声音映射器 (跟随系统默认设备)
            for api in sd.query_hostapis():
                if 'mme' in api['name'].lower():
                    for dev_idx in api['devices']:
                        try:
                            dev = sd.query_devices(dev_idx)
                            if dev['max_input_channels'] > 0 and 'Microsoft' in dev.get('name', ''):
                                candidates.append(dev_idx)
                        except:
                            pass
                    break
            
            # 2. 添加非虚拟的WASAPI设备
            for api in sd.query_hostapis():
                if 'wasapi' in api['name'].lower():
                    for dev_idx in api['devices']:
                        if dev_idx not in candidates:
                            try:
                                dev = sd.query_devices(dev_idx)
                                if dev['max_input_channels'] > 0:
                                    name = dev.get('name', '')
                                    if not any(k in name for k in VIRTUAL_KEYWORDS):
                                        candidates.append(dev_idx)
                            except:
                                pass
                    break
            
            # 3. 添加所有后端的默认输入设备
            for api in sd.query_hostapis():
                if api['default_input_device'] is not None and api['default_input_device'] not in candidates:
                    candidates.append(api['default_input_device'])
            
            for dev_idx in candidates:
                for try_rate in [48000, 44100, 16000]:
                    try:
                        dev_info = sd.query_devices(dev_idx) if dev_idx is not None else sd.query_devices(kind='input')
                        dev_name = dev_info.get('name', '?')
                        block = int(0.2 * try_rate)
                        test_stream = sd.InputStream(
                            samplerate=try_rate,
                            channels=1,
                            dtype='int16',
                            blocksize=block,
                            device=dev_idx,
                            callback=audio_callback,
                        )
                        test_stream.start()
                        # 成功启动！
                        stream = test_stream
                        native_rate = try_rate
                        mic_dev = dev_idx
                        downsample = native_rate // TARGET_RATE if native_rate > TARGET_RATE else 1
                        print(f"[豆包2.0] 设备 [{dev_idx}] {dev_name} @ {try_rate}Hz → {TARGET_RATE}Hz (downsample={downsample})")
                        break
                    except Exception as e:
                        tried_devices.append(f"[{dev_idx}]@{try_rate}Hz: {str(e)[:60]}")
                        continue
                if stream is not None:
                    break
            
            if stream is None:
                print(f"[豆包2.0] 所有设备都打开失败:")
                for t in tried_devices:
                    print(f"  {t}")
                self._is_recording = False
                return
            
            print(f"[豆包2.0] 开始录音")
            
            while self._is_recording and self._ws and self._ws.sock and self._ws.sock.connected:
                try:
                    # 从队列获取音频数据
                    audio_data = audio_queue.get(timeout=1.0)
                    
                    # 降采样到 16000Hz
                    if downsample > 1:
                        audio_data = audio_data[::downsample]
                    
                    audio_bytes = audio_data.tobytes()
                    
                    # Audio Only Request: header(4B) + payload_size(4B) + payload
                    header = bytes([0x11, 0x20, 0x00, 0x00])
                    frame = header + struct.pack(">I", len(audio_bytes)) + audio_bytes
                    self._ws.send(frame, opcode=websocket.ABNF.OPCODE_BINARY)
                except queue.Empty:
                    continue
                except Exception as e:
                    if self._is_recording:
                        print(f"[豆包2.0] 录音帧错误: {e}")
                    break

            # 发送结束帧（负包）
            if self._ws and self._ws.sock and self._ws.sock.connected:
                header = bytes([0x11, 0x22, 0x00, 0x00])
                end_frame = header + struct.pack(">I", 0)
                self._ws.send(end_frame, opcode=websocket.ABNF.OPCODE_BINARY)
                print("[豆包2.0] 结束帧已发送")

            stream.stop()
            stream.close()
            print("[豆包2.0] 录音已停止")

            # 等待最后一包结果
            time.sleep(1.5)
            if self._ws:
                self._ws.close()

        except ImportError:
            print("[豆包2.0] sounddevice 未安装，回退到 pyaudio")
            self._record_audio_pyaudio()
        except Exception as e:
            print(f"[豆包2.0] 录音异常: {e}")
            import traceback; traceback.print_exc()
            self._is_recording = False

    def _record_audio_pyaudio(self):
        """PyAudio fallback 录音"""
        try:
            pa = pyaudio.PyAudio()
            stream = pa.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=3200,
            )
            print("[豆包2.0] 开始录音(pyaudio)，200ms/帧")

            while self._is_recording and self._ws and self._ws.sock and self._ws.sock.connected:
                try:
                    audio_data = stream.read(3200, exception_on_overflow=False)
                    # Audio Only Request: header(4B) + payload_size(4B) + payload
                    # byte0: protocol=1, header_size=1 → 0x11
                    # byte1: msg_type=0x2(audio only, 4b), flags=0x0(no sequence, 4b) → 0x20
                    # byte2: serialization=0x0(no serialization), compression=0x0 → 0x00
                    # byte3: reserved → 0x00
                    # 注: 服务器自动分配序列号，客户端无需传sequence
                    header = bytes([0x11, 0x20, 0x00, 0x00])
                    frame = header + struct.pack(">I", len(audio_data)) + audio_data
                    self._ws.send(frame, opcode=websocket.ABNF.OPCODE_BINARY)
                    time.sleep(0.2)  # 200ms 间隔
                except Exception as e:
                    if self._is_recording:
                        print(f"[豆包2.0] 录音帧错误: {e}")
                    break

            # 发送结束帧（负包）
            if self._ws and self._ws.sock and self._ws.sock.connected:
                # End Frame: header(4B) + payload_size(4B=0)
                # byte1: msg_type=0x2, flags=0x2(last packet, no sequence) → 0x22
                header = bytes([0x11, 0x22, 0x00, 0x00])
                end_frame = header + struct.pack(">I", 0)
                self._ws.send(end_frame, opcode=websocket.ABNF.OPCODE_BINARY)
                print("[豆包2.0] 结束帧已发送")

            stream.stop_stream()
            stream.close()
            pa.terminate()
            print("[豆包2.0] 录音已停止")

            # 等待最后一包结果
            time.sleep(1.5)
            if self._ws:
                self._ws.close()

        except Exception as e:
            print(f"[豆包2.0] 录音异常: {e}")
            import traceback; traceback.print_exc()
            self._is_recording = False

    # ============================================================
    # 公共接口
    # ============================================================
    def start(self) -> bool:
        """启动流式识别"""
        with self._lock:
            if self._is_recording:
                return True

            self._started = False
            self._text = ""
            self._error = None

        # 构建 HTTP Header 鉴权
        connect_id = str(uuid.uuid4())
        headers = [
            f"X-Api-App-Key: {self.app_id}",
            f"X-Api-Access-Key: {self.token}",
            f"X-Api-Resource-Id: {RESOURCE_ID}",
            f"X-Api-Connect-Id: {connect_id}",
        ]

        print(f"[豆包2.0] 连接 {WS_URL} ...")
        print(f"[豆包2.0] App-Key: {self.app_id}, Resource-Id: {RESOURCE_ID}")

        self._ws = websocket.WebSocketApp(
            WS_URL,
            header=headers,
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close,
        )

        self._ws_thread = threading.Thread(
            target=self._ws.run_forever,
            kwargs={"ping_interval": 10, "ping_timeout": 5},
            daemon=True,
        )
        self._ws_thread.start()

        # 等待连接建立（最多 8 秒）
        for _ in range(80):
            if self._started:
                break
            time.sleep(0.1)

        if not self._started:
            self._error = "连接超时"
            return False

        if self._error:
            # 连接后立即报错（如 403）
            return False

        # 开始录音
        self._is_recording = True
        self._rec_thread = threading.Thread(target=self._record_audio, daemon=True)
        self._rec_thread.start()
        return True

    # ============================================================
    # 前端录音模式（音频由浏览器采集，通过 HTTP 转发）
    # ============================================================
    def start_connection(self) -> bool:
        """启动 WebSocket 连接（不启动录音线程，音频由外部提供）"""
        with self._lock:
            if self._is_recording:
                return True
            self._started = False
            self._text = ""
            self._error = None

        connect_id = str(uuid.uuid4())
        headers = [
            f"X-Api-App-Key: {self.app_id}",
            f"X-Api-Access-Key: {self.token}",
            f"X-Api-Resource-Id: {RESOURCE_ID}",
            f"X-Api-Connect-Id: {connect_id}",
        ]

        print(f"[豆包2.0] 连接 {WS_URL} (前端录音模式) ...")

        self._ws = websocket.WebSocketApp(
            WS_URL,
            header=headers,
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close,
        )

        self._ws_thread = threading.Thread(
            target=self._ws.run_forever,
            kwargs={"ping_interval": 10, "ping_timeout": 5},
            daemon=True,
        )
        self._ws_thread.start()

        # 等待连接建立
        for _ in range(80):
            if self._started:
                break
            time.sleep(0.1)

        if not self._started:
            self._error = "连接超时"
            return False

        if self._error:
            return False

        self._is_recording = True
        print("[豆包2.0] 前端录音模式就绪，等待音频数据")
        return True

    def feed_audio(self, pcm_bytes: bytes) -> bool:
        """接收外部音频数据（16kHz PCM Int16 单声道）并发送到豆包"""
        if not self._ws or not self._ws.sock or not self._ws.sock.connected:
            return False
        try:
            header = bytes([0x11, 0x20, 0x00, 0x00])
            frame = header + struct.pack(">I", len(pcm_bytes)) + pcm_bytes
            self._ws.send(frame, opcode=websocket.ABNF.OPCODE_BINARY)
            return True
        except Exception as e:
            print(f"[豆包2.0] 音频发送错误: {e}")
            return False

    def stop_connection(self) -> dict:
        """停止连接，发送结束帧，返回最终结果"""
        self._is_recording = False

        # 发送结束帧
        if self._ws and self._ws.sock and self._ws.sock.connected:
            try:
                header = bytes([0x11, 0x22, 0x00, 0x00])
                end_frame = header + struct.pack(">I", 0)
                self._ws.send(end_frame, opcode=websocket.ABNF.OPCODE_BINARY)
                print("[豆包2.0] 结束帧已发送")
            except:
                pass

        # 等待最后一包结果
        time.sleep(1.5)

        if self._ws:
            try:
                self._ws.close()
            except:
                pass

        text = self._text.strip()
        if text:
            return {"ok": True, "text": text, "engine": "doubao2.0"}
        return {"ok": False, "error": self._error or "未识别到语音"}

    def stop(self) -> dict:
        """停止识别，返回最终结果"""
        self._is_recording = False

        if self._rec_thread:
            self._rec_thread.join(timeout=8)

        if self._ws:
            try:
                self._ws.close()
            except:
                pass

        text = self._text.strip()
        if text:
            return {"ok": True, "text": text, "engine": "doubao2.0"}
        return {"ok": False, "error": self._error or "未识别到语音"}

    def status(self) -> dict:
        """当前状态"""
        return {
            "recording": self._is_recording,
            "text": self._text,
            "error": self._error,
            "engine": "doubao2.0",
        }


# 全局单例
doubao_asr = DoubaoASR()
