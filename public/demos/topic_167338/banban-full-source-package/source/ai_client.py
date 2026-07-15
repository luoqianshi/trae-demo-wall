"""
伴伴 - AI 客户端模块（双模型架构）

【视觉模型】免费/便宜的视觉模型，负责看懂屏幕截图
  推荐：智谱 GLM-4V-Flash（完全免费，OpenAI 兼容）
  地址：https://open.bigmodel.cn  → api_base: https://open.bigmodel.cn/api/paas/v4

【主模型】长上下文高级模型，负责主动分析和弹窗决策
  推荐：DeepSeek V3（128K上下文，¥2/百万Token）
  地址：https://api.deepseek.com/v1
"""
import base64
import json
import httpx
from typing import Optional
from companion_db import Database

# 默认配置
DEFAULT_CONFIG = {
    # 主模型（文字聊天、主动分析、画布提取、截图文字分析）- DeepSeek
    "ai_base_url": "https://api.deepseek.com/v1",
    "ai_api_key": "sk-YOUR_API_KEY_HERE",
    "ai_model": "deepseek-chat",
    "ai_temperature": 0.7,
    "ai_max_tokens": 2048,

    # 视觉模型（截图分析、图片理解）- 智谱 GLM-4V-Flash（免费）
    "ai_vision_base_url": "https://open.bigmodel.cn/api/paas/v4",
    "ai_vision_api_key": "ab7539a43d384b3389fbeb283651e2e6.086VMNY4MdVpiqpQ",
    "ai_vision_model": "glm-4v-flash",

    # 数据模式：true=演示模式(默认，含种子数据)，false=真实数据模式(仅用真实截图)
    "demo_mode": "true",
}


class AIClient:
    """双模型 AI 客户端"""

    def __init__(self, db: Database = None):
        self.db = db or Database()
        self._load_config()

    def _get_cfg(self, cfg: dict, key: str, default=None):
        """安全获取配置，空字符串/None 时回退到默认值"""
        val = cfg.get(key)
        if val is None or (isinstance(val, str) and val.strip() == ""):
            return default if default is not None else DEFAULT_CONFIG.get(key)
        return val

    def _load_config(self):
        cfg = self.db.get_all_config()

        # 主模型
        self.base_url = self._get_cfg(cfg, "ai_base_url")
        self.api_key = self._get_cfg(cfg, "ai_api_key")
        self.model = self._get_cfg(cfg, "ai_model")
        self.temperature = float(self._get_cfg(cfg, "ai_temperature"))
        self.max_tokens = int(self._get_cfg(cfg, "ai_max_tokens"))

        # 视觉模型（独立配置）
        self.vision_base_url = self._get_cfg(cfg, "ai_vision_base_url")
        self.vision_api_key = self._get_cfg(cfg, "ai_vision_api_key")
        self.vision_model = self._get_cfg(cfg, "ai_vision_model")

    def reload(self):
        self._load_config()

    @property
    def configured(self) -> bool:
        """主文字模型是否已完整配置。"""
        return bool(self.api_key and self.base_url and self.model)

    @property
    def vision_configured(self) -> bool:
        """视觉模型是否已配置"""
        return bool(self.vision_api_key and self.vision_base_url)

    # ========= 主模型 API（文字对话）=========

    def _call_api(self, base_url: str, api_key: str, model: str,
                   messages: list, temperature: float = None,
                   max_tokens: int = None, json_mode: bool = False,
                   timeout: int = 60) -> str:
        """通用 API 调用"""
        if not api_key or not base_url or not model:
            raise RuntimeError("AI 服务尚未完整配置，请先在设置中填写地址、密钥和模型")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": model,
            "messages": messages,
            "temperature": self.temperature if temperature is None else temperature,
            "max_tokens": self.max_tokens if max_tokens is None else max_tokens,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        with httpx.Client(trust_env=False, timeout=timeout) as client:
            resp = client.post(
                f"{base_url.rstrip('/')}/chat/completions",
                headers=headers, json=body,
            )
        if resp.status_code != 200:
            err_body = resp.text[:500]
            raise Exception(f"HTTP {resp.status_code}: {err_body}")
        return resp.json()["choices"][0]["message"]["content"]

    def chat(self, messages: list, temperature: float = None,
             max_tokens: int = None, json_mode: bool = False) -> str:
        """主模型：文字对话"""
        return self._call_api(
            self.base_url, self.api_key, self.model,
            messages, temperature, max_tokens, json_mode,
        )

    # ========= 视觉模型 API（图片理解）=========

    def chat_with_image(self, messages: list, image_path: str = None,
                        image_base64: str = None, temperature: float = None) -> str:
        """视觉模型：附带图片进行对话"""
        if image_path:
            with open(image_path, "rb") as f:
                image_base64 = base64.b64encode(f.read()).decode()

        vision_messages = []
        for msg in messages:
            if msg["role"] == "user" and image_base64:
                vision_messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": msg["content"]},
                        {"type": "image_url",
                         "image_url": {"url": f"data:image/png;base64,{image_base64}"}},
                    ],
                })
            else:
                vision_messages.append(msg)

        return self._call_api(
            self.vision_base_url, self.vision_api_key, self.vision_model,
            vision_messages, temperature, min(self.max_tokens, 1024),
            timeout=90,
        )

    # ========= 高级方法 =========

    def generate_reminder_message(self, profile_summary: str, stage: int,
                                  elapsed_minutes: int, current_activity: str = None,
                                  tone: str = "gentle") -> str:
        """生成三阶段注意力提醒文案（主模型）"""
        stage_desc = {
            1: "这是第一阶段轻提醒。像微风一样提到时间和注意力，不施压，不评判。",
            2: "这是第二阶段觉察提醒。温和邀请用户觉察'无意识消耗'，引导思考当前行为是否真正想做的。",
            3: "这是第三阶段轻切换。提供具体的注意力锚定动作建议，温和而非命令式。",
        }
        tone_map = {
            "gentle": "说话温柔如水，像朋友轻轻拍肩",
            "direct": "直接但温暖，像关心你的家人",
            "friend": "像好友聊天，轻松幽默",
            "coach": "像温暖的人生教练，有方向感但不严厉",
        }
        messages = [
            {"role": "system", "content": (
                f"你是'伴伴'，一个温柔贴心的生活伴侣。{tone_map.get(tone, tone_map['gentle'])}。"
                f"根据用户画像和当前状态，生成一句简短（30字以内）的注意力提醒。"
                f"{stage_desc.get(stage, '')}"
                f"不要用'你应该'、'你必须'这样的命令语言。"
            )},
            {"role": "user", "content": (
                f"用户画像：{profile_summary}\n"
                f"已持续 {elapsed_minutes} 分钟\n"
                f"当前活动：{current_activity or '未知'}\n"
                f"提醒阶段：第{stage}阶段\n请生成一句提醒："
            )},
        ]
        return self.chat(messages, temperature=0.8, max_tokens=100)

    def analyze_screenshot(self, image_path: str, ocr_text: str = None,
                           app_name: str = None, window_title: str = None) -> str:
        """视觉模型：分析截图，返回结构化描述

        优先使用视觉模型（GLM-4V）看图分析；
        若视觉模型未配置，降级为用 DeepSeek 基于 OCR文字 + 窗口信息分析。
        """
        context_parts = []
        if app_name:
            context_parts.append(f"当前应用：{app_name}")
        if window_title:
            context_parts.append(f"窗口标题：{window_title}")
        if ocr_text:
            context_parts.append(f"OCR文字（可能不完整）：{ocr_text[:500]}")

        context = "\n".join(context_parts) if context_parts else "无额外信息"

        messages = [
            {"role": "system", "content": (
                "你是伴伴的视觉模块。你的唯一任务是：观察这张用户屏幕截图，"
                "用丰富的中文描述用户当前在做什么。\n"
                "要求：\n"
                "1. 描述长度尽量拉满到60个字左右，信息越丰富越好\n"
                "2. 包含：用户在什么应用里、具体在做什么操作、屏幕上可见的关键内容\n"
                "3. 要实事求是，不要猜测用户情绪\n"
                "4. 注意应用名称、窗口标题、屏幕上可见的文字、界面布局\n"
                "5. 输出格式：纯文本，一整段话，不要用 JSON，不要用列表\n"
                "6. 示例：用户正在VS Code中编辑Python代码，屏幕左侧是文件树，右侧编辑区显示正在编写一个处理用户登录的函数，底部终端显示测试运行结果"
            )},
            {"role": "user", "content": (
                f"请分析这张截图。\n\n上下文信息：\n{context}\n\n"
                f"请用一段话（60字左右）尽可能详细地描述用户当前在做什么："
            )},
        ]
        # 降级：用主模型（DeepSeek）基于文字信息分析
        fallback_messages = [
            {"role": "system", "content": (
                "你是伴伴的屏幕分析模块。你无法直接看到屏幕截图，"
                "但会收到应用名称、窗口标题和OCR文字信息。"
                "请根据这些信息，用丰富的中文描述用户当前可能在做什么。\n"
                "要求：\n"
                "1. 描述长度尽量拉满到60个字左右，信息越丰富越好\n"
                "2. 包含：用户在什么应用里、具体在做什么、可见的关键内容\n"
                "3. 要实事求是，不要猜测用户情绪\n"
                "4. 输出格式：纯文本，一整段话，不要用JSON，不要用列表"
            )},
            {"role": "user", "content": (
                f"请根据以下信息分析用户当前在做什么：\n\n{context}\n\n"
                f"请用一段话（60字左右）尽可能详细地描述："
            )},
        ]

        try:
            # 优先用视觉模型
            if self.vision_configured:
                try:
                    result = self.chat_with_image(messages, image_path=image_path, temperature=0.3)
                    return result.strip()
                except Exception as vision_err:
                    print(f"[AI] 视觉模型调用失败，降级到文字分析: {vision_err}")
                    # 视觉模型失败，降级到文字分析
                    result = self.chat(fallback_messages, temperature=0.3, max_tokens=150)
                    return result.strip()
            else:
                # 未配置视觉模型，直接用主模型（DeepSeek）基于文字信息分析
                result = self.chat(fallback_messages, temperature=0.3, max_tokens=150)
                return result.strip()
        except Exception as e:
            # 所有分析方式都失败，返回友好的兜底描述
            print(f"[AI] 截图分析完全失败: {e}")
            fallback_desc = f"用户正在使用{app_name or '电脑'}"
            if window_title:
                fallback_desc += f"，窗口标题：{window_title[:30]}"
            return fallback_desc

    def check_activity_continuity(self, recent_records: list) -> dict:
        """DeepSeek 连续性判断：用户是否还在持续做同一件事？

        快速模式下，每积累几张截图就调用一次，判断用户当前状态趋势，
        用于在交互界面给出实时反馈。

        Args:
            recent_records: 最近的截图记录列表，每项含 app_name, window_title, ai_analysis, created_at

        Returns:
            {
              "is_continuing": bool,          # 是否在持续做同一件事
              "activity": "当前在做的事情",    # 一句话概括
              "duration_minutes": int,        # 估算已持续多少分钟
              "trend": "focus_building" | "maintaining" | "distracting" | "switching",
              "feedback": "简短反馈（15字以内）",  # 给UI状态条用的
              "suggestion": "建议伴伴说的话"       # 空字符串表示不说
            }
        """
        if not recent_records:
            return {
                "is_continuing": False,
                "activity": "暂无数据",
                "duration_minutes": 0,
                "trend": "maintaining",
                "feedback": "等待中...",
                "suggestion": "",
            }

        # 构建输入文本
        record_texts = []
        for i, rec in enumerate(recent_records):
            parts = []
            time_str = rec.get("created_at", "")
            if time_str:
                try:
                    from datetime import datetime
                    dt = datetime.fromisoformat(time_str)
                    time_str = dt.strftime("%H:%M")
                except Exception:
                    pass
            parts.append(f"【截图{i+1} {time_str}】")
            if rec.get("app_name"):
                parts.append(f"应用：{rec['app_name']}")
            if rec.get("window_title"):
                parts.append(f"窗口：{rec['window_title'][:60]}")
            if rec.get("ai_analysis"):
                analysis = str(rec["ai_analysis"])[:200].replace("\n", " ")
                parts.append(f"画面描述：{analysis}")
            record_texts.append(" ".join(parts))

        all_text = "\n\n".join(record_texts)

        messages = [
            {"role": "system", "content": (
                "你是「伴伴」的实时状态感知模块。用户每隔1-3分钟会截一次屏，"
                "现在给你连续几张截图的分析结果，请你判断：用户是不是在持续做同一件事？"
                "状态趋势是怎样的？\n\n"
                "输出要求（严格 JSON 格式，不要其他文字）：\n"
                "{\n"
                '  "is_continuing": true/false,\n'
                '  "activity": "当前在做的事情（10字以内）",\n'
                '  "duration_minutes": 估算已持续多少分钟（整数）,\n'
                '  "trend": "focus_building",  // 渐入佳境，越来越专注\n'
                '           "maintaining",      // 稳定保持\n'
                '           "distracting",      // 有点分心了\n'
                '           "switching"         // 切换了任务\n'
                '  "feedback": "给界面的简短状态（12字以内，比如「专注编码中」「有点走神」「刚切换任务」）",\n'
                '  "suggestion": "建议伴伴说的话（30字以内，语气温柔。如果不需要说话就返回空字符串）"\n'
                "}\n\n"
                "规则：\n"
                "1. 根据应用、窗口标题和画面描述的变化程度判断是否在做同一件事\n"
                "2. trend 要准确反映趋势：越来越专注/稳定/分心/切换了\n"
                "3. feedback 要短，适合放在小状态栏里\n"
                "4. suggestion 不要太频繁，只有在值得说的时候才说（比如连续专注很久可以提醒休息，分心了可以轻轻鼓励，切换任务可以说加油）\n"
                "5. 语气温柔，像朋友一样，不要说教"
            )},
            {"role": "user", "content": (
                f"以下是最近 {len(recent_records)} 张截图的信息：\n\n"
                f"{all_text}\n\n"
                f"请按要求输出 JSON："
            )},
        ]

        try:
            result = self.chat(messages, temperature=0.7, max_tokens=300)
            result = result.strip()

            import json as _json
            try:
                parsed = _json.loads(result)
                if isinstance(parsed, dict) and "is_continuing" in parsed:
                    return parsed
            except Exception:
                # 尝试提取 JSON 部分
                if "{" in result and "}" in result:
                    start = result.find("{")
                    end = result.rfind("}") + 1
                    try:
                        parsed = _json.loads(result[start:end])
                        if isinstance(parsed, dict) and "is_continuing" in parsed:
                            return parsed
                    except Exception:
                        pass

            # 兜底返回
            return {
                "is_continuing": True,
                "activity": "工作中",
                "duration_minutes": len(recent_records) * 2,
                "trend": "maintaining",
                "feedback": "工作中",
                "suggestion": "",
            }
        except Exception as e:
            print(f"[AI] 连续性判断失败: {e}")
            return {
                "is_continuing": True,
                "activity": "工作中",
                "duration_minutes": 0,
                "trend": "maintaining",
                "feedback": "分析中...",
                "suggestion": "",
            }

    def companion_check(self, day_context: str,
                        yesterday_summary: str = "",
                        user_memory: str = "",
                        weekly_digest: str = "") -> dict:
        """主模型：根据全天上下文 + 长期记忆 + 周度摘要，判断是否该主动说话

        Args:
            day_context: 全天活动摘要（JSON数组，每条含 time/app/description）
            yesterday_summary: 昨日活动摘要（跨天记忆，可选）
            user_memory: 用户长期画像摘要（人格+认知，可选）
            weekly_digest: 周度记忆摘要（~400字，过去一周的压缩记忆，可选）

        Returns:
            {"should_speak": bool, "message": str, "reason": str}
        """
        now_time = __import__('datetime').datetime.now().strftime("%H:%M")

        # 构建长期记忆段落
        memory_section = ""
        has_memory = user_memory or yesterday_summary or weekly_digest
        if has_memory:
            memory_parts = ["## 你的长期记忆（你认识这个人，不是第一次见面）"]
            if weekly_digest:
                memory_parts.append(f"### 过去一周的记忆\n{weekly_digest}")
            if user_memory:
                memory_parts.append(f"### 用户画像\n{user_memory}")
            if yesterday_summary:
                memory_parts.append(f"### 昨日活动\n{yesterday_summary}")
            memory_parts.append("\n请基于你对这个人的了解，给出更有针对性的关心和建议。")
            memory_section = "\n\n".join(memory_parts) + "\n\n"

        messages = [
            {"role": "system", "content": (
                "你是「伴伴」，一个温柔贴心的 AI 生活伴侣。\n"
                "你静默陪伴用户一整天，每隔一段时间你会收到用户的「全天活动摘要」。\n"
                "你认识这个人，你知道 TA 的性格、工作方式和偏好。\n"
                "你的任务：判断现在是不是该主动跟用户说句话的时机。\n\n"
                "## 判断标准\n"
                "你应该说话的场景：\n"
                "- 用户连续工作/学习超过 60 分钟 → 轻轻提醒休息\n"
                "- 用户切换到了娱乐/社交应用（说明在放松）→ 不说，不打扰\n"
                "- 距离上次你的发言已经超过 30 分钟，且用户有明显活动变化 → 可以说话\n"
                "- 用户从工作切换到了空闲/桌面 → 可以轻轻问一句\n"
                "- 时间到了中午、傍晚等关键节点 → 可以关心吃饭/休息\n\n"
                "你不应该说话的场景：\n"
                "- 你在最近 15 分钟内已经说过话了\n"
                "- 用户正在全屏看视频/游戏（不要打断）\n"
                "- 只有一两条记录，信息太少，无法判断\n"
                "- 没有什么特别值得说的\n\n"
                "## 说话要求\n"
                "- 如果决定说话，要像朋友一样自然，不要说教\n"
                "- 可以提及用户在做什么（说明你在默默陪伴），但不要像监控报告\n"
                "- 基于你对用户的长期了解，给出个性化的关心（如知道 TA 习惯晚睡就别催早起）\n"
                "- 消息要短，20-40 字，像微信消息\n"
                "- 你不应该每次都说话，沉默也是陪伴\n\n"
                "## 输出格式\n"
                "返回 JSON：\n"
                '{"should_speak": true/false, "message": "如果说话就说这句", "reason": "为什么做这个决定"}'
            )},
            {"role": "user", "content": (
                f"现在是 {now_time}。\n\n"
                + (memory_section if memory_section else "")
                + f"以下是用户今天的活动摘要（按时间排序）：\n{day_context}\n\n"
                f"请判断是否该主动说话："
            )},
        ]
        try:
            result = self.chat(messages, temperature=0.6, max_tokens=200, json_mode=True)
            return json.loads(result)
        except Exception as e:
            return {"should_speak": False, "reason": str(e)}

    def generate_ideas(self, voice_text: str) -> list:
        """主模型：根据语音输入生成 2-4 个小想法/灵感卡片

        Args:
            voice_text: 语音识别出的文字

        Returns:
            [{"title": "简洁标题", "detail": "展开的想法", "emoji": "💡"}, ...]
        """
        messages = [
            {"role": "system", "content": (
                "你是「伴伴」，一个温柔、有创意、懂人心的生活伙伴。\n"
                "用户刚刚说了一段话，语音识别转成了文字。你需要根据这段话，\n"
                "发散出 2-4 个小想法，像朋友聊天时自然冒出的灵感碎片。\n\n"
                "## 你的风格\n"
                "- 温暖但不油腻，有创意但不浮夸\n"
                "- 像朋友听完你的话后，轻轻接了一句「诶，你有没有想过…」\n"
                "- 不评判、不说教、不命令\n\n"
                "## 想法类型参考\n"
                "- 如果用户说了具体要做的事 → 给一个做这件事的小技巧或新角度\n"
                "- 如果用户表达了情绪 → 温柔的回应 + 一个小建议\n"
                "- 如果用户说了困惑 → 一个值得思考的新视角\n"
                "- 如果用户只是碎碎念 → 从碎碎念里发现一个有趣的点展开\n"
                "- 如果用户说了计划 → 补充一个用户可能没注意到的细节\n\n"
                "## 返回格式\n"
                "返回 JSON 数组，2-4 个元素：\n"
                '{"title": "8字以内的简洁标题", "detail": "展开的想法，像朋友聊天一样自然，30字以内", "emoji": "一个贴切的emoji"}\n\n'
                "只返回 JSON 数组，不要其他文字。"
            )},
            {"role": "user", "content": f"用户说：{voice_text}\n\n请生成几个小想法："},
        ]
        try:
            result = self.chat(messages, temperature=0.8, max_tokens=500, json_mode=True)
            ideas = json.loads(result)
            if isinstance(ideas, list):
                return ideas
            return []
        except Exception as e:
            print(f"[伴伴] 生成想法失败: {e}")
            return []

    def generate_review_insight(self, events: list, profile_summary: str = "") -> str:
        """主模型：生成每日复盘"""
        events_text = "\n".join(
            f"- {e.get('timestamp', '')[:16]} {e.get('app_name', '')} "
            f"- {e.get('window_title', '')} ({e.get('duration', 0)}秒)"
            for e in events[-30:]
        )
        messages = [
            {"role": "system", "content": (
                "你是'伴伴'，温柔的生活伴侣。请根据用户今天的活动记录，"
                "生成一段温柔的每日复盘。包含：1）一个温暖的整体感受 2）一个值得注意的模式 3）一句鼓励的话。"
                "用 JSON 返回：{\"feeling\": \"\", \"pattern\": \"\", \"encouragement\": \"\"}"
            )},
            {"role": "user", "content": f"用户画像：{profile_summary}\n\n今日活动记录：\n{events_text}\n\n请生成复盘："},
        ]
        return self.chat(messages, temperature=0.7, json_mode=True)
