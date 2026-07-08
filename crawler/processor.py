"""作品处理逻辑（scraper.py 与 incremental_scraper.py 共享）

将原有两个爬虫中重复的 process_project 提取至此，确保行为一致。
修复要点：
1. 扩展 demo 识别：不仅限白名单域名，裸 IP / 自定义域名也作为 external 外链
2. 附件仅识别论坛上传（/uploads/），ZIP 优先于 HTML
3. 无可嵌入 demo 但有外链时，保留为 external 类型（可跳转体验）而非丢弃
4. 统一支持微信小程序类型（原 scraper.py 缺失此逻辑）
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from filter import (
    is_miniprogram_project,
    EMBEDDABLE_DOMAINS,
    NON_DEMO_DOMAINS,
    IMAGE_EXTENSIONS,
)
from downloader import download_file
from extractor import extract_zip

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEMOS_DIR = os.path.join(SCRIPT_DIR, '..', 'public', 'demos')


def _find_entry_html(extract_dir: str, topic_id: int) -> str | None:
    """在解压目录中查找入口 HTML 文件，返回相对于 demos 的路径

    跳过 __MACOSX、._ 前缀文件、node_modules 等非有效入口，
    优先选择 index.html > main.html > 其它 html。
    """
    # 快速路径：根目录直接有 index.html / main.html
    for entry_name in ('index.html', 'main.html'):
        candidate = os.path.join(extract_dir, entry_name)
        if os.path.isfile(candidate) and not entry_name.startswith('._'):
            return f"./demos/topic_{topic_id}/{entry_name}"

    # 通用搜索：跳过问题目录/文件，按优先级打分
    SKIP_DIRS = {'__MACOSX', 'node_modules', '.git', 'dist', '__pycache__'}
    candidates = []
    for root, dirs, files in os.walk(extract_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if not f.endswith('.html') or f.startswith('._'):
                continue
            rel = os.path.relpath(os.path.join(root, f), extract_dir)
            score = 100 if f == 'index.html' else 90 if f == 'demo.html' else 80 if 'index' in f.lower() else 70 if 'demo' in f.lower() else 50
            score -= rel.count(os.sep) * 5
            candidates.append((score, rel))
    if candidates:
        candidates.sort(key=lambda x: -x[0])
        return f"./demos/topic_{topic_id}/{candidates[0][1]}"
    return None


def _find_embeddable_url(external_links: list[str]) -> str | None:
    """查找可嵌入 iframe 的外部 demo 链接（已知托管域名）"""
    for link in external_links:
        if any(d in link for d in EMBEDDABLE_DOMAINS):
            return link
    return None


def _find_fallback_url(external_links: list[str]) -> str | None:
    """查找备选体验地址（裸 IP / 自定义域名，仅可跳转）"""
    for link in external_links:
        if not link.startswith('http'):
            continue
        if any(d in link for d in NON_DEMO_DOMAINS):
            continue
        if any(link.lower().endswith(ext) for ext in IMAGE_EXTENSIONS):
            continue
        return link
    return None


def _try_local_from_attachments(attachments: list[dict], topic_id: int) -> tuple[str | None, str | None]:
    """处理论坛附件生成本地 demo（ZIP 优先于 HTML）

    返回 (local_path, project_type) 或 (None, None)
    """
    # ZIP 优先：自包含静态 demo 可直接嵌入预览
    zip_att = next((a for a in attachments if a['type'] == 'zip'), None)
    html_att = next((a for a in attachments if a['type'] == 'html'), None)
    chosen = zip_att or html_att

    if not chosen:
        return None, None

    if chosen['type'] == 'zip':
        try:
            zip_path = os.path.join(DEMOS_DIR, f"topic_{topic_id}.zip")
            extract_dir = os.path.join(DEMOS_DIR, f"topic_{topic_id}")
            download_file(chosen['url'], zip_path)
            extract_zip(zip_path, extract_dir)
            local_path = _find_entry_html(extract_dir, topic_id)
            if os.path.exists(zip_path):
                os.remove(zip_path)
            if local_path:
                return local_path, 'local'
        except Exception as e:
            print(f"  [WARN] 下载/解压失败 topic_{topic_id}: {e}")
        return None, None

    # HTML 附件
    try:
        html_dir = os.path.join(DEMOS_DIR, f"topic_{topic_id}")
        os.makedirs(html_dir, exist_ok=True)
        html_path = os.path.join(html_dir, 'index.html')
        download_file(chosen['url'], html_path)
        return f"./demos/topic_{topic_id}/index.html", 'local'
    except Exception as e:
        print(f"  [WARN] 下载 HTML 失败 topic_{topic_id}: {e}")
    return None, None


def process_project(topic: dict, detail: dict) -> dict | None:
    """处理单个帖子，返回项目字典或 None

    优先级：
    1. 可嵌入外链（github.io / vercel 等）→ type=external, iframe 预览
    2. 备选外链（裸 IP / 自定义域名）→ type=external, 可跳转体验
    3. 论坛附件（ZIP 优先）→ type=local, 本地嵌入预览
    4. 微信小程序 → type=miniprogram, 二维码
    5. 以上均无 → 返回 None
    """
    topic_id = topic['id']
    title = topic.get('title', '')
    tags = [t.get('name', '') for t in topic.get('tags', [])]
    external_links = detail.get('external_links', [])
    attachments = detail.get('attachments', [])
    description = detail.get('description', '')
    screenshots = detail.get('screenshots', [])

    demo_url = None
    local_path = None
    project_type = None

    # 1 & 2. 外部链接优先（可嵌入域名 > 裸 IP/自定义域名）
    embeddable_url = _find_embeddable_url(external_links)
    if embeddable_url:
        demo_url = embeddable_url
        project_type = 'external'
    else:
        fallback_url = _find_fallback_url(external_links)
        if fallback_url:
            demo_url = fallback_url
            project_type = 'external'

    # 3. 无任何外部链接时，才处理论坛附件生成本地 demo
    if not demo_url:
        local_path, project_type = _try_local_from_attachments(attachments, topic_id)

    # 4. 确定最终结果
    if demo_url or local_path:
        pass  # project_type 已设定
    else:
        # 无外链且无本地 demo，检查是否为微信小程序
        if is_miniprogram_project(title, topic.get('excerpt', ''), description):
            qr_code = None
            for img in screenshots:
                if any(ext in img.lower() for ext in ['.jpeg', '.jpg', '.png']):
                    qr_code = img
                    break
            return {
                'id': f"topic_{topic_id}",
                'forumUrl': f"https://forum.trae.cn/t/topic/{topic_id}",
                'title': title,
                'author': detail.get('author', 'unknown'),
                'description': description,
                'tags': tags,
                'views': topic.get('views', 0),
                'likes': topic.get('like_count', 0),
                'createdAt': topic.get('created_at', ''),
                'type': 'miniprogram',
                'demoUrl': None,
                'localPath': None,
                'qrCode': qr_code or (screenshots[0] if screenshots else None),
                'thumbnail': qr_code or (screenshots[0] if screenshots else None),
                'screenshots': screenshots[:5],
            }
        return None

    thumbnail = topic.get('image_url', None)
    if not thumbnail and screenshots:
        thumbnail = screenshots[0]

    return {
        'id': f"topic_{topic_id}",
        'forumUrl': f"https://forum.trae.cn/t/topic/{topic_id}",
        'title': title,
        'author': detail.get('author', 'unknown'),
        'description': description,
        'tags': tags,
        'views': topic.get('views', 0),
        'likes': topic.get('like_count', 0),
        'createdAt': topic.get('created_at', ''),
        'type': project_type,
        'demoUrl': demo_url,
        'localPath': local_path,
        'thumbnail': thumbnail,
        'screenshots': screenshots[:5],
    }
