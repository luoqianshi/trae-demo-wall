"""
心镜 MindMirror — FastAPI 后端服务
提供对话接口、会话管理、静态文件服务、离线语音识别
"""

import os
import json
import io
import base64
import asyncio
from pathlib import Path
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from pydub import AudioSegment
from psychology import generate_response, call_ollama_stream, select_cbt_strategy, CBT_STRATEGIES, detect_crisis, CRISIS_RESPONSE, EMOTION_MIRRORS
from session import (
    init_db, start_session, add_message, add_emotion_sample,
    end_session, get_session, list_sessions, get_session_emotion_trajectory
)

# ==================== 初始化 ====================

app = FastAPI(title="心镜 MindMirror", version="1.0.0")

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


class NoCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/static/") or request.url.path.endswith(".html") or request.url.path == "/":
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response


app.add_middleware(NoCacheMiddleware)

sensevoice_model = None
sensevoice_ready = False
deepface_ready = False

# SenseVoice 情感标签 → 系统情绪标签映射
SENSEVOICE_EMOTION_MAP = {
    '<|HAPPY|>': 'happy',
    '<|SAD|>': 'sad',
    '<|ANGRY|>': 'angry',
    '<|NEUTRAL|>': 'neutral',
    '<|FEARFUL|>': 'fearful',
    '<|DISGUSTED|>': 'disgusted',
    '<|SURPRISED|>': 'surprised',
}


@app.on_event("startup")
async def startup():
    global sensevoice_model, sensevoice_ready, deepface_ready
    init_db()

    # 加载 SenseVoice-Small（ASR + 语音情绪识别一体）
    try:
        from funasr import AutoModel
        loop = asyncio.get_event_loop()

        def _load_sensevoice():
            return AutoModel(
                model="iic/SenseVoiceSmall",
                vad_model="fsmn-vad",
                vad_kwargs={"max_single_segment_time": 30000},
                device="cpu",
            )

        sensevoice_model = await loop.run_in_executor(None, _load_sensevoice)
        sensevoice_ready = True
        print("✅ SenseVoice 语音识别+情绪模型已加载")
    except Exception as e:
        print(f"⚠️ SenseVoice 加载失败: {e}，语音识别不可用")

    # 预加载 DeepFace 情绪分析模型（FER2013）
    # 用 opencv 检测器：先检测人脸区域再分析，避免背景干扰导致愤怒误判
    try:
        from deepface import DeepFace
        import numpy as np
        dummy = np.zeros((48, 48, 3), dtype=np.uint8)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: DeepFace.analyze(
            img_path=dummy, actions=['emotion'], enforce_detection=False,
            detector_backend='opencv', silent=True
        ))
        deepface_ready = True
        print("✅ DeepFace 情绪分析模型已加载")
    except Exception as e:
        print(f"⚠️ DeepFace 加载失败: {e}，面部情绪识别不可用")

    print("心镜 MindMirror 服务已启动 → http://localhost:8765")


# ==================== 数据模型 ====================

class ChatRequest(BaseModel):
    text: str
    session_id: str
    face_emotion: str = ""
    voice_emotion: str = ""
    text_emotion: str = ""
    fused_emotion: str = ""
    intensity: float = 0.0
    trend: str = "stable"
    history: list = []


class ChatResponse(BaseModel):
    response: str
    cbt_strategy: str
    cbt_strategy_name: str = ""
    crisis_flag: bool
    emotion_analysis: dict


class SessionStartRequest(BaseModel):
    user_id: str = "default"


class SessionEndRequest(BaseModel):
    session_id: str
    summary: str = ""
    dominant_emotion: str = ""
    emotion_change: str = ""


class EmotionSampleRequest(BaseModel):
    session_id: str
    emotion: str
    intensity: float
    source: str = "fused"


# ==================== API 接口 ====================

@app.get("/")
async def index():
    return FileResponse(str(STATIC_DIR / "index.html"))


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    result = generate_response(
        user_text=req.text,
        emotion_label=req.fused_emotion or req.text_emotion or "neutral",
        intensity=req.intensity,
        trend=req.trend,
        history=req.history,
        face_emotion=req.face_emotion,
        voice_emotion=req.voice_emotion,
        text_emotion=req.text_emotion,
    )

    add_message(
        session_id=req.session_id, role="user", content=req.text,
        face_emotion=req.face_emotion, voice_emotion=req.voice_emotion,
        text_emotion=req.text_emotion, fused_emotion=req.fused_emotion,
        emotion_intensity=req.intensity, emotion_trend=req.trend,
        crisis_flag=result.get("crisis_flag", False),
    )
    add_message(
        session_id=req.session_id, role="assistant", content=result["response"],
        fused_emotion=result["emotion_analysis"]["label"],
        emotion_intensity=result["emotion_analysis"]["intensity"],
        cbt_strategy=result.get("cbt_strategy", ""),
        crisis_flag=result.get("crisis_flag", False),
    )
    return result


@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    """流式聊天接口（SSE）— 先发 metadata，再逐 chunk 发内容，最后发 done
    前端可用 fetch + ReadableStream 逐字显示，降低首字等待感知"""
    import random as _random

    emotion_label = req.fused_emotion or req.text_emotion or "neutral"

    # 危机检测：不走流式，直接返回危机响应
    if detect_crisis(req.text):
        result = {
            "response": CRISIS_RESPONSE,
            "cbt_strategy": "crisis_intervention",
            "cbt_strategy_name": "",
            "crisis_flag": True,
            "emotion_analysis": {
                "label": emotion_label, "intensity": req.intensity,
                "trend": req.trend, "conflict": False,
            }
        }
        add_message(session_id=req.session_id, role="user", content=req.text,
                    face_emotion=req.face_emotion, voice_emotion=req.voice_emotion,
                    text_emotion=req.text_emotion, fused_emotion=req.fused_emotion,
                    emotion_intensity=req.intensity, emotion_trend=req.trend, crisis_flag=True)
        add_message(session_id=req.session_id, role="assistant", content=CRISIS_RESPONSE,
                    fused_emotion=emotion_label, emotion_intensity=req.intensity,
                    cbt_strategy="crisis_intervention", crisis_flag=True)

        async def crisis_gen():
            yield f"data: {json.dumps({'type': 'metadata', 'cbt_strategy': 'crisis_intervention', 'cbt_strategy_name': '', 'emotion_analysis': result['emotion_analysis'], 'crisis_flag': True}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'type': 'chunk', 'content': CRISIS_RESPONSE}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'full_response': CRISIS_RESPONSE}, ensure_ascii=False)}\n\n"
        return StreamingResponse(crisis_gen(), media_type="text/event-stream")

    # 情绪冲突检测
    emotions_set = {e for e in [req.face_emotion, req.voice_emotion, req.text_emotion] if e}
    conflict = False
    if len(emotions_set) >= 2:
        positive = {"happy", "neutral"}
        negative = {"sad", "angry", "fearful", "anxious", "disgusted"}
        if emotions_set & positive and emotions_set & negative:
            conflict = True

    # 选 CBT 策略
    strategy_key = select_cbt_strategy(emotion_label, req.intensity, req.trend, req.text)
    strategy = CBT_STRATEGIES[strategy_key]

    emotion_analysis = {
        "label": emotion_label, "intensity": round(req.intensity, 1),
        "trend": req.trend, "conflict": conflict,
        "face_emotion": req.face_emotion, "voice_emotion": req.voice_emotion,
        "text_emotion": req.text_emotion,
    }

    # 保存用户消息
    add_message(session_id=req.session_id, role="user", content=req.text,
                face_emotion=req.face_emotion, voice_emotion=req.voice_emotion,
                text_emotion=req.text_emotion, fused_emotion=req.fused_emotion,
                emotion_intensity=req.intensity, emotion_trend=req.trend, crisis_flag=False)

    async def stream_gen():
        full_response = ""
        try:
            # 流式生成
            async for chunk in _async_iter(call_ollama_stream(
                req.text, emotion_label, req.intensity, req.face_emotion,
                req.voice_emotion, req.text_emotion, req.trend, req.history
            )):
                if chunk is None:
                    # 流式失败，回退到模板
                    break
                full_response += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk}, ensure_ascii=False)}\n\n"

            # 如果流式没有产出内容，回退到模板
            if not full_response.strip():
                mirror_emotion = emotion_label if emotion_label in EMOTION_MIRRORS else "neutral"
                mirror = _random.choice(EMOTION_MIRRORS[mirror_emotion])
                if conflict:
                    mirror += " 我注意到你嘴上说还好，但你的表情和语气似乎在告诉我一些不同的事情。你愿意让我了解真实的感受吗？"
                cbt_response = _random.choice(strategy["responses"])
                full_response = f"{mirror}\n\n{cbt_response}"
                yield f"data: {json.dumps({'type': 'chunk', 'content': full_response}, ensure_ascii=False)}\n\n"

        except Exception as e:
            print(f"  [stream] 流式生成错误: {e}")
            if not full_response:
                full_response = "抱歉，我遇到了一些问题，请稍后再试。"
                yield f"data: {json.dumps({'type': 'chunk', 'content': full_response}, ensure_ascii=False)}\n\n"

        # 保存 AI 消息
        add_message(session_id=req.session_id, role="assistant", content=full_response,
                    fused_emotion=emotion_label, emotion_intensity=req.intensity,
                    cbt_strategy=strategy_key, crisis_flag=False)

        # 发送结束事件
        yield f"data: {json.dumps({'type': 'done', 'full_response': full_response, 'cbt_strategy': strategy_key, 'cbt_strategy_name': strategy['name'], 'emotion_analysis': emotion_analysis, 'crisis_flag': False}, ensure_ascii=False)}\n\n"

    # 先发 metadata，再启动流式
    async def full_stream():
        yield f"data: {json.dumps({'type': 'metadata', 'cbt_strategy': strategy_key, 'cbt_strategy_name': strategy['name'], 'emotion_analysis': emotion_analysis, 'crisis_flag': False}, ensure_ascii=False)}\n\n"
        async for chunk in stream_gen():
            yield chunk

    return StreamingResponse(full_stream(), media_type="text/event-stream")


_ASYNC_SENTINEL = object()


def _next_or_sentinel(gen):
    """在线程池中调用 next，耗尽时返回哨兵而非抛出 StopIteration
    （StopIteration 通过 run_in_executor 返回时会与 asyncio 冲突）"""
    try:
        return next(gen)
    except StopIteration:
        return _ASYNC_SENTINEL


async def _async_iter(sync_gen):
    """将同步生成器包装为异步生成器（在线程池中运行阻塞迭代）"""
    import asyncio as _asyncio
    loop = _asyncio.get_event_loop()
    while True:
        item = await loop.run_in_executor(None, _next_or_sentinel, sync_gen)
        if item is _ASYNC_SENTINEL:
            break
        yield item


@app.post("/api/session/start")
async def api_start_session(req: SessionStartRequest):
    return {"session_id": start_session(req.user_id)}


@app.post("/api/session/end")
async def api_end_session(req: SessionEndRequest):
    end_session(req.session_id, req.summary, req.dominant_emotion, req.emotion_change)
    return {"status": "ok"}


@app.post("/api/emotion/sample")
async def api_emotion_sample(req: EmotionSampleRequest):
    add_emotion_sample(req.session_id, req.emotion, req.intensity, req.source)
    return {"status": "ok"}


@app.get("/api/sessions")
async def api_list_sessions():
    return {"sessions": list_sessions()}


@app.get("/api/session/{session_id}")
async def api_get_session(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.get("/api/session/{session_id}/trajectory")
async def api_get_trajectory(session_id: str):
    return {"trajectory": get_session_emotion_trajectory(session_id)}


# ==================== 语音识别 WebSocket ====================

import re as _re
import numpy as _np


def extract_emotion_from_sensevoice(raw_text):
    """从 SenseVoice 原始文本提取情感标签，返回 (emotion_label, cleaned_text)
    SenseVoice 输出格式示例: '<|zh|><|NEUTRAL|><|Speech|><|woitn|>你好世界'
    """
    emotion_tags = _re.findall(r'<\|(HAPPY|SAD|ANGRY|NEUTRAL|FEARFUL|DISGUSTED|SURPRISED)\|>', raw_text)

    emotion = 'neutral'
    if emotion_tags:
        emotion = SENSEVOICE_EMOTION_MAP.get(f'<|{emotion_tags[0]}|>', 'neutral')

    # 清理所有 <|xxx|> 标签
    cleaned = _re.sub(r'<\|[^|]+\|>', '', raw_text).strip()
    return emotion, cleaned


@app.websocket("/ws/speech")
async def speech_recognition_ws(websocket: WebSocket):
    """WebSocket — 接收 16kHz 16-bit mono PCM 块（3秒），用 SenseVoice 识别文字+情绪"""
    await websocket.accept()

    if not sensevoice_ready or sensevoice_model is None:
        await websocket.send_json({"type": "error", "message": "语音识别模型未加载"})
        await websocket.close()
        return

    loop = asyncio.get_event_loop()
    msg_count = 0

    try:
        while True:
            try:
                msg = await websocket.receive()
                msg_count += 1

                # 心跳
                if "text" in msg:
                    try:
                        text_msg = json.loads(msg["text"])
                        if text_msg.get("type") == "ping":
                            await websocket.send_json({"type": "pong"})
                    except:
                        pass
                    continue

                if "bytes" not in msg:
                    continue

                pcm_data = msg["bytes"]

                # PCM Int16 bytes → float32 numpy array（16kHz mono）
                audio_array = _np.frombuffer(pcm_data, dtype=_np.int16).astype(_np.float32) / 32768.0

                # 跳过静音块（能量太低时不调用模型，节省 CPU）
                energy = _np.sqrt(_np.mean(audio_array ** 2))
                if energy < 0.01:
                    continue

                # SenseVoice 推理（线程池中运行，避免阻塞事件循环）
                def _recognize():
                    return sensevoice_model.generate(
                        input=audio_array,
                        language="zh",
                        use_itn=True,
                        batch_size_s=60,
                    )

                try:
                    result = await loop.run_in_executor(None, _recognize)
                    raw_text = result[0].get("text", "") if result else ""

                    if raw_text:
                        emotion, cleaned_text = extract_emotion_from_sensevoice(raw_text)
                        if cleaned_text:
                            await websocket.send_json({
                                "type": "final",
                                "text": cleaned_text,
                                "emotion": emotion,
                            })
                except Exception as recog_err:
                    print(f"  [WS] SenseVoice 识别错误: {recog_err}")
                    continue

            except WebSocketDisconnect:
                print("客户端断开语音识别连接")
                break
            except RuntimeError as e:
                if "disconnect" in str(e).lower() or "receive" in str(e).lower():
                    break
                continue
            except Exception as e:
                print(f"语音识别错误: {e}")
                break

    except WebSocketDisconnect:
        print("客户端断开语音识别连接")
    except Exception as e:
        print(f"语音识别错误: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass


# ==================== 面部情绪识别 WebSocket (DeepFace) ====================

# DeepFace 情绪标签 → 系统标签映射
DEEPFACE_EMOTION_MAP = {
    'angry': 'angry',
    'disgust': 'disgusted',
    'fear': 'fearful',
    'happy': 'happy',
    'sad': 'sad',
    'surprise': 'surprised',
    'neutral': 'neutral',
}


@app.websocket("/ws/face")
async def face_emotion_ws(websocket: WebSocket):
    """WebSocket — 接收前端视频帧（base64 JPEG），用 DeepFace 分析面部情绪"""
    await websocket.accept()

    if not deepface_ready:
        await websocket.send_json({"type": "error", "message": "DeepFace 模型未加载"})
        await websocket.close()
        return

    from deepface import DeepFace
    import numpy as np
    import cv2

    loop = asyncio.get_event_loop()

    try:
        while True:
            try:
                msg = await websocket.receive()

                if "text" in msg:
                    try:
                        text_msg = json.loads(msg["text"])
                        if text_msg.get("type") == "ping":
                            await websocket.send_json({"type": "pong"})
                    except:
                        pass
                    continue

                if "bytes" not in msg:
                    continue

                # 解码 base64 JPEG → numpy 数组
                img_bytes = msg["bytes"]
                if len(img_bytes) == 0:
                    continue

                # 尝试直接解码二进制 JPEG
                img_array = np.frombuffer(img_bytes, dtype=np.uint8)
                frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

                if frame is None:
                    continue

                # 在线程池中运行 DeepFace 分析（避免阻塞事件循环）
                # opencv 检测器：先检测人脸区域再分析，避免背景干扰
                def analyze():
                    return DeepFace.analyze(
                        img_path=frame, actions=['emotion'],
                        enforce_detection=False,
                        detector_backend='opencv',
                        silent=True
                    )

                result = await loop.run_in_executor(None, analyze)

                if result and len(result) > 0:
                    dominant = result[0].get('dominant_emotion', 'neutral')
                    emotions = result[0].get('emotion', {})
                    # 映射到系统标签
                    mapped = DEEPFACE_EMOTION_MAP.get(dominant, 'neutral')
                    # 计算置信度（主导情绪的概率）—— float32 转 float 避免 JSON 序列化失败
                    confidence = float(emotions.get(dominant, 0))
                    # 归一化情绪分数到 0-1
                    normalized = {}
                    for k, v in emotions.items():
                        sys_key = DEEPFACE_EMOTION_MAP.get(k, k)
                        normalized[sys_key] = round(float(v) / 100.0, 4)

                    await websocket.send_json({
                        "type": "emotion",
                        "label": mapped,
                        "confidence": round(confidence / 100.0, 4),
                        "scores": normalized
                    })
                else:
                    await websocket.send_json({
                        "type": "emotion",
                        "label": "neutral",
                        "confidence": 0,
                        "scores": {}
                    })

            except WebSocketDisconnect:
                print("客户端断开面部识别连接")
                break
            except Exception as e:
                # 分析失败不关闭连接，发 neutral 兜底
                try:
                    await websocket.send_json({
                        "type": "emotion",
                        "label": "neutral",
                        "confidence": 0,
                        "scores": {},
                        "error": str(e)[:200]
                    })
                except:
                    break
                continue

    except WebSocketDisconnect:
        print("客户端断开面部识别连接")
    except Exception as e:
        print(f"面部识别错误: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass


if __name__ == "__main__":
    uvicorn.run("app:app", host="::", port=8765, reload=False)
