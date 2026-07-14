import json
import os
import sqlite3
from datetime import datetime

# 【优化】缓存全局变量
_devices_cache = None

def get_data_path(filename):
    """获取数据文件的绝对路径"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    return os.path.join(project_root, 'data', filename)

def load_json(filepath):
    """【优化】增强的JSON加载，带完善的异常处理"""
    if not filepath or not isinstance(filepath, str):
        return None
    
    if not os.path.exists(filepath):
        print(f"错误：文件 {filepath} 不存在")
        return None
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"错误：文件 {filepath} 格式错误")
        return None
    except PermissionError:
        print(f"错误：没有权限读取文件 {filepath}")
        return None
    except Exception as e:
        print(f"加载文件 {filepath} 时发生未知错误: {str(e)}")
        return None

def save_json(data, filepath):
    """【优化】增强的JSON保存，带完善的异常处理"""
    if not filepath or not isinstance(filepath, str):
        return False
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except PermissionError:
        print(f"错误：没有权限写入文件 {filepath}")
        return False
    except Exception as e:
        print(f"保存文件 {filepath} 时发生未知错误: {str(e)}")
        return False

def init_database():
    """初始化SQLite数据库"""
    db_path = get_data_path('history.db')
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_input TEXT NOT NULL,
                scene_name TEXT,
                total_price INTEGER,
                source TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"初始化数据库时发生错误: {str(e)}")
        return False

def save_history(user_input, scene_name=None, total_price=None, source=None):
    """保存历史记录到数据库"""
    db_path = get_data_path('history.db')
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO history (user_input, scene_name, total_price, source)
            VALUES (?, ?, ?, ?)
        ''', (user_input, scene_name, total_price, source))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"保存历史记录时发生错误: {str(e)}")
        return False

def get_history(limit=10):
    """获取历史记录"""
    db_path = get_data_path('history.db')
    if not os.path.exists(db_path):
        return []
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM history ORDER BY created_at DESC LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        conn.close()
        return rows
    except Exception as e:
        print(f"获取历史记录时发生错误: {str(e)}")
        return []

def calculate_total_price(devices):
    """【优化】计算设备总价，增强空值处理，支持数量计算"""
    if not devices or not isinstance(devices, list):
        return 0
    
    total = 0
    for device in devices:
        if isinstance(device, dict):
            price = device.get('price', 0)
            quantity = device.get('quantity', 1)
            if isinstance(price, (int, float)) and isinstance(quantity, (int, float)):
                total += price * quantity
    return total

def get_devices_by_tags(tags):
    """【新增】根据标签筛选设备"""
    global _devices_cache
    
    if _devices_cache is None:
        device_path = get_data_path('device_library.json')
        data = load_json(device_path)
        if data and 'devices' in data:
            _devices_cache = {d['id']: d for d in data['devices']}
        else:
            _devices_cache = {}
    
    if not tags or not isinstance(tags, list):
        return []
    
    matched = []
    for device in _devices_cache.values():
        device_tags = device.get('tags', [])
        if any(tag in device_tags for tag in tags):
            matched.append(device)
    return matched

def format_price(price):
    """【新增】格式化价格显示"""
    if isinstance(price, (int, float)):
        return f"¥{price}"
    return "¥0"


# ============================================
# 导出辅助函数
# ============================================

from urllib.parse import quote as _url_quote


# 设备类别 → 中文显示映射（导出用）
_CATEGORY_CN_MAP = {
    '照明': '灯光',
    '传感器': '传感器',
    '环境': '传感器',
    '开关': '开关插座',
    '插座': '开关插座',
    '网关': '网关',
    '摄像头': '摄像头',
    '门锁': '门锁',
    '窗帘': '窗帘',
    '空调': '空调',
    '音箱': '音箱',
    '家电': '家电',
    '电视': '电视',
}

# 类别 → 默认安装方式映射
_INSTALLATION_MAP = {
    '照明': '吸顶安装',
    '传感器': '粘贴式',
    '环境': '桌面放置',
    '开关': '墙面安装',
    '插座': '墙面安装',
    '网关': '桌面放置',
    '摄像头': '墙面安装',
    '门锁': '门体安装',
    '窗帘': '轨道安装',
    '空调': '墙面安装',
    '音箱': '桌面放置',
    '家电': '桌面放置',
    '电视': '壁挂安装',
}


def generate_purchase_link(brand, name):
    """
    【新增】生成京东搜索链接。
    拼接品牌+型号，URL 编码后生成 https://search.jd.com/Search?keyword=xxx
    """
    keyword = f"{brand} {name}".strip() if brand else (name or '').strip()
    if not keyword:
        return ''
    encoded = _url_quote(keyword)
    return f"https://search.jd.com/Search?keyword={encoded}"


def format_device_for_export(device, quantity=1):
    """
    【新增】将设备对象格式化为导出行。
    处理字段映射、中文转换、链接拼接、备注智能填充。
    返回 dict，键为导出列名。
    """
    if not device or not isinstance(device, dict):
        return {}

    name = device.get('name', '未知设备')
    brand = device.get('brand', '-')
    dev_id = device.get('id', '') or device.get('type', '')
    qty = device.get('quantity', quantity) or quantity
    category = device.get('category', '')
    category_cn = _CATEGORY_CN_MAP.get(category, category or '其他')
    power = device.get('power_supply', '220V市电')
    protocol = device.get('protocol', '-')
    price = device.get('price', 0)
    subtotal = price * qty

    # 零火线要求（仅开关/插座类显示）
    if category in ('开关', '插座'):
        features = device.get('features', []) or []
        desc = device.get('description', '')
        if '零线' in str(features) or '零火' in str(desc):
            neutral_wire = '需零线'
        elif '单火' in str(features) or '单火线' in str(desc):
            neutral_wire = '无需零线（单火线）'
        else:
            neutral_wire = '需零线'
    else:
        neutral_wire = '不适用'

    # 安装方式
    installation = _INSTALLATION_MAP.get(category, '桌面放置')

    # 购买链接
    purchase_link = generate_purchase_link(brand, name)

    # 备注智能填充
    notes = []
    if device.get('gateway_required', False):
        notes.append('建议搭配网关使用')
    if 'Wi-Fi' in str(protocol) or 'WiFi' in str(protocol):
        notes.append('需 2.4G WiFi')
    if device.get('local_control_supported', False):
        notes.append('支持本地控制')
    note_text = '；'.join(notes) if notes else '-'

    return {
        '商品名称': name,
        '品牌': brand,
        '型号': dev_id,
        '数量': qty,
        '单价(元)': price,
        '小计(元)': subtotal,
        '类型': category_cn,
        '供电方式': power,
        '通信协议': protocol,
        '零火线要求': neutral_wire,
        '安装方式': installation,
        '购买链接': purchase_link,
        '备注': note_text,
    }


def detect_conflicts(devices, budget=0):
    """
    【新增】冲突检测：在导出前检测 4 类问题。
    返回冲突列表：[{"level": "warning"/"error", "type": "xxx", "message": "xxx"}]
    level=warning 为黄色警告，level=error 为红色警告。
    检测不影响导出流程，仅用于展示。
    """
    conflicts = []
    if not devices or not isinstance(devices, list):
        return conflicts

    # 1. 多网关检测
    gateway_count = sum(1 for d in devices if d.get('category') == '网关')
    if gateway_count >= 2:
        conflicts.append({
            'level': 'warning',
            'type': 'multi_gateway',
            'message': f'检测到 {gateway_count} 个网关，建议只保留 1 个，避免网络冲突',
        })

    # 2. 协议不兼容检测（Zigbee 和 KNX 混用且无多协议网关）
    protocols = set()
    has_multi_protocol_gateway = False
    for d in devices:
        proto = str(d.get('protocol', ''))
        # 拆分多个协议
        for p in proto.replace('，', '/').replace(',', '/').split('/'):
            p = p.strip()
            if p:
                protocols.add(p)
        # 检查网关是否支持多协议
        if d.get('category') == '网关':
            gateway_protocols = str(d.get('protocol', ''))
            if 'Zigbee' in gateway_protocols and ('KNX' in gateway_protocols or 'BLE' in gateway_protocols):
                has_multi_protocol_gateway = True

    if 'Zigbee' in protocols and 'KNX' in protocols and not has_multi_protocol_gateway:
        conflicts.append({
            'level': 'warning',
            'type': 'protocol_incompatible',
            'message': '检测到 Zigbee 和 KNX 设备混用，请确认网关兼容性',
        })

    # 3. 重复设备检测（完全重复的 device_id 条目，非数量>1）
    id_counts = {}
    for d in devices:
        did = d.get('id', '')
        if did:
            id_counts[did] = id_counts.get(did, 0) + 1
    # 完全重复：同一 id 出现多次（且不是通过 quantity 表达的）
    for did, count in id_counts.items():
        if count > 1:
            dev_name = next((d.get('name', did) for d in devices if d.get('id') == did), did)
            conflicts.append({
                'level': 'error',
                'type': 'duplicate_device',
                'message': f'发现重复设备：{dev_name}（出现 {count} 次），请检查清单',
            })

    # 4. 预算超限检测
    if budget and budget > 0:
        total_price = sum(
            d.get('price', 0) * d.get('quantity', 1) for d in devices
            if isinstance(d.get('price', 0), (int, float))
        )
        if total_price > budget:
            over = total_price - budget
            conflicts.append({
                'level': 'error',
                'type': 'budget_overrun',
                'message': f'总价 ¥{total_price} 超出预算 ¥{budget}，超出 ¥{over}',
            })

    return conflicts


# ============================================
# 户型图 / 设备布局辅助函数
# ============================================

# 房间名称 → 颜色映射
_ROOM_COLORS = {
    '客厅': '#4FC3F7', '主卧': '#FFB74D', '次卧': '#FFD54F',
    '卧室': '#FFB74D', '厨房': '#FF8A65', '卫生间': '#81C784',
    '阳台': '#90CAF9', '玄关': '#CE93D8', '书房': '#A5D6A7',
    '餐厅': '#FFAB91', '客卫': '#80CBC4', '儿童房': '#F48FB1',
}

# 设备类别 → Emoji 映射
_DEVICE_EMOJI_MAP = {
    '照明': '💡', '灯光': '💡', '传感器': '📡', '环境': '📡',
    '开关': '🔌', '插座': '🔌', '开关插座': '🔌',
    '网关': '📶', '摄像头': '📹', '门锁': '🔑',
    '窗帘': '🪟', '空调': '❄️', '音箱': '🔊',
    '家电': '📺', '电视': '📺',
}

# 协议 → 颜色映射
_PROTOCOL_COLORS = {
    'Zigbee': '#4CAF50', 'WiFi': '#2196F3', 'Wi-Fi': '#2196F3',
    '蓝牙': '#FF9800', 'BLE': '#FF9800', 'Bluetooth': '#FF9800',
    'Thread': '#9C27B0', 'KNX': '#607D8B', 'Matter': '#00BCD4',
}


def get_room_color(room_name):
    """【新增】返回房间对应的颜色，未知房间返回默认色。"""
    if not room_name:
        return '#BDBDBD'
    # 精确匹配
    if room_name in _ROOM_COLORS:
        return _ROOM_COLORS[room_name]
    # 模糊匹配
    for key, color in _ROOM_COLORS.items():
        if key in room_name or room_name in key:
            return color
    return '#BDBDBD'


def get_device_emoji(category):
    """【新增】返回设备类别对应的 Emoji，未知类别返回 📦。"""
    if not category:
        return '📦'
    if category in _DEVICE_EMOJI_MAP:
        return _DEVICE_EMOJI_MAP[category]
    # 模糊匹配
    for key, emoji in _DEVICE_EMOJI_MAP.items():
        if key in category or category in key:
            return emoji
    return '📦'


def get_protocol_color(protocol):
    """【新增】返回通信协议对应的颜色，未知协议返回灰色。"""
    if not protocol:
        return '#9E9E9E'
    proto_str = str(protocol)
    # 精确匹配
    if proto_str in _PROTOCOL_COLORS:
        return _PROTOCOL_COLORS[proto_str]
    # 模糊匹配（处理 "Wi-Fi/Zigbee" 等组合）
    for key, color in _PROTOCOL_COLORS.items():
        if key.lower() in proto_str.lower():
            return color
    return '#9E9E9E'


