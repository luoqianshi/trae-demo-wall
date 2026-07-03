from flask import Flask, request, jsonify, send_from_directory
import requests
import re
import os
import json
import hashlib
from PIL import Image
from io import BytesIO

app = Flask(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.baidu.com/",
}

session = requests.Session()

# LLM 配置（通过环境变量）
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "https://api.deepseek.com")
LLM_MODEL = os.environ.get("LLM_MODEL", "deepseek-chat")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSTER_DIR = os.path.join(BASE_DIR, "posters")
os.makedirs(POSTER_DIR, exist_ok=True)


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(BASE_DIR, path)


def get_baidu_suggestions(query):
    """获取百度搜索联想建议"""
    suggestions = []
    try:
        url = f"https://suggestion.baidu.com/su?wd={requests.utils.quote(query)}&cb=callback"
        resp = session.get(url, headers=HEADERS, timeout=5)
        resp.encoding = 'gbk'
        text = resp.text
        match = re.search(r's\s*:\s*\[([^\]]*)\]', text)
        if match:
            items_str = match.group(1)
            items = re.findall(r'"([^"]*)"', items_str)
            suggestions = [item for item in items if len(item) > 1]
    except Exception as e:
        print(f"百度建议失败: {e}")

    if not suggestions:
        try:
            url = f"https://sug.so.360.cn/suggest?word={requests.utils.quote(query)}&encodein=utf-8&encodeout=utf-8"
            resp = session.get(url, headers={**HEADERS, "Referer": "https://www.so.com/"}, timeout=5)
            resp.encoding = 'utf-8'
            data = resp.json()
            for item in data.get("result", []):
                word = item.get("word", "")
                if word and len(word) > 1:
                    suggestions.append(word)
        except Exception as e:
            print(f"360建议失败: {e}")

    return suggestions[:10]


def extract_real_title(query, suggestions):
    """从搜索建议中提取完整的作品名称"""
    if not suggestions:
        return None

    matched = [s for s in suggestions if s.startswith(query)]
    if not matched:
        matched = [s for s in suggestions if query in s]

    if not matched:
        return None

    best = matched[0]

    stop_words = ["在线观看", "在线播放", "免费观看", "全集", "更新", "开播",
                  "小说", "txt下载", "阅读", "百度百科", "剧情介绍",
                  "动漫在线观看视频", "漫画在线观看"]

    clean_title = best
    for word in sorted(stop_words, key=len, reverse=True):
        if word in clean_title:
            clean_title = clean_title.split(word)[0]

    tail_patterns = [r'\d+集.*$', r'动漫.*$', r'动画.*$', r'电视剧.*$', r'电影.*$',
                     r'真人.*$', r'版.*$', r'\s+.*$']
    for pattern in tail_patterns:
        clean_title = re.sub(pattern, '', clean_title)

    clean_title = clean_title.strip()

    # 如果清理后的标题末尾有数字（如"斗罗大陆1"），而原始查询不包含该数字，尝试去掉
    # 这通常是因为百度建议把"斗罗大陆1"排在了"斗罗大陆"前面
    while clean_title and clean_title[-1].isdigit():
        # 检查原始查询是否以这些数字结尾
        if not query.endswith(clean_title[-1]):
            clean_title = clean_title[:-1].strip()
        else:
            break

    return clean_title if len(clean_title) >= len(query) else None


def detect_media_type(text):
    """从文本中检测媒体类型"""
    type_markers = [
        ("动漫", ["动漫", "动画", "番剧", "番"]),
        ("电影", ["电影", "院线", "院线版"]),
        ("电视剧", ["电视剧", "真人剧", "国产剧", "日剧", "韩剧", "美剧", "港剧", "台剧"]),
        ("综艺", ["综艺", "真人秀"]),
    ]
    for type_name, markers in type_markers:
        for marker in markers:
            if marker in text:
                return type_name
    return ""


def infer_year(title):
    """从标题中推断年份"""
    match = re.search(r'(19\d{2}|20\d{2})', title)
    return match.group(1) if match else ""


def infer_episodes(title, media_type, suggestions=None):
    """从标题或搜索建议中推断集数"""
    # 先从标题中提取
    match = re.search(r'(\d+)\s*集', title)
    if match:
        ep = int(match.group(1))
        if 1 <= ep <= 1000:
            return ep

    # 再从搜索建议中提取（如"凡人修仙传动漫180集"）
    if suggestions:
        all_text = " ".join(suggestions)
        matches = re.findall(r'(\d+)\s*集', all_text)
        if matches:
            # 选择出现频率最高的集数
            from collections import Counter
            valid = [int(m) for m in matches if 1 <= int(m) <= 1000]
            if valid:
                most_common = Counter(valid).most_common(1)[0][0]
                return most_common

    if media_type == "电影":
        return 1
    elif media_type == "动漫":
        return 12
    return 30


def search_baidu_images(query, num=3):
    try:
        url = f"https://image.baidu.com/search/acjson?tn=resultjson_com&word={requests.utils.quote(query + ' 海报')}&pn=0&rn={num}"
        resp = session.get(url, headers=HEADERS, timeout=15)
        text = resp.text
        urls = []
        for m in re.finditer(r'"thumbURL"\s*:\s*"([^"]+)"', text):
            urls.append(m.group(1))
        for m in re.finditer(r'"middleURL"\s*:\s*"([^"]+)"', text):
            urls.append(m.group(1))
        return urls[:num]
    except Exception as e:
        print(f"图片搜索失败: {e}")
        return []


def download_poster(img_url, filename):
    try:
        resp = session.get(img_url, headers=HEADERS, timeout=15)
        if resp.status_code == 200 and len(resp.content) > 1000:
            img = Image.open(BytesIO(resp.content))
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            w, h = img.size
            target_ratio = 3/4
            current_ratio = w/h
            if current_ratio > target_ratio:
                new_w = int(h * target_ratio)
                left = (w - new_w) // 2
                img = img.crop((left, 0, left + new_w, h))
            else:
                new_h = int(w / target_ratio)
                top = (h - new_h) // 2
                img = img.crop((0, top, w, top + new_h))
            img = img.resize((300, 400), Image.LANCZOS)
            output_path = os.path.join(POSTER_DIR, f"{filename}.jpg")
            img.save(output_path, "JPEG", quality=85)
            return f"posters/{filename}.jpg"
    except Exception as e:
        print(f"下载海报失败: {e}")
    return None


def infer_platform(suggestions):
    """从搜索建议中推断播放平台"""
    text = " ".join(suggestions)
    platform_map = {
        "腾讯": "腾讯视频", "爱奇艺": "爱奇艺",
        "优酷": "优酷", "芒果": "芒果TV",
        "哔哩哔哩": "哔哩哔哩", "B站": "哔哩哔哩",
    }
    for key, val in platform_map.items():
        if key in text:
            return val
    return "未知平台"


def infer_genres(suggestions):
    """从搜索建议中推断类型标签"""
    text = " ".join(suggestions)
    genre_keywords = ["悬疑", "科幻", "爱情", "古装", "喜剧", "历史", "犯罪", "都市",
                      "家庭", "武侠", "权谋", "年代", "乡村", "革命", "青春", "探案",
                      "冒险", "奇幻", "动作", "仙侠", "玄幻", "穿越", "宫廷"]
    genres = []
    for g in genre_keywords:
        if g in text:
            genres.append(g)
            if len(genres) >= 3:
                break
    return genres


def generate_summary(title, media_type, genres, platform):
    genre_str = "、".join(genres) if genres else "精彩"
    platform_str = f"在{platform}播出" if platform != "未知平台" else ""
    return f"《{title}》是一部{genre_str}题材的{media_type}。{platform_str}".strip()


@app.route("/api/suggest")
def api_suggest():
    """搜索联想建议接口"""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"suggestions": []})

    suggestions = get_baidu_suggestions(query)
    return jsonify({"suggestions": suggestions})


@app.route("/api/search")
def api_search():
    """详细搜索接口 - 只返回真实存在的影视作品"""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"results": []})

    # 1. 获取百度搜索建议
    suggestions = get_baidu_suggestions(query)

    # 2. 判断作品是否真实存在
    # 如果没有建议 → 作品不存在
    if not suggestions:
        return jsonify({"results": []})

    # 建议中必须包含查询词，且建议中必须有影视作品相关的关键词
    # （如电视剧、电影、动漫、在线观看、全集等）
    video_keywords = ["电视剧", "电影", "动漫", "动画", "番剧", "综艺", "在线观看",
                      "在线播放", "全集", "剧情", "演员", "播出", "上映"]
    has_relevant = any(query in s for s in suggestions)
    has_video_hint = any(kw in " ".join(suggestions) for kw in video_keywords)

    if not has_relevant or not has_video_hint:
        return jsonify({"results": []})

    # 3. 提取完整作品名
    real_title = extract_real_title(query, suggestions)
    if not real_title:
        return jsonify({"results": []})

    # 4. 推断类型
    media_type = detect_media_type(real_title)
    if not media_type:
        media_type = detect_media_type(" ".join(suggestions))
    if not media_type:
        media_type = "影视"

    # 5. 推断年份、集数、平台、类型标签
    year = infer_year(real_title)
    episodes = infer_episodes(real_title, media_type, suggestions)
    platform = infer_platform(suggestions)
    genres = infer_genres(suggestions)

    # 6. 搜索并下载海报
    img_urls = search_baidu_images(real_title, num=3)
    poster_path = ""
    if img_urls:
        safe_name = hashlib.md5(real_title.encode()).hexdigest()[:12]
        poster_path = download_poster(img_urls[0], safe_name) or ""

    # 7. 生成结果
    tags = genres[:3] if genres else [media_type] if media_type else ["剧情"]

    result = {
        "title": real_title,
        "originalTitle": query,
        "poster": poster_path,
        "year": year,
        "genre": genres[0] if genres else media_type or "剧情",
        "mediaType": media_type,
        "totalEp": episodes,
        "summary": generate_summary(real_title, media_type, genres, platform),
        "platform": platform,
        "tags": tags,
    }

    return jsonify({"results": [result]})


# ===== 数据持久化 =====
DATA_FILE = os.path.join(BASE_DIR, "data.json")
DEFAULT_DATA = {
    "dramas": [
        {"id": 1, "title": "漫长的季节", "poster": "posters/manchangdejijie.jpg", "emoji": "🍂", "status": "watching", "currentEp": 8, "totalEp": 12, "platform": "腾讯视频", "genre": "悬疑", "tags": ["悬疑", "犯罪", "高分"], "year": 2023, "summary": "小城桦林，此时，出租司机王响意气风发，能开得二十来年的出租车，正准备送儿子去大城市读大学。", "watchedEps": [1, 2, 3, 4, 5, 6, 7, 8]},
        {"id": 2, "title": "三体", "poster": "posters/santi.jpg", "emoji": "🌌", "status": "watching", "currentEp": 15, "totalEp": 30, "platform": "腾讯视频", "genre": "科幻", "tags": ["科幻", "原著改编", "刘慈欣"], "year": 2023, "summary": "2007年，地球基础科学出现了异常的扰动，科学界人心惶惶。", "watchedEps": list(range(1, 16))},
        {"id": 3, "title": "狂飙", "poster": "posters/kuangbiao.jpg", "emoji": "🚓", "status": "finished", "currentEp": 39, "totalEp": 39, "platform": "爱奇艺", "genre": "犯罪", "tags": ["犯罪", "扫黑", "张译"], "year": 2023, "summary": "京海市一线刑警安欣，在与黑恶势力的斗争中，不断遭到保护伞的打击。", "watchedEps": list(range(1, 40))},
        {"id": 4, "title": "去有风的地方", "poster": "posters/quyoufengdedifang.jpg", "emoji": "🌸", "status": "watching", "currentEp": 12, "totalEp": 40, "platform": "芒果TV", "genre": "爱情", "tags": ["爱情", "治愈", "刘亦菲"], "year": 2023, "summary": "许红豆因为闺蜜去世，生活和工作陷入低谷，她独自前往大理云苗村的民宿休息调整。", "watchedEps": list(range(1, 13))},
        {"id": 5, "title": "流浪地球2", "poster": "posters/liulangdiqiu2.jpg", "emoji": "🌍", "status": "finished", "currentEp": 1, "totalEp": 1, "platform": "影院", "genre": "科幻", "tags": ["科幻", "灾难", "吴京"], "year": 2023, "summary": "太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。", "watchedEps": [1]},
        {"id": 6, "title": "隐秘的角落", "poster": "posters/yinmidejiaoluo.jpg", "emoji": "🏔️", "status": "finished", "currentEp": 12, "totalEp": 12, "platform": "爱奇艺", "genre": "悬疑", "tags": ["悬疑", "犯罪", "秦昊"], "year": 2020, "summary": "沿海小城的三个孩子在景区游玩时，无意拍摄记录了一次谋杀。", "watchedEps": list(range(1, 13))},
        {"id": 7, "title": "庆余年", "poster": "posters/qingyunian.jpg", "emoji": "⚔️", "status": "want", "currentEp": 0, "totalEp": 46, "platform": "腾讯视频", "genre": "古装", "tags": ["古装", "权谋", "张若昀"], "year": 2019, "summary": "某大学文学史专业的学生张庆，熟读古典名著，但他用现代观念剖析古代文学史的论文命题不被叶教授所认可。", "watchedEps": []},
        {"id": 8, "title": "白夜追凶", "poster": "posters/baiyezhuixiong.jpg", "emoji": "🌙", "status": "want", "currentEp": 0, "totalEp": 32, "platform": "优酷", "genre": "悬疑", "tags": ["悬疑", "犯罪", "潘粤明"], "year": 2017, "summary": "一场灭门惨案，让原本逍遥浪荡的关宏宇成了在逃的通缉嫌犯。", "watchedEps": []},
    ],
    "classics": [
        {"id": 101, "title": "大明王朝1566", "poster": "posters/damingwangchao.jpg", "emoji": "👑", "status": "finished", "currentEp": 46, "totalEp": 46, "platform": "优酷", "genre": "历史", "tags": ["历史", "权谋", "陈宝国"], "year": 2007, "summary": "嘉靖三十九年，贪墨横行、民不聊生。奸臣严嵩党羽密布、权倾朝野。", "watchedEps": list(range(1, 47))},
        {"id": 102, "title": "武林外传", "poster": "posters/wulinwaizhuan.jpg", "emoji": "⚔️", "status": "finished", "currentEp": 80, "totalEp": 80, "platform": "爱奇艺", "genre": "喜剧", "tags": ["喜剧", "古装", "经典"], "year": 2006, "summary": "这是一个系列的戏说江湖的轻松喜剧。", "watchedEps": list(range(1, 81))},
        {"id": 103, "title": "沉默的真相", "poster": "posters/chenmodezhenxiang.jpg", "emoji": "⚖️", "status": "finished", "currentEp": 12, "totalEp": 12, "platform": "爱奇艺", "genre": "悬疑", "tags": ["悬疑", "犯罪", "廖凡"], "year": 2020, "summary": "一起看似简单的自杀案，背后隐藏着一个不可告人的巨大秘密。", "watchedEps": list(range(1, 13))},
        {"id": 104, "title": "琅琊榜", "poster": "posters/langyabang.jpg", "emoji": "🗡️", "status": "finished", "currentEp": 54, "totalEp": 54, "platform": "腾讯视频", "genre": "古装", "tags": ["古装", "权谋", "胡歌"], "year": 2015, "summary": "十二年前七万赤焰军被奸人所害导致梅岭惨案，少帅林殊侥幸生还。", "watchedEps": list(range(1, 55))},
    ]
}


def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"加载数据失败: {e}")
    return DEFAULT_DATA.copy()


def save_data(data):
    try:
        print(f"正在保存数据到 {DATA_FILE}...")
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("数据保存成功!")
        return True
    except Exception as e:
        print(f"保存数据失败: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


@app.route("/api/data", methods=["GET"])
def api_get_data():
    return jsonify(load_data())


@app.route("/api/data", methods=["POST"])
def api_post_data():
    data = request.get_json()
    if data is None:
        return jsonify({"success": False, "error": "Invalid JSON"}), 400
    success = save_data(data)
    return jsonify({"success": success})


import html

def call_llm_summary(title, year="", genre="", platform=""):
    """调用大模型获取简介"""
    if not LLM_API_KEY:
        return None
    try:
        url = f"{LLM_BASE_URL}/chat/completions"
        headers = {
            "Authorization": f"Bearer {LLM_API_KEY}",
            "Content-Type": "application/json"
        }
        prompt = f"请为《{title}》写一段中文剧情简介，控制在200字以内。"
        if year:
            prompt += f"该剧于{year}年播出。"
        if genre and genre not in ("未知", ""):
            prompt += f"类型为{genre}。"
        if platform and platform not in ("未知平台", ""):
            prompt += f"在{platform}播出。"
        prompt += "要求：1）只写你确定的真实剧情，不确定的内容不要编造；2）如有原著改编，说明改编自什么作品；3）突出核心看点。"

        payload = {
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": "你是一个专业的中国影视剧资料编辑。你只撰写你确信真实的剧情信息，不确定的内容宁可不写也不要编造。你精通中国电视剧、电影、动漫、综艺等各领域的影视作品。"},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 400,
            "temperature": 0.3
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        data = resp.json()
        summary = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        if summary and len(summary) > 20:
            return summary[:600]
        return None
    except Exception as e:
        print(f"LLM 调用失败: {e}")
        return None


def search_summary(title, year="", genre=""):
    """通过360搜索获取简介（LLM不可用时回退）"""
    try:
        # 方式1: 360搜索
        queries = [
            f"{title} 剧情介绍",
            f"{title} 简介",
        ]
        if year:
            queries.insert(0, f"{title} {year} 剧情介绍")

        for q in queries:
            search_url = f"https://www.so.com/s?q={requests.utils.quote(q)}"
            resp = session.get(search_url, headers=HEADERS, timeout=10)
            text = resp.text

            summaries = []

            # 提取 res-desc 摘要
            for m in re.finditer(r'<p class="res-desc"[^>]*>(.*?)</p>', text, re.S):
                clean = re.sub(r'<[^>]+>', '', m.group(1)).strip()
                clean = html.unescape(clean)
                clean = re.sub(r'\s+', ' ', clean)
                # 过滤掉日期前缀
                clean = re.sub(r'\d{4}年\d{1,2}月\d{1,2}日\s*-?\s*', '', clean)
                if len(clean) > 30 and clean not in summaries:
                    summaries.append(clean)

            # 提取 abstract 摘要
            for m in re.finditer(r'<div class="(?:res-|g-)abstract"[^>]*>(.*?)</div>', text, re.S):
                clean = re.sub(r'<[^>]+>', '', m.group(1)).strip()
                clean = html.unescape(clean)
                clean = re.sub(r'\s+', ' ', clean)
                clean = re.sub(r'\d{4}年\d{1,2}月\d{1,2}日\s*-?\s*', '', clean)
                if len(clean) > 30 and clean not in summaries:
                    summaries.append(clean)

            if summaries:
                best = max(summaries, key=len)
                return best[:600]

        # 方式2: 百度百科
        baike_url = f"https://baike.baidu.com/item/{requests.utils.quote(title)}"
        resp3 = session.get(baike_url, headers=HEADERS, timeout=10)
        text3 = resp3.text

        abstract = re.search(r'<div class="lemma-summary"[^>]*>(.*?)</div>', text3, re.S)
        if abstract:
            clean = re.sub(r'<[^>]+>', '', abstract.group(1)).strip()
            clean = re.sub(r'\s+', ' ', clean)
            if len(clean) > 20:
                return clean[:600]

        desc = re.search(r'<meta[^>]*description[^>]*content="([^"]+)"', text3)
        if desc:
            return desc.group(1)[:600]

        return None
    except Exception as e:
        print(f"搜索简介失败: {e}")
        return None


def get_summary(title, year="", genre="", platform=""):
    """获取简介：优先大模型，回退搜索引擎"""
    # 优先尝试大模型
    llm_result = call_llm_summary(title, year, genre, platform)
    if llm_result:
        return llm_result
    # 回退到搜索引擎
    return search_summary(title, year, genre)


@app.route("/api/summary")
def api_summary():
    title = request.args.get("title", "")
    year = request.args.get("year", "")
    genre = request.args.get("genre", "")
    platform = request.args.get("platform", "")
    if not title:
        return jsonify({"error": "缺少标题参数"}), 400

    summary = get_summary(title, year, genre, platform)
    if summary and len(summary) > 20:
        return jsonify({"summary": summary})

    return jsonify({"error": "未找到简介信息，请手动编辑"})


@app.route("/api/config")
def api_config():
    """获取前端配置：是否配置了LLM"""
    return jsonify({
        "llmEnabled": bool(LLM_API_KEY)
    })


@app.route("/api/episodes")
def api_episodes():
    """获取分集简介：通过大模型生成"""
    title = request.args.get("title", "")
    total_ep = request.args.get("total_ep", "0")
    year = request.args.get("year", "")
    genre = request.args.get("genre", "")
    platform = request.args.get("platform", "")
    if not title or not total_ep.isdigit():
        return jsonify({"error": "参数错误"}), 400

    total_ep = int(total_ep)
    if total_ep < 1 or total_ep > 200:
        return jsonify({"error": "集数范围1-200"}), 400

    if not LLM_API_KEY:
        return jsonify({"error": "未配置大模型API Key，请设置环境变量 LLM_API_KEY"}), 400

    # 构建作品信息上下文
    info = f"《{title}》"
    if year:
        info += f"（{year}年）"
    if genre and genre not in ("未知", ""):
        info += f"，{genre}类型"
    if platform and platform not in ("未知平台", ""):
        info += f"，在{platform}播出"
    info += "，共" + str(total_ep) + "集"

    # 分批请求，每批最多20集
    batch_size = 20
    all_episodes = []
    for batch_start in range(0, total_ep, batch_size):
        batch_end = min(batch_start + batch_size, total_ep)
        prompt = f"以下是关于{info}的信息。请为第{batch_start+1}集到第{batch_end}集提供真实的分集剧情简介。"
        prompt += "要求：1）每集一句话概括核心剧情（15-25字）；2）你必须确信内容是真实的，不确定的集数请写'暂无详细剧情记录'；3）严格按照格式输出，每行一集：'第X集：简介内容'。"

        try:
            url = f"{LLM_BASE_URL}/chat/completions"
            headers = {
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": LLM_MODEL,
                "messages": [
                    {"role": "system", "content": "你是一个专业的中国影视剧数据库编辑，熟知各影视剧的真实分集剧情。你只输出你确信真实的剧情信息，对不确定的内容明确标注，绝不编造剧情。"},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 2000,
                "temperature": 0.3
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            data = resp.json()
            text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

            # 解析每行
            for line in text.strip().split("\n"):
                line = line.strip()
                if not line:
                    continue
                # 提取集号和标题
                match = re.match(r'第\s*(\d+)\s*集[：:]\s*(.+)', line)
                if match:
                    ep_num = int(match.group(1))
                    ep_title = match.group(2).strip()
                    if ep_title:
                        all_episodes.append({"num": ep_num, "title": ep_title})
        except Exception as e:
            print(f"获取分集简介失败 (batch {batch_start}): {e}")

    if all_episodes:
        return jsonify({"episodes": all_episodes})

    return jsonify({"error": "获取分集简介失败，请稍后重试"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8081, debug=False)
