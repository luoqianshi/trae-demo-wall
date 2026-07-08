from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import re
import json
import os
import math
from itertools import permutations

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

OLLAMA_URL = os.environ.get('OLLAMA_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'qwen2.5:3b')

def check_ollama():
    try:
        session = requests.Session()
        session.trust_env = False
        resp = session.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        if resp.status_code == 200:
            models = [m['name'] for m in resp.json().get('models', [])]
            return any(OLLAMA_MODEL in m for m in models)
        return False
    except Exception as e:
        print(f"Ollama not available: {e}")
        return False

LLM_AVAILABLE = check_ollama()

CITY_POSITIONS = {
    "上海": {"lat": 31.2304, "lng": 121.4737},
    "北京": {"lat": 39.9042, "lng": 116.4074},
    "广州": {"lat": 23.1291, "lng": 113.2644},
    "深圳": {"lat": 22.5431, "lng": 114.0579},
    "杭州": {"lat": 30.2741, "lng": 120.1551},
    "南京": {"lat": 32.0603, "lng": 118.7969},
    "成都": {"lat": 30.5728, "lng": 104.0668},
    "重庆": {"lat": 29.5630, "lng": 106.5516},
    "苏州": {"lat": 31.2990, "lng": 120.5853},
    "武汉": {"lat": 30.5928, "lng": 114.3055},
    "西安": {"lat": 34.3416, "lng": 108.9398},
    "长沙": {"lat": 28.2282, "lng": 112.9388},
    "厦门": {"lat": 24.4798, "lng": 118.0894},
    "青岛": {"lat": 36.0671, "lng": 120.3826},
    "大理": {"lat": 25.6065, "lng": 100.2679},
    "丽江": {"lat": 26.8721, "lng": 100.2298},
    "三亚": {"lat": 18.2528, "lng": 109.5119},
    "拉萨": {"lat": 29.6520, "lng": 91.1721}
}

MOCK_POI = {
    "上海": [
        {"name": "GOODBAI CAFE", "address": "上海市徐汇区延庆路106号", "latitude": 31.2154, "longitude": 121.4417, "category": "cafe"},
        {"name": "巨鹿路", "address": "上海市徐汇区巨鹿路", "latitude": 31.2095, "longitude": 121.4500, "category": "road"},
        {"name": "富民路", "address": "上海市徐汇区富民路", "latitude": 31.2115, "longitude": 121.4470, "category": "road"},
        {"name": "长乐路", "address": "上海市徐汇区长乐路", "latitude": 31.2125, "longitude": 121.4460, "category": "road"},
        {"name": "延庆路", "address": "上海市徐汇区延庆路", "latitude": 31.2150, "longitude": 121.4420, "category": "road"},
        {"name": "武康大楼", "address": "上海市徐汇区淮海中路1842号", "latitude": 31.2110, "longitude": 121.4365, "category": "scenic"},
        {"name": "安福路", "address": "上海市徐汇区安福路", "latitude": 31.2130, "longitude": 121.4410, "category": "road"},
        {"name": "常熟路地铁站", "address": "上海市徐汇区常熟路", "latitude": 31.2165, "longitude": 121.4400, "category": "subway"},
        {"name": "陕西南路地铁站", "address": "上海市徐汇区陕西南路", "latitude": 31.2070, "longitude": 121.4550, "category": "subway"},
        {"name": "外滩", "address": "上海市黄浦区中山东一路", "latitude": 31.2397, "longitude": 121.4908, "category": "scenic"},
        {"name": "南京东路", "address": "上海市黄浦区南京东路", "latitude": 31.2352, "longitude": 121.4820, "category": "road"},
        {"name": "豫园", "address": "上海市黄浦区安仁街132号", "latitude": 31.2271, "longitude": 121.4925, "category": "scenic"},
        {"name": "东方明珠", "address": "上海市浦东新区世纪大道1号", "latitude": 31.2397, "longitude": 121.4998, "category": "scenic"},
        {"name": "田子坊", "address": "上海市黄浦区泰康路210弄", "latitude": 31.2100, "longitude": 121.4650, "category": "scenic"},
        {"name": "思南公馆", "address": "上海市黄浦区复兴中路523号", "latitude": 31.2150, "longitude": 121.4600, "category": "scenic"},
        {"name": "朱家角古镇", "address": "上海市青浦区朱家角镇", "latitude": 31.1070, "longitude": 121.0550, "category": "scenic"},
        {"name": "迪士尼乐园", "address": "上海市浦东新区申迪西路753号", "latitude": 31.1434, "longitude": 121.6575, "category": "scenic"},
        {"name": "城隍庙", "address": "上海市黄浦区方浜中路249号", "latitude": 31.2265, "longitude": 121.4910, "category": "scenic"},
        {"name": "Badmarket", "address": "上海市徐汇区长乐路608号", "latitude": 31.2125, "longitude": 121.4458, "category": "shop"},
        {"name": "又喜商店", "address": "上海市徐汇区富民路285号", "latitude": 31.2112, "longitude": 121.4480, "category": "shop"},
        {"name": "作家书店", "address": "上海市徐汇区巨鹿路733号", "latitude": 31.2088, "longitude": 121.4525, "category": "shop"},
        {"name": "LADY FAFA", "address": "上海市徐汇区巨鹿路728号", "latitude": 31.2085, "longitude": 121.4530, "category": "shop"},
        {"name": "Garden Books", "address": "上海市徐汇区长乐路325号", "latitude": 31.2082, "longitude": 121.4535, "category": "shop"},
        {"name": "静安寺", "address": "上海市静安区南京西路1686号", "latitude": 31.2245, "longitude": 121.4480, "category": "scenic"},
        {"name": "愚园路", "address": "上海市长宁区愚园路", "latitude": 31.2170, "longitude": 121.4380, "category": "road"},
        {"name": "淮海中路", "address": "上海市黄浦区淮海中路", "latitude": 31.2180, "longitude": 121.4540, "category": "road"},
        {"name": "新天地", "address": "上海市黄浦区马当路245号", "latitude": 31.2210, "longitude": 121.4680, "category": "scenic"},
        {"name": "K11购物中心", "address": "上海市黄浦区淮海中路300号", "latitude": 31.2215, "longitude": 121.4730, "category": "shop"},
        {"name": "人民广场", "address": "上海市黄浦区人民大道", "latitude": 31.2300, "longitude": 121.4730, "category": "scenic"},
        {"name": "徐家汇", "address": "上海市徐汇区徐家汇", "latitude": 31.1980, "longitude": 121.4370, "category": "shop"},
    ],
    "北京": [
        {"name": "故宫博物院", "address": "北京市东城区景山前街4号", "latitude": 39.9163, "longitude": 116.3972, "category": "scenic"},
        {"name": "天安门广场", "address": "北京市东城区东长安街", "latitude": 39.9055, "longitude": 116.3976, "category": "scenic"},
        {"name": "南锣鼓巷", "address": "北京市东城区南锣鼓巷", "latitude": 39.9378, "longitude": 116.4033, "category": "road"},
        {"name": "后海", "address": "北京市西城区后海", "latitude": 39.9381, "longitude": 116.3850, "category": "scenic"},
        {"name": "三里屯", "address": "北京市朝阳区三里屯路", "latitude": 39.9357, "longitude": 116.4536, "category": "shop"},
        {"name": "798艺术区", "address": "北京市朝阳区酒仙桥路4号", "latitude": 39.9837, "longitude": 116.4948, "category": "scenic"},
        {"name": "颐和园", "address": "北京市海淀区新建宫门路19号", "latitude": 39.9999, "longitude": 116.2755, "category": "scenic"},
        {"name": "长城", "address": "北京市延庆区八达岭", "latitude": 40.3576, "longitude": 116.0206, "category": "scenic"},
        {"name": "鸟巢", "address": "北京市朝阳区国家体育场南路1号", "latitude": 39.9929, "longitude": 116.3964, "category": "scenic"},
        {"name": "王府井", "address": "北京市东城区王府井大街", "latitude": 39.9145, "longitude": 116.4108, "category": "shop"},
    ],
    "成都": [
        {"name": "锦里古街", "address": "成都市武侯区武祠大街231号", "latitude": 30.6404, "longitude": 104.0462, "category": "scenic"},
        {"name": "宽窄巷子", "address": "成都市青羊区长顺上街127号", "latitude": 30.6685, "longitude": 104.0618, "category": "scenic"},
        {"name": "春熙路", "address": "成都市锦江区春熙路", "latitude": 30.6543, "longitude": 104.0806, "category": "road"},
        {"name": "太古里", "address": "成都市锦江区中纱帽街8号", "latitude": 30.6535, "longitude": 104.0815, "category": "shop"},
        {"name": "大熊猫基地", "address": "成都市成华区熊猫大道1375号", "latitude": 30.7343, "longitude": 104.1460, "category": "scenic"},
        {"name": "都江堰", "address": "成都市都江堰市公园路", "latitude": 30.9939, "longitude": 103.6153, "category": "scenic"},
        {"name": "峨眉山", "address": "乐山市峨眉山市", "latitude": 29.5425, "longitude": 103.4839, "category": "scenic"},
        {"name": "人民公园", "address": "成都市青羊区少城路12号", "latitude": 30.6647, "longitude": 104.0645, "category": "scenic"},
    ],
    "杭州": [
        {"name": "西湖", "address": "杭州市西湖区西湖", "latitude": 30.2587, "longitude": 120.1305, "category": "scenic"},
        {"name": "断桥残雪", "address": "杭州市西湖区北山街", "latitude": 30.2616, "longitude": 120.1470, "category": "scenic"},
        {"name": "灵隐寺", "address": "杭州市西湖区灵隐路法云弄1号", "latitude": 30.2402, "longitude": 120.0984, "category": "scenic"},
        {"name": "河坊街", "address": "杭州市上城区河坊街", "latitude": 30.2432, "longitude": 120.1688, "category": "road"},
        {"name": "南宋御街", "address": "杭州市上城区中山中路", "latitude": 30.2466, "longitude": 120.1670, "category": "road"},
        {"name": "西溪湿地", "address": "杭州市西湖区天目山路518号", "latitude": 30.2780, "longitude": 120.0665, "category": "scenic"},
        {"name": "千岛湖", "address": "杭州市淳安县千岛湖镇", "latitude": 29.6034, "longitude": 119.0336, "category": "scenic"},
        {"name": "雷峰塔", "address": "杭州市西湖区南山路15号", "latitude": 30.2312, "longitude": 120.1480, "category": "scenic"},
    ]
}

DEFAULT_PLACE_DURATION = {
    "scenic": 90,
    "cafe": 60,
    "shop": 45,
    "road": 30,
    "subway": 15,
    "restaurant": 60,
    "default": 60
}

DEFAULT_PLACE_FEATURES = {
    "scenic": ["打卡拍照", "风景优美"],
    "cafe": ["咖啡好喝", "环境舒适", "适合休息"],
    "shop": ["好逛好买", "小众品牌"],
    "road": ["Citywalk", "梧桐树", "沿街小店"],
    "subway": ["交通便利"],
    "restaurant": ["美食推荐"]
}

def haversine_distance(lat1, lng1, lat2, lng2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLng = math.radians(lng2 - lng1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLng/2) * math.sin(dLng/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def search_poi_local(keyword, city):
    pois = MOCK_POI.get(city, [])
    target = keyword.strip().lower().replace(' ', '')
    
    scored = []
    for poi in pois:
        name_norm = poi['name'].lower().replace(' ', '')
        score = 0
        
        if name_norm == target:
            score = 100
        elif target in name_norm or name_norm in target:
            score = 80
        else:
            common = set(target) & set(name_norm)
            if len(target) > 0:
                ratio = len(common) / len(target)
                if ratio >= 0.5:
                    score = 40 + ratio * 30
        
        if score >= 30:
            scored.append({**poi, 'match_score': score})
    
    scored.sort(key=lambda x: x['match_score'], reverse=True)
    return scored[:3]

def llm_extract_places(text, city):
    prompt = f"""你是一个旅行攻略分析助手。请分析以下攻略文字，提取所有推荐的地点。

城市：{city}

要求：
1. 提取帖子明确推荐的地点（店铺、餐厅、景点、道路、地铁站、咖啡馆等）
2. 对每个地点，尽可能推断：
   - name: 地点名称
   - type: 类型(scenic景点/cafe咖啡馆/shop商店/restaurant餐厅/road道路/subway地铁/other其他)
   - duration_minutes: 建议游玩时长（分钟）
   - features: 2-3个特点/亮点描述
   - raw: 原文中对应的句子

3. 只提取明确提到的地点，不要凭空想象
4. 如果文字提到"需要2小时""逛一下午"等时间信息，用于估算时长
5. 如果文字提到"拍照好看""咖啡好喝""好逛"等描述，归入特点

请严格按以下 JSON 格式输出：
```json
{{
  "places": [
    {{
      "name": "地点名称",
      "type": "shop",
      "duration_minutes": 60,
      "features": ["特点1", "特点2"],
      "raw": "原文对应内容"
    }}
  ]
}}
```

攻略文字：
{text}"""

    try:
        session = requests.Session()
        session.trust_env = False
        resp = session.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.2, "num_predict": 2048}
            },
            timeout=120
        )
        
        if resp.status_code == 200:
            output = resp.json().get('response', '')
            json_match = re.search(r'```json\s*(\{[\s\S]*?\})\s*```', output)
            if json_match:
                parsed = json.loads(json_match.group(1))
                return parsed.get('places', [])
            
            json_match = re.search(r'\{[\s\S]*?"places"[\s\S]*?\}', output)
            if json_match:
                parsed = json.loads(json_match.group(0))
                return parsed.get('places', [])
        
        return None
    except Exception as e:
        print(f"LLM extract error: {e}")
        return None

def rule_extract_places(text):
    lines = text.split('\n')
    places = []
    
    place_line_re = re.compile(r'^(?:\d+[.．、]|\d+\s*[.．]|\[)?\s*(.+)$')
    road_re = re.compile(r'([\u4e00-\u9fa5]{2,5}路)')
    subway_re = re.compile(r'(\S+地铁站)')
    
    for line in lines:
        line = line.strip()
        if len(line) <= 1 or len(line) > 80:
            continue
        
        if subway_re.search(line):
            name = subway_re.search(line).group(1)
            places.append({"name": name, "type": "subway", "raw": line})
            continue
        
        if road_re.search(line):
            name = road_re.search(line).group(1)
            if not any(p['name'] == name for p in places):
                places.append({"name": name, "type": "road", "raw": line})
            continue
        
        match = place_line_re.match(line)
        if match:
            name = match.group(1).strip()
            name = re.sub(r'^[\d\.\s]+', '', name).strip()
            if len(name) >= 2 and len(name) <= 50:
                if not any(p['name'] == name for p in places):
                    places.append({"name": name, "type": "shop", "raw": line})
    
    return places

def enrich_place(place, city):
    name = place.get('name', '')
    ptype = place.get('type', 'shop')
    
    pois = search_poi_local(name, city)
    if pois:
        poi = pois[0]
        result = {
            "name": poi['name'],
            "address": poi['address'],
            "latitude": poi['latitude'],
            "longitude": poi['longitude'],
            "type": ptype if ptype != 'shop' else poi.get('category', 'shop'),
            "duration_minutes": place.get('duration_minutes') or DEFAULT_PLACE_DURATION.get(ptype, 60),
            "features": place.get('features') or DEFAULT_PLACE_FEATURES.get(ptype, []),
            "raw": place.get('raw', ''),
            "image": None,
            "match_score": poi.get('match_score', 0)
        }
        return result
    
    return {
        "name": name,
        "address": f"{city}（未精确定位）",
        "latitude": None,
        "longitude": None,
        "type": ptype,
        "duration_minutes": place.get('duration_minutes', DEFAULT_PLACE_DURATION.get(ptype, 60)),
        "features": place.get('features') or DEFAULT_PLACE_FEATURES.get(ptype, []),
        "raw": place.get('raw', ''),
        "image": None,
        "match_score": 0
    }

def optimize_route(places, start_idx=0):
    if not places:
        return []
    
    located = [p for p in places if p.get('latitude') and p.get('longitude')]
    unlocated = [p for p in places if not p.get('latitude') or not p.get('longitude')]
    
    if len(located) <= 1:
        return places
    
    if len(located) <= 8:
        best_order = None
        best_distance = float('inf')
        
        indices = list(range(len(located)))
        start = min(start_idx, len(located) - 1)
        others = [i for i in indices if i != start]
        
        for perm in permutations(others):
            order = [start] + list(perm)
            total_dist = 0
            for i in range(len(order) - 1):
                a = located[order[i]]
                b = located[order[i+1]]
                total_dist += haversine_distance(a['latitude'], a['longitude'], b['latitude'], b['longitude'])
            
            if total_dist < best_distance:
                best_distance = total_dist
                best_order = order
        
        ordered = [located[i] for i in best_order]
    else:
        unvisited = list(range(len(located)))
        current = min(start_idx, len(located) - 1)
        unvisited.remove(current)
        order = [current]
        
        while unvisited:
            next_idx = None
            min_dist = float('inf')
            a = located[current]
            
            for idx in unvisited:
                b = located[idx]
                dist = haversine_distance(a['latitude'], a['longitude'], b['latitude'], b['longitude'])
                if dist < min_dist:
                    min_dist = dist
                    next_idx = idx
            
            order.append(next_idx)
            unvisited.remove(next_idx)
            current = next_idx
        
        ordered = [located[i] for i in order]
    
    return ordered + unlocated

@app.route('/api/cities', methods=['GET'])
def get_cities():
    return jsonify({
        "success": True,
        "cities": list(CITY_POSITIONS.keys())
    })

@app.route('/api/analyze-text', methods=['POST'])
def analyze_text():
    data = request.json or {}
    text = data.get('text', '').strip()
    city = data.get('city', '上海')
    custom_places = data.get('custom_places', [])
    
    if not text and not custom_places:
        return jsonify({"error": "请输入攻略文字或手动添加地点"}), 400
    
    all_places = []
    
    if text:
        if LLM_AVAILABLE:
            llm_result = llm_extract_places(text, city)
            if llm_result and len(llm_result) > 0:
                for p in llm_result:
                    p['source'] = 'ai_extracted'
                all_places.extend(llm_result)
            else:
                rule_result = rule_extract_places(text)
                for p in rule_result:
                    p['source'] = 'rule_extracted'
                all_places.extend(rule_result)
        else:
            rule_result = rule_extract_places(text)
            for p in rule_result:
                p['source'] = 'rule_extracted'
            all_places.extend(rule_result)
    
    for cp in custom_places:
        cp['source'] = 'manual'
        all_places.append(cp)
    
    enriched = []
    for place in all_places:
        enriched.append(enrich_place(place, city))
    
    optimized = optimize_route(enriched)
    
    total_duration = sum(p.get('duration_minutes') or 60 for p in optimized)
    total_distance = 0
    for i in range(len(optimized) - 1):
        a = optimized[i]
        b = optimized[i+1]
        if a.get('latitude') and b.get('latitude'):
            total_distance += haversine_distance(a['latitude'], a['longitude'], b['latitude'], b['longitude'])
    
    return jsonify({
        "success": True,
        "city": city,
        "places": optimized,
        "total_duration_minutes": total_duration,
        "total_distance_km": round(total_distance, 2),
        "used_llm": LLM_AVAILABLE and bool(text),
        "llm_available": LLM_AVAILABLE
    })

@app.route('/api/optimize-route', methods=['POST'])
def optimize_route_endpoint():
    data = request.json or {}
    places = data.get('places', [])
    start_index = data.get('start_index', 0)
    
    if not places:
        return jsonify({"error": "没有地点"}), 400
    
    optimized = optimize_route(places, start_index)
    
    total_duration = sum(p.get('duration_minutes') or 60 for p in optimized)
    total_distance = 0
    for i in range(len(optimized) - 1):
        a = optimized[i]
        b = optimized[i+1]
        if a.get('latitude') and b.get('latitude'):
            total_distance += haversine_distance(a['latitude'], a['longitude'], b['latitude'], b['longitude'])
    
    return jsonify({
        "success": True,
        "places": optimized,
        "total_duration_minutes": total_duration,
        "total_distance_km": round(total_distance, 2)
    })

@app.route('/api/search-poi', methods=['GET'])
def search_poi():
    keyword = request.args.get('keyword', '')
    city = request.args.get('city', '上海')
    
    if not keyword:
        return jsonify({"error": "缺少关键词"}), 400
    
    results = search_poi_local(keyword, city)
    return jsonify({"success": True, "pois": results})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "llm_available": LLM_AVAILABLE,
        "llm_model": OLLAMA_MODEL if LLM_AVAILABLE else None,
        "cities": list(CITY_POSITIONS.keys())
    })

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
