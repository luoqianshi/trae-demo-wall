"""分析模块：关键词搜索、查重、赛道分析、排行榜"""

import json
import math
import os
from collections import Counter

from config import DATA_FILE, DUPLICATE_THRESHOLD, TRACK_TAGS, OFFICIAL_POST_IDS

# jieba 延迟加载，加快部署环境启动速度
_jieba = None


def _get_jieba():
    global _jieba
    if _jieba is None:
        import jieba as _j
        _jieba = _j
    return _jieba


def load_posts():
    """加载本地数据，自动排除官方教程/公告帖"""
    if not os.path.exists(DATA_FILE):
        print(f"数据文件不存在: {DATA_FILE}，请先运行爬取。")
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        posts = json.load(f)
    return [p for p in posts if p.get("id") not in OFFICIAL_POST_IDS]


def _is_demo_post(post):
    """判断是否为 Demo 参赛帖（有赛道标签，或标题含赛道关键词）"""
    tags = post.get("tags", [])
    # 有明确的赛道标签
    if any(t in TRACK_TAGS for t in tags):
        return True
    # 标题中包含赛道关键词（部分用户没打标签但在标题写明了赛道）
    title = post.get("title", "")
    if any(track in title for track in TRACK_TAGS):
        return True
    # 标题中包含 "赛道"、"Demo"、"初赛" 等参赛特征词（不区分大小写）
    title_lower = title.lower()
    if any(kw in title_lower for kw in ("赛道", "demo", "初赛")):
        return True
    return False


def _filter_demo(posts):
    """过滤出仅 Demo 参赛帖"""
    return [p for p in posts if _is_demo_post(p)]


def _tokenize(text):
    """中文分词"""
    return list(_get_jieba().cut(text))


def search_by_keyword(keyword, posts=None, demo_only=True):
    """
    按关键词搜索帖子（匹配标题 + 正文）。
    demo_only=True 时仅搜索带赛道标签的 Demo 参赛帖。
    返回匹配的帖子列表，按相关度排序（关键词出现次数）。
    """
    if posts is None:
        posts = load_posts()
    if demo_only:
        posts = _filter_demo(posts)
    if not posts:
        return []

    keyword_lower = keyword.lower()
    results = []
    for p in posts:
        title = (p.get("title") or "").lower()
        content = (p.get("content") or "").lower()
        score = title.count(keyword_lower) * 3 + content.count(keyword_lower)
        if score > 0:
            results.append((score, p))
    results.sort(key=lambda x: x[0], reverse=True)
    return [r[1] for r in results]


def _build_tfidf_vectors(docs, max_features=5000):
    """
    纯 Python 实现 TF-IDF + L2 归一化，稀疏向量（dict）表示。
    不依赖 sklearn，避免大型依赖包导致磁盘配额不足。
    返回: (vectors, term_to_idx)
      - vectors: list[dict[int, float]]，每个文档的稀疏 TF-IDF 向量（只存非零项）
      - term_to_idx: dict，term → 向量中的索引
    向量已 L2 归一化，点积即为余弦相似度。
    """
    if not docs:
        return [], {}

    tokenized = [_tokenize(doc) for doc in docs]
    doc_count = len(tokenized)

    # 统计 DF + 词频
    df = Counter()
    tf_list = []
    for tokens in tokenized:
        unique = set(tokens)
        for t in unique:
            df[t] += 1
        tf_list.append(Counter(tokens))

    top_terms = [t for t, _ in df.most_common(max_features)]
    term_to_idx = {t: i for i, t in enumerate(top_terms)}

    if not term_to_idx:
        return [], {}

    # 构建稀疏 TF-IDF 向量（只存非零项）
    vectors = []
    for tf in tf_list:
        sparse = {}
        sq_sum = 0.0
        for term, idx in term_to_idx.items():
            tf_val = tf.get(term, 0)
            if tf_val > 0:
                idf = math.log((doc_count + 1.0) / (df[term] + 1.0)) + 1.0
                val = tf_val * idf
                sparse[idx] = val
                sq_sum += val * val
        norm = math.sqrt(sq_sum) if sq_sum > 0 else 1.0
        # L2 归一化
        vectors.append({k: v / norm for k, v in sparse.items()})

    return vectors, term_to_idx


def _cosine_sim(vectors, i, j):
    """两个已归一化稀疏向量的余弦相似度（只遍历交集项）"""
    va, vb = vectors[i], vectors[j]
    # 遍历较短的向量，加速点积计算
    if len(va) > len(vb):
        va, vb = vb, va
    return sum(val * vb.get(idx, 0.0) for idx, val in va.items())


def detect_duplicates(posts=None, threshold=DUPLICATE_THRESHOLD, demo_only=True):
    """
    TF-IDF + 余弦相似度查重（纯 Python 实现）。
    demo_only=True 时仅比较带赛道标签的 Demo 参赛帖。
    返回 [(post1, post2, similarity), ...] 列表，按相似度降序。
    """
    if posts is None:
        posts = load_posts()
    if demo_only:
        posts = _filter_demo(posts)
    if len(posts) < 2:
        return []

    # 拼接标题 + 正文作为文档（标题权重加倍）
    docs = []
    for p in posts:
        title = p.get("title", "")
        content = p.get("content", "")
        docs.append(f"{title} {title} {content}")

    vectors, _ = _build_tfidf_vectors(docs)
    if not vectors:
        return []

    # 收集超过阈值的配对
    pairs = []
    n = len(posts)
    for i in range(n):
        for j in range(i + 1, n):
            sim = _cosine_sim(vectors, i, j)
            if sim >= threshold:
                pairs.append((posts[i], posts[j], sim))
    pairs.sort(key=lambda x: x[2], reverse=True)
    return pairs


def find_similar(topic_id, threshold=0.5, demo_only=True):
    """
    以指定帖子为锚点，查找与之相似的其他帖子（纯 Python 实现）。
    返回 [(post, similarity), ...] 列表，按相似度降序，不包含锚点本身。
    """
    posts = load_posts()
    if demo_only:
        posts = _filter_demo(posts)

    # 找到锚点帖子（在过滤后的列表中找）
    anchor = None
    anchor_idx = None
    for i, p in enumerate(posts):
        if p["id"] == topic_id:
            anchor = p
            anchor_idx = i
            break

    if anchor is None:
        # 锚点帖子可能不在 demo_only 过滤后的列表中，尝试从全量数据找
        all_posts = load_posts()
        for p in all_posts:
            if p["id"] == topic_id:
                anchor = p
                if anchor not in posts:
                    posts.append(anchor)
                    anchor_idx = len(posts) - 1
                break

    if anchor is None or anchor_idx is None or len(posts) < 2:
        return []

    # 拼接标题 + 正文作为文档（标题权重加倍）
    docs = []
    for p in posts:
        title = p.get("title", "")
        content = p.get("content", "")
        docs.append(f"{title} {title} {content}")

    vectors, _ = _build_tfidf_vectors(docs)
    if not vectors:
        return []

    results = []
    for i, _ in enumerate(posts):
        if i == anchor_idx:
            continue
        sim = _cosine_sim(vectors, anchor_idx, i)
        if sim >= threshold:
            results.append((posts[i], sim))

    results.sort(key=lambda x: x[1], reverse=True)
    return results


# 关键词提取停用词：通用虚词 + 赛事/论坛无意义词
_KEYWORD_STOPWORDS = frozenset([
    # 通用虚词
    "的", "了", "是", "在", "我", "有", "和", "就", "不", "人", "都", "一", "上",
    "也", "很", "到", "说", "要", "去", "你", "会", "着", "看", "好", "自己",
    "这", "那", "它", "他", "她", "我们", "他们", "可以", "这个", "那个", "什么",
    "怎么", "为什么", "因为", "所以", "但是", "如果", "虽然", "已经", "一个", "一些",
    "把", "让", "被", "从", "对", "向", "与", "及", "或", "只", "还", "又",
    "没", "吗", "吧", "呢", "啊", "呀", "哦", "嗯", "嘛", "啦",
    # 赛事/论坛无意义词
    "demo", "参赛", "提交", "初赛", "赛道", "作品", "项目", "trae", "ai", "创造力",
    "大赛", "比赛", "论坛", "帖子", "回复", "查看", "编辑", "发布", "更新", "使用",
    "实现", "功能", "系统", "设计", "可以", "能够", "需要", "通过", "进行", "一种",
    "打个招呼", "自我介绍", "大家好", "感谢", "谢谢", "支持", "分享",
    "大家", "身边", "朋友", "聊聊", "想法", "觉得", "希望", "想要", "发现",
    "经验总结", "总结", "经验", "收获", "感受", "体会", "至少", "然后",
    "部分", "标签", "内容", "问题", "方式", "过程", "结果", "时间", "方面",
    "简介", "标题", "包含", "以下", "额外", "增加", "比如", "面向", "完整", "行动",
    "简单", "核心", "介绍", "说明", "备注", "附", "补充", "相关", "前言",
    "开头", "结语", "结尾", "背景", "目的", "目标", "适用", "范围", "效果",
    "提供", "利用", "结合", "采用", "基于", "主要", "当前", "目前",
    # 赛道名本身
    "生活", "娱乐", "学习", "工作", "社会", "服务", "硬件", "交互", "公益",
])


def _extract_title_keywords(plist, top_n=20):
    """提取帖子标题中的关键词分布（jieba 分词 + 停用词过滤）"""
    from collections import Counter
    word_counts = Counter()
    for p in plist:
        title = p.get("title", "") or ""
        words = _get_jieba().cut(title)
        for w in words:
            w = w.strip().lower()
            if len(w) >= 2 and w not in _KEYWORD_STOPWORDS:
                word_counts[w] += 1
    return [{"word": w, "count": c} for w, c in word_counts.most_common(top_n)]


def analyze_tracks(posts=None):
    """
    赛道分析：各赛道帖子数量、占比、标题关键词分布、帖子列表、拥挤预警。
    参考 Hack-Hackathon 的做法：展示可量化数据，不做自动分类命名。
    """
    if posts is None:
        posts = load_posts()
    if not posts:
        return {}

    # 先尝试为未分类帖子自动补标签
    for p in posts:
        tags = p.get("tags", [])
        if not any(t in TRACK_TAGS for t in tags):
            title = p.get("title", "")
            for track in TRACK_TAGS:
                if track in title:
                    if track not in tags:
                        tags.append(track)
                    break
            p["tags"] = tags

    total = len(posts)

    # 按赛道分组
    track_posts = {t: [] for t in TRACK_TAGS}
    untagged = []

    for p in posts:
        tags = p.get("tags", [])
        assigned = False
        for tag in tags:
            tag_str = str(tag).strip()
            if tag_str in track_posts:
                track_posts[tag_str].append(p)
                assigned = True
        if not assigned:
            untagged.append(p)

    # 统计各赛道：关键词分布 + 帖子列表
    track_stats = {}
    for track, plist in track_posts.items():
        count = len(plist)
        ratio = count / total * 100 if total > 0 else 0
        keywords = _extract_title_keywords(plist)

        # 帖子列表（按浏览量降序排列，返回全部帖子供前端筛选）
        sorted_posts = sorted(plist, key=lambda p: p.get("views", 0), reverse=True)
        posts_data = [
            {
                "id": p.get("id"),
                "title": p.get("title", ""),
                "author": p.get("author", ""),
                "views": p.get("views", 0),
                "like_count": p.get("like_count", 0),
                "vote_count": p.get("vote_count", 0),
                "reply_count": p.get("reply_count", 0),
                "url": p.get("url", ""),
            }
            for p in sorted_posts
        ]

        track_stats[track] = {
            "count": count,
            "ratio": ratio,
            "keywords": keywords,
            "posts": posts_data,
        }

    return {
        "total": total,
        "tracks": track_stats,
        "untagged_count": len(untagged),
    }


def leaderboard(posts=None, sort_by="views", top_n=None, demo_only=True):
    """
    排行榜：按浏览量/点赞数/评论数/投票数排序。
    demo_only=True 时仅显示带赛道标签的 Demo 参赛帖。
    sort_by: "views", "likes", "comments", "votes"
    """
    if posts is None:
        posts = load_posts()
    if demo_only:
        posts = _filter_demo(posts)
    if not posts:
        return []

    key_map = {"views": "views", "likes": "like_count", "comments": "posts_count", "votes": "vote_count"}
    key = key_map.get(sort_by, "views")

    sorted_posts = sorted(posts, key=lambda p: p.get(key, 0), reverse=True)
    if top_n:
        sorted_posts = sorted_posts[:top_n]
    return sorted_posts


def get_post_detail(topic_id, posts=None):
    """根据帖子 ID 获取详情"""
    if posts is None:
        posts = load_posts()
    for p in posts:
        if p["id"] == topic_id:
            return p
    return None


def export_csv(posts, filepath="data/posts.csv"):
    """导出为 CSV 文件"""
    import csv

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "id", "title", "author", "tags", "views",
                "like_count", "posts_count", "vote_count", "reply_count",
                "created_at", "updated_at", "excerpt", "url"
            ],
            extrasaction="ignore",
        )
        writer.writeheader()
        for p in posts:
            row = {k: v for k, v in p.items() if k != "content"}
            row["tags"] = ", ".join(p.get("tags", []))
            writer.writerow(row)
    print(f"已导出到: {os.path.abspath(filepath)}")


if __name__ == "__main__":
    posts = load_posts()
    print(f"已加载 {len(posts)} 条帖子")
