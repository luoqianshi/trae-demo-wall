"""FastAPI 后端入口。

接口：
  GET  /api/health            健康检查
  POST /api/analyze           需求分析
  POST /api/generate          图像生成
  POST /api/search            头像搜索
  POST /api/avatar/recommend  一站式推荐（前端主流程调用）

静态服务：
  /outputs/*                  生成的头像图片
  /                           前端 HTML（avatar_match_ai_demo.html）
"""
from __future__ import annotations

import logging
import asyncio

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings, PROJECT_DIR
from schemas import (
    AnalyzeRequest, GenerateRequest, DCGANGenerateRequest, SearchRequest, RecommendRequest,
    Analysis, GeneratedImage, HealthResponse, SearchResponse,
    RecommendResponse, ErrorResponse, MatchItem,
)
from services import intent_analyzer, prompt_builder, image_generator, avatar_search, cache
from services.dcgan_celeba_generator import (
    DCGANWeightsNotFoundError, DCGANTorchNotAvailableError,
)

# ============ 日志配置（绝不输出 API Key） ============
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("avatar.main")


# ============ 应用初始化 ============
app = FastAPI(title="一句话头像灵感站 后端", version="1.0.0")

# 允许前端跨域调用（便于直接双击 HTML 打开调试）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

settings = get_settings()

# 启动时打印安全配置快照（不含 Key）
logger.info("startup config: %s", settings.safe_log_dict())

# 挂载 outputs 静态目录：/outputs/xxx.svg
app.mount("/outputs", StaticFiles(directory=str(settings.output_path)), name="outputs")


# ============ 工具：本地降级时按需生成 SVG（已移除固定 Demo 占位） ============
# 原先的 _ensure_demo_svgs() 会预生成 demo_*.svg 占位文件，现已移除。
# 头像搜索在外部源不可用时，由 avatar_search._local_generated() 实时按需生成 SVG，
# 不再使用固定 Demo 占位数据。


# ============ 接口 ============

@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """健康检查。"""
    return HealthResponse(
        status="ok",
        service="avatar-match-ai-backend",
        image_provider=settings.image_provider,
        external_search_enabled=settings.enable_external_search,
    )


@app.post("/api/analyze", response_model=Analysis)
async def api_analyze(req: AnalyzeRequest) -> Analysis:
    """需求分析：把一句话拆成风格 / 颜色 / 主体 / 用途 / 推荐方向。"""
    text = req.text.strip()
    if len(text) > settings.max_input_length:
        raise HTTPException(status_code=400, detail=f"输入过长，最多 {settings.max_input_length} 字")
    return intent_analyzer.analyze(text)


@app.post("/api/generate", response_model=GeneratedImage)
async def api_generate(req: GenerateRequest) -> GeneratedImage:
    """图像生成：调用配置的 Provider，无 Key 时自动使用本地兜底。"""
    text = req.text.strip()
    if len(text) > settings.max_input_length:
        raise HTTPException(status_code=400, detail=f"输入过长，最多 {settings.max_input_length} 字")

    analysis = intent_analyzer.analyze(text)
    prompt, negative_prompt = prompt_builder.build_prompt(text, analysis)

    # 缓存命中则直接返回（按 prompt 哈希）
    cached = cache.get("generate", prompt)
    if cached:
        logger.info("generate cache hit")
        return GeneratedImage(**cached)

    # 超时控制
    try:
        gen = await asyncio.wait_for(
            asyncio.to_thread(
                image_generator.get_generator().generate,
                prompt, negative_prompt, req.size, analysis, text,
            ),
            timeout=settings.generate_timeout,
        )
    except asyncio.TimeoutError:
        logger.error("image generation timeout")
        raise HTTPException(status_code=504, detail="图像生成超时，请稍后重试")
    except Exception as e:
        logger.error("image generation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"图像生成失败：{e}")

    cache.set("generate", gen.model_dump(), prompt)
    return gen


@app.post("/api/generate/dcgan", response_model=GeneratedImage)
async def api_generate_dcgan(req: DCGANGenerateRequest) -> GeneratedImage:
    """DCGAN-CelebA 本地头像生成。

    完全本地运行，不调用外部 API。
    - 未安装 torch 时返回 503 + 清晰提示
    - 权重文件不存在时返回 503 + 清晰提示（不静默生成错误图片）
    - 同一文本默认稳定 seed；regenerate=True 换一张
    """
    text = req.text.strip()
    if len(text) > settings.max_input_length:
        raise HTTPException(status_code=400, detail=f"输入过长，最多 {settings.max_input_length} 字")

    analysis = intent_analyzer.analyze(text)
    prompt, negative_prompt = prompt_builder.build_prompt(text, analysis)

    from services.dcgan_celeba_generator import get_dcgan_generator
    gen = get_dcgan_generator()

    # 可用性预检：torch / 权重
    available, reason = gen.is_available()
    if not available:
        logger.warning("DCGAN unavailable: %s", reason)
        raise HTTPException(
            status_code=503,
            detail={"error": "DCGAN model weights not found", "message": reason},
        )

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                gen.generate,
                prompt, negative_prompt, req.size, analysis, text,
                req.regenerate, req.transparent,
            ),
            timeout=settings.generate_timeout,
        )
    except asyncio.TimeoutError:
        logger.error("DCGAN generation timeout")
        raise HTTPException(status_code=504, detail="DCGAN 生成超时，CPU 模式较慢，请稍后重试或减小尺寸")
    except (DCGANWeightsNotFoundError, DCGANTorchNotAvailableError) as e:
        logger.warning("DCGAN generation blocked: %s", e)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("DCGAN generation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"DCGAN 生成失败：{e}")

    return result


@app.post("/api/search", response_model=SearchResponse)
async def api_search(req: SearchRequest) -> SearchResponse:
    """头像搜索：优先授权明确的开源头像源，失败回退本地 Demo。"""
    text = req.text.strip()
    if len(text) > settings.max_input_length:
        raise HTTPException(status_code=400, detail=f"输入过长，最多 {settings.max_input_length} 字")

    analysis = intent_analyzer.analyze(text)

    # 缓存
    cache_key = f"{text}|{req.limit}"
    cached = cache.get("search", cache_key)
    if cached:
        logger.info("search cache hit")
        return SearchResponse(**cached)

    query, results = await avatar_search.search(text, analysis, req.limit)
    resp = SearchResponse(query=query, results=results)
    cache.set("search", resp.model_dump(), cache_key)
    return resp


@app.post("/api/avatar/recommend", response_model=RecommendResponse)
async def api_recommend(req: RecommendRequest) -> RecommendResponse:
    """一站式推荐：同时返回分析、生成头像、搜索匹配结果。前端主流程调用此接口。

    通过 provider 指定生成方式：local / external / dcgan-celeba-local。
    DCGAN 不可用（未装 torch / 无权重）时，生成部分返回 None，不影响搜索结果。
    """
    text = req.text.strip()
    if len(text) > settings.max_input_length:
        raise HTTPException(status_code=400, detail=f"输入过长，最多 {settings.max_input_length} 字")

    analysis = intent_analyzer.analyze(text)
    prompt, negative_prompt = prompt_builder.build_prompt(text, analysis)

    generated: GeneratedImage | None = None
    matches: list = []
    generation_error: str | None = None

    # 并发执行生成与搜索，互不阻塞
    tasks = []
    if req.generate:
        tasks.append(asyncio.create_task(_do_generate(prompt, negative_prompt, analysis, text, req.provider, req.regenerate)))
    if req.search:
        tasks.append(asyncio.create_task(_do_search(text, analysis, req.limit)))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, GeneratedImage):
            generated = r
        elif isinstance(r, tuple) and len(r) == 2:
            matches = r[1]
        elif isinstance(r, Exception):
            # 生成失败（如 DCGAN 权重缺失）时，generated 保持 None，搜索结果照常返回
            logger.warning("recommend sub-task failed: %s", r)
            generation_error = str(r)

    return RecommendResponse(analysis=analysis, generated=generated, matches=matches,
                             generation_error=generation_error)


async def _do_generate(prompt, negative_prompt, analysis, text, provider: str = "auto",
                       regenerate: bool = False) -> GeneratedImage:
    """执行生成。DCGAN provider 不可用时抛出异常，由调用方捕获。

    provider 解析：
      - "auto"/空 → 读 .env IMAGE_PROVIDER
      - "dcgan-celeba-local" / "external" / "local" → 显式指定
    """
    # 归一化 provider：auto/空 → 读配置
    raw = (provider or "").strip().lower()
    if raw in ("", "auto"):
        raw = (settings.image_provider or "local").strip().lower()

    # DCGAN 不走缓存（regenerate 需要不同结果）；local/external 走缓存
    if raw != "dcgan-celeba-local":
        cached = cache.get("generate", prompt)
        if cached:
            return GeneratedImage(**cached)

    if raw == "dcgan-celeba-local":
        from services.dcgan_celeba_generator import get_dcgan_generator
        gen = get_dcgan_generator()
        available, reason = gen.is_available()
        if not available:
            raise RuntimeError(f"DCGAN 不可用：{reason}")
        result = await asyncio.wait_for(
            asyncio.to_thread(
                gen.generate,
                prompt, negative_prompt, "512x512", analysis, text, regenerate, False,
            ),
            timeout=settings.generate_timeout,
        )
        return result

    gen = await asyncio.wait_for(
        asyncio.to_thread(
            image_generator.get_generator(raw).generate,
            prompt, negative_prompt, "512x512", analysis, text,
        ),
        timeout=settings.generate_timeout,
    )
    cache.set("generate", gen.model_dump(), prompt)
    return gen


async def _do_search(text, analysis, limit) -> tuple[str, list]:
    cache_key = f"{text}|{limit}"
    cached = cache.get("search", cache_key)
    if cached:
        return cached.get("query", ""), [MatchItem(**m) if isinstance(m, dict) else m for m in cached.get("results", [])]
    query, results = await avatar_search.search(text, analysis, limit)
    cache.set("search", {"query": query, "results": [r.model_dump() for r in results]}, cache_key)
    return query, results


# ============ 前端托管：根路径返回 HTML ============

HTML_PATH = PROJECT_DIR / "avatar_match_ai_demo.html"


@app.get("/")
async def index():
    """返回前端 HTML，便于通过 http://localhost:8000/ 直接访问。"""
    if not HTML_PATH.exists():
        raise HTTPException(status_code=404, detail="前端 HTML 文件未找到")
    return FileResponse(str(HTML_PATH), media_type="text/html")


# ============ 全局异常处理：返回结构化错误而非裸 500 ============
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(error="internal_error", detail=str(exc)).model_dump(),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
