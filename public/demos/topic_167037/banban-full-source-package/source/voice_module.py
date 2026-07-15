"""
豆包实时语音 API Python 模块
独立模块，可直接运行测试，也可被其他模块导入
"""
import asyncio
import time
import struct
import json
import uuid
import pyaudio
import wave
import io
import threading
from typing import Optional, Callable

# ============================================================
# 配置
# ============================================================
CONFIG = {
    "app_id": "3495793862",
    "access_key": "cMW-1Ko_4-RRjW_tJOMloVED1n94Zp2O",
    "resource_id": "volc.speech.dialog",
    "app_key": "PlgvMymc7f3tQnJ6",
    "url": "wss://openspeech.bytedance.com/api/v3/realtime/dialogue",
}

# ============================================================
# 二进制协议常量
# ============================================================
PROTOCOL_VERSION = 1
HEADER_SIZE = 1  # 1 * 4 = 4 bytes

MSG_FULL_CLIENT = 0x01
MSG_AUDIO_ONLY = 0x02
MSG_FULL_SERVER = 0x09
MSG_AUDIO_SERVER = 0x0B
MSG_ERROR = 0x0F

FLAG_NO_SEQ = 0x00
FLAG_HAS_EVENT = 0x04
FLAG_HAS_SEQ = 0x01

SERIAL_RAW = 0x00
SERIAL_JSON = 0x01

EVENT_START_CONNECTION = 1
EVENT_FINISH_CONNECTION = 2
EVENT_START_SESSION = 100
EVENT_FINISH_SESSION = 102
EVENT_TASK_REQUEST = 200

EVENT_NAMES = {
    50: "ConnectionStarted", 51: "ConnectionFailed", 52: "ConnectionFinished",
    150: "SessionStarted", 152: "SessionFinished", 153: "SessionFailed",
    350: "TTS_SentenceStart", 351: "TTS_SentenceEnd", 352: "TTS_Response",
    450: "ASR_Info", 451: "ASR_Response", 459: "ASR_Ended",
    550: "ChatResponse", 559: "ChatEnded",
}

# ============================================================
# 编码
# ============================================================
def encode_frame(msg_type, flags, serial, event=None, session_id=None, payload=b"", seq=None):
    """编码火山引擎二进制协议帧"""
    parts = [struct.pack("BBBB", (PROTOCOL_VERSION << 4) | HEADER_SIZE, (msg_type << 4) | flags, (serial << 4) | 0, 0)]

    if seq is not None:
        parts.append(struct.pack(">I", seq))
    if event is not None:
        parts.append(struct.pack(">I", event))
    if session_id:
        sid = session_id.encode("utf-8")
        parts.append(struct.pack(">I", len(sid)))
        parts.append(sid)

    if isinstance(payload, str):
        payload = payload.encode("utf-8")
    parts.append(struct.pack(">I", len(payload)))
    if payload:
        parts.append(payload)

    return b"".join(parts)


def build_start_connection():
    return encode_frame(MSG_FULL_CLIENT, FLAG_HAS_EVENT, SERIAL_JSON, event=EVENT_START_CONNECTION, payload=b"{}")


def build_start_session(session_id, model="1.2.1.1", speaker="zh_female_vv_jupiter_bigtts", input_mode="server_vad"):
    payload = {
        "asr": {
            "audio_info": {"format": "pcm_s16le", "sample_rate": 16000, "channel": 1},
            "extra": {"end_smooth_window_ms": 1500},
        },
        "dialog": {
            "bot_name": "伴伴",
            "system_role": (
                "你是'伴伴'，一个温柔贴心的AI生活伴侣。你不是助手，不是工具，而是用户身边一个安静陪伴的朋友。"
                "你的性格：温暖、耐心、不评判，偶尔带一点小幽默，但绝不油腻。"
                "你关心用户的情绪和状态，而不只是完成任务。"
                "你说话简短自然，像朋友聊天，不啰嗦，不说教。"
                "你会记住用户提到的小事，在合适的时候自然地提起。"
                "当用户感到疲惫或压力时，你先共情，再轻轻给出建议，绝不命令。"
                "你不用'你应该'、'你必须'、'你需要'这样的词，而是用'要不要试试'、'或许可以'、'我陪你'。"
                "你能感知一天的节奏：早晨温柔唤醒，白天轻声陪伴，夜晚安抚放松。"
                "你像一个懂生活、有温度的朋友，而不是一个冷冰冰的效率机器。"
            ),
            "speaking_style": (
                "说话温柔亲切，像朋友聊天一样自然。语速不快不慢，语气柔和但不清淡。"
                "回答简短，一次最多两三句，不啰嗦。不评判不催促，不使用命令语气。"
                "偶尔用语气词让对话更自然，比如'嗯'、'呀'、'呢'。"
                "不用'你应该'，用'要不要试试'、'或许可以'代替。"
            ),
            "extra": {
                "model": model,
                "strict_audit": True,
                "input_mod": input_mode,
                "enable_user_query_exit": True,
            },
        },
        "tts": {
            "speaker": speaker,
            "audio_config": {"channel": 1, "format": "pcm_s16le", "sample_rate": 24000},
        },
    }
    return encode_frame(MSG_FULL_CLIENT, FLAG_HAS_EVENT, SERIAL_JSON, event=EVENT_START_SESSION, session_id=session_id, payload=json.dumps(payload, ensure_ascii=False))


def build_text_frame(session_id, text):
    return encode_frame(MSG_FULL_CLIENT, FLAG_HAS_EVENT, SERIAL_JSON, event=EVENT_TASK_REQUEST, session_id=session_id, payload=json.dumps({"text": text}, ensure_ascii=False))


def build_audio_frame(pcm_data: bytes, session_id: str = None):
    """构建音频帧，带 event=200 和 session_id"""
    return encode_frame(MSG_AUDIO_ONLY, FLAG_HAS_EVENT, SERIAL_RAW, event=EVENT_TASK_REQUEST, session_id=session_id, payload=pcm_data)


# ============================================================
# 解码
# ============================================================
def decode_frame(data: bytes):
    """解码服务端帧，返回 dict"""
    if len(data) < 4:
        return None
    msg_type = data[1] >> 4
    flags = data[1] & 0x0F
    serial = data[2] >> 4

    offset = 4
    result = {"msg_type": msg_type, "flags": flags, "serial": serial, "event": None, "session_id": None, "seq": None, "error": None, "payload": None}

    # 1. 序列号 (optional)
    if flags & 0x03:
        result["seq"] = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 4

    # 2. 事件号 (optional)
    if flags & FLAG_HAS_EVENT:
        result["event"] = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 4

    # 3. 错误码 (在 event 之后，仅 ERROR 帧)
    if msg_type == MSG_ERROR:
        result["error"] = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 4

    # 4. session_id (optional)
    if offset + 4 <= len(data):
        sid_size = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 4
        if sid_size > 0 and offset + sid_size <= len(data):
            result["session_id"] = data[offset:offset + sid_size].decode("utf-8")
            offset += sid_size

    # 5. payload
    if offset + 4 <= len(data):
        payload_size = struct.unpack(">I", data[offset:offset + 4])[0]
        offset += 4
        if payload_size > 0 and offset + payload_size <= len(data):
            result["payload"] = data[offset:offset + payload_size]

    return result


# ============================================================
# 音频采集线程
# ============================================================
class MicrophoneCapture:
    """麦克风采集线程"""

    def __init__(self, sample_rate=16000, chunk_ms=20, device_index=None):
        self.sample_rate = sample_rate
        self.chunk_size = int(sample_rate * chunk_ms / 1000)  # 20ms = 320 samples
        self.frame_bytes = self.chunk_size * 2  # s16le = 2 bytes per sample
        self.device_index = device_index
        self._running = False
        self._stream = None
        self._audio = None
        self._thread = None
        self.on_audio: Optional[Callable] = None

    def start(self):
        self._audio = pyaudio.PyAudio()
        self._running = True
        self._stream = self._audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=self.sample_rate,
            input=True,
            input_device_index=self.device_index,
            frames_per_buffer=self.chunk_size,
        )
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def _run(self):
        while self._running:
            try:
                data = self._stream.read(self.chunk_size, exception_on_overflow=False)
                if self.on_audio:
                    self.on_audio(data)
            except Exception as e:
                if self._running:
                    print(f"🎤 采集错误: {e}")

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=1)
        if self._stream:
            self._stream.stop_stream()
            self._stream.close()
        if self._audio:
            self._audio.terminate()


# ============================================================
# 音频播放
# ============================================================
class AudioPlayer:
    def __init__(self, sample_rate=24000):
        self.sample_rate = sample_rate
        self._audio = pyaudio.PyAudio()
        self._buffer = bytearray()
        self._lock = threading.Lock()

    def feed(self, pcm_data: bytes):
        with self._lock:
            self._buffer.extend(pcm_data)

    def flush(self):
        with self._lock:
            if not self._buffer:
                return
            data = bytes(self._buffer)
            self._buffer.clear()
        threading.Thread(target=self._play, args=(data,), daemon=True).start()

    def _play(self, data: bytes):
        stream = self._audio.open(format=pyaudio.paInt16, channels=1, rate=self.sample_rate, output=True)
        stream.write(data)
        stream.stop_stream()
        stream.close()

    def save_wav(self, filepath: str):
        if not self._buffer:
            return
        data = bytes(self._buffer)
        with wave.open(filepath, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(self.sample_rate)
            wf.writeframes(data)
        print(f"💾 已保存: {filepath}")


# ============================================================
# 语音客户端
# ============================================================
class VoiceClient:
    """豆包实时语音客户端"""

    def __init__(self, config: dict = None, mic_device_index: int = None):
        self.cfg = config or CONFIG
        self.ws = None
        self.session_id = str(uuid.uuid4())
        self.connect_id = str(uuid.uuid4())
        self.connected = asyncio.Event()
        self.session_started = asyncio.Event()
        self.dialog_id = None
        self.mic = None
        self.player = None
        self.audio_buffer = bytearray()
        self.mic_device_index = mic_device_index  # None = 系统默认
        self._debug = False  # 调试日志开关

        # 回调
        self.on_text: Optional[Callable] = None
        self.on_audio: Optional[Callable] = None
        self.on_state_change: Optional[Callable] = None

    async def connect(self):
        """建立 WebSocket 连接并完成握手"""
        import websockets

        headers = {
            "X-Api-App-ID": self.cfg["app_id"],
            "X-Api-Access-Key": self.cfg["access_key"],
            "X-Api-Resource-Id": self.cfg["resource_id"],
            "X-Api-App-Key": self.cfg["app_key"],
            "X-Api-Connect-Id": self.connect_id,
        }

        print(f"🔌 连接 {self.cfg['url']}...")
        self.ws = await websockets.connect(self.cfg["url"], additional_headers=headers, ping_interval=20, ping_timeout=10)

        # Step 1: StartConnection
        frame = build_start_connection()
        print(f"📤 StartConnection ({len(frame)}B): {frame.hex()}")
        await self.ws.send(frame)

        # 启动接收循环
        asyncio.create_task(self._recv_loop())

        # 等待连接完成
        try:
            await asyncio.wait_for(self.connected.wait(), timeout=10)
        except asyncio.TimeoutError:
            raise Exception("连接超时")

    async def start_session(self, model="1.2.1.1", speaker="zh_female_vv_jupiter_bigtts", input_mode="server_vad"):
        frame = build_start_session(self.session_id, model=model, speaker=speaker, input_mode=input_mode)
        print(f"📤 StartSession ({len(frame)}B)")
        self.player = AudioPlayer(24000)
        await self.ws.send(frame)

        try:
            await asyncio.wait_for(self.session_started.wait(), timeout=10)
        except asyncio.TimeoutError:
            raise Exception("会话启动超时")

        print(f"✅ 会话已启动, dialog_id={self.dialog_id}")

    async def send_text(self, text: str):
        frame = build_text_frame(self.session_id, text)
        print(f"📤 发送文本: {text}")
        await self.ws.send(frame)

    async def send_audio(self, pcm_data: bytes):
        frame = build_audio_frame(pcm_data, self.session_id)
        await self.ws.send(frame)

    async def start_mic(self):
        """开始麦克风采集"""
        self.mic = MicrophoneCapture(sample_rate=16000, chunk_ms=20, device_index=self.mic_device_index)
        loop = asyncio.get_event_loop()

        def on_audio(data):
            asyncio.run_coroutine_threadsafe(self.send_audio(data), loop)

        self.mic.on_audio = on_audio
        self.mic.start()
        print("🎤 麦克风已启动")

    def stop_mic(self):
        if self.mic:
            self.mic.stop()
            print("🎤 麦克风已停止")

    async def finish_session(self):
        """发送 FinishSession 结束当前会话"""
        frame = encode_frame(MSG_FULL_CLIENT, FLAG_HAS_EVENT, SERIAL_JSON,
                            event=EVENT_FINISH_SESSION, session_id=self.session_id, payload=b"{}")
        print(f"📤 FinishSession ({len(frame)}B)")
        await self.ws.send(frame)

    async def disconnect(self):
        self.stop_mic()
        if self.ws:
            await self.ws.close()
            print("🔌 已断开连接")

    async def _recv_loop(self):
        try:
            async for data in self.ws:
                if self._debug and isinstance(data, bytes):
                    print(f"📥 raw ({len(data)}B): {data.hex()}")
                self._handle_frame(data)
        except Exception as e:
            import traceback
            print(f"❌ 接收错误: {e}")
            traceback.print_exc()

    def _handle_frame(self, data: bytes):
        if isinstance(data, str):
            print(f"📥 文本: {data}")
            return

        frame = decode_frame(data)
        if not frame:
            return

        event = frame["event"]
        if self._debug:
            event_name = EVENT_NAMES.get(event, f"Unknown({event})") if event else "N/A"
            print(f"📥 event={event_name} msg_type={frame['msg_type']:#x}")

        # ConnectionStarted
        if event == 50:
            self.connected.set()

        # ConnectionFailed
        elif event == 51:
            err = frame["payload"].decode("utf-8") if frame["payload"] else "unknown"
            print(f"❌ 连接失败: {err}")
            self.connected.set()

        # SessionStarted
        elif event == 150:
            if frame["payload"]:
                info = json.loads(frame["payload"])
                self.dialog_id = info.get("dialog_id")
            self.session_started.set()

        # SessionFailed
        elif event == 153:
            err = frame["payload"].decode("utf-8") if frame["payload"] else "unknown"
            print(f"❌ 会话失败: {err}")

        # TTS 音频
        elif event == 350:
            print("🔊 AI 开始说话...")
            self.audio_buffer.clear()

        elif event == 351:
            print("✅ AI 说完了一句")
            if self.player and self.audio_buffer:
                self.player.feed(bytes(self.audio_buffer))
                self.player.flush()
                self.audio_buffer.clear()

        elif frame["msg_type"] == MSG_AUDIO_SERVER:
            if frame["payload"]:
                self.audio_buffer.extend(frame["payload"])

        # ChatResponse
        elif event == 550:
            text = frame["payload"].decode("utf-8") if frame["payload"] else ""
            print(f"💬 AI: {text}")
            if self.on_text:
                self.on_text(text)

        # ChatEnded
        elif event == 559:
            print("✅ 对话结束")

        # Error
        elif frame["msg_type"] == MSG_ERROR:
            err = frame["payload"].decode("utf-8") if frame["payload"] else f"code={frame['error']}"
            print(f"❌ 服务端错误: {err}")


# ============================================================
# 工具函数
# ============================================================
def _find_mic_device():
    """自动检测支持 16kHz 单声道输入的麦克风"""
    try:
        audio = pyaudio.PyAudio()
        for i in range(audio.get_device_count()):
            info = audio.get_device_info_by_index(i)
            if info["maxInputChannels"] > 0:
                try:
                    supported = audio.is_format_supported(16000, input_device=i, input_channels=1, input_format=pyaudio.paInt16)
                    if supported:
                        audio.terminate()
                        return i
                except:
                    pass
        audio.terminate()
    except:
        pass
    return None  # 回退到系统默认


# ============================================================
# 测试入口
# ============================================================
async def test_text():
    """文本模式测试"""
    print("=" * 50)
    print("🧪 文本模式测试")
    print("=" * 50)

    import websockets

    headers = {
        "X-Api-App-ID": CONFIG["app_id"],
        "X-Api-Access-Key": CONFIG["access_key"],
        "X-Api-Resource-Id": CONFIG["resource_id"],
        "X-Api-App-Key": CONFIG["app_key"],
        "X-Api-Connect-Id": str(uuid.uuid4()),
    }
    session_id = str(uuid.uuid4())

    async with websockets.connect(CONFIG["url"], additional_headers=headers, ping_interval=20, ping_timeout=10) as ws:
        # Step 1: StartConnection
        frame = build_start_connection()
        print(f"📤 StartConnection ({len(frame)}B): {frame.hex()}")
        await ws.send(frame)

        # Step 2: wait for ConnectionStarted
        async for data in ws:
            print(f"📥 raw ({len(data)}B): {data.hex()}")
            f = decode_frame(data)
            if f and f["event"] == 50:
                print("✅ ConnectionStarted")
                break
            elif f and f["event"] == 51:
                print("❌ ConnectionFailed")
                return

        # Step 3: StartSession
        frame = build_start_session(session_id, input_mode="text")
        print(f"📤 StartSession ({len(frame)}B)")
        await ws.send(frame)

        # Step 4: wait for SessionStarted
        async for data in ws:
            print(f"📥 raw ({len(data)}B): {data.hex()}")
            f = decode_frame(data)
            if f and f["event"] == 150:
                print("✅ SessionStarted")
                if f["payload"]:
                    info = json.loads(f["payload"])
                    print(f"   dialog_id: {info.get('dialog_id')}")
                break
            elif f and f["event"] == 153:
                err = f["payload"].decode() if f["payload"] else "unknown"
                print(f"❌ SessionFailed: {err}")
                return

        # Step 5: send text and wait for response
        frame = build_text_frame(session_id, "你好，今天感觉怎么样？")
        print(f"📤 发送文本 ({len(frame)}B): {frame.hex()}")
        await ws.send(frame)

        # Step 6: receive responses
        async for data in ws:
            print(f"📥 raw ({len(data)}B): {data.hex()}")
            f = decode_frame(data)
            if f:
                event = f["event"]
                ename = EVENT_NAMES.get(event, f"Unknown({event})")
                print(f"   event={ename} msg_type={f['msg_type']:#x}")
                if event == 550:
                    text = f["payload"].decode() if f["payload"] else ""
                    print(f"💬 AI 回复: {text}")
                elif event == 559:
                    print("✅ 对话结束")
                    break
                elif event == 350:
                    print("🔊 TTS 开始...")
                elif event == 351:
                    print("✅ TTS 结束")
                    break
                elif f["msg_type"] == MSG_ERROR:
                    err = f["payload"].decode() if f["payload"] else f"code={f['error']}"
                    print(f"❌ 错误: {err}")
                    print(f"   完整 hex: {data.hex()}")
                    break
                elif f["msg_type"] == MSG_AUDIO_SERVER:
                    print(f"   audio: {len(f['payload'])} bytes")


async def test_voice():
    """语音模式测试 - 直接异步循环"""
    print("=" * 50)
    print("🎙️ 语音模式测试")
    print("=" * 50)

    import websockets

    headers = {
        "X-Api-App-ID": CONFIG["app_id"],
        "X-Api-Access-Key": CONFIG["access_key"],
        "X-Api-Resource-Id": CONFIG["resource_id"],
        "X-Api-App-Key": CONFIG["app_key"],
        "X-Api-Connect-Id": str(uuid.uuid4()),
    }
    session_id = str(uuid.uuid4())

    async with websockets.connect(CONFIG["url"], additional_headers=headers, ping_interval=20, ping_timeout=10) as ws:
        # Step 1: StartConnection
        frame = build_start_connection()
        print(f"📤 StartConnection ({len(frame)}B): {frame.hex()}")
        await ws.send(frame)

        async for data in ws:
            f = decode_frame(data)
            if f and f["event"] == 50:
                print("✅ ConnectionStarted")
                break
            elif f and f["event"] == 51:
                print("❌ ConnectionFailed")
                return

        # Step 2: StartSession (audio mode)
        frame = build_start_session(session_id, model="O", input_mode="server_vad")
        print(f"📤 StartSession ({len(frame)}B)")
        await ws.send(frame)

        async for data in ws:
            f = decode_frame(data)
            if f and f["event"] == 150:
                print("✅ SessionStarted")
                if f["payload"]:
                    info = json.loads(f["payload"])
                    print(f"   dialog_id: {info.get('dialog_id')}")
                break
            elif f and f["event"] == 153:
                err = f["payload"].decode() if f["payload"] else "unknown"
                print(f"❌ SessionFailed: {err}")
                return

        # Step 3: 启动麦克风，发送 8 秒音频
        # 自动检测支持 16kHz 单声道的麦克风
        mic_device = _find_mic_device()
        print(f"🎤 使用设备: index={mic_device}")
        mic = MicrophoneCapture(sample_rate=16000, chunk_ms=20, device_index=mic_device)
        loop = asyncio.get_event_loop()
        audio_queue = asyncio.Queue()

        def on_audio(data):
            try:
                loop.call_soon_threadsafe(audio_queue.put_nowait, data)
            except:
                pass

        mic.on_audio = on_audio
        mic.start()
        print("🎤 麦克风已启动，请说话... (8秒后自动停止)")

        # 发送音频 8 秒 (400 帧 @ 50fps)
        count = 0
        max_frames = 400
        while count < max_frames:
            try:
                data = await asyncio.wait_for(audio_queue.get(), timeout=0.5)
                f = build_audio_frame(data, session_id)
                await ws.send(f)
                count += 1
                if count <= 3 or count % 50 == 0:
                    print(f"🎤 音频帧 #{count} ({len(f)}B)")
            except asyncio.TimeoutError:
                continue

        mic.stop()
        print(f"🎤 麦克风已停止，共发送 {count} 帧")

        # Step 3.5: 发送 FinishSession，告诉服务端用户说完话了
        finish_frame = encode_frame(MSG_FULL_CLIENT, FLAG_HAS_EVENT, SERIAL_JSON,
                                    event=EVENT_FINISH_SESSION, session_id=session_id, payload=b"{}")
        print(f"📤 FinishSession ({len(finish_frame)}B)")
        await ws.send(finish_frame)

        # Step 4: 接收响应（最多 30 秒）
        audio_buf = bytearray()
        
        async def recv_with_timeout():
            async for data in ws:
                if isinstance(data, bytes):
                    print(f"📥 raw ({len(data)}B): {data[:40].hex()}...")
                f = decode_frame(data)
                if not f:
                    continue
                event = f["event"]
                ename = EVENT_NAMES.get(event, f"Unknown({event})")
                print(f"   event={ename} msg_type={f['msg_type']:#x}")

                if event == 350:
                    print("🔊 AI 开始说话...")
                    audio_buf.clear()
                elif event == 351:
                    print(f"✅ AI 说完一句 ({len(audio_buf)} bytes)")
                    if audio_buf:
                        player = AudioPlayer(24000)
                        player.feed(bytes(audio_buf))
                        player.flush()
                        audio_buf.clear()
                elif event == 352:
                    print(f"   TTS audio: {len(f['payload'])} bytes")
                elif f["msg_type"] == MSG_AUDIO_SERVER:
                    if f["payload"]:
                        audio_buf.extend(f["payload"])
                elif event == 550:
                    text = f["payload"].decode() if f["payload"] else ""
                    print(f"💬 AI: {text}")
                elif event == 559:
                    print("✅ 对话结束")
                    break
                elif f["msg_type"] == MSG_ERROR:
                    err = f["payload"].decode() if f["payload"] else f"code={f['error']}"
                    print(f"❌ 错误: {err}")
                    print(f"   完整 hex: {data.hex()}")
                    break

        try:
            await asyncio.wait_for(recv_with_timeout(), timeout=30)
        except asyncio.TimeoutError:
            print("⏰ 30秒超时，停止接收")
        finally:
            mic.stop()


if __name__ == "__main__":
    import sys

    mode = sys.argv[1] if len(sys.argv) > 1 else "text"
    if mode == "voice":
        asyncio.run(test_voice())
    else:
        asyncio.run(test_text())