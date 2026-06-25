"""公式识别服务 - 调用多模态大模型进行公式识别

支持以下供应商（填入 .env 即可）：
  1. OpenAI (GPT-4o / GPT-4V)
     OPENAI_BASE_URL=https://api.openai.com/v1
     VLM_MODEL=gpt-4o

  2. DeepSeek (deepseek-chat 支持 vision)
     OPENAI_BASE_URL=https://api.deepseek.com/v1
     VLM_MODEL=deepseek-chat

  3. 阿里云百炼 (Qwen-VL)
     OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
     VLM_MODEL=qwen-vl-max

  4. 智谱 GLM (GLM-4V)
     OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
     VLM_MODEL=glm-4v

  5. 其他 OpenAI 兼容 API
     OPENAI_BASE_URL=<你的 API 地址>
     VLM_MODEL=<你的模型名称>
"""
import base64
import time
import io
from typing import Optional
from PIL import Image
import httpx
from app.config import get_settings

settings = get_settings()

# 公式识别专用 System Prompt
SYSTEM_PROMPT = """你是一个专业的 LaTeX 公式识别助手。请将图片中的数学公式转换为精确的 LaTeX 代码。

要求：
1. 保持原始公式的完整结构（分数、根号、求和、积分、矩阵、括号等）
2. 正确使用 \\left 和 \\right 配对括号
3. 多行公式使用 align 或 gather 环境
4. 特殊符号使用标准 LaTeX 命令
5. 仅输出 LaTeX 代码，不要添加任何解释或 markdown 标记
6. 对于不确定的符号，保留原样并标注
7. 矩阵使用 matrix、bmatrix 或 pmatrix 环境"""


def preprocess_image(image_bytes: bytes) -> bytes:
    """图像预处理：缩放、转灰度、增强对比度"""
    image = Image.open(io.BytesIO(image_bytes))

    # 转换 RGBA 为 RGB
    if image.mode == "RGBA":
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        image = background
    elif image.mode != "RGB":
        image = image.convert("RGB")

    # 限制最大尺寸
    max_size = settings.MAX_IMAGE_SIZE
    if max(image.size) > max_size:
        ratio = max_size / max(image.size)
        new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
        image = image.resize(new_size, Image.LANCZOS)

    output = io.BytesIO()
    image.save(output, format="JPEG", quality=settings.IMAGE_QUALITY)
    return output.getvalue()


def image_to_base64(image_bytes: bytes) -> str:
    """将图片字节转为 base64 data URL"""
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def validate_api_config() -> None:
    """校验 API 配置，未配置时给出明确提示"""
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "sk-your-api-key-here":
        raise ValueError(
            "未配置 API Key。请在 yanyiji/backend/.env 文件中设置 OPENAI_API_KEY。\n\n"
            "常用供应商配置示例：\n"
            "  # OpenAI\n"
            "  OPENAI_API_KEY=sk-xxx\n"
            "  OPENAI_BASE_URL=https://api.openai.com/v1\n"
            "  VLM_MODEL=gpt-4o\n\n"
            "  # DeepSeek\n"
            "  OPENAI_API_KEY=sk-xxx\n"
            "  OPENAI_BASE_URL=https://api.deepseek.com/v1\n"
            "  VLM_MODEL=deepseek-chat\n\n"
            "  # 阿里云百炼\n"
            "  OPENAI_API_KEY=sk-xxx\n"
            "  OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1\n"
            "  VLM_MODEL=qwen-vl-max\n\n"
            "  # 智谱 GLM\n"
            "  OPENAI_API_KEY=xxx\n"
            "  OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4\n"
            "  VLM_MODEL=glm-4v"
        )


async def recognize_formula(image_bytes: bytes) -> dict:
    """
    调用 VLM 识别公式，返回 LaTeX 代码和元信息

    Returns:
        dict: {
            "latex": str,
            "confidence": float,
            "processing_time_ms": int
        }
    """
    # 校验 API 配置
    validate_api_config()

    start_time = time.time()

    # 预处理图片
    processed = preprocess_image(image_bytes)
    data_url = image_to_base64(processed)

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                f"{settings.OPENAI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.VLM_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "请识别以下图片中的数学公式，输出 LaTeX 代码：",
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {"url": data_url, "detail": "high"},
                                },
                            ],
                        },
                    ],
                    "max_tokens": 2048,
                    "temperature": 0.1,  # 低温度确保输出稳定
                },
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            detail = ""
            try:
                detail = e.response.json()
            except Exception:
                detail = e.response.text[:500]

            if status == 401:
                raise ValueError(
                    f"API Key 认证失败 (401)。请检查 .env 中的 OPENAI_API_KEY 是否正确。\n"
                    f"当前 BASE_URL: {settings.OPENAI_BASE_URL}\n"
                    f"错误详情: {detail}"
                )
            elif status == 404:
                raise ValueError(
                    f"模型或接口不存在 (404)。请检查 .env 中的 VLM_MODEL 和 OPENAI_BASE_URL 是否正确。\n"
                    f"当前模型: {settings.VLM_MODEL}\n"
                    f"当前地址: {settings.OPENAI_BASE_URL}\n"
                    f"错误详情: {detail}"
                )
            elif status == 429:
                raise ValueError(
                    f"API 调用频率限制 (429)。请稍后重试或检查账户配额。\n"
                    f"错误详情: {detail}"
                )
            else:
                raise ValueError(
                    f"API 调用失败 (HTTP {status})。\n"
                    f"当前地址: {settings.OPENAI_BASE_URL}\n"
                    f"错误详情: {detail}"
                )

        result = response.json()

    latex_code = result["choices"][0]["message"]["content"].strip()
    # 移除可能的 markdown 代码块标记
    if latex_code.startswith("```latex"):
        latex_code = latex_code[8:]
    if latex_code.startswith("```"):
        latex_code = latex_code[3:]
    if latex_code.endswith("```"):
        latex_code = latex_code[:-3]
    latex_code = latex_code.strip()

    processing_time = int((time.time() - start_time) * 1000)

    # 估算置信度（基于 token 使用情况）
    usage = result.get("usage", {})
    total_tokens = usage.get("total_tokens", 0)
    confidence = min(0.99, 0.7 + (total_tokens / 500) * 0.2) if total_tokens > 0 else 0.85

    return {
        "latex": latex_code,
        "confidence": round(confidence, 4),
        "processing_time_ms": processing_time,
    }


async def recognize_formula_batch(
    images: list[bytes],
    on_progress: Optional[callable] = None,
) -> list[dict]:
    """批量识别多个公式"""
    results = []
    total = len(images)

    for i, img_bytes in enumerate(images):
        result = await recognize_formula(img_bytes)
        results.append(result)
        if on_progress:
            await on_progress(i + 1, total, result)

    return results