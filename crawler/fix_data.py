#!/usr/bin/env python3
"""
TRAE Demo Wall 数据修复脚本
修复：空标签、异常标签、URL 清洗
"""

import json
import os
import re
import sys

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data')
PAGES_DIR = os.path.join(DATA_DIR, 'pages')
INDEX_PATH = os.path.join(DATA_DIR, 'index.json')

# 论坛标签名映射（数字 ID → 实际名称）
TAG_ID_MAP = {
    '65-tag': None,  # 无法确定，跳过
    '68-tag': None,  # 无法确定，跳过
}

# 标题中的赛道关键字映射
TITLE_TAG_PATTERNS = [
    (r'学习工作', '学习工作'),
    (r'生活娱乐', '生活娱乐'),
    (r'社会服务', '社会服务'),
    (r'社会公益', '社会公益'),
    (r'硬件交互', '硬件交互'),
]

# 异常标签列表（前端已有过滤逻辑，但数据层也清理）
INVALID_TAGS = {'65-tag', '68-tag'}


def fix_tags_from_title(title):
    """从标题中提取赛道标签"""
    tags = []
    for pattern, tag in TITLE_TAG_PATTERNS:
        if re.search(pattern, title):
            tags.append(tag)
    return tags


def clean_url(url):
    """清洗 URL"""
    if not url:
        return url
    
    # 移除末尾全角分号（及 URL 编码形式）
    url = url.replace('％3B', '').replace('%EF%BC%9B', '').rstrip('；;')
    
    # HTTP → HTTPS（仅 github.io / netlify.app / vercel.app）
    https_hosts = ['github.io', 'netlify.app', 'vercel.app', 'pages.dev', 'surge.sh']
    for host in https_hosts:
        if host in url and url.startswith('http://'):
            url = 'https://' + url[len('http://'):]
            break
    
    return url


def main():
    print("=" * 60)
    print("TRAE Demo Wall 数据修复脚本")
    print("=" * 60)

    # 统计计数器
    empty_tag_fixed = 0
    invalid_tag_removed = 0
    url_fixed = 0
    no_fix_needed = 0

    # 加载所有分页数据
    all_projects = []
    if not os.path.exists(PAGES_DIR):
        print(f"[ERROR] pages 目录不存在: {PAGES_DIR}")
        sys.exit(1)

    for fname in sorted(os.listdir(PAGES_DIR)):
        if fname.startswith('page-') and fname.endswith('.json'):
            with open(os.path.join(PAGES_DIR, fname), 'r', encoding='utf-8') as f:
                page_data = json.load(f)
            all_projects.extend(page_data.get('projects', []))

    print(f"\n加载了 {len(all_projects)} 个项目")

    # Step 1: 修复空标签（从标题解析）
    print("\n[Step 1] 修复空标签...")
    for p in all_projects:
        if not p.get('tags') or len(p.get('tags', [])) == 0:
            parsed_tags = fix_tags_from_title(p.get('title', ''))
            if parsed_tags:
                p['tags'] = parsed_tags
                empty_tag_fixed += 1
                print(f"  [FIX] {p['id']}: tags [] → {parsed_tags} (标题: {p['title'][:50]})")

    print(f"  修复 {empty_tag_fixed} 个空标签项目")

    # Step 2: 移除异常标签
    print("\n[Step 2] 移除异常标签...")
    for p in all_projects:
        tags = p.get('tags', [])
        original_tags = list(tags)
        p['tags'] = [t for t in tags if t not in INVALID_TAGS]
        if len(p['tags']) != len(original_tags):
            removed = set(original_tags) - set(p['tags'])
            invalid_tag_removed += 1
            print(f"  [FIX] {p['id']}: 移除标签 {removed}")

    print(f"  修复 {invalid_tag_removed} 个异常标签项目")

    # Step 3: 清洗 URL
    print("\n[Step 3] 清洗 URL...")
    for p in all_projects:
        # demoUrl
        original_url = p.get('demoUrl', '')
        if original_url:
            cleaned = clean_url(original_url)
            if cleaned != original_url:
                p['demoUrl'] = cleaned
                url_fixed += 1
                print(f"  [FIX] {p['id']}: demoUrl \"{original_url}\" → \"{cleaned}\"")

        # screenshots 中的 URL 也清洗
        for i, s in enumerate(p.get('screenshots', [])):
            cleaned = clean_url(s)
            if cleaned != s:
                p['screenshots'][i] = cleaned
                url_fixed += 1

    print(f"  修复 {url_fixed} 个 URL")

    # Step 4: 处理 local 类型但文件缺失的项目 → 标记为无 demo
    print("\n[Step 4] 检查 local 文件缺失...")
    DEMOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'demos')
    local_missing = 0
    for p in all_projects:
        if p.get('type') == 'local' and p.get('localPath'):
            # 检查路径中提到的文件是否存在
            rel_path = p['localPath'].lstrip('./')
            full_path = os.path.join(DEMOS_DIR, rel_path)
            if not os.path.exists(full_path):
                local_missing += 1
                print(f"  [WARN] {p['id']}: localPath \"{p['localPath']}\" 文件不存在")
                # 尝试查找替代文件
                topic_dir = os.path.join(DEMOS_DIR, f"topic_{p['id'].replace('topic_', '')}")
                if os.path.isdir(topic_dir):
                    # 找目录下的第一个 html 文件
                    for root, dirs, files in os.walk(topic_dir):
                        for f in files:
                            if f.endswith('.html'):
                                corrected = f"./demos/topic_{p['id'].replace('topic_', '')}/{f}"
                                print(f"    → 找到替代文件: {corrected}")
                                p['localPath'] = corrected
                                break
                        if p['localPath'] != f"./demos/topic_{p['id'].replace('topic_', '')}/index.html":
                            break
                    # 检查是否找到
                    if not os.path.exists(os.path.join(DEMOS_DIR, p['localPath'].lstrip('./'))):
                        # 重置
                        if os.path.isdir(topic_dir):
                            for root, dirs, files in os.walk(topic_dir):
                                for f in files:
                                    if f.endswith('.html'):
                                        corrected = f"./demos/topic_{p['id'].replace('topic_', '')}/{os.path.relpath(os.path.join(root, f), topic_dir)}"
                                        p['localPath'] = corrected
                                        print(f"    → 替代路径: {corrected}")
                                        break
                else:
                    # 目录不存在，将类型改为无法预览
                    p['type'] = 'none'
                    p['localPath'] = None
                    print(f"    → 标记为无法预览 (type=none)")

    print(f"  缺失 {local_missing} 个文件，已尝试修复或标记")

    # Step 5: 保存回分页文件
    print("\n[Step 5] 保存修复后的数据...")
    
    # 按创建时间倒序排序
    all_projects.sort(key=lambda p: p.get('createdAt', ''), reverse=True)

    # 统计
    tag_counts = {}
    total_views = 0
    total_likes = 0
    for p in all_projects:
        total_views += p.get('views', 0)
        total_likes += p.get('likes', 0)
        for tag in p.get('tags', []):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    PAGE_SIZE = 20
    total_pages = (len(all_projects) + PAGE_SIZE - 1) // PAGE_SIZE if all_projects else 0

    # 生成 index.json
    index = {
        'updatedAt': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
        'totalProjects': len(all_projects),
        'totalPages': total_pages,
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

    # 清除旧分页文件并重新生成
    for fname in os.listdir(PAGES_DIR):
        if fname.startswith('page-') and fname.endswith('.json'):
            os.remove(os.path.join(PAGES_DIR, fname))

    for page_num in range(total_pages):
        start = page_num * PAGE_SIZE
        end = start + PAGE_SIZE
        page_projects = all_projects[start:end]
        page_data = {
            'page': page_num + 1,
            'pageSize': PAGE_SIZE,
            'hasNext': page_num + 1 < total_pages,
            'projects': page_projects,
        }
        page_path = os.path.join(PAGES_DIR, f"page-{page_num + 1}.json")
        with open(page_path, 'w', encoding='utf-8') as f:
            json.dump(page_data, f, ensure_ascii=False, indent=2)

    print(f"  分页文件 page-1.json ~ page-{total_pages}.json")

    # 汇总
    print(f"\n{'=' * 60}")
    print(f"修复完成！")
    print(f"  空标签修复: {empty_tag_fixed} 个")
    print(f"  异常标签移除: {invalid_tag_removed} 个")
    print(f"  URL 清洗: {url_fixed} 个")
    print(f"  local 文件缺失: {local_missing} 个")
    print(f"  总项目数: {len(all_projects)}")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    main()
