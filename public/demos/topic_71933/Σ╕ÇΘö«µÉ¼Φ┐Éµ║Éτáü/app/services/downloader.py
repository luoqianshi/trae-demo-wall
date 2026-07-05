import json
"""视频解析与下载服务。

支持抖音/快手分享链接解析为真实视频地址，并下载到本地。
"""

import re
import hashlib
import uuid
from pathlib import Path

import shutil
import httpx
from loguru import logger

from app.core.config import get_settings
from app.models.video import Platform, VideoSource
from app.utils.bin import get_ffmpeg_bin, get_ffprobe_bin


def extract_url(text: str) -> str:
    """从粘贴的分享文本中自动提取 URL。"""
    text = text.strip()
    # 先尝试直接是 URL
    if text.startswith("http"):
        # 截断中文字符
        m = re.match(r"(https?://[^\s一-鿿＀-￯]+)", text)
        if m:
            return m.group(1).rstrip("/")
    return text


# ---- 平台链接识别 ----

PLATFORM_PATTERNS = {
    Platform.DOUYIN: [
        re.compile(r"douyin\.com"),
        re.compile(r"iesdouyin\.com"),
        re.compile(r"v\.douyin\.com"),
    ],
    Platform.KUAISHOU: [
        re.compile(r"kuaishou\.com"),
        re.compile(r"v\.kuaishou\.com"),
        re.compile(r"gifshow\.com"),
        re.compile(r"chenzhongtech\.com"),
    ],
}


def detect_platform(url: str) -> Platform:
    """根据 URL 域名判断来源平台。"""
    for platform, patterns in PLATFORM_PATTERNS.items():
        for pattern in patterns:
            if pattern.search(url):
                return platform
    return Platform.UNKNOWN


# ---- 平台解析器基类 ----

class BaseParser:
    """视频解析器基类。"""

    def __init__(self, client: httpx.AsyncClient | None = None):
        self.client = client or httpx.AsyncClient(
            proxy=None,
            timeout=30,
            follow_redirects=True,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) "
                    "Version/17.0 Mobile/15E148 Safari/604.1"
                ),
            },
        )

    async def parse(self, url: str) -> VideoSource:
        raise NotImplementedError

    async def close(self) -> None:
        await self.client.aclose()


class DouyinParser(BaseParser):
    """抖音视频解析。"""

    async def parse(self, url: str) -> VideoSource:
        logger.info("解析抖音链接: {}", url)
        resp = await self.client.get(url)
        real_url = str(resp.url)
        logger.debug("重定向到: {}", real_url)

        video_id = self._extract_video_id(real_url)
        if not video_id:
            raise ValueError(f"无法从链接提取视频ID: {real_url}")

        api_url = f"https://www.douyin.com/aweme/v1/web/aweme/detail/?aweme_id={video_id}"
        headers = {
            "Referer": "https://www.douyin.com/",
            "User-Agent": self.client.headers["User-Agent"],
        }
        try:
            detail_resp = await self.client.get(api_url, headers=headers)
            data = detail_resp.json()
            aweme = data.get("aweme_detail", {})

            video_url = ""
            play_addr = aweme.get("video", {}).get("play_addr", {})
            url_list = play_addr.get("url_list", [])
            if url_list:
                video_url = url_list[0].replace("playwm", "play")

            return VideoSource(
                url=url,
                video_url=video_url,
                cover_url=aweme.get("video", {}).get("cover", {}).get("url_list", [""])[0],
                title=aweme.get("desc", ""),
                tags=[t.get("tag_name", "") for t in aweme.get("text_extra", []) if t.get("tag_name")],
                duration=aweme.get("video", {}).get("duration", 0) / 1000,
                platform=Platform.DOUYIN,
                author=aweme.get("author", {}).get("nickname", ""),
            )
        except ValueError:
            raise
        except Exception as e:
            logger.error("抖音 API 解析失败: {}", e)
            raise ValueError(f"抖音视频解析失败: {e}") from e

    @staticmethod
    def _extract_video_id(url: str) -> str:
        patterns = [
            re.compile(r"/video/(\d+)"),
            re.compile(r"aweme_id=(\d+)"),
            re.compile(r"/(\d{15,})"),
        ]
        for p in patterns:
            m = p.search(url)
            if m:
                return m.group(1)
        return ""


class KuaishouParser(BaseParser):
    """快手视频解析。"""

    async def parse(self, url: str) -> VideoSource:
        logger.info("解析快手链接: {}", url)

        # Step 1: 跟踪短链，获取真实页面 URL
        resp = await self.client.get(url)
        real_url = str(resp.url)
        logger.debug("重定向到: {}", real_url)

        # Step 2: 从 URL 或页面中提取 video_id
        photo_id = self._extract_photo_id(real_url)

        # 如果 URL 路径没找到 ID，尝试从页面 HTML 中提取
        if not photo_id:
            try:
                page_text = resp.text
                photo_id = self._extract_id_from_html(page_text)
                if photo_id:
                    logger.debug("从页面 HTML 中提取到 ID: {}", photo_id)
            except Exception:
                pass

        # 仍然找不到，尝试从 URL 的 hash/fragment 中提取
        if not photo_id:
            photo_id = self._extract_from_url_fragments(real_url)

        if not photo_id:
            raise ValueError(
                f"无法从链接提取视频ID，请确认链接有效。\n"
                f"  原始链接: {url}\n"
                f"  重定向到: {real_url}"
            )

        # Step 3: 调用 API 获取视频详情
        return await self._fetch_photo_detail(photo_id, url)

    async def _fetch_photo_detail(self, photo_id: str, original_url: str) -> VideoSource:
        """调用快手 API 获取视频详情。"""
        # 尝试多种 API 端点
        api_endpoints = [
            {
                "url": "https://m.gifshow.com/rest/wd/photo/info",
                "method": "POST",
                "payload": {"photoId": photo_id, "isLongVideo": False},
                "content_type": "json",
            },
            {
                "url": f"https://m.gifshow.com/rest/wd/photo/info?photoId={photo_id}",
                "method": "GET",
                "content_type": "json",
            },
        ]

        for endpoint in api_endpoints:
            try:
                headers = {"Referer": original_url, "User-Agent": self.client.headers["User-Agent"]}

                if endpoint["method"] == "POST":
                    headers["Content-Type"] = "application/json"
                    resp = await self.client.post(
                        endpoint["url"],
                        json=endpoint.get("payload", {}),
                        headers=headers,
                    )
                else:
                    resp = await self.client.get(endpoint["url"], headers=headers)

                data = resp.json()
                photo = data.get("photo", {})
                if not photo:
                    # 有些 API 响应直接包含字段
                    photo = data.get("result") == 1 and data.get("photo", data) or {}

                video_url = (
                    photo.get("mainMvUrl")
                    or photo.get("photoUrl")
                    or photo.get("url")
                    or ""
                )
                if video_url:
                    return VideoSource(
                        url=original_url,
                        video_url=video_url,
                        cover_url=photo.get("coverUrl", photo.get("coverUrlHttps", "")),
                        title=photo.get("caption", ""),
                        tags=photo.get("tagList", []),
                        duration=photo.get("duration", 0) / 1000,
                        platform=Platform.KUAISHOU,
                        author=photo.get("userName", photo.get("userNamePronunciation", "")),
                    )
            except Exception as e:
                logger.debug("API 端点 {} 失败: {}", endpoint["url"], e)
                continue

        # 所有 API 都失败，尝试从页面 HTML 提取
        return await self._extract_from_html_fallback(original_url, photo_id)

    async def _extract_from_html_fallback(self, original_url: str, photo_id: str) -> VideoSource:
        """当 API 失败时，直接从重定向页面 HTML 提取视频信息。"""
        try:
            resp = await self.client.get(original_url)
            html = resp.text

            video_url = ""
            for pat in [
                r'"mainMvUrl"\s*:\s*"([^"]+)"',
                r'"photoUrl"\s*:\s*"([^"]+)"',
                r'"url"\s*:\s*"(https?://[^"]*kwimgs[^"]+)"',
                r'"url"\s*:\s*"(https?://[^"]*\.mp4[^"]*)"',
            ]:
                m = re.search(pat, html)
                if m:
                    video_url = m.group(1)
                    break

            title = ""
            for pat in [
                r'"caption"\s*:\s*"([^"]{1,200})"',
                r'"desc"\s*:\s*"([^"]{1,200})"',
            ]:
                m = re.search(pat, html)
                if m:
                    raw = m.group(1)
                    try:
                        title = json.loads("\"" + raw + "\"")
                    except Exception:
                        title = raw
                    break

            author = ""
            for pat in [r'"userName"\s*:\s*"([^"]+)"', r'"authorName"\s*:\s*"([^"]+)"']:
                m = re.search(pat, html)
                if m:
                    author = m.group(1)
                    break

            cover = ""
            m = re.search(r'"coverUrl"\s*:\s*"([^"]+)"', html)
            if m:
                cover = m.group(1)

            duration = 0
            m = re.search(r'"duration"\s*:\s*(\d+)', html)
            if m:
                duration = int(m.group(1)) / 1000

            logger.info("HTML 提取成功: title={} author={}", title, author)
            return VideoSource(
                url=original_url,
                video_url=video_url,
                cover_url=cover,
                title=title,
                duration=duration,
                platform=Platform.KUAISHOU,
                author=author,
            )
        except Exception as e:
            logger.error("HTML 提取失败: {}", e)
            return VideoSource(
                url=original_url,
                platform=Platform.KUAISHOU,
                title=f"快手视频 {photo_id}",
            )

    @staticmethod
    def _extract_photo_id(url: str) -> str:
        """从 URL 路径提取快手视频 ID。"""
        patterns = [
            re.compile(r"/short-video/(\w+)"),
            re.compile(r"/fw/long-video/(\w+)"),
            re.compile(r"/fw/photo/(\w+)"),
            re.compile(r"/photo/(\w+)"),
            re.compile(r"photoId=(\w+)"),
            re.compile(r"/f/(\w+)"),
        ]
        for p in patterns:
            m = p.search(url)
            if m:
                return m.group(1)
        return ""

    @staticmethod
    def _extract_from_url_fragments(url: str) -> str:
        """从 URL 片段或查询参数中尝试提取 ID。"""
        # 有些快手短链重定向后 ID 在 fragment 中
        if "#" in url:
            fragment = url.split("#", 1)[1]
            m = re.search(r"(\w{10,})", fragment)
            if m:
                return m.group(1)
        return ""

    @staticmethod
    def _extract_id_from_html(html: str) -> str:
        """从页面 HTML 源码中提取快手视频 ID。"""
        patterns = [
            re.compile(r'"photoId"\s*:\s*"(\w+)"'),
            re.compile(r'"photo_id"\s*:\s*"(\w+)"'),
            re.compile(r'"id"\s*:\s*"(\w{10,})"'),
            re.compile(r'/short-video/(\w+)'),
            re.compile(r'photoId=(\w+)'),
            re.compile(r'"shareInfo".*?"photoId"\s*:\s*"(\w+)"'),
        ]
        for p in patterns:
            m = p.search(html)
            if m:
                return m.group(1)
        return ""


# ---- 解析器工厂 ----

PARSERS = {
    Platform.DOUYIN: DouyinParser,
    Platform.KUAISHOU: KuaishouParser,
}


def get_parser(url: str) -> BaseParser:
    platform = detect_platform(url)
    parser_cls = PARSERS.get(platform)
    if not parser_cls:
        raise ValueError(f"不支持的平台链接: {url}")
    return parser_cls()


# ---- 下载器 ----

class VideoDownloader:
    """视频文件下载器。"""

    def __init__(self):
        self.settings = get_settings()

    async def parse_url(self, url: str) -> VideoSource:
        """解析分享链接，返回视频源信息。自动从分享文本中提取 URL。"""
        url = extract_url(url)
        logger.info("提取到 URL: {}", url)
        parser = get_parser(url)
        try:
            source = await parser.parse(url)
            logger.info("解析成功: platform={} title={}", source.platform.value, source.title)
            return source
        finally:
            await parser.close()

    async def download(self, source: VideoSource) -> Path:
        """下载视频到本地，返回文件路径。"""
        if not source.video_url:
            raise ValueError("视频下载地址为空，无法下载（解析可能未获取到真实视频链接）")

        # 生成唯一文件名
        url_hash = hashlib.md5(source.video_url.encode()).hexdigest()[:12]
        filename = f"{source.platform.value}_{url_hash}_{uuid.uuid4().hex[:6]}.mp4"
        output_path = self.settings.output_dir / filename
        output_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info("开始下载: {} -> {}", source.title or source.url, output_path)

        download_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "video/mp4,video/*;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "identity",
            "Connection": "keep-alive",
            "Range": "bytes=0-",
        }

        async with httpx.AsyncClient(
                    proxy=None,
                    timeout=httpx.Timeout(self.settings.download_timeout, read=self.settings.download_timeout),
                    follow_redirects=True,
                    max_redirects=15,
                    verify=False,
                    headers=download_headers,
                ) as client:
            for attempt in range(1, self.settings.download_max_retries + 1):
                try:
                    logger.info("下载尝试 {}/{}: {}", attempt, self.settings.download_max_retries, source.video_url[:120])
                    content_length = 0
                    downloaded = 0
                    content_type = ""

                    async with client.stream("GET", source.video_url) as resp:
                        # 检查重定向后的最终URL
                        final_url = str(resp.url)
                        if final_url != source.video_url:
                            logger.info("重定向: {} -> {}", source.video_url[:80], final_url[:80])

                        resp.raise_for_status()
                        content_type = resp.headers.get("content-type", "")
                        cl = resp.headers.get("content-length", "0")
                        content_length = int(cl) if cl.isdigit() else 0

                        logger.info("响应: status={} content-type={} content-length={}", resp.status_code, content_type, content_length)

                        with open(output_path, "wb") as f:
                            async for chunk in resp.aiter_bytes(chunk_size=65536):
                                f.write(chunk)
                                downloaded += len(chunk)

                    logger.info("下载完成: {}/{} bytes", downloaded, content_length)

                    # 检查1: 下载字节数
                    if downloaded < 10240:
                        logger.warning("文件太小 ({} bytes), 可能是错误页面", downloaded)
                        output_path.unlink(missing_ok=True)
                        if attempt < self.settings.download_max_retries:
                            continue
                        raise RuntimeError(f"下载文件太小({downloaded}字节)，可能是错误页面")

                    # 检查2: Content-Type
                    if content_type and "html" in content_type:
                        logger.warning("返回HTML而非视频: {}", content_type)
                        output_path.unlink(missing_ok=True)
                        if attempt < self.settings.download_max_retries:
                            continue
                        raise RuntimeError("服务器返回HTML页面而非视频文件")

                    # 检查3: 文件头魔数 (MP4: ftyp)
                    with open(output_path, "rb") as f:
                        header = f.read(12)
                    is_mp4 = b"ftyp" in header[:12]
                    is_webm = b"\x1aE\xdf\xa3" in header[:4]
                    is_valid_container = is_mp4 or is_webm

                    if not is_valid_container:
                        # 检查是否是HTML错误页
                        with open(output_path, "rb") as f:
                            head_text = f.read(2048)
                        if b"<html" in head_text.lower() or b"<!doctype" in head_text.lower():
                            logger.warning("下载到HTML错误页面")
                            output_path.unlink(missing_ok=True)
                            if attempt < self.settings.download_max_retries:
                                continue
                            raise RuntimeError("服务器返回错误页面而非视频文件")
                        logger.warning("文件头不是MP4/WebM: {}", header[:16].hex())
                        output_path.unlink(missing_ok=True)
                        if attempt < self.settings.download_max_retries:
                            continue
                        raise RuntimeError("下载文件格式不正确")

                    # 检查4: ffprobe 验证
                    if not self._validate_mp4(output_path):
                        logger.warning("ffprobe验证失败 (attempt {}): {}", attempt, filename)
                        output_path.unlink(missing_ok=True)
                        if attempt < self.settings.download_max_retries:
                            continue
                        raise RuntimeError("下载文件损坏，重试后仍失败")

                    # 修复 moov atom
                    fixed = self._fix_moov(output_path)
                    if fixed:
                        output_path = fixed

                    logger.info("✅ 下载成功: {} ({:.1f} MB)", filename, output_path.stat().st_size / 1024 / 1024)
                    return output_path

                except httpx.HTTPError as e:
                    logger.warning("HTTP错误 (第{}次): {}", attempt, e)
                    output_path.unlink(missing_ok=True)
                    if attempt == self.settings.download_max_retries:
                        raise RuntimeError(f"下载失败，已重试{attempt}次: {e}") from e
                except RuntimeError:
                    raise
                except Exception as e:
                    logger.warning("下载异常 (第{}次): {}", attempt, e)
                    output_path.unlink(missing_ok=True)
                    if attempt == self.settings.download_max_retries:
                        raise RuntimeError(f"下载异常，已重试{attempt}次: {e}") from e

        raise RuntimeError("下载失败: 未知错误")

    @staticmethod
    def _validate_mp4(path: Path) -> bool:
        """验证 MP4 文件是否完整可用。"""
        import subprocess
        try:
            result = subprocess.run(
                [get_ffprobe_bin(), "-v", "error", "-show_entries",
                 "format=duration", "-of", "csv=p=0", str(path)],
                capture_output=True, text=True, timeout=15,
            )
            if result.returncode != 0:
                logger.warning("ffprobe 验证失败: {}", result.stderr.strip()[:200])
                return False
            # 检查是否有时长
            duration_str = result.stdout.strip()
            if not duration_str or duration_str == "N/A":
                return False
            return float(duration_str) > 0
        except Exception as e:
            logger.warning("文件验证异常: {}", e)
            return False

    @staticmethod
    def _fix_moov(input_path: Path) -> Path | None:
        """将 moov atom 移到文件头部（-movflags +faststart）。"""
        import subprocess
        output = input_path.parent / f"{input_path.stem}_fast.mp4"
        try:
            result = subprocess.run(
                [get_ffmpeg_bin(), "-y", "-i", str(input_path),
                 "-c", "copy", "-movflags", "+faststart",
                 str(output)],
                capture_output=True, text=True, timeout=60,
            )
            if result.returncode == 0 and output.exists() and output.stat().st_size > 1024:
                # 替换原文件
                input_path.unlink()
                output.rename(input_path)
                logger.debug("moov atom 已移至文件头: {}", input_path.name)
                return input_path  # 返回原路径
            else:
                output.unlink(missing_ok=True)
                logger.debug("moov 修复跳过（无需修复或失败）")
                return None
        except Exception as e:
            output.unlink(missing_ok=True)
            logger.debug("moov 修复异常: {}", e)
            return None
