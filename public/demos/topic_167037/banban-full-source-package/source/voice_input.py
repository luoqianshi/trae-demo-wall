"""
伴伴 - 语音输入模块（双引擎：火山引擎优先 + sherpa-onnx fallback）
引擎1: 火山引擎 Doubao 流式 ASR（高质量，边说边出字）
引擎2: sherpa-onnx + Zipformer2 CTC（离线 fallback）
"""
import os
import threading
from typing import Optional

MODEL_DIR = os.path.join(
    os.path.expanduser("~"), ".banban", "sherpa_model",
    "sherpa-onnx-streaming-zipformer-small-ctc-zh-int8-2025-04-01"
)


class VoiceInput:
    def __init__(self):
        self.is_recording = False
        self._stream_text = ""
        self._partial_text = ""
        self._stream_engine = "doubao"  # 默认优先用火山引擎
        self._rec_thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        self._recognizer = None
        self._online_stream = None
        self._ready = False
        self._error: Optional[str] = None

        # 火山引擎 ASR 实例
        self._doubao = None
        self._doubao_checked = False

    def _get_doubao(self):
        """懒加载火山引擎 ASR 实例"""
        if self._doubao_checked:
            return self._doubao
        self._doubao_checked = True
        try:
            from doubao_asr import doubao_asr
            if doubao_asr.is_configured:
                self._doubao = doubao_asr
                print("[语音] 火山引擎 Doubao ASR 已就绪")
            else:
                print("[语音] 火山引擎未配置，将使用 sherpa-onnx")
        except Exception as e:
            print(f"[语音] 加载火山引擎失败: {e}")
        return self._doubao

    def _init_recognizer(self):
        """初始化 sherpa-onnx（仅作为 fallback）"""
        if self._recognizer is not None:
            return self._recognizer
        if self._error:
            return None
        try:
            import sherpa_onnx
            if not os.path.exists(os.path.join(MODEL_DIR, "model.int8.onnx")):
                self._error = "模型未下载"
                return None
            self._recognizer = sherpa_onnx.OnlineRecognizer.from_zipformer2_ctc(
                model=os.path.join(MODEL_DIR, "model.int8.onnx"),
                tokens=os.path.join(MODEL_DIR, "tokens.txt"),
                num_threads=2, sample_rate=16000, feature_dim=80,
                enable_endpoint_detection=True,
                rule1_min_trailing_silence=2.4,
                rule2_min_trailing_silence=0.8,
                rule3_min_utterance_length=20.0,
                decoding_method="greedy_search",
            )
            self._ready = True
            print("[语音] sherpa-onnx 流式识别器就绪（fallback）")
            return self._recognizer
        except Exception as e:
            self._error = str(e)
            print(f"[语音] sherpa-onnx 初始化失败: {e}")
            return None

    # ============================================================
    # 流式识别：start → status(轮询) → stop
    # ============================================================

    def stream_start(self) -> bool:
        """开始流式录音+识别"""
        with self._lock:
            if self.is_recording:
                return False
            self._stream_text = ""
            self._partial_text = ""
            self._error = None
            self.is_recording = True

        # 优先尝试火山引擎
        doubao = self._get_doubao()
        if doubao and doubao.is_configured:
            ok = doubao.start()
            if ok:
                # 等 1 秒检查是否有 403 错误
                import time as _t
                _t.sleep(1)
                s = doubao.status()
                if s.get("error"):
                    # 火山引擎启动后立即报错（通常是 403 Token 过期），回退
                    err = s["error"]
                    print(f"[语音] 火山引擎报错: {err}，回退到 sherpa-onnx")
                    doubao.stop()
                    self.is_recording = False
                    self._doubao_failed = True
                    # 继续走 sherpa-onnx 路径
                else:
                    self._stream_engine = "doubao"
                    print("[语音] 火山引擎流式识别已启动")
                    return True
            else:
                err = doubao._error or "未知错误"
                print(f"[语音] 火山引擎启动失败: {err}，回退到 sherpa-onnx")
                self._doubao_failed = True
                self.is_recording = False
                self._error = f"火山引擎: {err}"
                # 继续尝试 sherpa-onnx

        # Fallback: sherpa-onnx
        self._stream_engine = "sherpa-onnx"
        self.is_recording = True
        self._rec_thread = threading.Thread(target=self._record_and_recognize_sherpa, daemon=True)
        self._rec_thread.start()
        return True

    def stream_stop(self) -> dict:
        """停止流式录音，等待最终结果"""
        with self._lock:
            if not self.is_recording:
                return {"ok": False, "error": "没有在录音"}
            self.is_recording = False

        if self._stream_engine == "doubao" and self._doubao:
            result = self._doubao.stop()
            if result.get("ok"):
                self._stream_text = result["text"]
            return result

        # sherpa-onnx
        if self._rec_thread:
            self._rec_thread.join(timeout=5)
        t = self._stream_text.strip()
        return {"ok": True, "text": t, "engine": "sherpa-onnx"} if t else {"ok": False, "error": "未识别到语音"}

    # ============================================================
    # 前端录音模式：浏览器采集音频 → HTTP 转发 → 豆包2.0
    # ============================================================
    def stream_start_frontend(self) -> bool:
        """前端录音模式：只连接 WebSocket，不启动录音线程"""
        with self._lock:
            if self.is_recording:
                return False
            self._stream_text = ""
            self._partial_text = ""
            self._error = None
            self.is_recording = True

        doubao = self._get_doubao()
        if doubao and doubao.is_configured:
            ok = doubao.start_connection()
            if ok:
                import time as _t
                _t.sleep(0.5)
                s = doubao.status()
                if s.get("error"):
                    doubao.stop_connection()
                    self.is_recording = False
                    self._error = s["error"]
                    return False
                self._stream_engine = "doubao"
                print("[语音] 前端录音模式已启动")
                return True
            else:
                self.is_recording = False
                self._error = doubao._error or "连接失败"
                return False
        self.is_recording = False
        self._error = "豆包未配置"
        return False

    def stream_feed_audio(self, pcm_bytes: bytes) -> bool:
        """转发前端音频到豆包"""
        if self._stream_engine == "doubao" and self._doubao:
            return self._doubao.feed_audio(pcm_bytes)
        return False

    def stream_stop_frontend(self) -> dict:
        """停止前端录音模式"""
        with self._lock:
            if not self.is_recording:
                return {"ok": False, "error": "没有在录音"}
            self.is_recording = False

        if self._stream_engine == "doubao" and self._doubao:
            result = self._doubao.stop_connection()
            if result.get("ok"):
                self._stream_text = result["text"]
            return result
        return {"ok": False, "error": "引擎未启动"}

    def stream_status(self) -> dict:
        """轮询当前流式识别结果"""
        if self._stream_engine == "doubao" and self._doubao:
            s = self._doubao.status()
            return {
                "recording": s.get("recording", False),
                "text": s.get("text", ""),
                "partial": s.get("text", ""),  # 火山引擎实时返回的就是当前结果
                "engine": "doubao",
                "error": s.get("error"),
            }

        return {
            "recording": self.is_recording,
            "text": self._stream_text,
            "partial": self._partial_text,
            "engine": self._stream_engine,
        }

    def _record_and_recognize_sherpa(self):
        """sherpa-onnx 录音+识别（fallback）- 自动选择麦克风"""
        try:
            rec = self._init_recognizer()
            if rec is None:
                return
            import sounddevice as sd
            import numpy as np
            import queue as _q
            
            audio_q = _q.Queue()
            def cb(indata, frames, time_info, status):
                audio_q.put(indata.copy())
            
            # 自动查找可用设备：优先真实麦克风，跳过虚拟设备
            VIRTUAL_KEYWORDS = ['智音', 'Loopback', '虚拟', 'Virtual', 'YY AI', '网易', 'NetEase', '立体声混音', 'Stereo']
            candidates = []
            for api in sd.query_hostapis():
                if 'wasapi' in api['name'].lower():
                    for dev_idx in api['devices']:
                        try:
                            dev = sd.query_devices(dev_idx)
                            if dev['max_input_channels'] > 0:
                                name = dev.get('name', '')
                                if not any(k in name for k in VIRTUAL_KEYWORDS):
                                    candidates.append(dev_idx)
                        except:
                            pass
                    break
            if not candidates:
                for api in sd.query_hostapis():
                    if api['default_input_device'] is not None:
                        candidates.append(api['default_input_device'])
            for api in sd.query_hostapis():
                if 'wasapi' in api['name'].lower():
                    for dev_idx in api['devices']:
                        if dev_idx not in candidates:
                            try:
                                dev = sd.query_devices(dev_idx)
                                if dev['max_input_channels'] > 0:
                                    candidates.append(dev_idx)
                            except:
                                pass
                    break
            
            for dev_idx in candidates:
                for try_rate in [48000, 44100, 16000]:
                    try:
                        block = int(0.02 * try_rate)
                        test_stream = sd.InputStream(
                            samplerate=try_rate, channels=1, dtype='int16',
                            blocksize=block, device=dev_idx, callback=cb,
                        )
                        test_stream.start()
                        stream = test_stream
                        native_rate = try_rate
                        downsample = native_rate // 16000 if native_rate > 16000 else 1
                        print(f"[语音] sherpa 设备[{dev_idx}] @{try_rate}Hz downsample={downsample}")
                        break
                    except:
                        continue
                if stream is not None:
                    break
            
            if stream is None:
                print("[语音] sherpa 无可用麦克风")
                return
            
            s = rec.create_stream()
            self._stream_text = ""
            self._partial_text = ""

            while self.is_recording:
                try:
                    chunk = audio_q.get(timeout=1.0)
                    if downsample > 1:
                        chunk = chunk[::downsample]
                    samples = [int(x) for x in chunk.flatten()]
                    s.accept_waveform(16000, samples)
                    while rec.is_ready(s):
                        rec.decode_stream(s)

                    text = rec.get_result(s)
                    if text:
                        if rec.is_endpoint(s):
                            self._stream_text = (self._stream_text + " " + text).strip()
                            self._partial_text = ""
                            rec.reset(s)
                        else:
                            self._partial_text = text
                except _q.Empty:
                    continue
                except Exception as e:
                    print(f"[语音] sherpa err: {e}")
                    break

            stream.stop(); stream.close()

            final = rec.get_result(s)
            if final and isinstance(final, str):
                self._stream_text = (self._stream_text + " " + final).strip()
            print(f"[语音] sherpa 完成: {self._stream_text[:80]}")
        except Exception as e:
            print(f"[语音] sherpa 异常: {e}")
            import traceback; traceback.print_exc()

    # ============================================================
    # 文件识别
    # ============================================================

    def transcribe_file(self, path: str) -> dict:
        """识别音频文件（使用 sherpa-onnx）"""
        import os as _os
        if not _os.path.exists(path):
            return {"ok": False, "error": "文件不存在"}
        rec = self._init_recognizer()
        if rec is None:
            return {"ok": False, "error": self._error or "不可用"}
        try:
            import wave
            wf = wave.open(path, 'rb')
            data = wf.readframes(wf.getnframes()); wf.close()
            s = rec.create_stream()
            total = len(data) // 2
            for i in range(0, total, 320):
                end = min(i + 320, total)
                smp = [int.from_bytes(data[j*2:(j+1)*2], 'little', signed=True) for j in range(i, end)]
                s.accept_waveform(16000, smp)
                while rec.is_ready(s):
                    rec.decode_stream(s)
            text = rec.get_result(s)
            return {"ok": True, "text": (text or "").strip(), "engine": "sherpa-onnx"} if text else {"ok": False, "error": "无内容"}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    # ============================================================
    # 状态查询
    # ============================================================

    def model_status(self) -> dict:
        # 先检查火山引擎
        doubao = self._get_doubao()
        if doubao and doubao.is_configured:
            return {
                "ready": True,
                "engine": "doubao",
                "model": "火山引擎流式ASR",
                "mode": "realtime",
                "fallback": "sherpa-onnx" if self._ready else None,
            }

        # sherpa-onnx 状态
        if self._ready:
            return {"ready": True, "model": "zipformer-ctc-zh", "engine": "sherpa-onnx", "mode": "realtime"}
        if self._error:
            return {"ready": False, "error": self._error}
        if not os.path.exists(os.path.join(MODEL_DIR, "model.int8.onnx")):
            return {"ready": False, "status": "needs download"}
        return {"ready": False, "status": "loading"}


voice_input = VoiceInput()
