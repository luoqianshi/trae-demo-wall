import json
import os
import re

# 【优化】缓存全局变量，实现懒加载
_rules_cache = None
_devices_cache = None
_rules_mtime = None
_devices_mtime = None

# 规则索引缓存（category 索引 + tags 索引）
_rules_index_by_category = None
_rules_index_by_tags = None
_rules_index_mtime = None

# rule_library.json 中使用短 id，需映射到 device_library.json 的完整 id
DEVICE_ID_MAP = {
    'bulb': 'xiaomi_bulb',
    'curtain': 'xiaomi_curtain',
    'tv': 'xiaomi_tv',
    'speaker': 'xiaomi_speaker',
    'socket': 'xiaomi_socket',
    'switch': 'xiaomi_switch',
    'aircon': 'xiaomi_aircon_partner',
    'door_sensor': 'xiaomi_door_sensor',
    'lock_door': 'xiaomi_lock',
    'camera': 'xiaomi_camera',
    'smoke_detector': 'xiaomi_smoke_detector',
    'motion_sensor': 'xiaomi_motion_sensor',
    'temp_humidity': 'xiaomi_temp_humidity',
    'gateway': 'xiaomi_gateway',
    'air_conditioner': 'viomi_aircon',
    'yeelight_strip': 'yeelight_strip',
    'yeelight_bedside': 'yeelight_bedside',
    'aqara_fp2': 'aqara_fp2',
    'aqara_fp1': 'aqara_fp1',
    'aqara_curtain': 'aqara_curtain',
    'exhaust_fan': 'xiaomi_exhaust_fan',
    'bath_heater': 'xiaomi_bath_heater',
    'humidifier': 'xiaomi_humidifier',
    'water_leak': 'xiaomi_water_leak',
    'clothes_rack': 'xiaomi_clothes_rack',
    'air_purifier': 'xiaomi_air_purifier',
    'projector': 'xiaomi_projector',
    'light_sensor': 'aqara_light_sensor',
    'smart_panel': 'xiaomi_smart_panel',
    'infrared': 'xiaomi_infrared',
    'gas_detector': 'aqara_gas_detector',
    'vibration_sensor': 'aqara_vibration_sensor',
    'switch_e1': 'aqara_switch_e1',
    'panel_s1e': 'aqara_s1e_panel',
    'm3_gateway': 'aqara_m3_gateway',
    'camera_e1': 'aqara_camera_e1',
    'camera_pt': 'xiaomi_camera_pt',
    'fridge': 'viomi_fridge',
}

def get_data_path(filename):
    """获取数据文件的绝对路径"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    return os.path.join(project_root, 'data', filename)

def get_preset_rules():
    """获取预设联动规则（覆盖客厅/卧室/厨房三个区域）
    
    每条规则结构与 session_state.rules 完全一致：
    - id: 唯一标识
    - trigger_dev_id: 触发设备 id
    - trigger_event: 触发事件
    - action_dev_id: 执行设备 id
    - action: 执行动作
    - condition: 触发条件
    - room: 所属区域
    - description: 自然语言描述
    - source: 规则来源标记
    """
    return [
        {
            'id': 'preset_1',
            'trigger_dev_id': 'preset_motion_living',
            'trigger_dev_label': '客厅人体传感器',
            'trigger_event': 'detected',
            'action_dev_id': 'preset_light_living',
            'action_dev_label': '客厅主灯',
            'action': 'turn_on',
            'condition': '夜间',
            'room': '客厅',
            'source': 'preset',
            'description': '🌙 夜间，客厅人体传感器检测到人 → 客厅主灯自动打开'
        },
        {
            'id': 'preset_2',
            'trigger_dev_id': 'preset_door_living',
            'trigger_dev_label': '客厅门窗传感器',
            'trigger_event': 'open',
            'action_dev_id': 'preset_light_living',
            'action_dev_label': '客厅主灯',
            'action': 'turn_on',
            'condition': 'always',
            'room': '客厅',
            'source': 'preset',
            'description': '🚪 客厅门窗传感器检测到开门 → 客厅主灯自动亮起'
        },
        {
            'id': 'preset_3',
            'trigger_dev_id': 'preset_motion_bedroom',
            'trigger_dev_label': '卧室人体传感器',
            'trigger_event': 'detected',
            'action_dev_id': 'preset_light_bedroom',
            'action_dev_label': '卧室床头灯',
            'action': 'turn_on',
            'condition': '夜间',
            'room': '卧室',
            'source': 'preset',
            'description': '🌙 夜间，卧室人体传感器检测到人 → 卧室床头灯自动亮起'
        },
        {
            'id': 'preset_4',
            'trigger_dev_id': 'preset_door_bedroom',
            'trigger_dev_label': '卧室门窗传感器',
            'trigger_event': 'open',
            'action_dev_id': 'preset_plug_bedroom',
            'action_dev_label': '卧室智能插座',
            'action': 'turn_on',
            'condition': 'always',
            'room': '卧室',
            'source': 'preset',
            'description': '🚪 卧室门打开 → 卧室智能插座通电（报警器待命）'
        },
        {
            'id': 'preset_5',
            'trigger_dev_id': 'preset_temp_kitchen',
            'trigger_dev_label': '厨房温湿度传感器',
            'trigger_event': 'temperature_change',
            'action_dev_id': 'preset_plug_kitchen',
            'action_dev_label': '厨房智能插座',
            'action': 'turn_on',
            'condition': '温度>28°C',
            'room': '厨房',
            'source': 'preset',
            'description': '🌡️ 厨房温湿度异常（温度>28°C）→ 厨房智能插座开启降温设备'
        },
        {
            'id': 'preset_6',
            'trigger_dev_id': 'preset_motion_living',
            'trigger_dev_label': '客厅人体传感器',
            'trigger_event': 'detected',
            'action_dev_id': 'preset_plug_living',
            'action_dev_label': '客厅智能插座',
            'action': 'turn_on',
            'condition': 'always',
            'room': '客厅',
            'source': 'preset',
            'description': '🚶 客厅人体传感器检测到人 → 客厅智能插座开启（电视/音响待命）'
        }
    ]

def load_rules():
    """【优化】带缓存的规则加载，文件变更时自动刷新"""
    global _rules_cache, _rules_mtime
    rule_path = get_data_path('rule_library.json')
    try:
        current_mtime = os.path.getmtime(rule_path)
    except OSError:
        current_mtime = None

    # 缓存为空 或 文件已修改 → 重新加载
    if _rules_cache is None or _rules_mtime != current_mtime:
        try:
            with open(rule_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'rules' in data and isinstance(data['rules'], list):
                    _rules_cache = data['rules']
                else:
                    _rules_cache = []
                _rules_mtime = current_mtime
        except FileNotFoundError:
            print(f"错误：规则文件 {rule_path} 不存在")
            _rules_cache = []
        except json.JSONDecodeError:
            print(f"错误：规则文件 {rule_path} 格式错误")
            _rules_cache = []
        except Exception as e:
            print(f"加载规则文件时发生未知错误: {str(e)}")
            _rules_cache = []
    return _rules_cache

def load_devices():
    """【优化】带缓存的设备加载，文件变更时自动刷新"""
    global _devices_cache, _devices_mtime
    device_path = get_data_path('device_library.json')
    try:
        current_mtime = os.path.getmtime(device_path)
    except OSError:
        current_mtime = None

    if _devices_cache is None or _devices_mtime != current_mtime:
        try:
            with open(device_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'devices' in data and isinstance(data['devices'], list):
                    _devices_cache = {d['id']: d for d in data['devices']}
                else:
                    _devices_cache = {}
                _devices_mtime = current_mtime
        except FileNotFoundError:
            print(f"错误：设备文件 {device_path} 不存在")
            _devices_cache = {}
        except json.JSONDecodeError:
            print(f"错误：设备文件 {device_path} 格式错误")
            _devices_cache = {}
        except Exception as e:
            print(f"加载设备文件时发生未知错误: {str(e)}")
            _devices_cache = {}
    return _devices_cache


# ============================================
# 规则索引：按 category 和 tags 建立倒排索引
# ============================================

def build_rule_indexes():
    """构建规则索引：按 category 索引 + 按 tags 索引。
    
    返回:
        (index_by_category, index_by_tags)
        - index_by_category: {category: [rule, rule, ...]}
        - index_by_tags: {tag: [rule, rule, ...]}
    """
    global _rules_index_by_category, _rules_index_by_tags, _rules_index_mtime
    
    rule_path = get_data_path('rule_library.json')
    try:
        current_mtime = os.path.getmtime(rule_path)
    except OSError:
        current_mtime = None

    # 索引为空 或 规则文件已修改 → 重建索引
    if (_rules_index_by_category is None 
        or _rules_index_by_tags is None 
        or _rules_index_mtime != current_mtime):
        rules = load_rules()
        index_by_category = {}
        index_by_tags = {}
        for rule in rules:
            # 按 category 索引
            cat = rule.get('category', '未分类')
            if cat not in index_by_category:
                index_by_category[cat] = []
            index_by_category[cat].append(rule)
            # 按 tags 索引
            for tag in rule.get('tags', []):
                if tag not in index_by_tags:
                    index_by_tags[tag] = []
                index_by_tags[tag].append(rule)
        _rules_index_by_category = index_by_category
        _rules_index_by_tags = index_by_tags
        _rules_index_mtime = current_mtime
    
    return _rules_index_by_category, _rules_index_by_tags


def match_rules_by_keywords(keywords, floorplan=None):
    """【新增】按关键词列表匹配规则，返回 Top 5 匹配度最高的规则。
    
    逻辑：
    1. 按 keywords 匹配规则的 tags 和 description（子串匹配）
    2. 若提供 floorplan，按 applicable_areas 过滤（只保留适用当前户型的规则）
       - floorplan 可以是户型文件名（如 'one_bedroom.json'）或区域列表
    3. 计算匹配度 match_score = 匹配关键词数 / 总关键词数（0~1）
    4. 返回 Top 5
    
    返回值格式：
    [
        {
            "rule": {...},           # 规则原始数据
            "match_score": 0.85,     # 匹配度
            "matched_keywords": ["影院", "投影"]
        },
        ...
    ]
    """
    if not keywords:
        return []
    
    rules = load_rules()
    if not rules:
        return []
    
    # 解析 floorplan 为区域列表
    floorplan_areas = _parse_floorplan_areas(floorplan) if floorplan else None
    
    results = []
    
    for rule in rules:
        # 按户型区域过滤
        if floorplan_areas is not None:
            applicable_areas = rule.get('applicable_areas', [])
            # 全屋规则总是适用；否则取交集
            if applicable_areas and '全屋' not in applicable_areas:
                # 户型区域与规则适用区域有交集才保留
                if not set(applicable_areas) & set(floorplan_areas):
                    continue
        
        # 收集规则的匹配文本：tags + description + scene_name + keywords
        rule_tags = rule.get('tags', [])
        rule_desc = rule.get('description', '')
        rule_scene = rule.get('scene_name', '')
        rule_keywords = rule.get('keywords', [])
        
        matched_kws = []  # 记录该规则匹配到的关键词
        
        for kw in keywords:
            kw_matched = False
            # 匹配 tags
            for tag in rule_tags:
                if kw in tag or tag in kw:
                    kw_matched = True
                    break
            if not kw_matched:
                # 匹配 description
                if kw in rule_desc:
                    kw_matched = True
            if not kw_matched:
                # 匹配 scene_name
                if kw in rule_scene:
                    kw_matched = True
            if not kw_matched:
                # 匹配 rule 自身的 keywords
                for rk in rule_keywords:
                    if kw in rk or rk in kw:
                        kw_matched = True
                        break
            
            if kw_matched:
                matched_kws.append(kw)
        
        matched_keywords = matched_kws
        
        if matched_keywords:
            # 匹配度 = 匹配到的关键词数 / 用户提供的总关键词数
            match_score = round(len(matched_keywords) / len(keywords), 2)
            results.append({
                'rule': rule,
                'match_score': match_score,
                'matched_keywords': matched_keywords
            })
    
    # 按匹配度降序排序，取 Top 5
    results.sort(key=lambda x: (-x['match_score'], -len(x['matched_keywords'])))
    return results[:5]


def _parse_floorplan_areas(floorplan):
    """解析户型为区域列表。
    
    支持两种输入：
    - 字符串：户型文件名（如 'one_bedroom.json'）→ 读取 JSON 获取区域
    - 列表：直接作为区域列表使用
    """
    if isinstance(floorplan, list):
        return floorplan
    
    if isinstance(floorplan, str):
        # 尝试作为文件名解析
        if floorplan.endswith('.json'):
            try:
                floorplan_path = get_data_path(os.path.join('floorplan_templates', floorplan))
                with open(floorplan_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                # 提取区域名称
                areas = []
                for room in data.get('rooms', []):
                    if isinstance(room, dict):
                        areas.append(room.get('name', ''))
                    elif isinstance(room, str):
                        areas.append(room)
                areas = [a for a in areas if a]
                return areas if areas else None
            except Exception:
                return None
        else:
            # 直接作为区域名
            return [floorplan]
    
    return None


def match_by_rules(user_input, budget=3000):
    """【优化】增强的规则匹配，支持关键词、标签和预算三重匹配"""
    # 输入校验
    if not user_input or not isinstance(user_input, str) or not user_input.strip():
        return None
    
    rules = load_rules()
    devices = load_devices()
    
    if not rules or not devices:
        return None
    
    # 第一步：关键词精确匹配（优先级最高）
    # 每条规则取最长匹配关键词（而非首个匹配），用匹配数量作为 tiebreaker
    keyword_matches = []  # [(best_len, match_count, rule_index, rule)]
    for idx, rule in enumerate(rules):
        best_len = 0
        match_count = 0
        for keyword in rule.get('keywords', []):
            if keyword in user_input:
                match_count += 1
                if len(keyword) > best_len:
                    best_len = len(keyword)
        if best_len > 0:
            keyword_matches.append((best_len, match_count, idx, rule))

    if keyword_matches:
        # 排序：最长关键词优先 → 匹配数量多者优先 → 规则顺序
        keyword_matches.sort(key=lambda x: (-x[0], -x[1], x[2]))
        for _, _, _, rule in keyword_matches:
            result = _build_plan_from_rule(rule, devices, budget)
            if result:
                return result

    # 第二步：标签精确匹配（兜底，要求完整词匹配而非子串）
    # 将用户输入按空格/标点分词，标签必须完全等于某个词
    user_words = set(re.split(r'[\s,，、。；;]+', user_input))
    user_words.discard('')

    tag_matches = []  # [(match_count, rule_index, rule)]
    for idx, rule in enumerate(rules):
        rule_tags = rule.get('tags', [])
        match_count = sum(1 for tag in rule_tags if tag in user_words)
        if match_count > 0:
            tag_matches.append((match_count, idx, rule))

    if tag_matches:
        # 按匹配数降序、规则顺序升序排列
        tag_matches.sort(key=lambda x: (-x[0], x[1]))
        for _, _, rule in tag_matches:
            result = _build_plan_from_rule(rule, devices, budget)
            if result:
                return result
    
    return None

def _build_plan_from_rule(rule, devices, budget=3000):
    """【优化】根据规则构建方案，支持预算筛选"""
    matched_devices = []
    required_device_ids = rule.get('devices', [])
    
    for device_id in required_device_ids:
        # 映射短 id 到完整 id
        mapped_id = DEVICE_ID_MAP.get(device_id, device_id)
        if mapped_id in devices:
            device = devices[mapped_id]
            if device.get('price', 0) <= budget:
                matched_devices.append(device)
    
    if not matched_devices:
        return {
            'scene_name': rule.get('scene_name', '未命名场景'),
            'devices': [],
            'actions': [],
            'description': '预算过低，无法配齐该场景所需设备',
            'source': 'local_rules',
            'warning': '预算过低，建议调整'
        }
    
    # 检查是否需要网关
    needs_gateway = any(d.get('gateway_required', False) for d in matched_devices)
    matched_ids = [d['id'] for d in matched_devices]
    gateway_id = 'xiaomi_gateway'
    if needs_gateway and gateway_id in devices and gateway_id not in matched_ids:
        gateway = devices[gateway_id]
        if gateway.get('price', 0) <= budget:
            matched_devices.append(gateway)
    
    return {
        'scene_name': rule.get('scene_name', '未命名场景'),
        'devices': matched_devices,
        'actions': rule.get('actions', []),
        'description': rule.get('description', ''),
        'source': 'local_rules'
    }


# ============================================
# 联动模拟辅助函数（用于 dashboard 联动模拟器）
# ============================================

# 设备类别 → 联动目标映射表（硬编码）
# 格式: {触发类别: [{target_category, action, desc}]}
_DEVICE_LINKAGE_MAP = {
    '传感器': [
        {'target_category': '照明', 'action': '开启', 'desc': '人来灯亮'},
        {'target_category': '开关', 'action': '开启', 'desc': '自动通电'},
    ],
    '门锁': [
        {'target_category': '照明', 'action': '开启', 'desc': '开门亮灯'},
        {'target_category': '摄像头', 'action': '开启', 'desc': '自动录像'},
    ],
    '照明': [
        {'target_category': '开关', 'action': '开启', 'desc': '灯控联动'},
    ],
    '窗帘': [
        {'target_category': '照明', 'action': '调节', 'desc': '光线联动'},
    ],
    '空调': [
        {'target_category': '窗帘', 'action': '关闭', 'desc': '节能联动'},
    ],
}

# 传感器子类 → 更精确的联动目标
_SENSOR_LINKAGE_MAP = {
    '人体': [{'target_category': '照明', 'action': '开启', 'desc': '人来灯亮'}],
    '门磁': [{'target_category': '照明', 'action': '开启', 'desc': '开门亮灯'}],
    '门窗': [{'target_category': '照明', 'action': '开启', 'desc': '开门亮灯'}],
    '温湿度': [{'target_category': '空调', 'action': '开启', 'desc': '温度自动调节'}],
    '光照': [{'target_category': '窗帘', 'action': '调节', 'desc': '光线自适应'}],
    '烟雾': [{'target_category': '开关', 'action': '开启', 'desc': '烟雾报警'}],
    '水浸': [{'target_category': '开关', 'action': '关闭', 'desc': '断电保护'}],
}

# 一键模式定义
_MODE_ACTIONS = {
    '离家': {
        'icon': '🚪',
        'name': '离家模式',
        'actions': [
            {'category': '照明', 'action': '关闭', 'desc': '关闭所有灯光'},
            {'category': '空调', 'action': '关闭', 'desc': '关闭空调'},
            {'category': '窗帘', 'action': '关闭', 'desc': '关闭窗帘'},
            {'category': '摄像头', 'action': '开启', 'desc': '摄像头布防'},
            {'category': '门锁', 'action': '上锁', 'desc': '门锁布防'},
        ],
    },
    '回家': {
        'icon': '🏠',
        'name': '回家模式',
        'actions': [
            {'category': '照明', 'action': '开启', 'desc': '打开客厅灯'},
            {'category': '空调', 'action': '开启', 'desc': '开启空调'},
            {'category': '窗帘', 'action': '开启', 'desc': '打开窗帘'},
            {'category': '摄像头', 'action': '关闭', 'desc': '摄像头撤防'},
            {'category': '门锁', 'action': '解锁', 'desc': '门锁解锁'},
        ],
    },
    '晚安': {
        'icon': '🌙',
        'name': '晚安模式',
        'actions': [
            {'category': '照明', 'action': '关闭', 'desc': '关闭全屋灯光'},
            {'category': '窗帘', 'action': '关闭', 'desc': '关闭卧室窗帘'},
            {'category': '空调', 'action': '调节', 'desc': '空调调至睡眠模式'},
            {'category': '门锁', 'action': '上锁', 'desc': '门锁布防'},
            {'category': '摄像头', 'action': '开启', 'desc': '夜间监控开启'},
        ],
    },
}


def get_linkage_targets(trigger_device, all_devices):
    """根据触发设备获取联动目标设备列表。
    
    遍历硬编码的联动映射表，找到与触发设备类别匹配的目标设备。
    对于传感器类设备，会进一步根据设备名称中的关键词（人体/门磁/温湿度等）
    匹配更精确的联动规则。
    
    返回: [{'device': target_device, 'action': str, 'desc': str}]
    """
    if not trigger_device or not all_devices:
        return []

    trigger_category = trigger_device.get('category', '')
    trigger_name = trigger_device.get('name', '')
    trigger_id = trigger_device.get('id', '')

    # 确定联动规则
    linkage_rules = []
    if trigger_category == '传感器':
        # 传感器按名称子串精确匹配
        for sensor_key, rules in _SENSOR_LINKAGE_MAP.items():
            if sensor_key in trigger_name:
                linkage_rules = rules
                break
        # 未匹配到具体传感器类型，使用通用传感器规则
        if not linkage_rules:
            linkage_rules = _DEVICE_LINKAGE_MAP.get('传感器', [])
    else:
        linkage_rules = _DEVICE_LINKAGE_MAP.get(trigger_category, [])

    if not linkage_rules:
        return []

    # 查找匹配的目标设备
    targets = []
    for rule in linkage_rules:
        target_cat = rule.get('target_category', '')
        for dev in all_devices:
            dev_id = dev.get('id', '')
            dev_cat = dev.get('category', '')
            # 排除触发设备自身，且类别需匹配
            if dev_id == trigger_id:
                continue
            if dev_cat == target_cat or target_cat in dev_cat:
                targets.append({
                    'device': dev,
                    'action': rule.get('action', '开启'),
                    'desc': rule.get('desc', ''),
                })
                break  # 每个目标类别只取第一个匹配的设备

    return targets


def get_mode_actions(mode, all_devices):
    """获取一键模式的所有联动动作。
    
    参数:
        mode: '离家' / '回家' / '晚安'
        all_devices: 当前方案设备列表
    
    返回: {'name': str, 'icon': str, 'actions': [{'device', 'action', 'desc'}]}
    """
    mode_def = _MODE_ACTIONS.get(mode)
    if not mode_def or not all_devices:
        return {'name': mode, 'icon': '⚡', 'actions': []}

    result_actions = []
    for act in mode_def['actions']:
        target_cat = act.get('category', '')
        for dev in all_devices:
            dev_cat = dev.get('category', '')
            if dev_cat == target_cat or target_cat in dev_cat:
                result_actions.append({
                    'device': dev,
                    'action': act.get('action', ''),
                    'desc': act.get('desc', ''),
                })
                break

    return {
        'name': mode_def['name'],
        'icon': mode_def['icon'],
        'actions': result_actions,
    }


def get_all_mode_names():
    """返回所有可用的一键模式名称列表。"""
    return list(_MODE_ACTIONS.keys())

