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
    """从帖子 HTML 中提取附件链接（ZIP/HTML）"""
    from bs4 import BeautifulSoup
    from urllib.parse import urljoin
    soup = BeautifulSoup(cooked_html, 'lxml')
    attachments = []
    base_url = 'https://forum.trae.cn'
    for a in soup.find_all('a', href=True):
        href = a['href']
        # 修复相对路径 URL
        if href.startswith('/'):
            href = urljoin(base_url, href)
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
