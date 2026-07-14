"""
心镜 MindMirror — 心理干预引擎
基于 CBT（认知行为疗法）+ 本地 LLM（Ollama Qwen2.5-7B）的共情回复生成
"""

import json
import random
import re
from typing import Optional

import requests

# ==================== 本地 LLM 配置（Ollama）====================
OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "qwen2.5:7b-instruct"

# 心理咨询 system prompt（融合 CBT 理念 + EmoLLM 风格）
PSYCHOLOGY_SYSTEM_PROMPT = """你是一位温暖、专业、富有同理心的心理咨询师，名叫"心镜"。你的任务是陪伴用户探索内心、缓解情绪困扰。

遵循以下原则：
1. **共情优先**：先准确镜映用户的情绪，让用户感到被理解，再引导思考。不要急于给建议。
2. **CBT 认知行为疗法**：帮助用户识别自动化思维和认知偏差，温和地引导重新评估。
3. **开放性提问**：用开放式问题引导用户深入探索，而非封闭式提问。
4. **非评判态度**：接纳所有情绪，不评判对错。
5. **安全第一**：如涉及自伤/自杀念头，立即表达关切并建议联系专业危机热线（全国24小时心理援助热线：400-161-9995）。
6. **简洁温暖**：回复控制在2-4句话，避免说教感，像朋友般自然。适当使用语气词。
7. **中文表达**：用自然流畅的中文，避免翻译腔。

不要扮演 AI 助手，你就是心镜咨询师。不要使用 markdown 标题或列表格式，用自然的对话语气。"""


def _build_user_context(user_text, emotion_label, intensity, face_emotion, voice_emotion, text_emotion, trend):
    """构建多模态情绪上下文，注入到用户消息中供 LLM 感知"""
    context_parts = []
    if face_emotion and face_emotion != "neutral":
        context_parts.append(f"面部表情显示{face_emotion}")
    if voice_emotion and voice_emotion != "neutral":
        context_parts.append(f"语音语调显示{voice_emotion}")
    if text_emotion and text_emotion != "neutral":
        context_parts.append(f"文字情绪为{text_emotion}")
    if emotion_label and emotion_label != "neutral":
        context_parts.append(f"综合情绪：{emotion_label}（强度{round(intensity, 1)}/1.0）")
    if trend and trend != "stable":
        trend_cn = {"improving": "情绪好转", "worsening": "情绪恶化", "fluctuating": "情绪波动"}.get(trend, trend)
        context_parts.append(trend_cn)

    if context_parts:
        return f"[多模态感知：{'，'.join(context_parts)}]\n\n用户说：{user_text}"
    return user_text


def _build_history_messages(history):
    """将对话历史转换为 Ollama messages 格式（取最近 6 轮）"""
    messages = []
    recent = history[-12:] if len(history) > 12 else history  # 最近6轮=12条
    for h in recent:
        role = h.get("role", "user")
        content = h.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    return messages


def call_ollama(user_text, emotion_label, intensity, face_emotion, voice_emotion, text_emotion, trend, history):
    """调用本地 Ollama 生成心理咨询回复，失败返回 None"""
    try:
        user_context = _build_user_context(
            user_text, emotion_label, intensity, face_emotion, voice_emotion, text_emotion, trend
        )
        messages = [{"role": "system", "content": PSYCHOLOGY_SYSTEM_PROMPT}]
        messages.extend(_build_history_messages(history))
        messages.append({"role": "user", "content": user_context})

        resp = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False, "options": {"temperature": 0.7, "num_predict": 300}},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        content = data.get("message", {}).get("content", "").strip()
        return content if content else None
    except Exception as e:
        print(f"⚠️ Ollama 调用失败，回退到模板回复: {e}")
        return None


def call_ollama_stream(user_text, emotion_label, intensity, face_emotion, voice_emotion, text_emotion, trend, history):
    """流式调用 Ollama，yield 文本块。失败时 yield None 并由调用方回退"""
    try:
        user_context = _build_user_context(
            user_text, emotion_label, intensity, face_emotion, voice_emotion, text_emotion, trend
        )
        messages = [{"role": "system", "content": PSYCHOLOGY_SYSTEM_PROMPT}]
        messages.extend(_build_history_messages(history))
        messages.append({"role": "user", "content": user_context})

        resp = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": True, "options": {"temperature": 0.7, "num_predict": 300}},
            timeout=30,
            stream=True,
        )
        resp.raise_for_status()

        for line in resp.iter_lines():
            if not line:
                continue
            try:
                data = json.loads(line)
            except Exception:
                continue
            if data.get("done"):
                return
            content = data.get("message", {}).get("content", "")
            if content:
                yield content
    except Exception as e:
        print(f"⚠️ Ollama 流式调用失败: {e}")
        yield None


# ==================== 危机检测 ====================

CRISIS_KEYWORDS = [
    "不想活", "想死", "自杀", "了结", "跳楼", "割腕", "活不下去",
    "没有意义", "想结束", "遗书", "永别", "解脱", "消失",
    "活着没意思", "不如死", "去死", "伤害自己"
]

CRISIS_RESPONSE = (
    "我听到了你此刻非常痛苦，你说的这些话让我很担心你。"
    "你现在经历的痛苦是真实的，但请知道——你不需要独自承受这一切。\n\n"
    "请立即拨打 24 小时心理援助热线：\n"
    "  - 全国心理援助热线：400-161-9995\n"
    "  - 北京心理危机研究与干预中心：010-82951332\n"
    "  - 希望24热线：400-161-9995\n\n"
    "如果你正处于危险中，请立即拨打 120 或前往最近的医院急诊。"
    "你的生命很重要，请给自己一个获得帮助的机会。"
)


def detect_crisis(text: str) -> bool:
    """检测文本中是否包含危机信号"""
    text_lower = text.lower()
    for keyword in CRISIS_KEYWORDS:
        if keyword in text_lower:
            return True
    # 检测"不想活了"等变体
    if re.search(r'不想.{0,2}活', text) or re.search(r'想.{0,2}死', text):
        return True
    return False


# ==================== 情绪镜像 ====================

EMOTION_MIRRORS = {
    "happy": [
        "我能感受到你现在心情不错，这种轻松的感觉很好。",
        "看到你现在的状态比较积极，这让我也很高兴。",
        "你现在的表情告诉我，你此刻的心情是开朗的。",
    ],
    "sad": [
        "我能感觉到你此刻很低落，眼眶似乎有些湿润。",
        "你的表情告诉我，你现在心里不好受。",
        "我注意到你的情绪有些低沉，这没关系，慢慢来。",
    ],
    "angry": [
        "我感受到你现在有些愤怒，眉头紧锁着。",
        "你现在的情绪里有不满，我能看出来。",
        "我注意到你此刻有些烦躁，这是完全可以理解的。",
    ],
    "surprised": [
        "你看起来有些惊讶，是遇到了什么意想不到的事吗？",
        "我注意到你的表情有些意外。",
        "你此刻似乎被什么惊到了。",
    ],
    "fearful": [
        "我感受到你现在有些不安和紧张。",
        "你的表情告诉我，你此刻可能有些害怕。",
        "我注意到你有些担忧，这种感觉很正常。",
    ],
    "disgusted": [
        "我感觉到你对某些事情有些排斥。",
        "你此刻似乎对什么感到不太舒服。",
        "我注意到你的表情里有些厌恶。",
    ],
    "neutral": [
        "你现在的状态比较平静。",
        "我感受到你此刻情绪比较稳定。",
        "你看起来比较平和，准备好了可以随时聊聊。",
    ],
    "anxious": [
        "我感受到你现在有些焦虑，坐立不安的样子。",
        "你的表情和语气告诉我，你此刻心里有些紧张。",
        "我注意到你有些担忧不安，我们在慢慢来。",
    ],
}

# ==================== CBT 策略 ====================

CBT_STRATEGIES = {
    "cognitive_restructuring": {
        "name": "认知重构",
        "description": "引导用户识别自动化负面思维",
        "responses": [
            "你提到的事情确实让人不舒服。我想请你想想——在这个情境中，你最担心的是什么？这个担心有没有可能是思维在'放大'事情的严重性？",
            "我听到你在描述这件事时情绪有明显波动。有时候我们的思维会自动跳到最坏的结果——你觉得这件事真的是你想象的那么糟吗？",
            "你说的这些，有没有哪些是事实，哪些是你在脑中推测的？我们可以试着把两者分开看看。",
        ]
    },
    "grounding": {
        "name": "接地技术",
        "description": "帮助用户从情绪旋涡中稳定下来",
        "responses": [
            "我注意到你现在的情绪波动比较大。让我们先暂停一下——试着感受你的双脚踩在地面上的感觉。你能告诉我，你现在能看到的 3 样东西是什么吗？",
            "你此刻的情绪似乎有些汹涌。我们可以先做一个简单的呼吸练习——慢慢吸气 4 秒，屏住 2 秒，再慢慢呼气 6 秒。准备好了我们一起开始。",
            "我感受到你需要先稳定一下。试着把注意力放到你的身体上——你的手现在放在哪里？感受一下它们的温度。",
        ]
    },
    "socratic_questioning": {
        "name": "苏格拉底式提问",
        "description": "通过提问引导自我探索",
        "responses": [
            "你说的这件事，如果发生在你最好的朋友身上，你会怎么对他说？",
            "你觉得这件事背后，真正困扰你的是什么？是事情本身，还是它触发了你某种更深层的感受？",
            "你希望这件事件最终怎样解决？在那之前，你觉得可以先做的一小步是什么？",
        ]
    },
    "positive_reinforcement": {
        "name": "正向强化",
        "description": "强化积极情绪和进步",
        "responses": [
        "我注意到你的情绪比刚才好了一些——这说明你在努力调整自己，这本身就很了不起。你能告诉我，是什么让你感觉好了一点吗？",
            "你能在这个时候还保持一些积极的状态，这不容易。你最近有没有什么让自己感到骄傲的小事？",
            "你现在的状态比之前稳定了，这说明你有能力照顾好自己的情绪。你觉得今天这段对话中，什么对你最有帮助？",
        ]
    },
    "validation": {
        "name": "情绪确认",
        "description": "确认用户情绪的合理性",
        "responses": [
            "你有这样的感受是完全正常的——任何人面对这样的情况，都可能会有类似的反应。你不需要为此自责。",
            "我能理解你为什么会有这样的感觉。你的感受是真实的，也是合理的。你愿意多告诉我一些吗？",
            "谢谢你愿意和我分享这些。能说出来本身就需要勇气，你已经迈出了重要的一步。",
        ]
    },
    "exploration": {
        "name": "开放探索",
        "description": "引导用户自由表达",
        "responses": [
            "你愿意多聊聊吗？今天有什么事情让你想来说说？",
            "我在这里听着。你可以从任何你想说的地方开始。",
            "你此刻心里在想什么？不用组织语言，想到什么就说什么。",
        ]
    }
}


def select_cbt_strategy(emotion: str, intensity: float, trend: str, user_text: str) -> str:
    """根据情绪状态和趋势选择 CBT 策略"""
    # 高强度负面情绪 + 恶化趋势 → 接地技术
    if emotion in ("sad", "fearful", "anxious") and intensity >= 7 and trend == "worsening":
        return "grounding"

    # 负面情绪 + 中高强度 → 认知重构
    if emotion in ("sad", "angry", "fearful", "anxious", "disgusted") and intensity >= 5:
        if trend == "worsening":
            return "cognitive_restructuring"
        return "validation"

    # 情绪波动 → 接地技术
    if trend == "fluctuating":
        return "grounding"

    # 正面情绪 + 好转 → 正向强化
    if emotion == "happy" and trend in ("improving", "stable"):
        return "positive_reinforcement"

    # 中性情绪 → 开放探索
    if emotion == "neutral":
        return "exploration"

    # 用户提到了具体困扰 → 苏格拉底式提问
    if any(w in user_text for w in ["怎么办", "不知道", "纠结", "选择", "矛盾", "犹豫"]):
        return "socratic_questioning"

    # 默认 → 情绪确认
    return "validation"


def generate_response(
    user_text: str,
    emotion_label: str,
    intensity: float,
    trend: str,
    history: list,
    face_emotion: str = "",
    voice_emotion: str = "",
    text_emotion: str = "",
) -> dict:
    """
    生成心理回复

    参数:
        user_text: 用户输入文本
        emotion_label: 融合后的主导情绪标签
        intensity: 情绪强度 0-10
        trend: 情绪趋势 (improving/worsening/stable/fluctuating)
        history: 对话历史 [{role, content, emotion, intensity}, ...]
        face_emotion: 表情识别结果
        voice_emotion: 语音分析结果
        text_emotion: 文本情感分析结果

    返回:
        dict: {response, cbt_strategy, crisis_flag, emotion_analysis}
    """
    # 1. 危机检测（最高优先级，不走 LLM）
    if detect_crisis(user_text):
        return {
            "response": CRISIS_RESPONSE,
            "cbt_strategy": "crisis_intervention",
            "crisis_flag": True,
            "emotion_analysis": {
                "label": emotion_label,
                "intensity": intensity,
                "trend": trend,
                "conflict": False,
            }
        }

    # 2. 情绪冲突检测（供前端展示）
    emotions_set = {e for e in [face_emotion, voice_emotion, text_emotion] if e}
    conflict = False
    if len(emotions_set) >= 2:
        positive = {"happy", "neutral"}
        negative = {"sad", "angry", "fearful", "anxious", "disgusted"}
        if emotions_set & positive and emotions_set & negative:
            conflict = True

    # 3. 选择 CBT 策略标签（供前端展示，不直接用于回复文本）
    strategy_key = select_cbt_strategy(emotion_label, intensity, trend, user_text)
    strategy = CBT_STRATEGIES[strategy_key]

    # 4. 优先调用本地 LLM 生成回复
    llm_response = call_ollama(
        user_text, emotion_label, intensity, face_emotion, voice_emotion, text_emotion, trend, history
    )

    if llm_response:
        full_response = llm_response
    else:
        # 5. LLM 失败时回退到模板回复
        mirror_emotion = emotion_label if emotion_label in EMOTION_MIRRORS else "neutral"
        mirror = random.choice(EMOTION_MIRRORS[mirror_emotion])
        if conflict:
            mirror += " 我注意到你嘴上说还好，但你的表情和语气似乎在告诉我一些不同的事情。你愿意让我了解真实的感受吗？"
        cbt_response = random.choice(strategy["responses"])
        full_response = f"{mirror}\n\n{cbt_response}"

    return {
        "response": full_response,
        "cbt_strategy": strategy_key,
        "cbt_strategy_name": strategy["name"],
        "crisis_flag": False,
        "emotion_analysis": {
            "label": emotion_label,
            "intensity": round(intensity, 1),
            "trend": trend,
            "conflict": conflict,
            "face_emotion": face_emotion,
            "voice_emotion": voice_emotion,
            "text_emotion": text_emotion,
        }
    }
