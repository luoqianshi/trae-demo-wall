#!/usr/bin/env python3
"""
TRAE Demo Wall 爬虫
从 forum.trae.cn 爬取初赛专区的网页/前端作品
"""

import json
import os
import sys
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup

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
DELAY = 0.5
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data')
PAGES_DIR = os.path.join(OUTPUT_DIR, 'pages')
DEMOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'demos')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
}


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


def parse_topic_list(data: dict) -> list[dict]:
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
    print("TRAE Demo Wall 爬虫启动")
    print("=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(PAGES_DIR, exist_ok=True)
    os.makedirs(DEMOS_DIR, exist_ok=True)

    print("\n[Step 1] 遍历论坛帖子列表...")
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
        page += 1
        more_url = data.get('topic_list', {}).get('more_topics_url', None)
        if not more_url:
            break
        time.sleep(DELAY)

    print(f"  共获取 {len(all_topics)} 个帖子")

    print("\n[Step 2] 筛选网页/前端作品...")
    web_topics = []
    for topic in all_topics:
        title = topic.get('title', '')
        excerpt = topic.get('excerpt', '')
        if is_web_project(title, excerpt, ''):
            web_topics.append(topic)
            continue
        topic['_need_detail_check'] = True
        web_topics.append(topic)

    print(f"  初步筛选 {len(web_topics)} 个候选帖子")

    print("\n[Step 3] 获取帖子详情并处理...")
    projects = []
    for i, topic in enumerate(web_topics):
        topic_id = topic['id']
        title = topic.get('title', '')
        print(f"  [{i + 1}/{len(web_topics)}] 处理: {title[:40]}...")

        try:
            detail_data = fetch_topic_detail(topic_id)
            detail = parse_topic_detail(detail_data, topic_id)
            if not detail:
                continue

            if topic.get('_need_detail_check'):
                cooked = detail_data.get('post_stream', {}).get('posts', [{}])[0].get('cooked', '')
                if not is_web_project(title, topic.get('excerpt', ''), cooked):
                    continue

            project = process_project(topic, detail)
            if project:
                projects.append(project)
                print(f"    -> 已收录 ({project['type']})")
        except Exception as e:
            print(f"    [ERROR] {e}")

        time.sleep(DELAY)

    print(f"\n  共收录 {len(projects)} 个网页/前端作品")

    projects.sort(key=lambda p: p.get('createdAt', ''), reverse=True)

    print("\n[Step 4] 生成数据文件...")

    tag_counts = {}
    total_views = 0
    total_likes = 0
    for p in projects:
        total_views += p.get('views', 0)
        total_likes += p.get('likes', 0)
        for tag in p.get('tags', []):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    index = {
        'updatedAt': datetime.utcnow().isoformat() + 'Z',
        'totalProjects': len(projects),
        'totalPages': (len(projects) + PAGE_SIZE - 1) // PAGE_SIZE if projects else 0,
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
            for p in projects
        ],
    }

    with open(os.path.join(OUTPUT_DIR, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"  index.json ({len(index['projects'])} 条摘要)")

    for page_num in range(index['totalPages']):
        start = page_num * PAGE_SIZE
        end = start + PAGE_SIZE
        page_projects = projects[start:end]
        page_data = {
            'page': page_num + 1,
            'pageSize': PAGE_SIZE,
            'hasNext': page_num + 1 < index['totalPages'],
            'projects': page_projects,
        }
        page_path = os.path.join(PAGES_DIR, f"page-{page_num + 1}.json")
        with open(page_path, 'w', encoding='utf-8') as f:
            json.dump(page_data, f, ensure_ascii=False, indent=2)
        print(f"  page-{page_num + 1}.json ({len(page_projects)} 条)")

    print(f"\n{'=' * 60}")
    print(f"爬取完成！共 {len(projects)} 个作品")
    print(f"索引: src/data/index.json")
    print(f"分页: src/data/pages/page-1.json ~ page-{index['totalPages']}.json")
    print(f"本地作品: public/demos/")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    main()
