"""AI 服务"""
import json
import httpx
from typing import List, Optional
from app.config import settings
from app.core.exceptions import AIServiceError
from app.models import Friend, Memory, IDENTITY_MAP, SPEAKING_STYLE_MAP


class AIService:
    """AI 服务"""

    def __init__(self):
        self.base_url = settings.ai_base_url
        self.api_key = settings.ai_api_key
        self.model = settings.ai_model

    async def chat(
        self,
        friend: Friend,
        conversation_history: List[dict],
        user_message: str,
        recent_memories: List[str],
    ) -> str:
        """生成 AI 回复（基础聊天，非流式）"""

        # 构建系统提示词
        system_prompt = self._build_system_prompt(friend, recent_memories)

        # 构建消息列表
        messages = [{"role": "system", "content": system_prompt}]

        # 添加对话历史（最近 10 条）
        for msg in conversation_history[-10:]:
            messages.append({
                "role": msg.role,
                "content": msg.content,
            })

        # 添加用户消息
        messages.append({"role": "user", "content": user_message})

        # 调用 AI
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 500,  # 限制回复长度，让回复更精简
                        "top_p": 0.9,
                    },
                )
                response.raise_for_status()
                result = response.json()

            content = result["choices"][0]["message"]["content"]
            return content.strip()

        except httpx.HTTPError as e:
            raise AIServiceError(f"AI 服务请求失败: {str(e)}")
        except (KeyError, IndexError) as e:
            raise AIServiceError(f"AI 服务响应格式错误: {str(e)}")

    async def extract_memories(
        self,
        friend: Friend,
        conversation_turns: List[dict],
    ) -> List[dict]:
        """从对话中提取记忆"""

        # 构建提取记忆的提示词
        prompt = self._build_memory_extraction_prompt(conversation_turns)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 500,
                    },
                )
                response.raise_for_status()
                result = response.json()

            content = result["choices"][0]["message"]["content"]

            # 尝试解析 JSON
            try:
                memories = json.loads(content)
                # 验证格式
                if isinstance(memories, list):
                    validated = []
                    for m in memories:
                        if isinstance(m, dict) and "content" in m:
                            validated.append({
                                "content": m["content"],
                                "importance": min(5, max(1, m.get("importance", 3))),
                            })
                    return validated
            except json.JSONDecodeError:
                pass

            return []

        except Exception:
            return []

    def _build_system_prompt(self, friend: Friend, recent_memories: List[str]) -> str:
        """构建系统提示词"""
        identity_label = IDENTITY_MAP.get(friend.identity, friend.identity)
        speaking_style_label = SPEAKING_STYLE_MAP.get(friend.speaking_style, "自然日常")
        personality_traits = "、".join(friend.personality_traits) if friend.personality_traits else "热情友善"

        prompt = f"""你是一个名叫 {friend.name} 的 AI {identity_label}。

【你的性格特点】
{personality_traits}

【你的说话风格】
{speaking_style_label}，回复要自然、口语化，像真实的朋友聊天一样。

"""

        # 添加记忆上下文
        if recent_memories:
            memories_text = "\n".join([f"- {m}" for m in recent_memories[:5]])
            prompt += f"""【你对用户的了解】
{memories_text}

"""

        prompt += """【回复要求】
1. 保持角色一致性，不要跳出角色
2. 回复要简短精炼，像正常朋友聊天一样（1-3句话为宜）
3. 适度使用表情符号增加亲切感，但不要过多
4. 不要编造关于自己的信息
5. 如果用户说的不清楚，可以友好地询问
"""

        return prompt

    def _build_memory_extraction_prompt(self, conversation_turns: List[dict]) -> str:
        """构建记忆提取提示词"""

        # 将对话格式化为文本
        dialogue_text = ""
        for turn in conversation_turns:
            role = "用户" if turn.get("role") == "user" else friend.name
            dialogue_text += f"{role}：{turn.get('content')}\n"

        prompt = f"""请分析以下对话，提取关于用户的重要信息（如喜好、习惯、重要事件、个人信息等）。

对话内容：
{dialogue_text}

要求：
1. 只提取确实重要的信息，不要过度解读
2. 如果对话中没有值得记忆的内容，返回空数组 []
3. 每条记忆要简洁明了（20字以内）
4. 返回格式：JSON数组，每项包含 content（记忆内容）和 importance（重要程度1-5）

示例输出：
[
  {{"content": "用户喜欢在加班后吃火锅", "importance": 3}},
  {{"content": "用户的生日是3月15日", "importance": 5}}
]

请直接返回 JSON，不要有其他文字："""

        return prompt
