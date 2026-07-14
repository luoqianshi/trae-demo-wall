# -*- coding: utf-8 -*-
"""
AI-Speed-Reader 后端服务
纯 Python + jieba 实现，不依赖外部 AI API
提供文本关键词提取、摘要生成、金句提炼、阅读分析、思维导图、情感分析等功能
"""

import json
import math
import re
from collections import Counter, defaultdict
from typing import List, Dict, Tuple, Set

import os
import jieba
import jieba.analyse
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# ============================================================
#  常量与配置
# ============================================================

# 中文停用词（高频但无实际意义的词）
STOP_WORDS: Set[str] = set("""
的 了 在 是 我 有 和 就 不 人 都 一 一个 上 也 很 到 说 要 去 你 会 着 没有 看 好
自己 这 他 她 它 们 那 里 个 什么 为 之 与 或 但 而 却 又 及 对 把 从 被 让 向 往
该 其中 并 以 因为 所以 如果 虽然 但是 还是 不过 然后 只是 或者 以及 之后 之前
地 得 中 大 小 多 少 可 能 还 已 已经 此 个 等 吧 呢 啊 哦 哈 嗯 呀 嘛
该 某些 些 其 之 等 就是 这个 那个 这些 那些 每个 某个 任何 所有 什么 怎么 哪里
时 时候 当 下 上 里 外 前 后 左 右 来 过 去 不 没 未 将 会 要 应 该 必须 可能
更 最 比 较 十 百 千 万 亿 第 初 正 好 太 更 最 极 较 一样 同样 类似 类似于
一方面 另一方面 同时 此外 另外 以及 如上所述 综上所述 总的来说 总体而言
""".split())

# 中文情感词典（内置简易版）
POSITIVE_WORDS: Set[str] = set("""
好 优秀 卓越 出色 伟大 美好 快乐 幸福 成功 赞 赞美 棒 精彩 漂亮 强大 创新
进步 发展 提升 优化 完善 完美 高效 便捷 智能 先进 科学 合理 稳定 可靠 安全
健康 积极 乐观 希望 信心 机遇 优势 亮点 价值 收益 增长 突破 超越 引领 领先
卓越 顶尖 一流 杰出 显著 有效 实用 方便 快速 简单 清晰 准确 精确 高质量
热情 真诚 友好 善良 温暖 动人 震撼 惊艳 精致 细腻 深刻 丰富 优秀 杰出
喜欢 爱 热爱 欣赏 享受 满意 高兴 开心 感谢 感激 尊重 关注 支持 拥护 推荐
积极 向上 勇敢 坚持 努力 奋斗 拼搏 奉献 贡献 和谐 团结 合作 共赢 共建
新兴 繁荣 昌盛 振兴 复兴 腾飞 飞跃 跨越 升级 转型 变革 创新 革命 开拓
美丽 优美 秀丽 壮丽 宏伟 辉煌 璀璨 绚丽 鲜艳 明亮 清新 自然 纯净
""".split())

NEGATIVE_WORDS: Set[str] = set("""
差 劣 坏 糟糕 失败 问题 困难 危机 风险 错误 缺陷 弱点 短板 痛点 不足
低效 复杂 难 混乱 落后 保守 僵化 停滞 衰退 萎缩 下降 减少 丧失 泄露
危险 威胁 隐患 事故 灾害 损失 浪费 负担 压力 焦虑 恐惧 担忧 痛苦 困惑
不满 抱怨 批评 质疑 反对 抵制 抗议 拒绝 否定 否认 否决 否决 取消 限制
腐败 贪污 污染 破坏 毁灭 灭绝 恐怖 暴力 犯罪 欺诈 虚假 伪造 失信
消极 悲观 失望 沮丧 绝望 绝望 痛苦 折磨 苦难 磨难 挫折 打击 崩溃 倒塌
衰退 萧条 不景气 低迷 下滑 恶化 劣质 伪劣 残次 缺失 空白 断层 鸿沟
严重 关键 紧急 危急 棘手 烦恼 苦恼 郁闷 厌倦 疲惫 厌恶 憎恨 仇恨
""".split())

# 否定词列表（遇到否定词，情感反转）
NEGATION_WORDS: Set[str] = set("不 没 未 非 无 莫 勿 弗 毋 别 否 未曾 并不 毫不 决不 并非".split())

# 程度副词及其权重
DEGREE_WORDS: Dict[str, float] = {
    "非常": 2.0, "极其": 2.5, "特别": 2.0, "十分": 2.0, "格外": 1.8,
    "相当": 1.5, "比较": 1.2, "稍微": 0.5, "略微": 0.5, "有点": 0.6,
    "很": 1.8, "太": 2.0, "超": 2.0, "极度": 2.5, "尤为": 1.8,
    "无比": 2.0, "相当": 1.5, "挺": 1.3, "蛮": 1.3, "颇为": 1.5,
}

# 分隔文本为句子的标点
SENTENCE_ENDINGS = re.compile(r'[。！？；\n]+')

# ============================================================
#  工具函数
# ============================================================


def split_sentences(text: str) -> List[str]:
    """将文本拆分为句子列表，过滤掉空句子和过短的无意义片段"""
    raw = SENTENCE_ENDINGS.split(text)
    sentences = [s.strip() for s in raw if len(s.strip()) > 5]
    return sentences


def split_paragraphs(text: str) -> List[str]:
    """将文本按段落拆分"""
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    return paragraphs if paragraphs else [text.strip()]


def tokenize(text: str) -> List[str]:
    """使用 jieba 分词，过滤停用词和标点，保留有意义的词"""
    words = jieba.lcut(text)
    return [w for w in words
            if len(w) >= 2 and w not in STOP_WORDS and not re.match(r'^[\W\d]+$', w)]


def count_chinese_chars(text: str) -> int:
    """统计中文字符数（不含标点和空白）"""
    return len(re.findall(r'[\u4e00-\u9fff]', text))


# ============================================================
#  1. 关键词提取（TF-IDF）
# ============================================================


def extract_keywords(text: str, top_n: int = 10) -> List[Dict[str, float]]:
    """
    使用 jieba 自带 TF-IDF 算法提取关键词
    返回: [{"word": "关键词", "weight": 权重}, ...]
    """
    # 使用 jieba.analyse 的 TF-IDF 实现
    keywords_with_weight = jieba.analyse.extract_tags(text, topK=top_n, withWeight=True)

    # 归一化权重到 0~1 区间
    if keywords_with_weight:
        max_weight = max(w for _, w in keywords_with_weight)
        min_weight = min(w for _, w in keywords_with_weight)
        range_w = max_weight - min_weight if max_weight != min_weight else 1.0

        result = []
        for word, weight in keywords_with_weight:
            normalized = round((weight - min_weight) / range_w, 4)
            result.append({"word": word, "weight": normalized})
        return result

    return [{"word": "无", "weight": 0}]


# ============================================================
#  2. 摘要生成（句子重要度评分）
# ============================================================


def generate_summary(text: str, top_n: int = 3) -> List[str]:
    """
    基于句子重要度评分提取 Top N 核心句子作为摘要
    评分因素：词频覆盖度 + 位置加权 + 句子长度加权
    """
    sentences = split_sentences(text)
    if len(sentences) <= top_n:
        return sentences

    # 对全文分词，计算词频
    all_words = tokenize(text)
    word_freq = Counter(all_words)
    total_words = len(all_words) if all_words else 1
    # 计算每个词的 TF（去除停用词后的词频比）
    word_tf = {w: c / total_words for w, c in word_freq.items()}

    # 前文关键词（用作"概念引入"的参考）
    top_keywords = set(w for w, _ in word_freq.most_common(30))

    sentence_scores = []
    for idx, sent in enumerate(sentences):
        score = 0.0
        sent_words = tokenize(sent)
        if not sent_words:
            sentence_scores.append(0.0)
            continue

        # ① 词频覆盖度：句子中的词在全文高频词中的覆盖
        tf_score = sum(word_tf.get(w, 0) for w in sent_words)
        # 关键词命中率（句子中包含多少 top 关键词）
        keyword_hit = sum(1 for w in sent_words if w in top_keywords) / max(len(sent_words), 1)

        # ② 位置加权：首段、末段句子加分
        position_score = 1.0
        total = len(sentences)
        if idx < total * 0.15:  # 前15%的句子（开篇）
            position_score = 1.5
        elif idx > total * 0.85:  # 后15%的句子（总结）
            position_score = 1.3

        # ③ 长度加权：适中长度的句子更可能是核心句
        sent_len = len(sent)
        # 理想长度 20-60 字
        if 20 <= sent_len <= 60:
            length_score = 1.2
        elif 10 <= sent_len <= 80:
            length_score = 1.0
        else:
            length_score = 0.7

        # 综合评分
        score = (tf_score * 10 + keyword_hit * 5) * position_score * length_score
        sentence_scores.append(score)

    # 按得分排序取 Top N，同时保持原文顺序
    ranked = sorted(enumerate(sentence_scores), key=lambda x: x[1], reverse=True)
    top_indices = sorted([i for i, _ in ranked[:top_n]])

    return [sentences[i] for i in top_indices]


# ============================================================
#  3. 金句提炼
# ============================================================


def extract_golden_sentences(text: str, top_n: int = 5) -> List[Dict[str, str]]:
    """
    找出最有力的短句作为金句
    筛选条件：15-50字，信息密度高，含有对比/排比/比喻等修辞特征
    """
    sentences = split_sentences(text)
    candidates = []

    # 修辞/强调特征正则模式
    patterns = [
        (r'不是.{1,6}而是', "对比"),     # 不是...而是...
        (r'不仅.{1,6}还', "递进"),       # 不仅...还...
        (r'既.{1,4}又.{1,4}', "并列"),   # 既...又...
        (r'是.{2,8}的.{2,8}', "定义"),    # 是...的...
        (r'只有.{2,10}才', "条件"),       # 只有...才...
        (r'无论.{2,8}都', "让步"),       # 无论...都...
        (r'越.{1,4}越.{1,4}', "递进"),   # 越...越...
        (r'[，,].{2,6}[，,]', "排比"),    # 含多个逗号分隔短语的句子
        (r'关键|核心|本质|根本|灵魂|精髓', "强调"),  # 含强调词
        (r'——|—', "解释说明"),           # 破折号引出解释
        (r'「.*」|".*"', "引用"),         # 引用
    ]

    for sent in sentences:
        char_count = count_chinese_chars(sent)
        # 筛选 15-50 字的句子
        if not (15 <= char_count <= 50):
            continue

        # 计算信息密度（关键词占比）
        words = tokenize(sent)
        if not words:
            continue

        all_words = tokenize(text)
        word_freq = Counter(all_words)
        # 高频词在句子中的占比
        top_kws = set(w for w, _ in word_freq.most_common(20))
        density = sum(1 for w in words if w in top_kws) / len(words)

        # 修辞特征加分
        rhetoric_score = 0
        matched_features = []
        for pattern, feature_name in patterns:
            if re.search(pattern, sent):
                rhetoric_score += 1
                matched_features.append(feature_name)

        # 综合评分
        score = density * 0.5 + rhetoric_score * 0.5

        candidates.append({
            "sentence": sent,
            "score": round(score, 4),
            "char_count": char_count,
            "features": matched_features
        })

    # 按评分排序取 Top N
    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates[:top_n]


# ============================================================
#  4. 阅读分析
# ============================================================


def analyze_reading(text: str) -> Dict:
    """
    阅读分析：字数统计、预估阅读时间、段落分析、信息密度评分
    """
    char_count = count_chinese_chars(text)
    # 中文平均阅读速度：约 300-500 字/分钟，取 400
    reading_time_min = char_count / 400
    reading_time_min = math.ceil(reading_time_min * 10) / 10  # 保留一位小数，向上取整

    paragraphs = split_paragraphs(text)
    sentences = split_sentences(text)

    # 段落分析
    para_details = []
    for idx, para in enumerate(paragraphs):
        para_chars = count_chinese_chars(para)
        para_words = tokenize(para)
        # 段落信息密度：有效词 / 段落字数
        density = len(para_words) / max(para_chars, 1)
        para_details.append({
            "index": idx + 1,
            "char_count": para_chars,
            "word_count": len(para_words),
            "density": round(density, 4),
            "text": para[:50],
            "density_score": round(density * 100)
        })

    # 全文信息密度评分（0-100）
    all_words = tokenize(text)
    unique_words = set(all_words)
    lexical_diversity = len(unique_words) / max(len(all_words), 1)  # 词汇多样性

    # 关键词集中度（前10关键词在总词数中的占比）
    word_freq = Counter(all_words)
    top10_count = sum(c for _, c in word_freq.most_common(10))
    keyword_concentration = top10_count / max(len(all_words), 1)

    # 综合密度分：多样性高 + 关键词集中 → 信息密度高
    density_score = round((lexical_diversity * 40 + keyword_concentration * 30 + len(unique_words) * 0.3) * 2, 1)
    density_score = min(max(density_score, 0), 100)  # 限制在 0-100

    # 句子长度分布
    sent_lengths = [count_chinese_chars(s) for s in sentences]
    avg_sent_len = round(sum(sent_lengths) / len(sent_lengths), 1) if sent_lengths else 0

    return {
        "total_chars": char_count,
        "total_sentences": len(sentences),
        "total_paragraphs": len(paragraphs),
        "unique_words": len(unique_words),
        "reading_time_minutes": reading_time_min,
        "avg_sentence_length": avg_sent_len,
        "info_density_score": density_score,
        "info_density_level": _density_level(density_score),
        "paragraphs": para_details
    }


def _density_level(score: float) -> str:
    """将密度分数转为可读等级"""
    if score >= 75:
        return "极高"
    elif score >= 55:
        return "较高"
    elif score >= 35:
        return "中等"
    elif score >= 20:
        return "较低"
    else:
        return "极低"


# ============================================================
#  5. 思维导图数据
# ============================================================


def generate_mindmap(text: str, keywords: List[Dict[str, float]]) -> Dict:
    """
    基于关键词共现关系生成层级结构数据
    将关键词按语义关联聚类，形成：主主题 → 子主题 → 关键词 的树形结构
    """
    if not keywords:
        return {"name": "文本分析", "children": []}

    sentences = split_sentences(text)

    # 构建关键词共现矩阵（出现在同一句子中则共现+1）
    keyword_words = [k["word"] for k in keywords]
    cooccurrence: Dict[Tuple[str, str], int] = defaultdict(int)
    keyword_sent_map: Dict[str, Set[int]] = defaultdict(set)

    for s_idx, sent in enumerate(sentences):
        words = set(tokenize(sent))
        for kw in keyword_words:
            if kw in words:
                keyword_sent_map[kw].add(s_idx)

    for i, kw1 in enumerate(keyword_words):
        for kw2 in keyword_words[i + 1:]:
            common_sents = keyword_sent_map[kw1] & keyword_sent_map[kw2]
            if common_sents:
                cooccurrence[(kw1, kw2)] = len(common_sents)

    # 使用简单的层次聚类将关键词分组
    # 先按共现关系建立邻接图
    clusters: List[Set[str]] = []
    visited: Set[str] = set()

    # 按权重从高到低处理共现对
    sorted_pairs = sorted(cooccurrence.items(), key=lambda x: x[1], reverse=True)

    for (kw1, kw2), count in sorted_pairs:
        # 找到两个词各自所在的聚类
        cluster_kw1 = None
        cluster_kw2 = None
        for c in clusters:
            if kw1 in c:
                cluster_kw1 = c
            if kw2 in c:
                cluster_kw2 = c

        if cluster_kw1 is None and cluster_kw2 is None:
            # 都未分配，创建新聚类
            clusters.append({kw1, kw2})
        elif cluster_kw1 is not None and cluster_kw2 is None:
            cluster_kw1.add(kw2)
        elif cluster_kw1 is None and cluster_kw2 is not None:
            cluster_kw2.add(kw1)
        elif cluster_kw1 is not cluster_kw2:
            # 合并两个聚类
            cluster_kw1.update(cluster_kw2)
            clusters.remove(cluster_kw2)

    # 将未被聚类的高权重词单独成组
    for kw in keyword_words:
        if not any(kw in c for c in clusters):
            clusters.append({kw})

    # 构建思维导图树形结构
    weight_map = {k["word"]: k["weight"] for k in keywords}

    # 为每个聚类生成主题名称（取权重最高的词作为主题名）
    children = []
    for cluster in clusters:
        cluster_list = sorted(cluster, key=lambda w: weight_map.get(w, 0), reverse=True)
        theme_name = cluster_list[0]

        # 子节点：其余关键词
        sub_items = []
        for word in cluster_list[1:]:
            sub_items.append({
                "name": word,
                "value": weight_map.get(word, 0),
                "children": []
            })
        # 如果只有一个词，也作为子节点
        if len(cluster_list) == 1:
            sub_items.append({
                "name": theme_name,
                "value": weight_map.get(theme_name, 0),
                "children": []
            })

        children.append({
            "name": theme_name,
            "value": weight_map.get(theme_name, 0),
            "children": sub_items if sub_items else []
        })

    # 按聚类中最高权重排序
    children.sort(key=lambda x: x["value"], reverse=True)

    return {
        "name": "核心主题",
        "children": children
    }


# ============================================================
#  6. 情感分析
# ============================================================


def analyze_sentiment(text: str) -> Dict:
    """
    简单的基于情感词典的正负面判断
    考虑否定词反转、程度副词加权
    """
    words = jieba.lcut(text)

    positive_score = 0.0
    negative_score = 0.0
    positive_words_found = []
    negative_words_found = []

    i = 0
    while i < len(words):
        word = words[i]
        w = word.strip()

        # 检测否定词前缀
        negation = False
        if i > 0 and words[i - 1] in NEGATION_WORDS:
            negation = True

        # 检测程度副词
        degree = 1.0
        if i > 0 and words[i - 1] in DEGREE_WORDS:
            degree = DEGREE_WORDS[words[i - 1]]
        elif i > 1 and words[i - 2] in DEGREE_WORDS:
            degree = DEGREE_WORDS[words[i - 2]]

        if w in POSITIVE_WORDS:
            score = degree
            if negation:
                negative_score += score
                negative_words_found.append(f"不{w}" if len(w) <= 3 else f"不{w}")
            else:
                positive_score += score
                positive_words_found.append(w)
        elif w in NEGATIVE_WORDS:
            score = degree
            if negation:
                positive_score += score
                positive_words_found.append(f"不{w}" if len(w) <= 3 else f"不{w}")
            else:
                negative_score += score
                negative_words_found.append(w)

        i += 1

    total = positive_score + negative_score
    if total > 0:
        positive_ratio = positive_score / total
        negative_ratio = negative_score / total
    else:
        positive_ratio = 0.5
        negative_ratio = 0.5

    # 情感标签
    if positive_ratio > 0.65:
        label = "正面"
        emoji_hint = "积极乐观"
    elif positive_ratio > 0.55:
        label = "偏正面"
        emoji_hint = "较为积极"
    elif negative_ratio > 0.65:
        label = "负面"
        emoji_hint = "消极悲观"
    elif negative_ratio > 0.55:
        label = "偏负面"
        emoji_hint = "较为消极"
    else:
        label = "中性"
        emoji_hint = "客观中立"

    return {
        "label": label,
        "hint": emoji_hint,
        "positive_score": round(positive_score, 2),
        "negative_score": round(negative_score, 2),
        "positive_ratio": round(positive_ratio, 4),
        "negative_ratio": round(negative_ratio, 4),
        "neutral_ratio": round(1 - positive_ratio - negative_ratio, 4),
        "positive_words": list(set(positive_words_found))[:10],   # 去重，最多展示 10 个
        "negative_words": list(set(negative_words_found))[:10],
    }


# ============================================================
#  Flask 路由
# ============================================================


@app.route('/', methods=['GET'])
def index():
    """提供前端页面"""
    return send_from_directory('.', 'index.html')


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        "status": "ok",
        "service": "AI-Speed-Reader",
        "version": "1.0.0",
        "message": "服务运行正常"
    })


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    文本分析主接口
    请求体: {"text": "要分析的文本内容"}
    返回: 包含关键词、摘要、金句、阅读分析、思维导图、情感分析的完整结果
    """
    try:
        data = request.get_json(force=True)

        if not data or 'text' not in data:
            return jsonify({
                "success": False,
                "error": "请求体中缺少 'text' 字段"
            }), 400

        text = data['text'].strip()

        if not text:
            return jsonify({
                "success": False,
                "error": "文本内容不能为空"
            }), 400

        if len(text) < 20:
            return jsonify({
                "success": False,
                "error": "文本内容过短，至少需要20个字符才能进行有效分析"
            }), 400

        if len(text) > 50000:
            return jsonify({
                "success": False,
                "error": "文本内容过长，最多支持50000字符"
            }), 400

        # 执行各项分析
        keywords = extract_keywords(text, top_n=10)
        summary = generate_summary(text, top_n=3)
        golden_sentences = extract_golden_sentences(text, top_n=5)
        reading_analysis = analyze_reading(text)
        mindmap = generate_mindmap(text, keywords)
        sentiment = analyze_sentiment(text)

        result = {
            "success": True,
            "data": {
                "keywords": keywords,
                "summary": summary,
                "golden_sentences": golden_sentences,
                "reading_analysis": reading_analysis,
                "mindmap": mindmap,
                "sentiment": sentiment,
            }
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"服务端分析出错: {str(e)}"
        }), 500


# ============================================================
#  主入口
# ============================================================

if __name__ == '__main__':
    DEBUG = os.environ.get('FLASK_DEBUG', '0') == '1'
    print("=" * 50)
    print("  AI-Speed-Reader 后端服务启动中...")
    print("  地址: http://0.0.0.0:5000")
    print("  接口:")
    print("    GET  /api/health  - 健康检查")
    print("    POST /api/analyze - 文本分析")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=DEBUG)
