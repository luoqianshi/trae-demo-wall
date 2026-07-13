"""3D 场景一句话生成服务。

- Agnes AI（降级 DeepSeek）: 把用户自然语言描述解析为结构化场景 JSON
- 输出 SceneDescription，前端用 Three.js 程序化几何体组合渲染。
"""
from __future__ import annotations

import json
import logging
from typing import Any

import json_repair

from app.config import settings
from app.services.openai_client import get_deepseek_client, _text_model
from app.services.rate_limiter import acquire

logger = logging.getLogger(__name__)


# ===== 场景描述 JSON Schema =====

SCENE_DESCRIPTION_SCHEMA = {
    "type": "object",
    "properties": {
        "sceneName": {"type": "string"},
        "background": {"type": "string"},
        "meshes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": [
                            "mountain", "lake", "waterfall", "rock", "tree",
                            "ground", "cloud", "river", "house", "platform",
                            "man", "woman", "table", "chair",
                        ],
                    },
                    "position": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "[x, y, z] 世界坐标，y 为高度",
                    },
                    "rotation": {
                        "type": "array",
                        "items": {"type": "number"},
                    },
                    "scale": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "[x, y, z] 缩放，单位约 1 米",
                    },
                    "color": {"type": "string"},
                    "action": {
                        "type": "string",
                        "description": "仅 man/woman 有效。人物动作描述，英文短语，如 standing/dancing/waving/sitting/running/arms_up/hands_on_hips/jumping/pointing/kneeling/looking_up。其他 type 忽略此字段。",
                    },
                },
                "required": ["type", "position", "scale", "color"],
            },
        },
        "suggestedCamera": {
            "type": "object",
            "properties": {
                "position": {"type": "array", "items": {"type": "number"}},
                "target": {"type": "array", "items": {"type": "number"}},
            },
            "required": ["position", "target"],
        },
    },
    "required": ["sceneName", "meshes"],
}

SCENE_GENERATION_PROMPT = """你是一名 3D 场景占位师。导演台需要用程序化几何体（cone/box/plane/sphere 等基础形状）搭出一个场景示意图，供后续截图给生图/视频模型参考。

用户会用一句话描述场景，请拆解为 5-20 个 mesh，输出结构化 JSON。坐标系：x 右、y 上、z 朝向用户（屏幕外为正 z）。1 单位 ≈ 1 米。

【重要约束】mesh 总数严格不超过 20 个。即使用户要求大量重复元素（如"100×100方阵""军队""人群""满山遍野"），也只用 1-3 个 mesh 代表性地表示，不要逐个生成。场景坐标系范围建议 x∈[-15,15]、z∈[-15,15]，不要把元素放到远离原点的地方（如 x=-200）。

支持的 mesh type（必须从此清单选）：
- mountain: 山体。渲染为 cone，scale 控制底径与高度，建议多个堆叠形成山峦
- lake: 湖面/池塘。渲染为躺平的 plane，半透明蓝色，y 接近 0
- river: 河流。渲染为躺平的长条 plane，半透明蓝绿色
- waterfall: 瀑布。渲染为竖直薄板 box，半透明白蓝色
- rock: 岩石。渲染为 dodecahedron，灰褐色
- tree: 树木。渲染为 cylinder 树干 + cone 树冠组合，绿色
- ground: 地面/草地。渲染为躺平的大 plane，绿色或土色
- cloud: 云。渲染为多个 sphere 组合，白色半透明
- house: 房屋。渲染为 box 主体 + cone 屋顶组合
- platform: 平台/台阶。渲染为躺平的 plane 或矮 box
- man: 男人。scale 约 [0.5, 1.8, 0.5]，color 为肤色/衣色。需填 action 字段描述动作（英文短语），如 standing/dancing/waving/sitting/running/arms_up/hands_on_hips/jumping/pointing/kneeling/looking_up。多个同类人物不同动作时各自填不同 action
- woman: 女人。同 man 但肩窄胯宽，scale 约 [0.45, 1.65, 0.45]，同样需填 action
- table: 桌子。渲染为 box 桌面 + 4 圆柱腿，scale 控制大小
- chair: 椅子。渲染为 box 座面 + box 靠背 + 4 圆柱腿

设计要点：
- 表现物体之间的空间关系即可，不需要精细
- 大场景（山、湖、瀑布）scale 通常 5-20
- 小物体（树、岩石、房屋、桌椅）scale 通常 0.5-3
- 人物（man/woman）scale 约 [0.5, 1.8, 0.5]，y 为脚底高度（通常 0）
- 重要物体可拆成多个 mesh（如雪山主峰 + 副峰 + 雪线）
- 颜色用十六进制色值（#rrggbb），符合物体真实色调
- 建议一个能看清全局的机位放入 suggestedCamera（position 朝场景斜上方，target 看场景中心）
- 【重要】不要生成 ground 类型的 mesh，除非用户在提示词里明确要求地面/草地/地板/大地（视口已有参考网格，无需额外地面）

输出要求：
- 只输出合法 JSON，不要 Markdown 代码块，不要任何解释
- 字段名必须与上述完全一致
- background 字段为场景背景色（如天空蓝 #87CEEB、夜空 #0a1a3a），可选"""


def _normalize_scene_description(data: dict[str, Any]) -> dict[str, Any]:
    """规范化 Agnes/DeepSeek 返回，兼容常见字段名偏差。

    - meshes 可能被命名为 elements / objects / items
    - sceneName 可能缺失
    - 丢弃不在枚举内的 mesh type
    """
    # mesh 列表字段名兼容
    meshes = data.get("meshes")
    if not meshes:
        for alt in ("elements", "objects", "items"):
            if data.get(alt):
                meshes = data[alt]
                break
    data["meshes"] = meshes or []

    # sceneName 缺失时用默认值
    if not data.get("sceneName"):
        data["sceneName"] = "AI 场景"

    # 过滤掉不支持类型的 mesh
    valid_types = {
        "mountain", "lake", "waterfall", "rock", "tree",
        "ground", "cloud", "river", "house", "platform",
        "man", "woman", "table", "chair",
    }
    data["meshes"] = [m for m in data["meshes"] if m.get("type") in valid_types]

    # 强制限制 mesh 数量，防止返回过多元素导致前端卡顿
    MAX_MESHES = 20
    if len(data["meshes"]) > MAX_MESHES:
        logger.warning("mesh 数量 %d 超过上限 %d，截断", len(data["meshes"]), MAX_MESHES)
        data["meshes"] = data["meshes"][:MAX_MESHES]
    return data


async def generate_scene_description(prompt: str) -> dict[str, Any]:
    """用 Agnes（降级 DeepSeek）把一句话描述解析为 SceneDescription JSON。

    失败时抛出异常，由调用方转友好提示。
    """
    client = get_deepseek_client()
    await acquire("text", settings.text_interval)
    resp = await client.chat.completions.create(
        model=_text_model(),
        messages=[
            {"role": "system", "content": SCENE_GENERATION_PROMPT},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
        max_tokens=4096,
    )
    content = resp.choices[0].message.content or "{}"
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        # LLM 输出较长 JSON 时偶尔会缺少逗号/引号，用 json_repair 修复后重试
        logger.warning("场景描述 JSON 首次解析失败 (%s)，尝试 json_repair 修复", e)
        repaired = json_repair.repair_json(content, return_objects=False)
        try:
            data = json.loads(repaired)
        except json.JSONDecodeError as e2:
            logger.exception("场景描述 JSON 修复后仍解析失败: %s", content)
            raise ValueError(f"场景描述解析失败: {e2}") from e2
    return _normalize_scene_description(data)
