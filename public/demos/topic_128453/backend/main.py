# -*- coding: utf-8 -*-
"""
文件：main.py
说明：墨问 · 古籍智慧对话引擎 v2.0 —— 全面升级版
      支持大语言模型开放域问答、20+诸子百家角色、多轮对话、用户账号、社区共问共答

      API 端点：
        - GET  /                    首页
        - GET  /api/health          健康检查
        - GET  /api/roles           获取20+角色列表
        - GET  /api/scenes          获取场景库
        - GET  /api/corpus/count    语料库统计
        - GET  /api/llm/status      LLM服务状态
        - POST /api/recommend       智能推荐角色
        - POST /api/chat            对话接口（支持auto/多轮上下文）
        - POST /api/role/switch     角色切换
        - POST /api/tts             语音合成
        - POST /api/search          古籍全文检索
        - POST /api/auth/register   用户注册
        - POST /api/auth/login      用户登录
        - GET  /api/favorites       获取收藏列表
        - POST /api/favorites/add   添加收藏
        - DELETE /api/favorites     删除收藏
        - POST /api/conversation/save  保存对话历史
        - GET  /api/conversation/history 获取对话历史
        - GET  /api/community       获取社区问答
        - POST /api/community/save  保存社区问答
        - POST /api/community/like  点赞社区问答
        - GET  /api/community/search 搜索社区问答

      运行方式：
        python -m uvicorn main:app --reload --port 8000
"""

import random
import io
import asyncio
import uuid
import os
from pathlib import Path
from fastapi import FastAPI, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional

from engine import roles, scenes, corpus
from engine import roles_extended
from engine import database as db
from engine.llm_service import llm_service

import edge_tts

# ============================================================
# FastAPI 应用初始化
# ============================================================
app = FastAPI(
    title="墨问 · 古籍智慧对话引擎 v2.0",
    description="用白话提问，以诸子百家视角回答。支持大语言模型开放域问答、多轮对话、社区共问共答。",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 请求/响应模型
# ============================================================

class ChatRequest(BaseModel):
    question: str
    role: str = "auto"
    session_id: Optional[str] = None  # 多轮对话会话ID
    user_id: Optional[int] = None     # 用户ID（可选）

class ChatResponse(BaseModel):
    role: str
    avatar: str
    style: str
    quote: str
    source: str
    plain: str
    interpretation: str
    suggestions: List[str]
    rate: float
    pitch: float

class TTSRequest(BaseModel):
    text: str
    role: str = "zhuangzi"

class RecommendRequest(BaseModel):
    question: str

class SearchRequest(BaseModel):
    keyword: str
    role_key: Optional[str] = None

class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: Optional[str] = ""

class LoginRequest(BaseModel):
    username: str
    password: str

class FavoriteRequest(BaseModel):
    user_id: int
    question: str
    role_key: str
    role_name: str
    quote: str
    source: str
    plain: Optional[str] = ""
    interpretation: Optional[str] = ""

class DeleteFavoriteRequest(BaseModel):
    user_id: int
    fav_id: int

class ConversationSaveRequest(BaseModel):
    session_id: str
    role_key: str
    question: str
    answer: dict
    user_id: Optional[int] = None

class CommunitySaveRequest(BaseModel):
    user_id: Optional[int] = None
    user_nickname: Optional[str] = "匿名墨友"
    question: str
    role_key: str
    answer: dict

class CommunityLikeRequest(BaseModel):
    qa_id: int


# ============================================================
# Edge TTS 神经语音配置 —— 20+角色专属声音
# ============================================================
VOICE_CONFIG = {
    # 原有5位
    "zhuangzi": {"voice": "zh-CN-YunxiNeural", "rate": "-15%", "pitch": "-2Hz", "volume": "+0%"},
    "kongzi": {"voice": "zh-CN-YunyangNeural", "rate": "-10%", "pitch": "-5Hz", "volume": "+0%"},
    "laozi": {"voice": "zh-CN-YunyangNeural", "rate": "-40%", "pitch": "-15Hz", "volume": "-10%"},
    "sunzi": {"voice": "zh-CN-YunjianNeural", "rate": "-5%", "pitch": "-3Hz", "volume": "+0%"},
    "wangyangming": {"voice": "zh-CN-YunxiNeural", "rate": "-15%", "pitch": "-8Hz", "volume": "-5%"},
    # 新增16位
    "mozi": {"voice": "zh-CN-YunjianNeural", "rate": "-8%", "pitch": "-5Hz", "volume": "+0%"},
    "mengzi": {"voice": "zh-CN-YunyangNeural", "rate": "-5%", "pitch": "-3Hz", "volume": "+0%"},
    "hanfeizi": {"voice": "zh-CN-YunxiNeural", "rate": "+0%", "pitch": "+2Hz", "volume": "+0%"},
    "guiguzi": {"voice": "zh-CN-YunyangNeural", "rate": "-25%", "pitch": "-12Hz", "volume": "-8%"},
    "xunzi": {"voice": "zh-CN-YunyangNeural", "rate": "-12%", "pitch": "-6Hz", "volume": "+0%"},
    "guanzi": {"voice": "zh-CN-YunyangNeural", "rate": "-30%", "pitch": "-14Hz", "volume": "-8%"},
    "liezi": {"voice": "zh-CN-YunxiNeural", "rate": "-18%", "pitch": "-4Hz", "volume": "-3%"},
    "huainanzi": {"voice": "zh-CN-YunyangNeural", "rate": "-22%", "pitch": "-10Hz", "volume": "-5%"},
    "dongzhongshu": {"voice": "zh-CN-YunyangNeural", "rate": "-8%", "pitch": "-4Hz", "volume": "+0%"},
    "zhouyi": {"voice": "zh-CN-YunyangNeural", "rate": "-30%", "pitch": "-15Hz", "volume": "-10%"},
    "zhugeliang": {"voice": "zh-CN-YunjianNeural", "rate": "-10%", "pitch": "-6Hz", "volume": "+0%"},
    "sushi": {"voice": "zh-CN-YunxiNeural", "rate": "-12%", "pitch": "-2Hz", "volume": "+0%"},
    "taoyuanming": {"voice": "zh-CN-YunxiNeural", "rate": "-15%", "pitch": "-3Hz", "volume": "-3%"},
    "fanli": {"voice": "zh-CN-YunjianNeural", "rate": "-8%", "pitch": "-4Hz", "volume": "+0%"},
    "liubowen": {"voice": "zh-CN-YunyangNeural", "rate": "-10%", "pitch": "-5Hz", "volume": "+0%"},
    "zhengguofan": {"voice": "zh-CN-YunyangNeural", "rate": "-12%", "pitch": "-6Hz", "volume": "-3%"},
}


# ============================================================
# 场景匹配引擎（保留原有逻辑）
# ============================================================

def match_scene(question: str) -> Optional[dict]:
    if not question:
        return None
    question_lower = question.strip()
    for scene in scenes.SCENES:
        if scene["question"] == question_lower:
            return scene
    best_scene = None
    best_score = 0
    for scene in scenes.SCENES:
        score = 0
        label = scene["label"]
        if label in question_lower:
            score += 3
        scene_keywords = _extract_keywords(scene["question"])
        question_keywords = _extract_keywords(question_lower)
        overlap = len(scene_keywords & question_keywords)
        score += overlap * 2
        for quote_item in scene.get("related_quotes", []):
            quote_text = quote_item.get("text", "")
            quote_keywords = _extract_keywords(quote_text)
            quote_overlap = len(quote_keywords & question_keywords)
            score += quote_overlap
        if score > best_score:
            best_score = score
            best_scene = scene
    if best_score >= 2:
        return best_scene
    return None


def _extract_keywords(text: str) -> set:
    keywords = set()
    text = text.replace("？", "").replace("，", "").replace("。", "")
    text = text.replace("了", "").replace("的", "").replace("我", "").replace("是", "")
    text = text.replace("不", "").replace("怎么", "").replace("什么", "")
    text = text.replace("可以", "").replace("应该", "").replace("还是", "")
    for i in range(len(text) - 1):
        word = text[i:i + 2]
        if len(word.strip()) == 2:
            keywords.add(word)
    return keywords


# ============================================================
# 核心回答生成逻辑 v2.0 —— LLM优先 + 语料库回退
# ============================================================

async def generate_answer(question: str, role_key: str,
                          session_id: str = None, user_id: int = None) -> dict:
    """
    生成三层回答。优先级：
      1. LLM 大语言模型（如果可用）—— 开放域古籍问答
      2. 场景定制化回答（scene_overrides）
      3. 古籍语料库语义匹配（corpus.match_corpus）
      4. 角色默认回答（default_answer）
    """
    # 获取角色数据（优先从扩展角色库获取）
    role = roles_extended.ROLES.get(role_key)
    if not role:
        role = roles.ROLES.get(role_key)
    if not role:
        role = roles.ROLES["zhuangzi"]
        role_key = "zhuangzi"

    # === 第一优先级：LLM 大语言模型 ===
    if llm_service.is_available():
        # 获取对话上下文
        context = []
        if session_id:
            history = db.get_conversation_history(session_id, limit=6)
            for h in history:
                context.append({"role": "user", "content": h.get("question", "")})
                context.append({"role": "assistant", "content": h.get("interpretation", "")})

        try:
            llm_answer = await llm_service.generate_answer(
                question=question,
                role_key=role_key,
                system_prompt=role.get("system_prompt", ""),
                context=context if context else None,
            )
            if llm_answer:
                return {
                    "role": role["name"],
                    "avatar": role["avatar"],
                    "style": role.get("style", ""),
                    "school": role.get("school", ""),
                    "era": role.get("era", ""),
                    "quote": llm_answer.get("quote", ""),
                    "source": llm_answer.get("source", ""),
                    "plain": llm_answer.get("plain", ""),
                    "interpretation": llm_answer.get("interpretation", ""),
                    "suggestions": llm_answer.get("suggestions", []),
                    "rate": role.get("rate", 0.9),
                    "pitch": role.get("pitch", 0.9),
                    "source_engine": "llm",
                    "llm_provider": llm_service.get_provider_name(),
                }
        except Exception as e:
            print(f"[墨问] LLM调用失败，回退到语料库: {e}")

    # === 第二优先级：场景定制化回答 ===
    matched_scene = match_scene(question)
    if matched_scene:
        override_answer = scenes.get_scene_override(matched_scene["id"], role_key)
        if override_answer:
            answer_data = override_answer
            return _build_answer_response(role, answer_data, "scene_override")

    # === 第三优先级：古籍语料库语义匹配 ===
    corpus_match = corpus.match_corpus(question, role_key)
    if corpus_match:
        return _build_answer_response(role, corpus_match, "corpus")

    # === 第四优先级：角色默认回答 ===
    answer_data = role.get("default_answer", {})
    return _build_answer_response(role, answer_data, "default")


def _build_answer_response(role: dict, answer_data: dict, engine: str) -> dict:
    """构建标准回答响应"""
    return {
        "role": role["name"],
        "avatar": role["avatar"],
        "style": role.get("style", ""),
        "school": role.get("school", ""),
        "era": role.get("era", ""),
        "quote": answer_data.get("quote", ""),
        "source": answer_data.get("source", ""),
        "plain": answer_data.get("plain", ""),
        "interpretation": answer_data.get("interpretation", ""),
        "suggestions": answer_data.get("suggestions", []),
        "rate": role.get("rate", 0.9),
        "pitch": role.get("pitch", 0.9),
        "source_engine": engine,
    }


# ============================================================
# API 路由
# ============================================================

@app.get("/")
async def index():
    # 如果前端已构建，返回 SPA 页面
    _fe = Path(__file__).resolve().parent.parent / "frontend" / "dist"
    if _fe.exists():
        return FileResponse(str(_fe / "index.html"))
    return {
        "name": "墨问 · 古籍智慧对话引擎 v2.0",
        "version": "2.0.0",
        "description": "诸子百家智慧，为你解答当下困惑。支持LLM开放域问答、多轮对话、社区共问共答。",
        "roles_count": len(roles_extended.ROLES),
        "llm_available": llm_service.is_available(),
        "llm_provider": llm_service.get_provider_name() if llm_service.is_available() else None,
        "endpoints": {
            "health": "GET /api/health",
            "roles": "GET /api/roles",
            "scenes": "GET /api/scenes",
            "chat": "POST /api/chat",
            "recommend": "POST /api/recommend",
            "search": "POST /api/search",
            "tts": "POST /api/tts",
            "auth_register": "POST /api/auth/register",
            "auth_login": "POST /api/auth/login",
            "favorites": "GET /api/favorites",
            "community": "GET /api/community",
        },
        "docs": "/docs",
    }


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "llm_available": llm_service.is_available(),
        "llm_provider": llm_service.get_provider_name() if llm_service.is_available() else "未配置",
        "roles_count": len(roles_extended.ROLES),
        "corpus_count": sum(corpus.get_corpus_count().values()),
    }


@app.get("/api/llm/status")
async def llm_status():
    """获取LLM服务状态"""
    return {
        "available": llm_service.is_available(),
        "provider": llm_service.get_provider_name() if llm_service.is_available() else None,
        "message": "LLM服务可用，支持开放域古籍问答" if llm_service.is_available()
                   else "未配置LLM API Key，使用语料库匹配模式。配置方法：设置环境变量 DEEPSEEK_API_KEY / QWEN_API_KEY / ZHIPU_API_KEY / OPENAI_API_KEY",
    }


@app.get("/api/roles")
async def get_roles():
    """获取20+角色列表（含学派、朝代信息）"""
    return {"roles": roles_extended.get_role_list_extended()}


@app.get("/api/scenes")
async def get_scenes():
    """获取场景库"""
    today = scenes.get_today_scene()
    categories = scenes.get_scenes_by_category()
    return {"today": today, "categories": categories}


@app.get("/api/corpus/count")
async def get_corpus_info():
    counts = corpus.get_corpus_count()
    return {"total": sum(counts.values()), "by_role": counts}


@app.post("/api/recommend")
async def recommend_role(request: RecommendRequest):
    """智能推荐角色"""
    role_key = corpus.recommend_role(request.question)
    role = roles_extended.ROLES.get(role_key, roles.ROLES.get(role_key, roles.ROLES["zhuangzi"]))
    return {"role_key": role_key, "role_name": role["name"], "avatar": role["avatar"]}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    对话接口 v2.0
    - 支持 auto 自动推荐角色
    - 支持多轮上下文（session_id）
    - LLM优先，语料库回退
    - 自动保存对话历史
    """
    role_key = request.role
    if not role_key or role_key == "auto":
        role_key = corpus.recommend_role(request.question)

    session_id = request.session_id or str(uuid.uuid4())[:8]

    answer = await generate_answer(request.question, role_key, session_id, request.user_id)

    # 保存对话历史
    try:
        db.save_conversation(session_id, role_key, request.question, answer, request.user_id)
    except Exception as e:
        print(f"[墨问] 保存对话历史失败: {e}")

    answer["session_id"] = session_id
    return answer


@app.post("/api/role/switch")
async def role_switch(request: ChatRequest):
    """角色切换接口"""
    return await generate_answer(request.question, request.role, request.session_id)


@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """语音合成接口 —— 20+角色专属神经语音"""
    config = VOICE_CONFIG.get(request.role, VOICE_CONFIG["zhuangzi"])
    try:
        communicate = edge_tts.Communicate(
            request.text,
            voice=config["voice"],
            rate=config["rate"],
            pitch=config["pitch"],
            volume=config["volume"],
        )
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])
        audio_buffer.seek(0)
        audio_data = audio_buffer.getvalue()
        if len(audio_data) == 0:
            return {"error": "音频生成失败"}, 500
        return Response(content=audio_data, media_type="audio/mp3")
    except Exception as e:
        return {"error": f"语音合成失败: {str(e)}"}, 500


# ============================================================
# 古籍全文检索 API
# ============================================================

@app.post("/api/search")
async def search_corpus(request: SearchRequest):
    """古籍全文检索 —— 在语料库中搜索关键词"""
    results = []
    for item in corpus.CORPUS:
        if request.role_key and item.get("role") != request.role_key:
            continue
        score = 0
        keyword = request.keyword
        if keyword in item.get("quote", ""):
            score += 5
        if keyword in item.get("plain", ""):
            score += 3
        if keyword in item.get("interpretation", ""):
            score += 2
        for theme in item.get("themes", []):
            if keyword in theme:
                score += 4
        if score > 0:
            results.append({**item, "score": score})
    results.sort(key=lambda x: x["score"], reverse=True)
    return {"results": results[:20], "total": len(results)}


# ============================================================
# 用户认证 API
# ============================================================

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    """用户注册"""
    result = db.create_user(request.username, request.password, request.nickname)
    return result


@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """用户登录"""
    result = db.authenticate_user(request.username, request.password)
    return result


# ============================================================
# 收藏云同步 API
# ============================================================

@app.get("/api/favorites")
async def get_favorites(user_id: int = Query(...)):
    """获取用户收藏列表"""
    return {"favorites": db.get_favorites(user_id)}


@app.post("/api/favorites/add")
async def add_favorite(request: FavoriteRequest):
    """添加收藏"""
    return db.add_favorite(request.user_id, {
        "question": request.question,
        "role_key": request.role_key,
        "role_name": request.role_name,
        "quote": request.quote,
        "source": request.source,
        "plain": request.plain,
        "interpretation": request.interpretation,
    })


@app.delete("/api/favorites")
async def delete_favorite(request: DeleteFavoriteRequest):
    """删除收藏"""
    return db.remove_favorite(request.user_id, request.fav_id)


# ============================================================
# 对话历史 API
# ============================================================

@app.post("/api/conversation/save")
async def save_conversation(request: ConversationSaveRequest):
    """保存对话历史"""
    return db.save_conversation(request.session_id, request.role_key,
                                request.question, request.answer, request.user_id)


@app.get("/api/conversation/history")
async def get_conversation_history(session_id: str = Query(...), limit: int = Query(20)):
    """获取对话历史"""
    return {"history": db.get_conversation_history(session_id, limit)}


# ============================================================
# 社区共问共答 API
# ============================================================

@app.get("/api/community")
async def get_community(limit: int = Query(20), offset: int = Query(0)):
    """获取社区问答列表"""
    return {"items": db.get_community_qa(limit, offset)}


@app.post("/api/community/save")
async def save_community_qa(request: CommunitySaveRequest):
    """保存问答到社区"""
    return db.save_community_qa(request.user_id, request.user_nickname,
                                request.question, request.role_key, request.answer)


@app.post("/api/community/like")
async def like_community_qa(request: CommunityLikeRequest):
    """点赞社区问答"""
    return db.like_community_qa(request.qa_id)


@app.get("/api/community/search")
async def search_community(keyword: str = Query(...), limit: int = Query(20)):
    """搜索社区问答"""
    return {"items": db.search_community_qa(keyword, limit)}


# ============================================================
# 静态文件托管 —— 前端 dist/ 由后端统一托管
# ============================================================
_FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(_FRONTEND_DIST / "assets")), name="assets")

    @app.exception_handler(404)
    async def _spa_fallback(request, exc):
        if not request.url.path.startswith("/api"):
            return FileResponse(str(_FRONTEND_DIST / "index.html"))
        raise exc


# ============================================================
# 应用入口
# ============================================================
if __name__ == "__main__":
    import uvicorn
    _port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=_port, reload=True)
