"""识别网页/前端类型的作品"""

WEB_KEYWORDS = [
    'html', 'h5', '网页', '网站', 'web', '前端',
    '在线体验', 'demo', '在线', '体验地址',
    'github.io', 'vercel.app', 'netlify.app',
    '单页', 'spa', '交互式',
]

EXTERNAL_DOMAINS = [
    'github.io', 'vercel.app', 'netlify.app', 'cloudflare.pages',
    'pages.dev', 'surge.sh', 'herokuapp.com', 'feishu.cn',
]

# 可嵌入 iframe 的外部托管域名（用于 process_project 识别 demo 链接）
EMBEDDABLE_DOMAINS = [
    'github.io', 'vercel.app', 'netlify.app', 'cloudflare.pages',
    'pages.dev', 'surge.sh', 'herokuapp.com',
]

# 不应作为 demo 体验地址的域名（代码仓库、论坛内部、CDN 图片等）
NON_DEMO_DOMAINS = ['github.com', 'forum.trae.cn', 'trae-forum-cdn']

# 图片扩展名（排除作为 demo URL）
IMAGE_EXTENSIONS = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')

MINIPROGRAM_KEYWORDS = [
    '微信小程序', '小程序', '扫码体验', '扫码',
]


def is_web_project(title: str, excerpt: str, cooked_html: str) -> bool:
    """判断帖子是否为网页/前端类型作品"""
    text = f"{title} {excerpt}".lower()
    for kw in WEB_KEYWORDS:
        if kw in text:
            return True
    if cooked_html:
        for domain in EXTERNAL_DOMAINS:
            if domain in cooked_html.lower():
                return True
    return False


def is_miniprogram_project(title: str, excerpt: str, cooked_html: str = '') -> bool:
    """判断帖子是否为微信小程序类型作品"""
    text = f"{title} {excerpt}".lower()
    for kw in MINIPROGRAM_KEYWORDS:
        if kw in text:
            return True
    if cooked_html:
        text_html = cooked_html.lower()
        for kw in MINIPROGRAM_KEYWORDS:
            if kw in text_html:
                return True
    return False


def extract_external_links(cooked_html: str) -> list[str]:
    """从帖子 HTML 中提取外部链接"""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(cooked_html, 'lxml')
    links = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        if 'forum.trae.cn' in href or 'trae.cn/t/' in href:
            continue
        skip = ['github.com/trae', 'mailto:', 'javascript:']
        if any(s in href for s in skip):
            continue
        links.append(href)
    return links


def extract_attachment_links(cooked_html: str) -> list[dict]:
    """从帖子 HTML 中提取附件链接（仅论坛上传的 ZIP/HTML）

    仅将 forum.trae.cn/uploads/ 路径下的文件视为附件，
    避免将外部网站的 .html/.zip 链接误判为可下载附件。
    """
    from bs4 import BeautifulSoup
    from urllib.parse import urljoin
    soup = BeautifulSoup(cooked_html, 'lxml')
    attachments = []
    seen = set()
    base_url = 'https://forum.trae.cn'
    for a in soup.find_all('a', href=True):
        href = a['href']
        # 修复相对路径 URL
        if href.startswith('/'):
            href = urljoin(base_url, href)
        # 仅将论坛上传的文件（/uploads/ 路径）视为附件
        if '/uploads/' not in href:
            continue
        # 去重
        if href in seen:
            continue
        seen.add(href)
        text = a.get_text(strip=True).lower()
        if href.endswith('.zip') or '.zip?' in href:
            attachments.append({'url': href, 'type': 'zip', 'name': text})
        elif href.endswith('.html') or href.endswith('.htm'):
            attachments.append({'url': href, 'type': 'html', 'name': text})
    return attachments


def extract_screenshots(cooked_html: str) -> list[str]:
    """从帖子 HTML 中提取截图 URL"""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(cooked_html, 'lxml')
    imgs = []
    for img in soup.find_all('img', src=True):
        src = img['src']
        if 'emoji' in src or 'avatar' in src or 'user_avatar' in src:
            continue
        if any(ext in src.lower() for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']):
            imgs.append(src)
    return imgs
