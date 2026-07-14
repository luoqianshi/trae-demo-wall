import json
import os
import random

# 【优化】缓存全局变量，实现懒加载
_devices_cache = None
_devices_mtime = None

def get_data_path(filename):
    """获取数据文件的绝对路径"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    return os.path.join(project_root, 'data', filename)

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

def match_by_local_ai(user_input, budget=3000):
    """【优化】本地AI模拟，支持预算筛选"""
    # 输入校验
    if not user_input or not isinstance(user_input, str) or not user_input.strip():
        return None
    
    devices = load_devices()
    if not devices:
        return None
    
    # 根据预算筛选设备
    filtered_devices = [d for d in devices.values() if d.get('price', 0) <= budget]
    if len(filtered_devices) < 2:
        return {
            'scene_name': '🤖 AI智能推荐',
            'devices': [],
            'actions': [],
            'description': '预算过低，建议调整预算以获得更多选择',
            'source': 'local_ai',
            'confidence': 0.0,
            'warning': '预算过低，建议调整'
        }
    
    # 随机选择设备
    selected = random.sample(filtered_devices, min(3, len(filtered_devices)))
    
    return {
        'scene_name': '🤖 AI智能推荐',
        'devices': selected,
        'actions': _generate_actions(selected),
        'description': '基于AI分析的智能家居方案',
        'source': 'local_ai',
        'confidence': 0.85
    }

# 场景类型 → 优先设备品类映射（中文 category）
SCENE_CATEGORY_PRIORITY = {
    'security': ['安防', '摄像头', '传感器', '网关', '开关'],
    'lighting': ['照明', '开关', '网关', '传感器'],
    'comfort': ['空调', '窗帘', '环境', '照明', '音箱', '网关'],
    'energy_saving': ['插座', '开关', '空调', '传感器', '网关'],
}

# 场景类型 → 中文名称
SCENE_TYPE_CN = {
    'security': '安防',
    'lighting': '照明',
    'comfort': '舒适',
    'energy_saving': '节能',
}


def detect_scene_type(user_input):
    """根据用户输入检测场景类型：security/lighting/comfort/energy_saving"""
    if not user_input:
        return 'comfort'
    text = user_input.lower()
    # 安防类关键词
    if any(kw in text for kw in ['安防', '安全', '监控', '门锁', '报警', '防盗', '摄像头', '入侵', '看家']):
        return 'security'
    # 照明类关键词
    if any(kw in text for kw in ['灯光', '照明', '灯', '氛围', '色温', '亮度', '调光']):
        return 'lighting'
    # 节能类关键词
    if any(kw in text for kw in ['节能', '省电', '能耗', '电费', '低碳', '环保']):
        return 'energy_saving'
    # 舒适类（默认）
    return 'comfort'


def _filter_by_scene_and_budget(devices, scene_type, budget_tier, count):
    """根据场景类型和预算档位筛选设备，返回差异化组合"""
    if not devices:
        return []

    priority_categories = SCENE_CATEGORY_PRIORITY.get(scene_type, [])
    # 按 scene 优先级分组
    prioritized = []
    others = []
    for d in devices:
        cat = d.get('category', '')
        if cat in priority_categories:
            prioritized.append(d)
        else:
            others.append(d)

    # 按优先级排序（在 priority_categories 中的顺序）
    def cat_priority(d):
        cat = d.get('category', '')
        if cat in priority_categories:
            return priority_categories.index(cat)
        return len(priority_categories)
    prioritized.sort(key=cat_priority)

    # 根据 budget_tier 决定价格策略
    if budget_tier == 'economy':
        # L1 基础智能：优先品类中选最便宜的
        result = []
        seen_categories = set()
        for d in prioritized:
            cat = d.get('category', '')
            if cat not in seen_categories:
                result.append(d)
                seen_categories.add(cat)
            if len(result) >= count:
                break
        # 按价格升序补充
        if len(result) < count:
            for d in sorted(prioritized + others, key=lambda x: x.get('price', 0)):
                if d not in result:
                    result.append(d)
                    if len(result) >= count:
                        break
        return result[:count]

    elif budget_tier == 'premium':
        # L5 高阶智能：优先品类中选最贵的
        result = []
        seen_categories = set()
        for d in prioritized:
            cat = d.get('category', '')
            if cat not in seen_categories:
                result.append(d)
                seen_categories.add(cat)
            if len(result) >= count:
                break
        # 按价格降序补充
        if len(result) < count:
            for d in sorted(prioritized + others, key=lambda x: x.get('price', 0), reverse=True):
                if d not in result:
                    result.append(d)
                    if len(result) >= count:
                        break
        return result[:count]

    else:
        # L3 场景智能：优先品类中选中价位
        result = []
        seen_categories = set()
        # 每个优先品类选一个中价位设备
        for cat in priority_categories:
            cat_devices = sorted([d for d in prioritized if d.get('category') == cat], key=lambda x: x.get('price', 0))
            if cat_devices:
                mid_idx = len(cat_devices) // 2
                result.append(cat_devices[mid_idx])
                seen_categories.add(cat)
            if len(result) >= count:
                break
        # 补充其他设备
        if len(result) < count:
            remaining = sorted([d for d in others], key=lambda x: x.get('price', 0))
            for d in remaining:
                if d not in result:
                    result.append(d)
                    if len(result) >= count:
                        break
        return result[:count]


def generate_multi_plans_with_budget(user_input, budget=3000, scene_type=None):
    """【优化】生成三套方案：L1 基础智能 / L3 场景智能 / L5 高阶智能，支持预算筛选和场景差异化"""
    if not user_input or not isinstance(user_input, str) or not user_input.strip():
        return None

    devices = load_devices()
    if not devices:
        return None

    # 自动检测场景类型
    if scene_type is None:
        scene_type = detect_scene_type(user_input)

    scene_cn = SCENE_TYPE_CN.get(scene_type, '智能')

    # 根据预算筛选设备
    filtered_devices = [d for d in devices.values() if d.get('price', 0) <= budget]

    # 如果筛选后设备不足，给出警告
    warning = None
    if len(filtered_devices) < 2:
        warning = '预算过低，建议调整'

    plans = {
        'economy': {
            'name': '🌱 L1 基础智能',
            'devices': _filter_by_scene_and_budget(filtered_devices, scene_type, 'economy', 3),
            'description': f'高性价比{scene_cn}入门方案，满足基本智能需求',
            'source': 'local_ai',
            'scene_type': scene_type,
            'warning': warning
        },
        'balanced': {
            'name': '⚡ L3 场景智能',
            'devices': _filter_by_scene_and_budget(filtered_devices, scene_type, 'balanced', 5),
            'description': f'功能全面{scene_cn}方案，性价比与体验兼顾',
            'source': 'local_ai',
            'scene_type': scene_type,
            'warning': warning
        },
        'premium': {
            'name': '💎 L5 高阶智能',
            'devices': _filter_by_scene_and_budget(filtered_devices, scene_type, 'premium', 6),
            'description': f'顶级配置{scene_cn}方案，享受完整智能体验',
            'source': 'local_ai',
            'scene_type': scene_type,
            'warning': warning
        }
    }

    # 为每个方案生成 actions
    for tier in ['economy', 'balanced', 'premium']:
        plans[tier]['actions'] = _generate_actions(plans[tier]['devices'])

    return plans

def _filter_cheapest_devices(devices, count):
    """【新增】选择最便宜的N个设备，支持预算筛选"""
    if not devices:
        return []
    sorted_devices = sorted(devices, key=lambda x: x.get('price', 0))
    return sorted_devices[:count] if len(sorted_devices) >= count else sorted_devices

def _filter_expensive_devices(devices, count):
    """【新增】选择最贵的N个设备，支持预算筛选"""
    if not devices:
        return []
    sorted_devices = sorted(devices, key=lambda x: x.get('price', 0), reverse=True)
    return sorted_devices[:count] if len(sorted_devices) >= count else sorted_devices

def _filter_balanced_devices(devices, count):
    """【新增】选择均衡的N个设备（包含低价、中价、高价），支持预算筛选"""
    if not devices:
        return []
    if len(devices) <= count:
        return devices
    
    sorted_devices = sorted(devices, key=lambda x: x.get('price', 0))
    n = len(sorted_devices)
    
    # 分散选择：最低价、 中间价、最高价
    selected = []
    indices = set()
    
    # 选择最便宜的
    indices.add(0)
    # 选择最贵的
    indices.add(n - 1)
    # 如果需要更多，选择中间的
    if count > 2:
        mid = n // 2
        indices.add(mid)
    if count > 3:
        indices.add(n // 4)
    
    # 填充到count个
    for idx in sorted(indices)[:count]:
        if len(selected) < count:
            selected.append(sorted_devices[idx])
    
    return selected

def _generate_actions(devices):
    """根据设备类别生成动作描述"""
    # 中文 category → 英文标准化映射
    CATEGORY_CN_TO_EN = {
        '照明': 'lighting', '窗帘': 'curtain', '插座': 'socket', '开关': 'switch',
        '网关': 'gateway', '音箱': 'speaker', '空调': 'aircon', '传感器': 'sensor',
        '摄像头': 'camera', '环境': 'environment', '门锁': 'lock', '电视': 'tv',
        '家电': 'appliance',
    }
    
    action_map = {
        'lighting': ['自动调节灯光亮度', '根据时间切换色温', '语音控制开关'],
        'curtain': ['定时开关窗帘', '根据光线自动开合', '语音控制'],
        'socket': ['远程控制电源', '定时断电', '电量统计'],
        'switch': ['APP控制开关', '语音控制', '定时开关'],
        'gateway': ['设备联动控制', '场景自动化', '远程控制中枢'],
        'speaker': ['语音助手控制', '音乐播放', '智能家居语音联动'],
        'aircon': ['远程控制空调', '定时开关', '温度自动调节'],
        'sensor': ['智能感应触发', '场景联动', '实时状态监测'],
        'camera': ['远程监控', '移动侦测', '双向语音'],
        'environment': ['智能恒湿', '定时开关', '空气质量监测'],
    }
    
    actions = []
    used_categories = set()
    
    for device in devices:
        raw_cat = device.get('category', '')
        category = CATEGORY_CN_TO_EN.get(raw_cat, raw_cat.lower() if isinstance(raw_cat, str) else '')
        if category in action_map and category not in used_categories:
            actions.append(random.choice(action_map[category]))
            used_categories.add(category)
    
    if not actions:
        actions = [
            "根据您的需求分析，建议配置智能灯光控制",
            "设置定时任务实现自动化控制",
            "通过米家APP配置场景联动"
        ]
    
    return actions