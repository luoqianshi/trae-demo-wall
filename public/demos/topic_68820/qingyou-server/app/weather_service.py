"""真实天气服务 —— 接入 Open-Meteo 免费 API（无需密钥）

Open-Meteo 提供免费的天气预报 API，无需注册和 API Key。
- 预报接口: https://api.open-meteo.com/v1/forecast
- 支持每日最高/最低温度、天气代码
- 使用 WMO 天气代码标准

所有网络异常时返回 None，调用方回退到数据库模拟数据。
"""
import json
import urllib.request
import urllib.error
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# 北京时区
BEIJING_TZ = timezone(timedelta(hours=8))

# Open-Meteo API 基地址
API_BASE = 'https://api.open-meteo.com/v1/forecast'
REQUEST_TIMEOUT = 6  # 秒，避免阻塞过久

# ===== 32 个城市的经纬度坐标 =====
CITY_COORDS = {
    '北京': (39.9042, 116.4074),
    '上海': (31.2304, 121.4737),
    '天津': (39.3434, 117.3616),
    '重庆': (29.5630, 106.5516),
    '哈尔滨': (45.8038, 126.5350),
    '长春': (43.8171, 125.3235),
    '沈阳': (41.8057, 123.4315),
    '呼和浩特': (40.8414, 111.7519),
    '石家庄': (38.0428, 114.5149),
    '太原': (37.8706, 112.5489),
    '济南': (36.6512, 117.1201),
    '郑州': (34.7466, 113.6253),
    '西安': (34.3416, 108.9398),
    '兰州': (36.0611, 103.8343),
    '银川': (38.4872, 106.2309),
    '西宁': (36.6171, 101.7782),
    '乌鲁木齐': (43.8256, 87.6168),
    '合肥': (31.8206, 117.2272),
    '南京': (32.0603, 118.7969),
    '杭州': (30.2741, 120.1551),
    '南昌': (28.6820, 115.8579),
    '福州': (26.0745, 119.2965),
    '武汉': (30.5928, 114.3055),
    '长沙': (28.2282, 112.9388),
    '广州': (23.1291, 113.2644),
    '海口': (20.0440, 110.1990),
    '南宁': (22.8170, 108.3665),
    '成都': (30.5728, 104.0668),
    '贵阳': (26.6470, 106.6302),
    '昆明': (24.8801, 102.8329),
    '拉萨': (29.6500, 91.1000),
    '台北': (25.0330, 121.5654),
}

# ===== WMO 天气代码映射（Open-Meteo 使用）=====
WMO_CODE_MAP = {
    0: {'text': '晴', 'icon': '☀️'},
    1: {'text': '晴', 'icon': '☀️'},
    2: {'text': '多云', 'icon': '⛅'},
    3: {'text': '阴', 'icon': '☁️'},
    45: {'text': '雾', 'icon': '🌫️'},
    48: {'text': '雾', 'icon': '🌫️'},
    51: {'text': '小雨', 'icon': '🌦️'},
    53: {'text': '小雨', 'icon': '🌦️'},
    55: {'text': '中雨', 'icon': '🌧️'},
    56: {'text': '小雨', 'icon': '🌦️'},
    57: {'text': '中雨', 'icon': '🌧️'},
    61: {'text': '小雨', 'icon': '🌧️'},
    63: {'text': '中雨', 'icon': '🌧️'},
    65: {'text': '大雨', 'icon': '⛈️'},
    66: {'text': '小雨', 'icon': '🌧️'},
    67: {'text': '大雨', 'icon': '⛈️'},
    71: {'text': '小雪', 'icon': '🌨️'},
    73: {'text': '中雪', 'icon': '🌨️'},
    75: {'text': '大雪', 'icon': '❄️'},
    77: {'text': '小雪', 'icon': '🌨️'},
    80: {'text': '小雨', 'icon': '🌦️'},
    81: {'text': '中雨', 'icon': '🌧️'},
    82: {'text': '大雨', 'icon': '⛈️'},
    85: {'text': '小雪', 'icon': '🌨️'},
    86: {'text': '大雪', 'icon': '❄️'},
    95: {'text': '雷暴', 'icon': '⛈️'},
    96: {'text': '雷暴', 'icon': '⛈️'},
    99: {'text': '雷暴', 'icon': '⛈️'},
}


def _fetch_json(url: str) -> Optional[dict]:
    """请求 URL 并返回 JSON，失败返回 None"""
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'qingyou-app/1.0',
            'Accept': 'application/json',
        })
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, Exception) as e:
        logger.warning('天气 API 请求失败: %s', e)
        return None


def _wmo_to_info(code: int) -> Dict[str, str]:
    """WMO 天气代码转中文描述 + emoji"""
    return WMO_CODE_MAP.get(code, {'text': '未知', 'icon': '🌡️'})


def _format_temp(temp_min, temp_max) -> str:
    """格式化温度区间，如 '18–25°C'"""
    lo = int(round(temp_min))
    hi = int(round(temp_max))
    return '{}–{}°C'.format(lo, hi)


def get_real_weather(city: str, days: int = 1) -> Optional[Dict]:
    """
    查询真实天气预报。

    Args:
        city: 城市中文名
        days: 行程天数（1-3），决定查询几天预报

    Returns:
        天气数据字典，格式与现有 plan.weather 一致:
        {
            'text': '晴',
            'temp': '18–25°C',
            'icon': '☀️',
            'source': 'open-meteo',
            'forecast': [
                {'date': '2026-07-02', 'text': '晴', 'temp': '18–25°C', 'icon': '☀️'},
                ...
            ]
        }
        失败时返回 None。
    """
    coords = CITY_COORDS.get(city)
    if not coords:
        logger.info('城市 %s 无坐标数据，回退模拟天气', city)
        return None

    lat, lon = coords
    # 请求预报天数（最少 1，最多 3，多查 1 天做容错）
    forecast_days = max(1, min(days, 3))

    url = (
        '{base}?latitude={lat}&longitude={lon}'
        '&daily=temperature_2m_max,temperature_2m_min,weather_code'
        '&current=temperature_2m,weather_code'
        '&timezone=Asia%2FShanghai'
        '&forecast_days={fdays}'
    ).format(
        base=API_BASE, lat=lat, lon=lon, fdays=forecast_days,
    )

    data = _fetch_json(url)
    if not data or 'daily' not in data:
        return None

    daily = data['daily']
    times = daily.get('time', [])
    t_maxs = daily.get('temperature_2m_max', [])
    t_mins = daily.get('temperature_2m_min', [])
    codes = daily.get('weather_code', [])

    # 构建逐日预报
    forecast = []
    for i in range(len(times)):
        wmo_info = _wmo_to_info(codes[i]) if i < len(codes) else {'text': '未知', 'icon': '🌡️'}
        temp_str = _format_temp(t_mins[i], t_maxs[i]) if i < len(t_mins) and i < len(t_maxs) else '—'
        forecast.append({
            'date': times[i],
            'text': wmo_info['text'],
            'temp': temp_str,
            'icon': wmo_info['icon'],
        })

    if not forecast:
        return None

    # 总览天气取第一天
    first = forecast[0]

    # 若有 current 数据，用当前温度补充
    current = data.get('current', {})
    current_temp = current.get('temperature_2m')
    if current_temp is not None:
        # 总览温度展示为「当前温度 / 当日区间」
        current_str = '{}°C'.format(int(round(current_temp)))
        overview_temp = current_str + ' / ' + first['temp']
    else:
        overview_temp = first['temp']

    return {
        'text': first['text'],
        'temp': overview_temp,
        'icon': first['icon'],
        'source': 'open-meteo',
        'forecast': forecast,
    }


def get_beijing_time() -> Dict:
    """返回当前北京时间（用于 /api/time 接口）"""
    now = datetime.now(BEIJING_TZ)
    return {
        'datetime': now.isoformat(),
        'date': now.strftime('%Y-%m-%d'),
        'year': now.year,
        'month': now.month,
        'day': now.day,
        'hour': now.hour,
        'minute': now.minute,
        'weekday': now.strftime('%A'),
        'timestamp': int(now.timestamp()),
    }
