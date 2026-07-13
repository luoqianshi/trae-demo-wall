"""LLM 客户端封装。

- Agnes AI: 文本生成（剧本分析、角色/场景/道具提示词、Agent 系统提示词、电影故事板提示词、3D 场景生成）
- 降级到 DeepSeek V4（当 Agnes API Key 未配置时）
- 图片生成见 image_client.py。
"""
from __future__ import annotations

import json
import logging
from typing import Any

from openai import AsyncOpenAI

from app.config import settings
from app.services.rate_limiter import acquire

logger = logging.getLogger(__name__)

# ===== 客户端单例 =====
_deepseek_client: AsyncOpenAI | None = None


def get_deepseek_client() -> AsyncOpenAI:
    """文本客户端。优先用 Agnes，降级到 DeepSeek。两者都兼容 OpenAI 格式。"""
    global _deepseek_client
    if _deepseek_client is None:
        if settings.agnes_api_key:
            _deepseek_client = AsyncOpenAI(
                api_key=settings.agnes_api_key,
                base_url=settings.agnes_base_url,
            )
        else:
            _deepseek_client = AsyncOpenAI(
                api_key=settings.deepseek_api_key,
                base_url=settings.deepseek_base_url,
            )
    return _deepseek_client


def _text_model() -> str:
    """返回当前使用的文本模型名。优先 Agnes，降级 DeepSeek。"""
    if settings.agnes_api_key:
        return settings.agnes_text_model
    return settings.deepseek_model


# ===== 剧本分析 (Agnes / DeepSeek) =====

SCRIPT_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "characters": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["name", "description"],
            },
        },
        "scenes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["name", "description"],
            },
        },
        "props": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["name", "description"],
            },
        },
        "episodes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "plot_summary": {"type": "string"},
                    "duration_seconds": {"type": "integer"},
                    "involved_character_names": {"type": "array", "items": {"type": "string"}},
                    "involved_scene_names": {"type": "array", "items": {"type": "string"}},
                    "involved_prop_names": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["title", "plot_summary", "duration_seconds"],
            },
        },
    },
    "required": ["characters", "scenes", "props", "episodes"],
}

SCRIPT_ANALYSIS_PROMPT = """你是一名专业的 AI 短剧剧本分析师。请严格分析用户提供的剧本文本，提取以下结构化信息并输出 JSON：

1. characters: 剧中所有出场角色数组。每个角色包含：
   - name: 角色姓名（必须与剧本中一致）
   - description: 外貌/性格/穿着的详细中文描述，要求具体到可以画图：性别、年龄、身高体型、发型发色、 facial features、服装款式/颜色/材质、配饰、表情气质、时代背景

2. scenes: 剧中所有场景数组。每个场景包含：
   - name: 场景名称（如“老宅客厅”）
   - description: 场景视觉描述，包含环境、空间结构、光线方向/色温、天气/时间、氛围情绪、色调、重要陈设

3. props: 剧中重要道具/配件数组。每个道具包含：
   - name: 道具名称
   - description: 道具外观描述，包含形状、尺寸、材质、颜色、磨损/光泽、功能暗示

4. episodes: 将剧本拆解为多集，每集字段如下：
   - title: 集标题
   - plot_summary: 该集剧情摘要（80~150 字）
   - duration_seconds: 预估时长（秒），默认 60 秒，可按剧情需要调整
   - involved_character_names: 该集涉及的角色 name 列表，必须来自 characters 中的 name
   - involved_scene_names: 该集涉及的场景 name 列表，必须来自 scenes 中的 name
   - involved_prop_names: 该集涉及的道具 name 列表，必须来自 props 中的 name

输出要求：
- 只输出合法 JSON，不要 Markdown 代码块，不要任何解释
- 字段名必须与上述完全一致
- 不要遗漏任何出场角色、场景或关键道具
- 描述用中文，详细到可以直接用于 AI 生图"""


async def analyze_script(script_text: str) -> dict[str, Any]:
    """用 Agnes（降级 DeepSeek）分析剧本，返回结构化 JSON。"""
    client = get_deepseek_client()
    await acquire("text", settings.text_interval)
    resp = await client.chat.completions.create(
        model=_text_model(),
        messages=[
            {"role": "system", "content": SCRIPT_ANALYSIS_PROMPT},
            {"role": "user", "content": script_text},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    content = resp.choices[0].message.content or "{}"
    return json.loads(content)


# ===== 资产提示词生成 (Agnes / DeepSeek) =====

ASSET_PROMPT_INSTRUCTIONS = {
    "character": """为这个角色生成一张高质量角色设定图（三视图：正面、侧面、背面在同一画面横向排列）。
要求：
- 用英文输出一条完整的生图提示词
- 必须包含：全身/半身比例、性别、年龄、发型/发色、面部特征、表情、服装款式与颜色/材质、配饰、鞋子、体态姿势
- 风格统一为 cinematic realistic / semi-realistic，白色或浅灰色背景，三视图 layout
- 加入画面质量词：highly detailed, professional character design sheet, clean lines, consistent design
- 只输出提示词本身，不要解释、不要引号""",
    "scene": """为场景生成一张电影级场景图。
要求：
- 用英文输出一条完整的生图提示词
- 必须包含：具体环境、空间层次、时间/天气、主光源方向与色温、氛围情绪、构图（广角/中景）、色调、重要视觉元素
- 风格统一为 cinematic, photorealistic, movie still, high production value
- 只输出提示词本身，不要解释、不要引号""",
    "prop": """为道具生成一张产品展示图，白色/纯色背景，居中打光。
要求：
- 用英文输出一条完整的生图提示词
- 必须包含：形状、尺寸比例、材质、颜色、表面纹理、磨损/光泽、功能性细节
- 风格统一为 product photography, studio lighting, highly detailed, photorealistic
- 只输出提示词本身，不要解释、不要引号""",
}


def _clean_prompt(text: str) -> str:
    """去掉 LLM 可能包裹的代码块或引号。"""
    text = (text or "").strip()
    if text.startswith("```"):
        # 去掉 ```python 等围栏
        parts = text.split("```", 2)
        text = (parts[-1] if len(parts) > 1 else text).strip()
    return text.strip('"').strip("'").strip()


async def generate_asset_prompt(asset_type: str, name: str, description: str) -> str:
    """用 Agnes（降级 DeepSeek）为资产生成英文生图提示词。"""
    client = get_deepseek_client()
    instruction = ASSET_PROMPT_INSTRUCTIONS.get(asset_type, "生成该资产的图片。输出英文提示词。")
    await acquire("text", settings.text_interval)
    resp = await client.chat.completions.create(
        model=_text_model(),
        messages=[
            {
                "role": "system",
                "content": "You are an expert prompt engineer for image generation models (agnes-image-2.1-flash). "
                           "Translate the user's Chinese asset description into ONE high-quality English image prompt. "
                           "Output ONLY the prompt itself. No Markdown, no code block, no quotes, no explanation.",
            },
            {"role": "user", "content": f"Asset type: {asset_type}\nName: {name}\nDescription: {description}\n\nInstruction: {instruction}"},
        ],
        temperature=0.5,
    )
    return _clean_prompt(resp.choices[0].message.content)


# ===== 故事板提示词生成 (Agnes / DeepSeek) =====

STORYBOARD_PROMPT_INSTRUCTION = """你是一名资深电影分镜师。请根据剧情和上下文，为当前故事板生成一段高质量英文生图提示词，用于 agnes-image-2.1-flash 生成电影故事板画面。

要求：
- 16:9 横屏电影构图，cinematic movie still，high production value
- 明确镜头类型（ extreme close-up / close-up / medium shot / wide shot / establishing shot ）
- 描述角色动作、表情、视线方向、服装细节，确保与前一镜/角色设定保持一致
- 描述场景环境、光线方向/色温、氛围、色调
- 如果提供了前一故事板描述，必须在构图、角色位置、光线、服装上保持视觉连续性
- 提示词只输出一条英文 prompt，不要解释、不要 Markdown、不要引号
- 不要出现任何中文"""


async def generate_storyboard_prompt(
    episode_plot: str,
    storyboard_index: int,
    total_storyboards: int,
    prev_storyboard_desc: str | None,
    involved_assets: dict[str, list[str]],
) -> str:
    """用 Agnes（降级 DeepSeek）生成单个故事板的生图提示词。"""
    client = get_deepseek_client()
    parts = [
        f"本集剧情: {episode_plot}",
        f"这是第 {storyboard_index}/{total_storyboards} 个故事板（每个 15 秒）",
    ]
    if prev_storyboard_desc:
        parts.append(f"前一故事板画面描述: {prev_storyboard_desc}")
    if involved_assets.get("characters"):
        parts.append(f"涉及角色: {', '.join(involved_assets['characters'])}")
    if involved_assets.get("scenes"):
        parts.append(f"涉及场景: {', '.join(involved_assets['scenes'])}")
    if involved_assets.get("props"):
        parts.append(f"涉及道具: {', '.join(involved_assets['props'])}")

    await acquire("text", settings.text_interval)
    resp = await client.chat.completions.create(
        model=_text_model(),
        messages=[
            {"role": "system", "content": STORYBOARD_PROMPT_INSTRUCTION},
            {"role": "user", "content": "\n".join(parts)},
        ],
        temperature=0.6,
    )
    return _clean_prompt(resp.choices[0].message.content)
