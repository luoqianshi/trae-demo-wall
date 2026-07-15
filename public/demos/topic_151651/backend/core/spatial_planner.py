import os
import random
import requests

POI_TYPE_MAP = {
    "书店": "050000",
    "公园": "110101",
    "咖啡馆": "050500",
    "图书馆": "140100",
    "健身房": "080600",
    "博物馆": "140200",
    "美术馆": "140200",
    "海边": "110101",
    "山顶": "110101",
    "寺庙": "100100",
    "花园": "110101",
}

POI_KEYWORDS = {
    "书店": "书店",
    "公园": "公园",
    "咖啡馆": "咖啡",
    "图书馆": "图书馆",
    "健身房": "健身房",
    "博物馆": "博物馆",
    "美术馆": "美术馆",
    "海边": "海滨公园",
    "山顶": "登山",
    "寺庙": "寺庙",
    "花园": "花园",
}

FALLBACK_POIS = {
    "书店": [
        {"name": "言几又书店", "lat_offset": 0.002, "lng_offset": 0.003},
        {"name": "西西弗书店", "lat_offset": -0.001, "lng_offset": 0.005},
        {"name": "新华书店", "lat_offset": 0.003, "lng_offset": -0.002},
    ],
    "公园": [
        {"name": "城市中央公园", "lat_offset": 0.002, "lng_offset": 0.003},
        {"name": "绿道公园", "lat_offset": -0.001, "lng_offset": 0.005},
        {"name": "湖畔公园", "lat_offset": 0.003, "lng_offset": -0.002},
    ],
    "咖啡馆": [
        {"name": "静谧咖啡馆", "lat_offset": 0.002, "lng_offset": 0.002},
        {"name": "文艺咖啡馆", "lat_offset": -0.003, "lng_offset": 0.001},
        {"name": "街角咖啡", "lat_offset": 0.001, "lng_offset": 0.004},
    ],
    "图书馆": [
        {"name": "市立图书馆", "lat_offset": -0.001, "lng_offset": -0.002},
        {"name": "大学图书馆", "lat_offset": 0.003, "lng_offset": 0.002},
        {"name": "社区图书馆", "lat_offset": -0.002, "lng_offset": 0.003},
    ],
    "健身房": [
        {"name": "活力健身中心", "lat_offset": 0.002, "lng_offset": -0.001},
        {"name": "瑜伽工作室", "lat_offset": -0.004, "lng_offset": 0.002},
        {"name": "运动俱乐部", "lat_offset": 0.001, "lng_offset": 0.003},
    ],
    "博物馆": [
        {"name": "城市博物馆", "lat_offset": 0.003, "lng_offset": -0.004},
        {"name": "艺术展览馆", "lat_offset": -0.001, "lng_offset": 0.002},
        {"name": "历史纪念馆", "lat_offset": 0.002, "lng_offset": 0.001},
    ],
    "美术馆": [
        {"name": "现代美术馆", "lat_offset": 0.003, "lng_offset": -0.004},
        {"name": "当代艺术中心", "lat_offset": -0.001, "lng_offset": 0.002},
        {"name": "艺术画廊", "lat_offset": 0.002, "lng_offset": 0.001},
    ],
    "海边": [
        {"name": "海滨公园", "lat_offset": 0.003, "lng_offset": 0.002},
        {"name": "观海栈道", "lat_offset": -0.002, "lng_offset": 0.004},
        {"name": "滨海步道", "lat_offset": 0.001, "lng_offset": -0.003},
    ],
    "山顶": [
        {"name": "登山步道", "lat_offset": 0.002, "lng_offset": 0.003},
        {"name": "观景台", "lat_offset": -0.001, "lng_offset": 0.005},
        {"name": "山顶公园", "lat_offset": 0.003, "lng_offset": -0.002},
    ],
    "寺庙": [
        {"name": "古寺禅院", "lat_offset": 0.002, "lng_offset": 0.003},
        {"name": "静心禅堂", "lat_offset": -0.001, "lng_offset": 0.005},
        {"name": "文化禅寺", "lat_offset": 0.003, "lng_offset": -0.002},
    ],
    "花园": [
        {"name": "植物园", "lat_offset": 0.002, "lng_offset": 0.003},
        {"name": "花卉公园", "lat_offset": -0.001, "lng_offset": 0.005},
        {"name": "生态花园", "lat_offset": 0.003, "lng_offset": -0.002},
    ],
}

DEFAULT_FALLBACK = [
    {"name": "综合文化中心", "lat_offset": 0.002, "lng_offset": 0.002},
    {"name": "创意园区", "lat_offset": -0.002, "lng_offset": -0.001},
    {"name": "休闲广场", "lat_offset": 0.001, "lng_offset": 0.003},
]


def search_nearby_pois(keyword: str, user_lat: float, user_lng: float, radius: int = 3000):
    """调用高德地图API搜索附近真实POI"""
    amap_key = os.getenv("AMAP_API_KEY", "")
    if not amap_key or amap_key == "your_amap_api_key_here":
        return None

    try:
        url = "https://restapi.amap.com/v3/place/around"
        params = {
            "key": amap_key,
            "location": f"{user_lng},{user_lat}",
            "keywords": keyword,
            "radius": radius,
            "sortrule": "distance",
            "offset": 5,
            "page": 1,
            "output": "json",
        }
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()

        if data.get("status") == "1" and data.get("pois"):
            pois = []
            for poi in data["pois"][:3]:
                location = poi.get("location", "").split(",")
                if len(location) == 2:
                    pois.append({
                        "name": poi.get("name", "未知地点"),
                        "address": poi.get("address", ""),
                        "latitude": float(location[1]),
                        "longitude": float(location[0]),
                        "distance": poi.get("distance", ""),
                    })
            return pois if pois else None
    except Exception as e:
        print(f"AMap API error: {e}")

    return None


def generate_spatial_plan(
    discrepancy_score: float,
    location_keyword: str,
    user_lat: float,
    user_lng: float
):
    # 优先使用高德API搜索真实POI
    search_keyword = POI_KEYWORDS.get(location_keyword, location_keyword)
    real_pois = search_nearby_pois(search_keyword, user_lat, user_lng)

    tasks = []
    priority = "high" if discrepancy_score > 70 else ("medium" if discrepancy_score > 40 else "low")

    if real_pois:
        for i, poi in enumerate(real_pois[:3]):
            tasks.append({
                "id": f"task_{i+1}",
                "name": poi["name"],
                "type": location_keyword,
                "latitude": round(poi["latitude"], 6),
                "longitude": round(poi["longitude"], 6),
                "priority": priority if i == 0 else ("medium" if i == 1 else "low"),
                "suggested_duration": f"{30 + i * 15}分钟",
                "description": generate_task_description(location_keyword, discrepancy_score, poi.get("address", "")),
                "address": poi.get("address", ""),
                "distance": poi.get("distance", ""),
                "is_real_poi": True,
                "completion_status": False,
            })
    else:
        # 没有API Key或请求失败时，使用模拟数据
        templates = FALLBACK_POIS.get(location_keyword, DEFAULT_FALLBACK)
        for i in range(min(3, len(templates))):
            template = templates[i]
            lat = user_lat + template["lat_offset"] + random.uniform(-0.0005, 0.0005)
            lng = user_lng + template["lng_offset"] + random.uniform(-0.0005, 0.0005)
            tasks.append({
                "id": f"task_{i+1}",
                "name": template["name"],
                "type": location_keyword,
                "latitude": round(lat, 6),
                "longitude": round(lng, 6),
                "priority": priority if i == 0 else ("medium" if i == 1 else "low"),
                "suggested_duration": f"{30 + i * 15}分钟",
                "description": generate_task_description(location_keyword, discrepancy_score),
                "is_real_poi": False,
                "completion_status": False,
            })

    return {
        "discrepancy_score": discrepancy_score,
        "location_keyword": location_keyword,
        "total_tasks": len(tasks),
        "tasks": tasks,
        "user_location": {
            "latitude": user_lat,
            "longitude": user_lng
        }
    }


def generate_task_description(location_keyword: str, discrepancy_score: float, address: str = ""):
    descriptions = {
        "书店": "在书香中寻找内心的平静，阅读可以开阔视野，帮助你更好地了解自己",
        "公园": "在自然环境中散步，呼吸新鲜空气，放松身心，缓解压力",
        "咖啡馆": "在安静的咖啡馆中思考人生，理清思绪，给自己一段独处时光",
        "图书馆": "沉浸在知识的海洋中，寻找成长的灵感和内心的宁静",
        "健身房": "运动可以释放压力，提升自信和活力，让身体和心灵都充满能量",
        "博物馆": "文化熏陶可以丰富内心世界，激发创造力和对美的感知",
        "美术馆": "在艺术作品中寻找共鸣，让美唤醒你内心沉睡的部分",
        "海边": "面朝大海，感受辽阔与自由，让海浪带走你的烦恼",
        "山顶": "站在山顶俯瞰一切，从更高的视角看待人生的困扰",
        "寺庙": "在禅意中寻找内心的平静，让心灵回归最纯粹的宁静",
        "花园": "在花草中感受生命的美好，让自然治愈你的疲惫",
    }

    base_desc = descriptions.get(location_keyword, "去探索新的环境，发现自我")

    if address:
        base_desc += f"（地址：{address}）"

    if discrepancy_score > 70:
        return f"【高优先级】{base_desc}，当前偏差较大，需要立即行动"
    elif discrepancy_score > 40:
        return f"【中优先级】{base_desc}，保持持续的自我提升"
    else:
        return f"【低优先级】{base_desc}，维持当前良好状态"
