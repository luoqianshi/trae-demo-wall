"""论坛数据爬取模块"""

import json
import os
import random
import re
import time
from datetime import datetime
from html.parser import HTMLParser

import requests

from config import (
    BASE_URL,
    DEMO_CATEGORY_URL,
    TOPIC_URL,
    QUERY_PARAMS,
    REQUEST_DELAY_MIN,
    REQUEST_DELAY_MAX,
    MAX_RETRIES,
    RETRY_BACKOFF,
    PAGE_SIZE,
    DATA_FILE,
    DATA_DIR,
    STATUS_FILE,
    UPDATE_LOG_FILE,
)


class HTMLTextExtractor(HTMLParser):
    """从 HTML 中提取纯文本，跳过 script/style/img/code/pre 等标签"""

    def __init__(self):
        super().__init__()
        self.text = []
        self.skip_tags = {"script", "style", "img", "code", "pre", "svg", "canvas"}
        self.skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.skip_depth += 1

    def handle_endtag(self, tag):
        if tag in self.skip_tags and self.skip_depth > 0:
            self.skip_depth -= 1

    def handle_data(self, data):
        if self.skip_depth == 0:
            self.text.append(data)

    def get_text(self):
        return "".join(self.text)


def clean_html(html):
    """清洗 HTML 为纯文本"""
    if not html:
        return ""
    extractor = HTMLTextExtractor()
    extractor.feed(html)
    text = extractor.get_text()
    text = re.sub(r"\n\s*\n", "\n", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def request_with_retry(url, params=None, max_retries=MAX_RETRIES):
    """带重试机制的 HTTP GET 请求"""
    last_error = None
    for attempt in range(max_retries + 1):
        try:
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            last_error = e
            if attempt < max_retries:
                wait = RETRY_BACKOFF ** (attempt + 1)
                print(f"  请求失败 ({e})，{wait:.0f}秒后重试 ({attempt + 1}/{max_retries})...")
                time.sleep(wait)
    raise RuntimeError(f"请求失败（已重试 {max_retries} 次）: {last_error}")


def _delay():
    """随机延迟 1-2 秒"""
    time.sleep(random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX))


def fetch_topic_list(page=1):
    """获取指定页的帖子列表（仅元数据，不含正文）"""
    params = {**QUERY_PARAMS}
    if page > 1:
        params["page"] = str(page)
    data = request_with_retry(DEMO_CATEGORY_URL, params=params)
    topics = data.get("topic_list", {}).get("topics", [])
    return topics


def fetch_topic_list_with_users(page=1):
    """获取指定页的帖子列表和用户信息，返回 (topics, users_map)"""
    params = {**QUERY_PARAMS}
    if page > 1:
        params["page"] = str(page)
    data = request_with_retry(DEMO_CATEGORY_URL, params=params)
    topics = data.get("topic_list", {}).get("topics", [])
    # 用户列表在顶层
    users = data.get("users", []) or data.get("topic_list", {}).get("users", [])
    users_map = {}
    for u in users:
        uid = u.get("id")
        if uid:
            # 优先用 name（显示名），为空则用 username
            users_map[uid] = u.get("name") or u.get("username", "")
    return topics, users_map


def fetch_topic_detail(topic_id):
    """获取单个帖子的完整内容（含正文 HTML、回复数、作者）"""
    url = TOPIC_URL.format(topic_id=topic_id)
    data = request_with_retry(url)
    post_stream = data.get("post_stream", {})
    posts = post_stream.get("posts", [])
    cooked = posts[0].get("cooked", "") if posts else ""
    # 作者取第一条帖子的 name（显示名），为空则用 username
    author = ""
    if posts:
        author = posts[0].get("name") or posts[0].get("display_username") or posts[0].get("username", "")
    return {
        "cooked": cooked,
        "reply_count": len(posts) - 1 if posts else 0,
        "author": author,
    }


def build_post_record(topic, detail):
    """将 topic 列表数据 + detail 正文数据合并为一条记录"""
    return {
        "id": topic["id"],
        "title": topic.get("title", ""),
        "excerpt": topic.get("excerpt", ""),
        "created_at": topic.get("created_at", ""),
        "updated_at": topic.get("updated_at", ""),
        "views": topic.get("views", 0),
        "like_count": topic.get("like_count", 0),
        "posts_count": topic.get("posts_count", 0),
        "vote_count": topic.get("vote_count", 0),
        "reply_count": detail["reply_count"],
        "tags": [t["name"] for t in topic.get("tags", [])],
        "author": detail.get("author", "") or topic.get("last_poster_username", ""),
        "url": f"{BASE_URL}/t/{topic['id']}",
        "content": clean_html(detail["cooked"]),
        "raw_html": detail["cooked"],
    }


def load_existing_data():
    """加载本地已有数据"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_data(posts):
    """保存数据到 JSON 文件"""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)


def write_status(state, message="", current=0, total=0, new_posts=0, started_at=None):
    """写入更新状态到 status.json"""
    os.makedirs(DATA_DIR, exist_ok=True)
    status = {
        "state": state,
        "started_at": started_at or datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "message": message,
        "current": current,
        "total": total,
        "new_posts": new_posts,
    }
    with open(STATUS_FILE, "w", encoding="utf-8") as f:
        json.dump(status, f, ensure_ascii=False, indent=2)


def read_status():
    """读取当前更新状态"""
    if os.path.exists(STATUS_FILE):
        with open(STATUS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"state": "idle", "message": ""}


def append_update_log(entry):
    """追加一条更新日志"""
    logs = []
    if os.path.exists(UPDATE_LOG_FILE):
        try:
            with open(UPDATE_LOG_FILE, "r", encoding="utf-8") as f:
                logs = json.load(f)
        except (json.JSONDecodeError, IOError):
            logs = []
    logs.insert(0, entry)
    logs = logs[:50]  # 最多保留 50 条
    with open(UPDATE_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, ensure_ascii=False, indent=2)


def read_update_log():
    """读取更新日志"""
    if os.path.exists(UPDATE_LOG_FILE):
        try:
            with open(UPDATE_LOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []


def _fetch_all_topic_meta():
    """翻页获取所有帖子的列表元数据，返回 {id: topic_dict} 映射。
    同时从 posters 数组中提取原帖作者，附加到 topic 的 _author 字段。
    """
    meta = {}
    page = 1
    consecutive_failures = 0
    while True:
        try:
            topics, users_map = fetch_topic_list_with_users(page)
            consecutive_failures = 0
        except Exception as e:
            consecutive_failures += 1
            print(f"  ⚠ 获取列表第 {page} 页失败: {e}")
            if consecutive_failures >= 3:
                print("  连续 3 页失败，停止翻页。")
                break
            page += 1
            _delay()
            continue
        if not topics:
            break
        for t in topics:
            # 从 posters 数组中找原帖作者（中文描述"原始发帖人"）
            posters = t.get("posters", [])
            for p in posters:
                desc = p.get("description") or ""
                if "原始发帖人" in desc or "Original Poster" in desc:
                    uid = p.get("user_id")
                    if uid and uid in users_map:
                        t["_author"] = users_map[uid]
                    break
            meta[t["id"]] = t
        if len(topics) < PAGE_SIZE:
            break
        page += 1
        _delay()
    return meta


def update_existing_posts(posts, on_progress=None):
    """
    阶段一：刷新已有帖子的数据。
    先批量获取列表元数据（views/likes 等），只对 updated_at 变化的帖子请求详情更新正文。
    返回 (更新后的 posts 列表, 需要刷新详情的数量)。
    """
    total = len(posts)

    # 先批量获取所有列表元数据
    print("  批量获取列表元数据...")
    meta_map = _fetch_all_topic_meta()
    print(f"  获取到 {len(meta_map)} 条列表元数据。")

    # 先用列表元数据更新 views/likes/comments，并判断哪些帖子需要刷新正文
    need_detail_update = []
    for i, post in enumerate(posts):
        tid = post["id"]
        if on_progress:
            on_progress(i, total, 0)

        if tid in meta_map:
            t = meta_map[tid]
            old_updated_at = post.get("updated_at", "")
            new_updated_at = t.get("updated_at", "")
            # 更新列表元数据
            post["views"] = t.get("views", post["views"])
            post["like_count"] = t.get("like_count", post["like_count"])
            post["posts_count"] = t.get("posts_count", post["posts_count"])
            post["vote_count"] = t.get("vote_count", post.get("vote_count", 0))
            post["updated_at"] = new_updated_at
            # 从列表元数据中更新作者（原帖作者，非最后评论者）
            if t.get("_author"):
                post["author"] = t["_author"]
            # 只有 updated_at 变化时才需要刷新正文
            if new_updated_at and old_updated_at and new_updated_at != old_updated_at:
                need_detail_update.append(i)
        elif tid not in meta_map:
            # 帖子可能被删除，保留本地数据但标记
            post["possibly_deleted"] = True
            print(f"  ⚠ 帖子 #{tid} 在列表中未找到，可能已被删除。")

    if on_progress:
        on_progress(total, total, 0)

    # 只对 updated_at 变化的帖子请求详情
    if need_detail_update:
        print(f"  {len(need_detail_update)} 条帖子有更新，正在刷新正文...")
        for idx, i in enumerate(need_detail_update):
            post = posts[i]
            tid = post["id"]
            try:
                _delay()
                detail = fetch_topic_detail(tid)
                post["content"] = clean_html(detail["cooked"])
                post["raw_html"] = detail["cooked"]
                post["reply_count"] = detail["reply_count"]
            except Exception as e:
                print(f"  ⚠ 刷新帖子 #{tid} 正文失败: {e}，保留旧数据。")
    else:
        print("  所有帖子正文无变化，跳过详情刷新。")

    return posts, len(need_detail_update)


def fetch_new_posts(existing_ids, on_progress=None):
    """
    阶段二：增量爬取新帖。
    从第 1 页开始翻页，遇到已有 ID 跳过，连续整页都是已有 ID 时停止。
    返回新帖列表。
    """
    new_posts = []
    page = 1
    stop_paging = False
    consecutive_existing_pages = 0

    while not stop_paging:
        print(f"正在获取第 {page} 页...")
        try:
            topics = fetch_topic_list(page)
        except Exception as e:
            print(f"  ⚠ 获取第 {page} 页失败: {e}")
            break

        if not topics:
            print("  没有更多帖子，翻页结束。")
            break

        page_all_existing = True
        for topic in topics:
            tid = topic["id"]
            if tid in existing_ids:
                print(f"  帖子 #{tid} 已存在，跳过。")
                continue

            page_all_existing = False
            consecutive_existing_pages = 0
            _delay()
            print(f"  获取帖子 #{tid}: {topic.get('title', '无标题')[:40]}...")
            try:
                detail = fetch_topic_detail(tid)
                record = build_post_record(topic, detail)
                new_posts.append(record)
                if on_progress:
                    on_progress(0, 0, len(new_posts))
            except Exception as e:
                print(f"  ⚠ 获取帖子 #{tid} 失败: {e}，跳过。")
                continue

        if page_all_existing:
            consecutive_existing_pages += 1
            if consecutive_existing_pages >= 1:
                print("  整页都是已有帖子，停止翻页。")
                stop_paging = True

        if len(topics) < PAGE_SIZE:
            print("  当前页不足 30 条，已到最后一页。")
            stop_paging = True

        page += 1
        if not stop_paging:
            _delay()

    return new_posts


def run_incremental_update(on_progress=None):
    """
    两阶段增量更新主入口：
    1. 刷新已有帖子数据
    2. 增量爬取新帖
    3. 保存数据 + 写日志
    返回 (all_posts, new_count)。
    """
    started_at = datetime.now().isoformat()
    write_status("running", "正在加载本地数据...", started_at=started_at)

    existing = load_existing_data()
    existing_ids = {p["id"] for p in existing}

    # 阶段一：刷新已有帖子（只更新列表元数据 + 变化帖子的详情）
    write_status("running", "阶段一：刷新已有帖子数据...", current=0, total=len(existing), started_at=started_at)
    detail_updated = 0
    if existing:
        existing, detail_updated = update_existing_posts(
            existing,
            on_progress=lambda i, t, n: write_status(
                "running", f"阶段一：刷新已有帖子 ({i}/{t})", i, t, n, started_at
            ),
        )

    # 阶段二：爬取新帖
    write_status("running", "阶段一完成，正在检查新帖...", current=len(existing), total=len(existing), started_at=started_at)
    new_posts = fetch_new_posts(
        existing_ids,
        on_progress=lambda i, t, n: write_status(
            "running", f"阶段二：爬取新帖 (已发现 {n} 条新帖)", len(existing), len(existing), n, started_at
        ),
    )

    all_posts = existing + new_posts
    save_data(all_posts)

    elapsed = (datetime.now() - datetime.fromisoformat(started_at)).total_seconds()
    log_entry = {
        "time": started_at,
        "elapsed_seconds": round(elapsed, 1),
        "new_posts": len(new_posts),
        "detail_updated": detail_updated,
        "total_posts": len(all_posts),
        "status": "success",
    }
    append_update_log(log_entry)

    # 检查连续无新增天数
    if len(new_posts) == 0:
        log = read_update_log()
        consecutive_days = 0
        for entry in reversed(log):
            if entry.get("new_posts", 0) == 0:
                consecutive_days += 1
            else:
                break
        if consecutive_days >= 7:
            warn_msg = f"已连续 {consecutive_days} 天无新增帖子，赛事可能已结束。"
            print(f"  ⚠ {warn_msg}")
            log_entry["warning"] = warn_msg

    write_status("success", f"更新完成：新增 {len(new_posts)} 条，正文更新 {detail_updated} 条，共 {len(all_posts)} 条", started_at=started_at)
    print(f"\n更新完成：共 {len(all_posts)} 条帖子（新增 {len(new_posts)} 条，正文更新 {detail_updated} 条），耗时 {elapsed:.1f} 秒。")
    return all_posts, len(new_posts)


def scrape_all(incremental=True):
    """
    全量爬取（首次使用，不刷新已有数据）。
    保留原 CLI 兼容入口。
    """
    existing = load_existing_data() if incremental else []
    existing_ids = {p["id"] for p in existing}

    new_posts = []
    page = 1
    stop_paging = False

    while not stop_paging:
        print(f"正在获取第 {page} 页...")
        topics = fetch_topic_list(page)

        if not topics:
            print("  没有更多帖子，翻页结束。")
            break

        for topic in topics:
            tid = topic["id"]

            if incremental and tid in existing_ids:
                print(f"  帖子 #{tid} 已存在，跳过。")
                continue

            _delay()
            print(f"  获取帖子 #{tid}: {topic.get('title', '无标题')[:40]}...")
            try:
                detail = fetch_topic_detail(tid)
                record = build_post_record(topic, detail)
                new_posts.append(record)
            except Exception as e:
                print(f"  ⚠ 获取帖子 #{tid} 失败: {e}，跳过。")
                continue

        if len(topics) < PAGE_SIZE:
            print("  当前页不足 30 条，已到最后一页。")
            stop_paging = True

        page += 1
        if not stop_paging:
            _delay()

    if incremental:
        all_posts = existing + new_posts
    else:
        all_posts = new_posts

    save_data(all_posts)
    print(f"\n爬取完成：共 {len(all_posts)} 条帖子（本次新增 {len(new_posts)} 条）。")
    print(f"数据已保存至: {os.path.abspath(DATA_FILE)}")
    return all_posts


if __name__ == "__main__":
    scrape_all(incremental=True)
