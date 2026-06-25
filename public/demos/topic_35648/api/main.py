"""
心语镜像 - 后端 API 服务
基于 FastAPI + DeepSeek API 的心理陪伴系统后端
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, AsyncGenerator
import json
import os
import time
import random
import asyncio
from datetime import datetime, timedelta

# DeepSeek API 配置
from openai import AsyncOpenAI

# DeepSeek API 客户端（OpenAI 兼容格式）
# 从环境变量或配置文件读取 API Key
def get_deepseek_api_key():
    """获取 DeepSeek API Key，支持多种配置方式"""
    # 1. 环境变量
    key = os.environ.get("DEEPSEEK_API_KEY")
    if key:
        return key
    
    # 2. 配置文件（项目根目录下的 .env 文件）
    env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("DEEPSEEK_API_KEY="):
                    return line[len("DEEPSEEK_API_KEY="):].strip().strip('"').strip("'")
    
    # 3. 默认空值（将使用本地模板降级）
    return ""

_DEEPSEEK_API_KEY = get_deepseek_api_key()

# 仅在配置有效时初始化客户端
if _DEEPSEEK_API_KEY and _DEEPSEEK_API_KEY != "your-api-key-here":
    deepseek_client = AsyncOpenAI(
        api_key=_DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com/v1"
    )
    print(f"[INFO] DeepSeek API 已配置，Key 前缀: {_DEEPSEEK_API_KEY[:8]}...")
else:
    deepseek_client = None
    print("[WARN] DeepSeek API Key 未配置，将使用本地模板回复（降级模式）")

# System Prompt 模板
SYSTEM_PROMPT = """你是"小镜"，一个温暖、专业、有边界的心理陪伴AI。你的核心使命不是诊断或治疗，而是陪伴用户穿越情绪的低谷，帮助他们看见自己的力量、重获内心的平静。

## 核心行为准则
1. 【不诊断原则】你绝不能给出任何医学诊断、用药建议或声称可以"治愈"心理疾病。
2. 【一次一问】每次回复只提出一个问题或一个引导性思考。等待用户回应后再继续。
3. 【短暂反思空间】在提出引导性问题后，加入一句"你可以花几秒钟感受一下"或"不用急着回答"。
4. 【共情优先】在任何引导或建议之前，先确认和命名用户的情绪。
5. 【正常化体验】帮助用户理解他们的感受是人类共通的。
6. 【价值锚定】适时将对话引导向用户的个人价值观。
7. 【小步行动】在对话自然收束时，引导用户想出一个今天就能完成的微小行动。
8. 【边界意识】当用户的问题超出你的能力范围，你必须明确告知边界并提供专业求助渠道。
9. 【不退场】如果用户说"不想说了"，你可以说："好的，我理解。我会在这里，任何时候你想继续都可以回来。"

## 禁止事项（硬约束）
- 禁止声称自己是"医生""治疗师"或有行医资格
- 禁止给出任何形式的医疗诊断或用药建议
- 禁止鼓励用户采取伤害自己或他人的行为
- 禁止对用户的价值观、信仰、性取向等进行评判
- 禁止存储或利用用户的个人信息进行任何非服务目的的操作
- 禁止在用户没有主动引导时，强行推进话题或追问
- 禁止使用空洞的鸡汤式安慰，要用具体的共情和实际行动引导
"""

app = FastAPI(
    title="心语镜像 API",
    description="基于多模态大模型的心理干预与陪伴系统后端",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ 数据模型 ============

class ChatMessage(BaseModel):
    role: str  # "user" | "ai" | "system"
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_id: Optional[str] = "anonymous"
    emotion_state: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    message: ChatMessage
    emotion_analysis: Optional[Dict[str, Any]] = None
    safety_flag: Optional[str] = None  # "normal" | "low" | "medium" | "high" | "emergency"
    suggested_action: Optional[str] = None

class EmotionData(BaseModel):
    calm: float
    anxiety: float
    energy: float
    hope: float
    connection: float
    sadness: float
    anger: float
    timestamp: str

class MicroAction(BaseModel):
    id: str
    title: str
    description: str
    completed: bool = False
    category: str
    created_at: str

class SoulCard(BaseModel):
    id: str
    date: str
    title: str
    emotion_from: str
    emotion_to: str
    image_url: str

class FeedbackRequest(BaseModel):
    user_id: str
    session_id: str
    score: int  # 1-5
    tags: List[str] = []
    comment: Optional[str] = None

# ============ 模拟数据存储 ============

# 危机关键词库
CRISIS_KEYWORDS = [
    "自杀", "自残", "不想活", "死了算了", "结束生命", "割腕", "跳楼",
    "不想活了", "活着没意思", "想死", "结束一切", "离开这个世界"
]

# 安全响应话术
SAFETY_RESPONSES = {
    "high": "我们注意到你可能正在经历非常困难的时期。你的感受是真实的，也很重要。\n\n如果你正在考虑伤害自己，请立即联系专业帮助：\n📞 全国24小时心理援助热线：010-82951332\n📞 希望24热线：400-161-9995",
    "medium": "我注意到你描述的感受听起来很辛苦。这些感受是真实的，也值得被认真对待。\n\n如果这些感受持续存在，我建议你和专业的心理咨询师聊一聊。同时，我会一直在这里陪你。"
}

# AI 回复模板（模拟 RAG + 大模型）
AI_RESPONSES = [
    {
        "triggers": ["焦虑", "紧张", "担心", "害怕"],
        "response": "我能感受到你现在的焦虑，这真的很不容易。\n\n焦虑其实是一种保护机制——它在提醒你有重要的事情需要关注。我想邀请你做一个简单的练习：\n\n1. 慢慢吸气 4 秒\n2. 屏住呼吸 4 秒\n3. 缓缓呼气 6 秒\n\n重复三次。感觉怎么样？"
    },
    {
        "triggers": ["难过", "伤心", "痛苦", "想哭"],
        "response": "谢谢你愿意跟我分享这些。难过是一种很真实的感受，不需要急着让它消失。\n\n我想问你：如果可以，你希望此刻有人对你说一句什么样的话？"
    },
    {
        "triggers": ["累", "疲惫", "压力", "忙"],
        "response": "听起来你最近承载了很多。累不是软弱，而是你一直在努力生活的证明。\n\n你之前提到过「成长」对你很重要。你觉得现在的疲惫，和你在乎的成长之间，有什么联系吗？"
    },
    {
        "triggers": ["孤独", "没人懂", "一个人"],
        "response": "孤独是一种很深刻的感受。我想让你知道，愿意说出孤独本身，就是一种勇气。\n\n虽然我现在是 AI，但我在认真地听你说。你愿意多告诉我一些吗——这种孤独是从什么时候开始的？"
    },
    {
        "triggers": [],  # 默认回复
        "response": "我在听。你愿意多说说吗？\n\n不用急着回答，你可以花几秒钟感受一下自己此刻的状态。"
    }
]

# 微行动库
MICRO_ACTIONS = [
    {"title": "深呼吸 3 次", "description": "慢慢吸气 4 秒，屏住 4 秒，缓缓呼气 6 秒", "category": "放松"},
    {"title": "写下一件今天值得感恩的小事", "description": "不需要很大，一杯好喝的咖啡、一缕阳光都可以", "category": "觉察"},
    {"title": "站起来，伸个懒腰，看看窗外", "description": "让眼睛和肩膀都休息一下，哪怕只有 30 秒", "category": "身体"},
    {"title": "给一个在乎的人发一条消息", "description": "不需要说很多，只是一个表情或一句「在干嘛」", "category": "连接"},
    {"title": "喝一杯温水", "description": "感受水从喉咙流过的温度，把注意力带回身体", "category": "身体"},
    {"title": "把此刻的感受写下一句话", "description": "不需要完整，一个词、一个句子都可以", "category": "觉察"},
    {"title": "听一首喜欢的歌", "description": "闭上眼睛，只关注音乐中的一个乐器声音", "category": "放松"},
]

# 用户数据（内存存储，实际应用应使用数据库）
users_db = {}
sessions_db = {}

# ============ 辅助函数 ============

def get_current_time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def analyze_text_emotion(text: str) -> Dict[str, Any]:
    """文本情感分析（模拟）"""
    text_lower = text.lower()
    
    # 简单的关键词匹配模拟
    emotions = {
        "calm": 50.0,
        "anxiety": 30.0,
        "energy": 40.0,
        "hope": 40.0,
        "connection": 40.0,
        "sadness": 30.0,
        "anger": 20.0
    }
    
    # 根据关键词调整
    if any(kw in text for kw in ["焦虑", "紧张", "担心", "害怕"]):
        emotions["anxiety"] = min(95, emotions["anxiety"] + 30)
        emotions["calm"] = max(10, emotions["calm"] - 15)
    
    if any(kw in text for kw in ["难过", "伤心", "痛苦", "想哭", "低落"]):
        emotions["sadness"] = min(95, emotions["sadness"] + 35)
        emotions["hope"] = max(10, emotions["hope"] - 15)
        emotions["energy"] = max(10, emotions["energy"] - 10)
    
    if any(kw in text for kw in ["累", "疲惫", "压力"]):
        emotions["energy"] = max(10, emotions["energy"] - 20)
        emotions["anxiety"] = min(95, emotions["anxiety"] + 15)
    
    if any(kw in text for kw in ["开心", "高兴", "不错", "挺好"]):
        emotions["calm"] = min(95, emotions["calm"] + 20)
        emotions["hope"] = min(95, emotions["hope"] + 15)
        emotions["energy"] = min(95, emotions["energy"] + 10)
    
    if any(kw in text for kw in ["生气", "愤怒", "烦", "讨厌"]):
        emotions["anger"] = min(95, emotions["anger"] + 35)
        emotions["calm"] = max(10, emotions["calm"] - 20)
    
    if any(kw in text for kw in ["孤独", "一个人", "没人"]):
        emotions["connection"] = max(10, emotions["connection"] - 25)
        emotions["sadness"] = min(95, emotions["sadness"] + 15)
    
    # 计算压力指数
    pas = round(
        emotions["anxiety"] * 0.35 +
        emotions["sadness"] * 0.25 +
        emotions["anger"] * 0.20 +
        (100 - emotions["calm"]) * 0.20
    )
    
    return {
        "emotions": emotions,
        "pas": pas,
        "level": "平静" if pas <= 30 else "轻度" if pas <= 50 else "中度" if pas <= 70 else "重度"
    }

def check_safety(text: str) -> str:
    """安全检查"""
    for keyword in CRISIS_KEYWORDS:
        if keyword in text:
            return "high"
    
    # 模拟 BERT 分类（简化版）
    high_risk_words = ["绝望", "无助", "活不下去", "没有意义"]
    medium_risk_words = ["很难受", "撑不住", "不知道怎么办", "很崩溃"]
    
    if any(w in text for w in high_risk_words):
        return "high"
    if any(w in text for w in medium_risk_words):
        return "medium"
    
    return "normal"

async def call_deepseek_api(messages: List[Dict[str, str]], stream: bool = False) -> str:
    """调用 DeepSeek API 生成回复"""
    # 检查客户端是否已初始化
    if deepseek_client is None:
        print("[INFO] DeepSeek 客户端未初始化，跳过 API 调用")
        return None
    
    try:
        # 构建消息列表（加入 System Prompt）
        api_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        api_messages.extend(messages)
        
        if stream:
            # 流式响应
            response = await deepseek_client.chat.completions.create(
                model="deepseek-chat",
                messages=api_messages,
                stream=True,
                temperature=0.7,
                max_tokens=800
            )
            return response
        else:
            # 非流式响应
            response = await deepseek_client.chat.completions.create(
                model="deepseek-chat",
                messages=api_messages,
                stream=False,
                temperature=0.7,
                max_tokens=800
            )
            return response.choices[0].message.content
    except Exception as e:
        print(f"[ERROR] DeepSeek API 调用失败: {e}")
        # 降级到本地模板回复
        return None

def generate_ai_response(text: str, emotion_analysis: Dict) -> str:
    """生成 AI 回复（本地模板，作为 DeepSeek 降级方案）"""
    # 优先匹配触发词
    for template in AI_RESPONSES[:-1]:
        if any(trigger in text for trigger in template["triggers"]):
            return template["response"]
    
    # 默认回复
    return AI_RESPONSES[-1]["response"]

def generate_micro_action() -> Dict[str, str]:
    """生成微行动"""
    action = random.choice(MICRO_ACTIONS)
    return action

# ============ API 路由 ============

@app.get("/")
async def root():
    return {
        "name": "心语镜像 API",
        "version": "2.0.0",
        "description": "基于多模态大模型的心理干预与陪伴系统",
        "status": "running"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": get_current_time()}

# ---- 对话 API ----

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """对话接口：接收用户消息，返回 AI 回复 + 情绪分析 + 安全标记（集成 DeepSeek API）"""
    
    if not request.messages:
        raise HTTPException(status_code=400, detail="消息不能为空")
    
    last_message = request.messages[-1]
    user_text = last_message.content
    
    # 1. 文本情感分析
    emotion_analysis = analyze_text_emotion(user_text)
    
    # 2. 安全检查
    safety_flag = check_safety(user_text)
    
    # 3. 生成回复
    if safety_flag == "high":
        ai_content = SAFETY_RESPONSES["high"]
    elif safety_flag == "medium":
        ai_content = SAFETY_RESPONSES["medium"]
    else:
        # 尝试调用 DeepSeek API
        # 将消息转换为 API 格式
        api_messages = []
        for msg in request.messages:
            if msg.role == "ai":
                api_messages.append({"role": "assistant", "content": msg.content})
            elif msg.role == "user":
                api_messages.append({"role": "user", "content": msg.content})
        
        # 调用 DeepSeek API
        deepseek_response = await call_deepseek_api(api_messages, stream=False)
        
        if deepseek_response:
            ai_content = deepseek_response
        else:
            # DeepSeek 调用失败，降级到本地模板
            ai_content = generate_ai_response(user_text, emotion_analysis)
    
    # 4. 生成微行动建议（每 6 条消息）
    suggested_action = None
    if len(request.messages) >= 6 and len(request.messages) % 6 == 0:
        action = generate_micro_action()
        suggested_action = f"💡 温和小行动：{action['title']}\n{action['description']}"
    
    # 构建响应
    response = ChatResponse(
        message=ChatMessage(
            role="ai",
            content=ai_content,
            timestamp=get_current_time()
        ),
        emotion_analysis=emotion_analysis,
        safety_flag=safety_flag,
        suggested_action=suggested_action
    )
    
    return response


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """对话流式接口：SSE 流式返回 AI 回复（集成 DeepSeek API）"""
    
    if not request.messages:
        raise HTTPException(status_code=400, detail="消息不能为空")
    
    last_message = request.messages[-1]
    user_text = last_message.content
    
    # 安全检查
    safety_flag = check_safety(user_text)
    
    if safety_flag == "high":
        # 危机情况直接返回，不走流式
        async def crisis_stream():
            yield f"data: {json.dumps({'type': 'content', 'content': SAFETY_RESPONSES['high']}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'safety_flag': 'high'}, ensure_ascii=False)}\n\n"
        
        return StreamingResponse(
            crisis_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
    
    # 构建 API 消息
    api_messages = []
    for msg in request.messages:
        if msg.role == "ai":
            api_messages.append({"role": "assistant", "content": msg.content})
        elif msg.role == "user":
            api_messages.append({"role": "user", "content": msg.content})
    
    async def generate_stream() -> AsyncGenerator[str, None]:
        """生成 SSE 流"""
        # 检查客户端是否已初始化
        if deepseek_client is None:
            print("[INFO] DeepSeek 客户端未初始化，使用本地模板回复")
            ai_content = generate_ai_response(user_text, {})
            data = json.dumps({"type": "content", "content": ai_content}, ensure_ascii=False)
            yield f"data: {data}\n\n"
            done_data = json.dumps({"type": "done", "safety_flag": safety_flag, "fallback": True}, ensure_ascii=False)
            yield f"data: {done_data}\n\n"
            return
        
        try:
            # 调用 DeepSeek 流式 API
            response = await deepseek_client.chat.completions.create(
                model="deepseek-chat",
                messages=api_messages,
                stream=True,
                temperature=0.7,
                max_tokens=800
            )
            
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    data = json.dumps({"type": "content", "content": content}, ensure_ascii=False)
                    yield f"data: {data}\n\n"
            
            # 发送完成信号
            done_data = json.dumps({"type": "done", "safety_flag": safety_flag}, ensure_ascii=False)
            yield f"data: {done_data}\n\n"
            
        except Exception as e:
            print(f"[ERROR] DeepSeek 流式 API 调用失败: {e}")
            # 降级到本地模板
            ai_content = generate_ai_response(user_text, {})
            data = json.dumps({"type": "content", "content": ai_content}, ensure_ascii=False)
            yield f"data: {data}\n\n"
            done_data = json.dumps({"type": "done", "safety_flag": safety_flag, "fallback": True}, ensure_ascii=False)
            yield f"data: {done_data}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

@app.post("/api/chat/feedback")
async def submit_feedback(request: FeedbackRequest):
    """提交对话反馈"""
    return {
        "success": True,
        "message": "反馈已收到，谢谢你",
        "timestamp": get_current_time()
    }

# ---- 情绪数据 API ----

@app.get("/api/emotion/current")
async def get_current_emotion(user_id: str = "anonymous"):
    """获取当前情绪状态"""
    return {
        "user_id": user_id,
        "emotions": {
            "calm": 72,
            "anxiety": 58,
            "energy": 45,
            "hope": 55,
            "connection": 60,
            "sadness": 40,
            "anger": 25
        },
        "pas": 58,
        "level": "轻度",
        "timestamp": get_current_time()
    }

@app.get("/api/emotion/history")
async def get_emotion_history(user_id: str = "anonymous", days: int = 30):
    """获取情绪历史数据"""
    history = []
    base_date = datetime.now() - timedelta(days=days)
    
    for i in range(days):
        date = base_date + timedelta(days=i)
        history.append({
            "date": date.strftime("%m/%d"),
            "pas": round(40 + 20 * (1 + (i % 7) / 7) + random.randint(-10, 10)),
            "emotions": {
                "calm": round(50 + random.randint(-20, 20)),
                "anxiety": round(40 + random.randint(-20, 30)),
                "energy": round(45 + random.randint(-15, 15)),
                "hope": round(50 + random.randint(-15, 20)),
                "connection": round(55 + random.randint(-15, 15)),
                "sadness": round(35 + random.randint(-15, 20)),
                "anger": round(25 + random.randint(-10, 15))
            }
        })
    
    return {"user_id": user_id, "history": history}

@app.get("/api/emotion/weekly")
async def get_weekly_emotion(user_id: str = "anonymous"):
    """获取本周情绪数据（用于雷达图）"""
    return {
        "user_id": user_id,
        "current_week": [72, 58, 45, 55, 60, 40, 25],
        "last_week": [60, 70, 38, 42, 52, 55, 30],
        "dimensions": ["平静", "焦虑", "活力", "希望", "连接感", "低落", "愤怒"],
        "timestamp": get_current_time()
    }

# ---- 微行动 API ----

@app.get("/api/actions")
async def get_actions(user_id: str = "anonymous"):
    """获取今日微行动列表"""
    return {
        "user_id": user_id,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "actions": [
            {
                "id": "a1",
                "title": "深呼吸 3 次",
                "description": "慢慢吸气 4 秒，屏住 4 秒，缓缓呼气 6 秒",
                "completed": True,
                "category": "放松",
                "created_at": get_current_time()
            },
            {
                "id": "a2",
                "title": "写下一件今天值得感恩的小事",
                "description": "不需要很大，一杯好喝的咖啡、一缕阳光都可以",
                "completed": True,
                "category": "觉察",
                "created_at": get_current_time()
            },
            {
                "id": "a3",
                "title": "站起来，伸个懒腰，看看窗外",
                "description": "让眼睛和肩膀都休息一下，哪怕只有 30 秒",
                "completed": False,
                "category": "身体",
                "created_at": get_current_time()
            }
        ],
        "progress": {"completed": 2, "total": 3}
    }

@app.post("/api/actions/{action_id}/complete")
async def complete_action(action_id: str, user_id: str = "anonymous"):
    """完成微行动"""
    return {
        "success": True,
        "action_id": action_id,
        "message": "太棒了！每一个小行动都在积累改变 💚",
        "timestamp": get_current_time()
    }

# ---- 心灵图卡 API ----

@app.get("/api/soulcards")
async def get_soulcards(user_id: str = "anonymous"):
    """获取心灵图卡列表"""
    return {
        "user_id": user_id,
        "cards": [
            {
                "id": "sc1",
                "date": "2026-06-20",
                "title": "流动的平静",
                "emotion_from": "焦虑",
                "emotion_to": "平静",
                "image_url": "/assets/hero_16x9.jpg"
            },
            {
                "id": "sc2",
                "date": "2026-06-19",
                "title": "镜中的自己",
                "emotion_from": "低落",
                "emotion_to": "希望",
                "image_url": "/assets/feature_mirror_4x3.jpg"
            }
        ]
    }

@app.post("/api/soulcards/generate")
async def generate_soulcard(user_id: str = "anonymous", emotion: str = "calm"):
    """生成心灵图卡"""
    # 模拟异步生成
    return {
        "success": True,
        "card": {
            "id": f"sc_{int(time.time())}",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "title": "新的心灵图卡",
            "emotion_from": emotion,
            "emotion_to": "平静",
            "image_url": "/assets/hero_16x9.jpg",
            "status": "generating",
            "estimated_time": 5
        }
    }

# ---- 安全 API ----

@app.get("/api/safety/status")
async def get_safety_status(user_id: str = "anonymous"):
    """获取安全状态"""
    return {
        "user_id": user_id,
        "status": "normal",
        "filters": {
            "keyword_filter": "active",
            "intent_classifier": "active",
            "llm_safety_check": "active",
            "hallucination_detection": "active",
            "human_review": "standby"
        },
        "last_check": get_current_time()
    }

@app.get("/api/safety/resources")
async def get_safety_resources():
    """获取心理援助资源"""
    return {
        "resources": [
            {"name": "全国24小时心理援助热线", "phone": "010-82951332"},
            {"name": "北京心理危机干预中心", "phone": "010-82951332"},
            {"name": "希望24热线", "phone": "400-161-9995"}
        ]
    }

# ---- 用户设置 API ----

@app.get("/api/settings")
async def get_settings(user_id: str = "anonymous"):
    """获取用户设置"""
    return {
        "user_id": user_id,
        "settings": {
            "face_emotion": True,
            "voice_emotion": True,
            "soulcard_generation": True,
            "action_reminder": True,
            "emergency_contact": False,
            "data_local_only": True
        }
    }

@app.post("/api/settings")
async def update_settings(user_id: str = "anonymous", settings: Dict[str, Any] = None):
    """更新用户设置"""
    return {
        "success": True,
        "message": "设置已保存",
        "settings": settings or {}
    }

# ============ 静态文件服务 ============

# 获取当前文件所在目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)

# 挂载静态文件
app.mount("/assets", StaticFiles(directory=os.path.join(PARENT_DIR, "assets")), name="assets")

@app.get("/demo")
async def serve_demo():
    """提供 Demo 页面"""
    return FileResponse(os.path.join(PARENT_DIR, "index.html"))

# ============ 启动 ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
