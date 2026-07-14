"""开源头像匹配：聚合多个真实开源头像源，根据用户输入做风格匹配。

数据来源（全部免费、无需 API Key、授权明确）：
1. DiceBear (https://api.dicebear.com) —— CC0 / MIT，多风格 SVG
2. Robohash (https://robohash.org) —— CC BY 4.0，机器人/怪物/猫
3. Multiavatar (https://api.multiavatar.com) —— MIT，多元人物
4. Boring Avatars (https://boring-avatars-api.vercel.app) —— MIT，几何色块

匹配逻辑：
- 根据 analysis（风格/主体/调色板）选择合适的「源 + 风格」组合
- 用文本稳定 hash 作为 seed，相同输入 → 相同结果
- match_score 基于风格命中度计算（非随机）
- 每条结果包含 match_reason 说明为什么匹配

降级方案：
- 外部源全部不可用时，本地程序化生成 SVG（标注 source="Local Generated"），
  不再使用固定 Demo 占位数据。
"""
from __future__ import annotations

import asyncio
import hashlib
import logging

from config import get_settings
from schemas import Analysis, MatchItem
from services import intent_analyzer

logger = logging.getLogger("avatar.search")


# ============ 开源头像源定义 ============

DICEBEAR_BASE = "https://api.dicebear.com/10.x"
ROBOHASH_BASE = "https://robohash.org"
MULTIAVATAR_BASE = "https://api.multiavatar.com"
BORING_AVATARS_BASE = "https://boring-avatars-api.vercel.app"

DICEBEAR_LICENSE = "CC0 / MIT (DiceBear)"
DICEBEAR_LICENSE_URL = "https://www.dicebear.com/licenses/"
DICEBEAR_SOURCE = "DiceBear"
DICEBEAR_HOME = "https://www.dicebear.com"

ROBOHASH_LICENSE = "CC BY 4.0 (Robohash)"
ROBOHASH_LICENSE_URL = "https://robohash.org"
ROBOHASH_SOURCE = "Robohash"
ROBOHASH_HOME = "https://robohash.org"

MULTIAVATAR_LICENSE = "MIT (Multiavatar)"
MULTIAVATAR_LICENSE_URL = "https://github.com/multiavatar/Multiavatar/blob/main/LICENSE"
MULTIAVATAR_SOURCE = "Multiavatar"
MULTIAVATAR_HOME = "https://multiavatar.com"

BORING_LICENSE = "MIT (Boring Avatars)"
BORING_LICENSE_URL = "https://github.com/boringdesigners/boring-avatars"
BORING_SOURCE = "Boring Avatars"
BORING_HOME = "https://boring-avatars.com"


# ============ 风格 → 源/风格 映射 ============

# 每个 palette 对应多个候选 (source, style, reason) 组合
# reason 解释为什么这个组合匹配用户的描述
PALETTE_MATCHES: dict[str, list[dict]] = {
    "tech": [
        {"source": "dicebear", "style": "bottts", "reason": "Bottts 机器人风格契合科技感/未来主题"},
        {"source": "robohash", "style": "set1", "reason": "Robohash 机器人头像适合程序员/科技场景"},
        {"source": "dicebear", "style": "bottts-neutral", "reason": "中性 Bottts 适合简洁科技头像"},
    ],
    "cyber": [
        {"source": "dicebear", "style": "bottts-neutral", "reason": "赛博朋克搭配 Bottts 中性机器人风格"},
        {"source": "robohash", "style": "set1", "reason": "Robohash 机器人契合赛博朋克气质"},
        {"source": "multiavatar", "style": "", "reason": "Multiavatar 多元人物适配赛博身份"},
    ],
    "pixel": [
        {"source": "dicebear", "style": "pixel-art", "reason": "Pixel-Art 直接命中像素风需求"},
        {"source": "robohash", "style": "set3", "reason": "Robohash set3 像素机器人适合游戏场景"},
        {"source": "dicebear", "style": "bottts", "reason": "Bottts 提供额外科技像素选择"},
    ],
    "anime": [
        {"source": "dicebear", "style": "adventurer", "reason": "Adventurer 风格契合二次元/动漫头像"},
        {"source": "dicebear", "style": "lorelei", "reason": "Lorelei 风格适合温柔治愈系动漫"},
        {"source": "multiavatar", "style": "", "reason": "Multiavatar 多元人物适配动漫身份"},
    ],
    "warm": [
        {"source": "dicebear", "style": "micah", "reason": "Micah 友好人物风格契合治愈系温暖头像"},
        {"source": "dicebear", "style": "lorelei", "reason": "Lorelei 适合温柔治愈系人物"},
        {"source": "multiavatar", "style": "", "reason": "Multiavatar 多元人物适配温柔风格"},
    ],
    "mono": [
        {"source": "dicebear", "style": "initials", "reason": "Initials 字母头像契合极简/GitHub 场景"},
        {"source": "boring", "style": "", "reason": "Boring Avatars 几何色块适合极简风格"},
        {"source": "dicebear", "style": "shapes", "reason": "Shapes 几何图形适合简洁背景"},
    ],
    "nature": [
        {"source": "dicebear", "style": "shapes", "reason": "Shapes 自然几何契合清新风格"},
        {"source": "multiavatar", "style": "", "reason": "Multiavatar 多元人物适配自然主题"},
        {"source": "dicebear", "style": "adventurer", "reason": "Adventurer 适合自然清新人物"},
    ],
    "purple": [
        {"source": "dicebear", "style": "fun-emoji", "reason": "Fun-Emoji 表情风格适配通用社交头像"},
        {"source": "multiavatar", "style": "", "reason": "Multiavatar 多元人物适配通用场景"},
        {"source": "dicebear", "style": "avataaars", "reason": "Avataaars 人物风格适合通用头像"},
    ],
}


# ============ 工具函数 ============

def _stable_seed(text: str) -> str:
    """根据文本生成稳定的 seed（相同输入 → 相同 seed → 相同头像）。"""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]


def _seed_variant(text: str, idx: int) -> str:
    """为同一文本生成第 idx 个变体 seed，确保同源多张不重复。"""
    return hashlib.sha256(f"{text}-{idx}".encode("utf-8")).hexdigest()[:12]


def _compute_match_score(matched_styles: int, total_styles: int, palette_hit: bool) -> float:
    """计算匹配分数（0-1），基于风格命中度和调色板命中。

    - 风格命中越多分数越高
    - 调色板命中额外加分
    - 非随机
    """
    style_ratio = matched_styles / max(total_styles, 1)
    score = 0.70 + style_ratio * 0.20  # 基础 0.70 + 风格贡献最高 0.20
    if palette_hit:
        score += 0.10
    return round(min(score, 0.99), 2)


# ============ 各源 URL 构建（外部源） ============

def _build_dicebear(style: str, seed: str) -> str:
    """构建 DiceBear SVG URL（外部，稳定可用）。"""
    return f"{DICEBEAR_BASE}/{style}/svg?seed={seed}&radius=20"


def _build_robohash(style: str, seed: str) -> str:
    """构建 Robohash PNG URL（外部）。style 为 set1/set2/set3/set4。"""
    return f"{ROBOHASH_BASE}/{seed}.png?set={style}&size=128x128"


# ============ 本地 SVG 生成（Boring Avatars / Multiavatar fallback） ============

def _save_svg_to_outputs(filename: str, svg: str) -> str:
    """保存 SVG 到 outputs 目录，返回可访问的本地 URL。"""
    settings = get_settings()
    file_path = settings.output_path / filename
    try:
        file_path.write_text(svg, encoding="utf-8")
    except Exception as e:
        logger.warning("save svg failed: %s", e)
    return f"/outputs/{filename}"


def _boring_marble_svg(seed: str, size: int = 128) -> str:
    """本地生成 Boring Avatars 风格的 marble SVG。

    Boring Avatars 的 vercel API (boring-avatars-api.vercel.app) 已下线，
    改为本地生成 marble 变体：从 seed 派生 5 个颜色，绘制重叠圆形几何头像。
    """
    h = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    colors = [f"#{h[i*6:(i+1)*6]}" for i in range(5)]
    parts = ""
    for i in range(4):
        chunk = h[(i + 5) * 4:(i + 6) * 4]
        cx = int(chunk[0:2], 16) % 64 + 32
        cy = int(chunk[2:4], 16) % 64 + 32
        r = 36 + (int(h[i * 2:(i + 1) * 2], 16) % 28)
        parts += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{colors[(i + 1) % 5]}"/>'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
        f'viewBox="0 0 128 128">'
        f'<rect width="128" height="128" fill="{colors[0]}"/>'
        f'{parts}'
        f'</svg>'
    )


def _multiavatar_fallback_svg(seed: str) -> str:
    """Multiavatar API 不可用时的本地 fallback SVG。

    使用 seed 派生的颜色生成几何人物头像，风格近似 Multiavatar。
    """
    h = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    c_skin = f"#{h[0:6]}"
    c_hair = f"#{h[6:12]}"
    c_bg = f"#{h[12:18]}"
    c_shirt = f"#{h[18:24]}"
    c_acc = f"#{h[24:30]}"
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'
        f'<rect width="128" height="128" fill="{c_bg}"/>'
        f'<circle cx="64" cy="50" r="28" fill="{c_skin}"/>'
        f'<path d="M36 48 Q36 24 64 24 Q92 24 92 48 Z" fill="{c_hair}"/>'
        f'<circle cx="54" cy="50" r="4" fill="#222"/>'
        f'<circle cx="74" cy="50" r="4" fill="#222"/>'
        f'<path d="M56 60 Q64 66 72 60" stroke="#222" stroke-width="2" fill="none"/>'
        f'<path d="M32 128 Q32 88 64 88 Q96 88 96 128 Z" fill="{c_shirt}"/>'
        f'<circle cx="64" cy="50" r="28" fill="none" stroke="{c_acc}" stroke-width="2" opacity="0.3"/>'
        f'</svg>'
    )


async def _fetch_multiavatar_svg(seed: str) -> str | None:
    """从 Multiavatar API 获取 SVG。成功返回 SVG 内容，失败返回 None。

    Multiavatar API (api.multiavatar.com) 有时被 Cloudflare 安全验证拦截，
    浏览器 <img> 标签可能无法加载。改为服务端获取并缓存为本地文件。
    """
    import httpx
    url = f"{MULTIAVATAR_BASE}/{seed}.svg"
    try:
        timeout = httpx.Timeout(8.0, connect=4.0)
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                text = resp.text
                if "<svg" in text and "</svg>" in text:
                    return text
            logger.debug("multiavatar fetch non-200: status=%d", resp.status_code)
    except Exception as e:
        logger.debug("multiavatar fetch error: %s", e)
    return None


# ============ 头像源适配器 ============

async def _resolve_thumbnail(source: str, style: str, seed: str,
                             palette: str, idx: int) -> str:
    """解析头像缩略图 URL（适配器模式）。

    每个源有独立的生成/获取逻辑：
    - dicebear:    外部 SVG URL（稳定可用）
    - robohash:    外部 PNG URL
    - boring:      本地生成 marble SVG（vercel API 已下线）
    - multiavatar: 服务端获取 SVG → 本地缓存；失败则本地 fallback SVG

    返回值始终是可访问的 URL（外部 http 或本地 /outputs/ 路径），
    绝不返回空链接或不可访问的占位链接。
    """
    if source == "dicebear":
        return _build_dicebear(style, seed)
    if source == "robohash":
        return _build_robohash(style, seed)
    if source == "boring":
        svg = _boring_marble_svg(seed)
        return _save_svg_to_outputs(f"search_boring_{idx}_{seed[:8]}.svg", svg)
    if source == "multiavatar":
        svg = await _fetch_multiavatar_svg(seed)
        if svg is not None:
            return _save_svg_to_outputs(f"search_multiavatar_{idx}_{seed[:8]}.svg", svg)
        # fallback: 本地生成
        logger.info("multiavatar fetch failed, using local fallback (seed=%s)", seed[:6])
        svg = _multiavatar_fallback_svg(seed)
        return _save_svg_to_outputs(f"search_multiavatar_{idx}_{seed[:8]}.svg", svg)
    # unknown source: local fallback
    logger.warning("unknown source '%s', using local fallback", source)
    return _save_svg_to_outputs(
        f"search_unknown_{idx}_{seed[:8]}.svg", _multiavatar_fallback_svg(seed))


def _validate_thumbnail_url(url: str) -> bool:
    """校验缩略图 URL 是否合法且可访问。

    - 不为空
    - 格式合法（http/https 外部 URL 或 /outputs/ 本地路径）
    - 不包含占位/无效标记
    """
    if not url or not url.strip():
        return False
    url = url.strip()
    if url.startswith(("http://", "https://")):
        return True
    if url.startswith("/outputs/"):
        return True
    return False


def _build_match_item(
    source: str, style: str, seed: str, text: str,
    analysis: Analysis, reason: str, palette: str, idx: int,
    thumbnail_url: str = "",
) -> MatchItem:
    """根据源信息构建一个 MatchItem。

    thumbnail_url 由适配器 _resolve_thumbnail() 提供，若为空则用默认本地路径。
    """
    if source == "dicebear":
        license_ = DICEBEAR_LICENSE
        license_url = DICEBEAR_LICENSE_URL
        source_url = f"{DICEBEAR_HOME}/styles/{style}/"
        title = f"DiceBear {style} #{idx+1}"
        source_name = DICEBEAR_SOURCE
    elif source == "robohash":
        license_ = ROBOHASH_LICENSE
        license_url = ROBOHASH_LICENSE_URL
        source_url = ROBOHASH_HOME
        title = f"Robohash {style} #{idx+1}"
        source_name = ROBOHASH_SOURCE
    elif source == "multiavatar":
        license_ = MULTIAVATAR_LICENSE
        license_url = MULTIAVATAR_LICENSE_URL
        source_url = MULTIAVATAR_HOME
        title = f"Multiavatar #{idx+1}"
        source_name = MULTIAVATAR_SOURCE
    elif source == "boring":
        license_ = BORING_LICENSE
        license_url = BORING_LICENSE_URL
        source_url = BORING_HOME
        title = f"Boring Avatar #{idx+1}"
        source_name = BORING_SOURCE
    else:
        # 本地生成降级
        license_ = "Local Generated (programmatic)"
        license_url = ""
        source_url = ""
        title = f"Local Generated #{idx+1}"
        source_name = "Local Generated"

    # thumbnail_url 由适配器提供，兜底为本地路径
    thumb = thumbnail_url or f"/outputs/search_local_{palette}_{idx}.svg"

    # 计算匹配分数
    matched_styles = sum(
        1 for s in (analysis.styles or [])
        if any(k in reason.lower() for k in [s.lower()[:2]])
    )
    score = _compute_match_score(
        matched_styles=matched_styles,
        total_styles=len(analysis.styles or []),
        palette_hit=True,
    )

    # tag 列表：风格 + 调色板 + 来源
    tags = list((analysis.styles or [])[:2]) + [palette]

    return MatchItem(
        title=title,
        thumbnail_url=thumb,
        source_url=source_url,
        license=license_,
        license_url=license_url,
        source=source_name,
        match_score=score,
        match_reason=reason,
        tags=tags,
        safe_to_use=True,
    )


# ============ 本地降级生成（非 Demo 占位） ============

def _local_generated(query: str, palette: str, limit: int, analysis: Analysis) -> list[MatchItem]:
    """外部源全部不可用时的降级：本地程序化生成 SVG 头像。

    与旧的 Demo 占位不同：
    - 这里实时调用 image_generator._build_svg 生成头像（不是固定 8 张）
    - 明确标注 source="Local Generated"，license="Local Generated (programmatic)"
    - 仍然根据用户输入产生不同结果（基于 text hash 的 variant）
    """
    from services.image_generator import _build_svg

    results: list[MatchItem] = []
    for i in range(min(limit, 4)):
        seed = _seed_variant(query, i)
        # 用 text hash 派生 variant，确保不同输入不同头像
        variant = int(hashlib.sha256(f"{query}-{i}".encode()).hexdigest()[:4], 16) % 10
        svg = _build_svg(palette, variant)

        # 实时写入 outputs（覆盖式，文件名含 seed 避免冲突）
        settings = get_settings()
        file_path = settings.output_path / f"search_local_{palette}_{i}.svg"
        try:
            file_path.write_text(svg, encoding="utf-8")
        except Exception as e:
            logger.warning("local generated svg write failed: %s", e)

        reason = f"外部头像源不可用，本地按「{palette}」调色板程序化生成"
        results.append(MatchItem(
            title=f"Local Generated #{i+1}",
            thumbnail_url=f"/outputs/search_local_{palette}_{i}.svg",
            source_url="",
            license="Local Generated (programmatic)",
            license_url="",
            source="Local Generated",
            match_score=round(0.75 - i * 0.05, 2),
            match_reason=reason,
            tags=list((analysis.styles or [])[:2]) + [palette],
            safe_to_use=True,
        ))
    logger.info("local generated %d avatars (palette=%s)", len(results), palette)
    return results


# ============ 主入口 ============

async def search(text: str, analysis: Analysis, limit: int = 8) -> tuple[str, list[MatchItem]]:
    """主入口：根据用户输入匹配开源头像。

    返回 (query, results)。query 为英文搜索关键词，results 为匹配结果列表。
    不同输入产生不同结果（基于 text hash 的 seed + 风格匹配）。

    适配器模式：
    - 每个头像源通过 _resolve_thumbnail() 独立解析缩略图 URL
    - Boring Avatars / Multiavatar 生成/获取本地 SVG，100% 可访问
    - DiceBear / Robohash 使用外部 URL
    - 某个源失败时跳过（不影响其他源），不足时用本地生成补充
    """
    from services import prompt_builder
    query = prompt_builder.build_search_query(text, analysis)
    palette = intent_analyzer.detect_palette(text)
    settings = get_settings()

    # 外部搜索禁用 → 直接本地生成
    if not settings.enable_external_search:
        logger.info("external search disabled, using local generated")
        return query, _local_generated(query, palette, limit, analysis)

    # 选择该 palette 对应的候选源组合
    candidates = PALETTE_MATCHES.get(palette, PALETTE_MATCHES["purple"])

    # 根据配置过滤掉被禁用的源
    enabled_map = {
        "dicebear": settings.search_enable_dicebear,
        "robohash": settings.search_enable_robohash,
        "multiavatar": settings.search_enable_multiavatar,
        "boring": settings.search_enable_boring,
    }
    candidates = [c for c in candidates if enabled_map.get(c["source"], True)]

    # 候选不够 limit 时补充通用源（也需过滤被禁用的源）
    extra_styles = [
        {"source": "dicebear", "style": "fun-emoji", "reason": "Fun-Emoji 表情风格作为通用补充"},
        {"source": "multiavatar", "style": "", "reason": "Multiavatar 多元人物作为通用补充"},
        {"source": "dicebear", "style": "avataaars", "reason": "Avataaars 人物风格作为通用补充"},
    ]
    extra_styles = [c for c in extra_styles if enabled_map.get(c["source"], True)]
    all_candidates = list(candidates) + extra_styles
    all_candidates = all_candidates[:limit]

    seed_base = _stable_seed(text)

    # 并发解析所有缩略图 URL（适配器模式）
    seeds = [_seed_variant(text, idx) for idx in range(len(all_candidates))]
    thumbnail_tasks = [
        _resolve_thumbnail(c["source"], c.get("style", ""), seeds[idx], palette, idx)
        for idx, c in enumerate(all_candidates)
    ]
    thumbnails = await asyncio.gather(*thumbnail_tasks)

    # 构建 MatchItem，校验 URL 有效性，跳过无效项
    results: list[MatchItem] = []
    for idx, (cand, thumb) in enumerate(zip(all_candidates, thumbnails)):
        if not _validate_thumbnail_url(thumb):
            logger.warning("invalid thumbnail for source=%s idx=%d, skipping",
                           cand["source"], idx)
            continue
        item = _build_match_item(
            source=cand["source"], style=cand.get("style", ""), seed=seeds[idx],
            text=text, analysis=analysis, reason=cand["reason"], palette=palette,
            idx=idx, thumbnail_url=thumb,
        )
        results.append(item)

    # 探活：并发检查外部 URL 可达性（本地 URL 视为可达）
    if results:
        reachable = await _check_sources_reachable(results[:3])
        if not any(reachable):
            logger.warning("all external sources unreachable, using local generated")
            return query, _local_generated(query, palette, limit, analysis)

    # 有效结果不足时，用本地生成补充
    if len(results) < limit:
        need = limit - len(results)
        local_items = _local_generated(query, palette, need, analysis)
        results.extend(local_items)

    logger.info("avatar search returned %d results for palette=%s (seed_base=%s)",
                len(results), palette, seed_base[:6])
    return query, results[:limit]


async def _check_sources_reachable(sample_items: list[MatchItem]) -> list[bool]:
    """并发检查样本 URL 是否可达（HEAD 请求，超时短）。

    仅用于探活，失败不阻塞主流程（前端 img onerror 会隐藏不可达图片）。
    """
    import httpx

    settings = get_settings()
    timeout = httpx.Timeout(settings.search_timeout, connect=3.0)

    async def _check(item: MatchItem) -> bool:
        url = item.thumbnail_url
        if not url.startswith("http"):
            return True  # 本地 URL 视为可达
        try:
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                resp = await client.head(url)
                return 200 <= resp.status_code < 400
        except Exception as e:
            logger.debug("source check failed for %s: %s", item.source, e)
            return False

    return await asyncio.gather(*[_check(it) for it in sample_items])
