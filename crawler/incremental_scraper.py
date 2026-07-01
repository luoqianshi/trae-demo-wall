#!/usr/bin/env python3
"""
TRAE Demo Wall 增量爬虫
只爬取新作品，跳过已存在于 index.json 中的帖子。
用法: python incremental_scraper.py
"""

import json
import os
import sys
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup

# 复用现有 filter / downloader / extractor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from filter import (
    is_web_project,
    extract_external_links,
    extract_attachment_links,
    extract_screenshots,
)
from downloader import download_file
from extractor import extract_zip

BASE_URL = "https://forum.trae.cn/c/38-category/40-category/40"
API_URL = f"{BASE_URL}.json"
TOPIC_URL = "https://forum.trae.cn/t/topic"
PAGE_SIZE = 20
DELAY = 0.3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, '..', 'src', 'data')
PAGES_DIR = os.path.join(OUTPUT_DIR, 'pages')
DEMOS_DIR = os.path.join(SCRIPT_DIR, '..', 'public', 'demos')
INDEX_PATH = os.path.join(OUTPUT_DIR, 'index.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
}


def load_existing_ids() -> set:
    """从 index.json 加载已有的项目 ID 集合"""
    if not os.path.exists(INDEX_PATH):
        print("  [INFO] index.json 不存在，将进行全量爬取")
        return set()
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    ids = set()
    for p in data.get('projects', []):
        ids.add(p['id'])
    return ids


def load_existing_projects() -> list:
    """加载完整的已有项目列表（从所有分页文件）"""
    projects = []
    if not os.path.exists(INDEX_PATH):
        return projects
    # 从分页文件加载完整数据
    if os.path.exists(PAGES_DIR):
        for fname in sorted(os.listdir(PAGES_DIR)):
            if fname.startswith('page-') and fname.endswith('.json'):
                with open(os.path.join(PAGES_DIR, fname), 'r', encoding='utf-8') as f:
                    page_data = json.load(f)
                projects.extend(page_data.get('projects', []))
    return projects


def fetch_topic_list(page: int = 0) -> dict:
    url = f"{API_URL}?page={page}"
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_topic_detail(topic_id: int) -> dict:
    url = f"{TOPIC_URL}/{topic_id}.json"
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()


def parse_topic_list(data: dict) -> list:
    topics = data.get('topic_list', {}).get('topics', [])
    return [t for t in topics if not t.get('pinned', False)]


def parse_topic_detail(data: dict, topic_id: int) -> dict:
    posts = data.get('post_stream', {}).get('posts', [])
    if not posts:
        return None
    first_post = posts[0]
    cooked = first_post.get('cooked', '')
    author = first_post.get('username', 'unknown')
    external_links = extract_external_links(cooked)
    attachments = extract_attachment_links(cooked)
    screenshots = extract_screenshots(cooked)
    soup = BeautifulSoup(cooked, 'lxml')
    description = soup.get_text(strip=True, separator=' ')[:500]
    return {
        'author': author,
        'description': description,
        'external_links': external_links,
        'attachments': attachments,
        'screenshots': screenshots,
    }


def process_project(topic: dict, detail: dict) -> dict | None:
    topic_id = topic['id']
    title = topic.get('title', '')
    tags = [t.get('name', '') for t in topic.get('tags', [])]
    external_links = detail.get('external_links', [])
    attachments = detail.get('attachments', [])

    demo_url = None
    local_path = None
    project_type = None

    for link in external_links:
        if any(d in link for d in ['github.io', 'vercel.app', 'netlify.app', 'pages.dev', 'surge.sh']):
            demo_url = link
            project_type = 'external'
            break

    if not demo_url and attachments:
        for att in attachments:
            if att['type'] == 'zip':
                try:
                    zip_path = os.path.join(DEMOS_DIR, f"topic_{topic_id}.zip")
                    extract_dir = os.path.join(DEMOS_DIR, f"topic_{topic_id}")
                    download_file(att['url'], zip_path)
                    extract_zip(zip_path, extract_dir)
                    if os.path.exists(os.path.join(extract_dir, 'index.html')):
                        local_path = f"./demos/topic_{topic_id}/index.html"
                        project_type = 'local'
                    elif os.path.exists(os.path.join(extract_dir, 'main.html')):
                        local_path = f"./demos/topic_{topic_id}/main.html"
                        project_type = 'local'
                    else:
                        for root, dirs, files in os.walk(extract_dir):
                            for f in files:
                                if f.endswith('.html'):
                                    local_path = f"./demos/topic_{topic_id}/{f}"
                                    project_type = 'local'
                                    break
                            if local_path:
                                break
                    if os.path.exists(zip_path):
                        os.remove(zip_path)
                except Exception as e:
                    print(f"  [WARN] 下载/解压失败 topic_{topic_id}: {e}")
                break
            elif att['type'] == 'html':
                try:
                    html_dir = os.path.join(DEMOS_DIR, f"topic_{topic_id}")
                    os.makedirs(html_dir, exist_ok=True)
                    html_path = os.path.join(html_dir, 'index.html')
                    download_file(att['url'], html_path)
                    local_path = f"./demos/topic_{topic_id}/index.html"
                    project_type = 'local'
                except Exception as e:
                    print(f"  [WARN] 下载 HTML 失败 topic_{topic_id}: {e}")
                break

    if not demo_url and not local_path:
        return None

    thumbnail = topic.get('image_url', None)
    screenshots = detail.get('screenshots', [])
    if not thumbnail and screenshots:
        thumbnail = screenshots[0]

    return {
        'id': f"topic_{topic_id}",
        'forumUrl': f"https://forum.trae.cn/t/topic/{topic_id}",
        'title': title,
        'author': detail.get('author', 'unknown'),
        'description': detail.get('description', ''),
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


def main():
    print("=" * 60)
    print("TRAE Demo Wall 增量爬虫启动")
    print("=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(PAGES_DIR, exist_ok=True)
    os.makedirs(DEMOS_DIR, exist_ok=True)

    # 加载已有数据
    existing_ids = load_existing_ids()
    existing_projects = load_existing_projects()
    print(f"\n  已有 {len(existing_ids)} 个已收录项目")

    # 构建已有项目索引，用于 views/likes 即时更新和变更追踪
    # existing_index[id] = {project, old_views, old_likes}
    existing_index = {}
    for p in existing_projects:
        existing_index[p['id']] = {
            'project': p,
            'old_views': p.get('views', 0),
            'old_likes': p.get('likes', 0),
        }
    changed_project_ids = set()  # views/likes 发生变化的项目 ID

    # Step 1: 遍历论坛帖子列表，筛选新帖子，同时更新已有项目 views/likes
    print("\n[Step 1] 遍历论坛帖子列表，查找新作品 + 同步浏览量/点赞数...")
    all_topics = []
    page = 0
    while True:
        print(f"  获取第 {page + 1} 页...")
        try:
            data = fetch_topic_list(page)
        except Exception as e:
            print(f"  [ERROR] 获取第 {page + 1} 页失败: {e}")
            break
        topics = parse_topic_list(data)
        if not topics:
            break
        all_topics.extend(topics)

        # 即时更新已有项目的 views/likes，跟踪变更页码
        for topic in topics:
            topic_id = f"topic_{topic['id']}"
            if topic_id in existing_index:
                idx = existing_index[topic_id]
                new_views = topic.get('views', 0)
                new_likes = topic.get('like_count', 0)
                if new_views != idx['old_views'] or new_likes != idx['old_likes']:
                    idx['project']['views'] = new_views
                    idx['project']['likes'] = new_likes
                    idx['old_views'] = new_views
                    idx['old_likes'] = new_likes
                    changed_project_ids.add(topic_id)

        page += 1
        more_url = data.get('topic_list', {}).get('more_topics_url', None)
        if not more_url:
            break
        time.sleep(DELAY)

    print(f"  共获取 {len(all_topics)} 个帖子，{len(changed_project_ids)} 个项目浏览量/点赞数变化")

    # Step 2: 筛选出是 web 类型且不在已有集合中的帖子
    print("\n[Step 2] 筛选新的网页/前端作品...")
    new_web_topics = []
    for topic in all_topics:
        topic_id = f"topic_{topic['id']}"
        if topic_id in existing_ids:
            continue
        title = topic.get('title', '')
        excerpt = topic.get('excerpt', '')
        if is_web_project(title, excerpt, ''):
            new_web_topics.append(topic)

    print(f"  发现 {len(new_web_topics)} 个新的候选帖子")

    if not new_web_topics and not changed_project_ids:
        print("\n  没有新作品，浏览量/点赞数无变化，无需更新。")
        return

    # Step 3: 获取详情并处理新作品
    print(f"\n[Step 3] 获取详情并处理 {len(new_web_topics)} 个新作品...")
    new_projects = []
    for i, topic in enumerate(new_web_topics):
        topic_id = topic['id']
        title = topic.get('title', '')
        print(f"  [{i + 1}/{len(new_web_topics)}] 处理: {title[:50]}...")

        try:
            detail_data = fetch_topic_detail(topic_id)
            detail = parse_topic_detail(detail_data, topic_id)
            if not detail:
                continue

            project = process_project(topic, detail)
            if project:
                new_projects.append(project)
                print(f"    -> 已收录 ({project['type']})")
            else:
                print(f"    -> 无可预览链接，跳过")
        except Exception as e:
            print(f"    [SKIP] {e}")

        time.sleep(DELAY)

    print(f"\n  新收录 {len(new_projects)} 个作品")

    # Step 4: 合并数据并重新生成
    print("\n[Step 4] 合并数据并重新生成文件...")

    # 重建所有 projects 列表
    all_projects_map = {}  # id -> project
    for p in existing_projects:
        all_projects_map[p['id']] = p
    for p in new_projects:
        all_projects_map[p['id']] = p

    # views/likes 已在 Step 1 中即时更新，此处无需再次遍历

    all_projects = list(all_projects_map.values())
    all_projects.sort(key=lambda p: p.get('createdAt', ''), reverse=True)

    # 计算排序后的页码，标记变更页
    changed_page_nums = set()
    project_page_map = {}  # id -> page_num (排序后)
    for i, p in enumerate(all_projects):
        pn = i // PAGE_SIZE + 1
        project_page_map[p['id']] = pn
        # views/likes 变化的项目
        if p['id'] in changed_project_ids:
            changed_page_nums.add(pn)
        # 新作品
        if p['id'] not in existing_ids:
            changed_page_nums.add(pn)

    # 统计
    tag_counts = {}
    total_views = 0
    total_likes = 0
    for p in all_projects:
        total_views += p.get('views', 0)
        total_likes += p.get('likes', 0)
        for tag in p.get('tags', []):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    # 生成 index.json（始终重写）
    index = {
        'updatedAt': datetime.utcnow().isoformat() + 'Z',
        'totalProjects': len(all_projects),
        'totalPages': (len(all_projects) + PAGE_SIZE - 1) // PAGE_SIZE if all_projects else 0,
        'pageSize': PAGE_SIZE,
        'stats': {
            'totalViews': total_views,
            'totalLikes': total_likes,
            'tagCounts': tag_counts,
        },
        'projects': [
            {
                'id': p['id'],
                'title': p['title'],
                'author': p['author'],
                'tags': p['tags'],
                'thumbnail': p.get('thumbnail'),
                'views': p['views'],
                'likes': p['likes'],
                'createdAt': p['createdAt'],
            }
            for p in all_projects
        ],
    }

    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"  index.json ({len(index['projects'])} 条摘要)")

    # 生成或更新分页文件（仅写入变更页）
    for page_num in changed_page_nums:
        start = (page_num - 1) * PAGE_SIZE
        end = start + PAGE_SIZE
        page_projects = all_projects[start:end]
        page_data = {
            'page': page_num,
            'pageSize': PAGE_SIZE,
            'hasNext': page_num < index['totalPages'],
            'projects': page_projects,
        }
        page_path = os.path.join(PAGES_DIR, f"page-{page_num}.json")
        with open(page_path, 'w', encoding='utf-8') as f:
            json.dump(page_data, f, ensure_ascii=False, indent=2)

    print(f"  已更新 {len(changed_page_nums)} 个分页文件 (page {[str(n) for n in sorted(changed_page_nums)][:5]}{'...' if len(changed_page_nums) > 5 else ''})")

    # 如果有新作品导致总页数增加，生成新页
    for page_num in range(1, index['totalPages'] + 1):
        page_path = os.path.join(PAGES_DIR, f"page-{page_num}.json")
        if not os.path.exists(page_path):
            start = (page_num - 1) * PAGE_SIZE
            end = start + PAGE_SIZE
            page_projects = all_projects[start:end]
            page_data = {
                'page': page_num,
                'pageSize': PAGE_SIZE,
                'hasNext': page_num < index['totalPages'],
                'projects': page_projects,
            }
            with open(page_path, 'w', encoding='utf-8') as f:
                json.dump(page_data, f, ensure_ascii=False, indent=2)
            changed_page_nums.add(page_num)

    print(f"  分页文件共 {index['totalPages']} 页")

    print(f"\n{'=' * 60}")
    print(f"增量爬取完成！")
    print(f"  新增作品: {len(new_projects)} 个")
    print(f"  总作品数: {len(all_projects)} 个")
    print(f"  浏览量/点赞数已同步更新")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    main()
