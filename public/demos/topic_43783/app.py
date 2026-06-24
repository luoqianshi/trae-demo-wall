"""Flask 主应用：提供 API 路由和页面渲染"""

import io
import json
import os
from datetime import datetime

import bleach
from flask import Flask, jsonify, render_template, request, send_file, Response
from whitenoise import WhiteNoise

from config import (
    FLASK_HOST,
    FLASK_PORT,
    FLASK_DEBUG,
    EVENT_END_DATE,
    DATA_FILE,
    TRACK_TAGS,
)
from analyzer import (
    load_posts,
    search_by_keyword,
    detect_duplicates,
    find_similar,
    analyze_tracks,
    get_post_detail,
    _filter_demo,
)
from scraper import (
    read_status,
    read_update_log,
    run_incremental_update,
    load_existing_data,
)
from scheduler import init_scheduler, trigger_update, get_update_state
from snapshot import get_trend_data

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static"),
)

# WhiteNoise 中间件：在生产环境正确提供静态文件（正确的 MIME 类型和缓存头）
app.wsgi_app = WhiteNoise(app.wsgi_app, root=os.path.join(BASE_DIR, "static"), prefix="static/")

# 赛道分析缓存：基于 posts.json 修改时间失效，数据更新后自动重算
_tracks_cache = {"data": None, "mtime": 0.0}

# 启动定时任务（仅本地运行，PythonAnywhere 等部署环境跳过）
if "PYTHONANYWHERE_DOMAIN" not in os.environ:
    try:
        init_scheduler(app)
    except Exception:
        pass


def _make_excerpt(html_content, max_len=200):
    """从 HTML 内容中提取纯文本摘要"""
    import re
    text = re.sub(r"<[^>]+>", "", html_content)
    text = text.strip()
    if len(text) > max_len:
        text = text[:max_len] + "..."
    return text


# ========== 页面路由 ==========

@app.route("/")
def index():
    return render_template("index.html")


# ========== API 路由 ==========

@app.route("/api/posts")
def api_posts():
    """获取帖子列表（支持排序、分页、过滤）"""
    sort_by = request.args.get("sort", "views")
    order = request.args.get("order", "desc")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))
    demo_only = request.args.get("demo_only", "1") == "1"
    track = request.args.get("track", "")

    posts = load_posts()
    if not posts:
        return jsonify({"posts": [], "total": 0, "page": page, "per_page": per_page, "total_pages": 0})

    if demo_only:
        posts = _filter_demo(posts)

    if track:
        posts = [p for p in posts if track in p.get("tags", [])]

    # 排序
    key_map = {"views": "views", "like_count": "like_count", "posts_count": "posts_count", "vote_count": "vote_count", "created_at": "created_at"}
    key = key_map.get(sort_by, "views")
    reverse = (order == "desc")
    if key == "created_at":
        posts.sort(key=lambda p: p.get(key, ""), reverse=reverse)
    else:
        posts.sort(key=lambda p: p.get(key, 0), reverse=reverse)

    total = len(posts)
    total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
    start = (page - 1) * per_page
    end = start + per_page
    page_posts = posts[start:end]

    # 为列表视图精简数据（不含 content/raw_html）
    slim_posts = []
    for i, p in enumerate(page_posts):
        rank = start + i + 1
        slim_posts.append({
            "rank": rank,
            "id": p["id"],
            "title": p.get("title", ""),
            "author": p.get("author", ""),
            "tags": p.get("tags", []),
            "views": p.get("views", 0),
            "like_count": p.get("like_count", 0),
            "posts_count": p.get("posts_count", 0),
            "vote_count": p.get("vote_count", 0),
            "reply_count": p.get("reply_count", 0),
            "created_at": p.get("created_at", ""),
            "updated_at": p.get("updated_at", ""),
            "url": p.get("url", ""),
            "possibly_deleted": p.get("possibly_deleted", False),
        })

    return jsonify({
        "posts": slim_posts,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    })


@app.route("/api/posts/<int:topic_id>")
def api_post_detail(topic_id):
    """获取单条帖子详情"""
    post = get_post_detail(topic_id)
    if not post:
        return jsonify({"error": "帖子不存在"}), 404

    # 过滤 HTML 中的危险标签
    raw_html = post.get("raw_html", "")
    allowed_tags = ["p", "br", "strong", "em", "a", "img", "ul", "ol", "li",
                    "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"]
    allowed_attrs = {"a": ["href", "rel", "target"], "img": ["src", "alt"]}
    safe_html = bleach.clean(raw_html, tags=allowed_tags, attributes=allowed_attrs, strip=True)

    # 给 a 标签添加安全属性
    if safe_html:
        safe_html = safe_html.replace("<a ", '<a rel="noopener noreferrer" target="_blank" ')

    post["safe_html"] = safe_html
    return jsonify(post)


@app.route("/api/search")
def api_search():
    """关键词搜索"""
    q = request.args.get("q", "").strip()
    demo_only = request.args.get("demo_only", "1") == "1"
    sort = request.args.get("sort", "relevance")
    order = request.args.get("order", "desc")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))

    if not q:
        return jsonify({"posts": [], "total": 0, "page": page, "per_page": per_page, "total_pages": 0})

    results = search_by_keyword(q, demo_only=demo_only)

    # 排序
    if sort != "relevance":
        key_map = {"views": "views", "like_count": "like_count", "posts_count": "posts_count", "vote_count": "vote_count", "created_at": "created_at"}
        key = key_map.get(sort, "views")
        reverse = (order == "desc")
        if key == "created_at":
            results.sort(key=lambda p: p.get(key, ""), reverse=reverse)
        else:
            results.sort(key=lambda p: p.get(key, 0), reverse=reverse)

    total = len(results)
    total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
    start = (page - 1) * per_page
    end = start + per_page
    page_posts = results[start:end]

    slim_posts = []
    for i, p in enumerate(page_posts):
        rank = start + i + 1
        slim_posts.append({
            "rank": rank,
            "id": p["id"],
            "title": p.get("title", ""),
            "author": p.get("author", ""),
            "tags": p.get("tags", []),
            "views": p.get("views", 0),
            "like_count": p.get("like_count", 0),
            "posts_count": p.get("posts_count", 0),
            "vote_count": p.get("vote_count", 0),
            "reply_count": p.get("reply_count", 0),
            "created_at": p.get("created_at", ""),
            "updated_at": p.get("updated_at", ""),
            "url": p.get("url", ""),
        })

    return jsonify({
        "posts": slim_posts,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    })


@app.route("/api/duplicates")
def api_duplicates():
    """查重检测（旧接口，保留兼容）"""
    threshold = float(request.args.get("threshold", "0.85"))
    demo_only = request.args.get("demo_only", "1") == "1"

    pairs = detect_duplicates(threshold=threshold, demo_only=demo_only)

    result = []
    for p1, p2, sim in pairs:
        result.append({
            "post1": {"id": p1["id"], "title": p1.get("title", ""), "url": p1.get("url", ""), "author": p1.get("author", ""), "excerpt": _make_excerpt(p1.get("content", ""))},
            "post2": {"id": p2["id"], "title": p2.get("title", ""), "url": p2.get("url", ""), "author": p2.get("author", ""), "excerpt": _make_excerpt(p2.get("content", ""))},
            "similarity": round(sim, 4),
        })

    return jsonify({"pairs": result, "total": len(result), "threshold": threshold})


@app.route("/api/similar")
def api_similar():
    """相似作品搜索：以指定帖子为锚点，反查相似作品"""
    topic_id = request.args.get("topic_id")
    if not topic_id:
        return jsonify({"error": "缺少 topic_id 参数"}), 400

    try:
        topic_id = int(topic_id)
    except ValueError:
        return jsonify({"error": "topic_id 必须是整数"}), 400

    threshold = float(request.args.get("threshold", "0.5"))
    demo_only = request.args.get("demo_only", "1") == "1"

    # 获取锚点帖子信息
    anchor = get_post_detail(topic_id)
    if not anchor:
        return jsonify({"error": "未找到该帖子", "results": [], "total": 0})

    results = find_similar(topic_id, threshold=threshold, demo_only=demo_only)

    result_list = []
    for post, sim in results:
        result_list.append({
            "id": post["id"],
            "title": post.get("title", ""),
            "url": post.get("url", ""),
            "author": post.get("author", ""),
            "tags": post.get("tags", []),
            "views": post.get("views", 0),
            "like_count": post.get("like_count", 0),
            "vote_count": post.get("vote_count", 0),
            "excerpt": _make_excerpt(post.get("content", ""), 100),
            "similarity": round(sim, 4),
        })

    return jsonify({
        "anchor": {
            "id": anchor["id"],
            "title": anchor.get("title", ""),
            "url": anchor.get("url", ""),
            "author": anchor.get("author", ""),
            "tags": anchor.get("tags", []),
            "excerpt": _make_excerpt(anchor.get("content", ""), 100),
        },
        "results": result_list,
        "total": len(result_list),
        "threshold": threshold,
    })


@app.route("/api/tracks")
def api_tracks():
    """赛道分析数据（基于 posts.json 修改时间缓存，数据更新后自动重算）"""
    mtime = os.path.getmtime(DATA_FILE) if os.path.exists(DATA_FILE) else 0.0
    if _tracks_cache["data"] is None or mtime != _tracks_cache["mtime"]:
        stats = analyze_tracks()
        _tracks_cache["data"] = stats
        _tracks_cache["mtime"] = mtime
    return jsonify(_tracks_cache["data"])


@app.route("/api/trend")
def api_trend():
    """获取趋势数据"""
    topic_id = request.args.get("topic_id")
    days = int(request.args.get("days", "14"))

    if topic_id:
        topic_id = int(topic_id)

    data = get_trend_data(topic_id=topic_id, days=days)
    return jsonify(data)


@app.route("/api/status")
def api_status():
    """获取当前更新状态"""
    status = read_status()
    status["is_updating"] = get_update_state()
    # 如果 status.json 没有 updated_at，从更新日志中获取最后一次成功更新的时间
    if not status.get("updated_at"):
        logs = read_update_log()
        for log in logs:
            if log.get("status") == "success":
                status["updated_at"] = log.get("time", "")
                break
    # 如果仍然没有，用 posts.json 的文件修改时间
    if not status.get("updated_at") and os.path.exists(DATA_FILE):
        status["updated_at"] = datetime.fromtimestamp(os.path.getmtime(DATA_FILE)).isoformat()
    return jsonify(status)


@app.route("/api/update", methods=["POST"])
def api_update():
    """手动触发增量更新"""
    success, message = trigger_update()
    if success:
        return jsonify({"success": True, "message": message})
    else:
        return jsonify({"success": False, "message": message})


@app.route("/api/update-log")
def api_update_log():
    """获取更新日志"""
    logs = read_update_log()
    return jsonify({"logs": logs[:10]})  # 返回最近 10 条


@app.route("/api/export")
def api_export():
    """导出数据（CSV 或 JSON）"""
    fmt = request.args.get("format", "csv")
    demo_only = request.args.get("demo_only", "1") == "1"

    posts = load_posts()
    if demo_only:
        posts = _filter_demo(posts)

    if fmt == "json":
        output = json.dumps(posts, ensure_ascii=False, indent=2)
        return Response(
            output,
            mimetype="application/json",
            headers={"Content-Disposition": "attachment; filename=posts.json"}
        )
    else:
        # CSV
        import csv
        output = io.StringIO()
        fieldnames = ["id", "title", "author", "tags", "views", "like_count",
                      "posts_count", "vote_count", "reply_count", "created_at", "updated_at", "url"]
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for p in posts:
            row = dict(p)
            row["tags"] = ", ".join(p.get("tags", []))
            writer.writerow(row)

        csv_data = output.getvalue()
        output.close()

        # 添加 BOM 以支持 Excel 正确显示中文
        return Response(
            "\ufeff" + csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=posts.csv"}
        )


@app.route("/api/event-status")
def api_event_status():
    """获取赛事状态信息"""
    today = datetime.now().strftime("%Y-%m-%d")
    event_ended = today > EVENT_END_DATE
    return jsonify({
        "event_ended": event_ended,
        "event_end_date": EVENT_END_DATE,
        "today": today,
    })


@app.route("/api/first-scrape", methods=["POST"])
def api_first_scrape():
    """首次全量爬取（无密码要求，仅在无数据时可用）"""
    existing = load_existing_data()
    if existing:
        return jsonify({"success": False, "message": "已有数据，请使用增量更新"}), 400

    success, message = trigger_update()
    if success:
        return jsonify({"success": True, "message": message})
    else:
        return jsonify({"success": False, "message": message})


if __name__ == "__main__":
    print(f"  赛道透视镜 启动中...")
    print(f"  访问地址: http://{FLASK_HOST}:{FLASK_PORT}")
    print(f"  按 Ctrl+C 停止服务")
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=FLASK_DEBUG, use_reloader=False)
