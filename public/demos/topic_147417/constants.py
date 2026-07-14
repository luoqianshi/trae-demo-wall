"""
统一设计系统和常量定义

集中管理所有页面共享的 emoji 映射、颜色变量、设备类型、场景标签等
"""

# ============================================
# 1. 设备类型 → Emoji 映射
# ============================================

DEVICE_TYPE_EMOJI = {
    'xiaomi_light': '💡',
    'xiaomi_curtain': '🪟',
    'xiaomi_plug': '🔌',
    'xiaomi_switch': '🔘',
    'xiaomi_gateway': '🌐',
    'xiaomi_speaker': '🔊',
    'xiaomi_aircon': '❄️',
    'xiaomi_door': '🚪',
    'xiaomi_motion': '🚶',
    'xiaomi_camera': '📷',
    'xiaomi_humidifier': '💧',
    'xiaomi_purifier': '🌬️',
    'xiaomi_yeelight_bedside': '🛏️',
    'xiaomi_yeelight_strip': '🎨',
    'xiaomi_aqara_presence': '📡',
    'xiaomi_lock': '🔒',
    'xiaomi_smoke': '🔥',
    'xiaomi_water': '💦',
    'xiaomi_temp': '🌡️',
    'xiaomi_heater': '🚿',
    'xiaomi_rack': '👕',
    'xiaomi_viomi_aircon': '❄️',
    'xiaomi_viomi_fridge': '🧊',
    'xiaomi_tv': '📺',
    'xiaomi_projector': '📽️',
    'xiaomi_aqara_curtain': '🪟',
    'xiaomi_aqara_fp1': '📡',
    'xiaomi_aqara_doorbell': '🚪',
    'xiaomi_aqara_sensor': '📡',
    'xiaomi_aqara_wall_switch': '🔘',
    'xiaomi_aqara_plug': '🔌',
    'xiaomi_aqara_cube': '🎲',
    'xiaomi_aqara_switch': '🔘',
    'xiaomi_aqara_thermostat': '🌡️',
    'xiaomi_aqara_window_opener': '🪟',
    'xiaomi_aqara_valve': '🚰',
    'xiaomi_aqara_gas_detector': '🔥',
    'xiaomi_aqara_smoke_detector': '🔥',
    'xiaomi_aqara_water_leak': '💦',
    'xiaomi_aqara_vibration': '📳',
    'xiaomi_aqara_door_window_sensor': '🚪',
    'xiaomi_aqara_motion_sensor': '🚶',
    'xiaomi_aqara_temp_humidity_sensor': '🌡️',
    'xiaomi_aqara_light_sensor': '☀️',
    'xiaomi_aqara_cube_v2': '🎲',
    'xiaomi_aqara_mini_switch': '🔘',
    'xiaomi_aqara_dual_switch': '🔘',
    'xiaomi_aqara_triple_switch': '🔘',
    'xiaomi_aqara_four_switch': '🔘',
    'xiaomi_aqara_e1_dual_switch': '🔘',
    'xiaomi_aqara_e1_triple_switch': '🔘',
    'xiaomi_aqara_e1_four_switch': '🔘',
    'xiaomi_aqara_e1_cube': '🎲',
    'xiaomi_aqara_e1_motion_sensor': '🚶',
    'xiaomi_aqara_e1_temp_humidity_sensor': '🌡️',
    'xiaomi_aqara_e1_door_window_sensor': '🚪',
    'xiaomi_aqara_e1_smoke_detector': '🔥',
    'xiaomi_aqara_e1_gas_detector': '🔥',
    'xiaomi_aqara_e1_water_leak': '💦',
    'xiaomi_aqara_e1_vibration': '📳',
    'xiaomi_aqara_e1_cube_v2': '🎲',
    'xiaomi_aqara_e1_mini_switch': '🔘',
    'xiaomi_aqara_e1_dual_switch_v2': '🔘',
    'xiaomi_aqara_e1_triple_switch_v2': '🔘',
    'xiaomi_aqara_e1_four_switch_v2': '🔘',
    'xiaomi_aqara_e1_dual_switch_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v2_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v2_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v2_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v3': '🔘',
    'xiaomi_aqara_e1_triple_switch_v3': '🔘',
    'xiaomi_aqara_e1_four_switch_v3': '🔘',
    'xiaomi_aqara_e1_dual_switch_v3_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v3_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v3_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v4': '🔘',
    'xiaomi_aqara_e1_triple_switch_v4': '🔘',
    'xiaomi_aqara_e1_four_switch_v4': '🔘',
    'xiaomi_aqara_e1_dual_switch_v4_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v4_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v4_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v5': '🔘',
    'xiaomi_aqara_e1_triple_switch_v5': '🔘',
    'xiaomi_aqara_e1_four_switch_v5': '🔘',
    'xiaomi_aqara_e1_dual_switch_v5_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v5_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v5_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v6': '🔘',
    'xiaomi_aqara_e1_triple_switch_v6': '🔘',
    'xiaomi_aqara_e1_four_switch_v6': '🔘',
    'xiaomi_aqara_e1_dual_switch_v6_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v6_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v6_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v7': '🔘',
    'xiaomi_aqara_e1_triple_switch_v7': '🔘',
    'xiaomi_aqara_e1_four_switch_v7': '🔘',
    'xiaomi_aqara_e1_dual_switch_v7_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v7_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v7_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v8': '🔘',
    'xiaomi_aqara_e1_triple_switch_v8': '🔘',
    'xiaomi_aqara_e1_four_switch_v8': '🔘',
    'xiaomi_aqara_e1_dual_switch_v8_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v8_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v8_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v9': '🔘',
    'xiaomi_aqara_e1_triple_switch_v9': '🔘',
    'xiaomi_aqara_e1_four_switch_v9': '🔘',
    'xiaomi_aqara_e1_dual_switch_v9_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v9_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v9_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v10': '🔘',
    'xiaomi_aqara_e1_triple_switch_v10': '🔘',
    'xiaomi_aqara_e1_four_switch_v10': '🔘',
    'xiaomi_aqara_e1_dual_switch_v10_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v10_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v10_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v11': '🔘',
    'xiaomi_aqara_e1_triple_switch_v11': '🔘',
    'xiaomi_aqara_e1_four_switch_v11': '🔘',
    'xiaomi_aqara_e1_dual_switch_v11_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v11_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v11_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v12': '🔘',
    'xiaomi_aqara_e1_triple_switch_v12': '🔘',
    'xiaomi_aqara_e1_four_switch_v12': '🔘',
    'xiaomi_aqara_e1_dual_switch_v12_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v12_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v12_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v13': '🔘',
    'xiaomi_aqara_e1_triple_switch_v13': '🔘',
    'xiaomi_aqara_e1_four_switch_v13': '🔘',
    'xiaomi_aqara_e1_dual_switch_v13_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v13_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v13_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v14': '🔘',
    'xiaomi_aqara_e1_triple_switch_v14': '🔘',
    'xiaomi_aqara_e1_four_switch_v14': '🔘',
    'xiaomi_aqara_e1_dual_switch_v14_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v14_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v14_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v15': '🔘',
    'xiaomi_aqara_e1_triple_switch_v15': '🔘',
    'xiaomi_aqara_e1_four_switch_v15': '🔘',
    'xiaomi_aqara_e1_dual_switch_v15_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v15_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v15_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v16': '🔘',
    'xiaomi_aqara_e1_triple_switch_v16': '🔘',
    'xiaomi_aqara_e1_four_switch_v16': '🔘',
    'xiaomi_aqara_e1_dual_switch_v16_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v16_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v16_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v17': '🔘',
    'xiaomi_aqara_e1_triple_switch_v17': '🔘',
    'xiaomi_aqara_e1_four_switch_v17': '🔘',
    'xiaomi_aqara_e1_dual_switch_v17_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v17_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v17_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v18': '🔘',
    'xiaomi_aqara_e1_triple_switch_v18': '🔘',
    'xiaomi_aqara_e1_four_switch_v18': '🔘',
    'xiaomi_aqara_e1_dual_switch_v18_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v18_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v18_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v19': '🔘',
    'xiaomi_aqara_e1_triple_switch_v19': '🔘',
    'xiaomi_aqara_e1_four_switch_v19': '🔘',
    'xiaomi_aqara_e1_dual_switch_v19_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v19_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v19_with_gnd': '🔘',
    'xiaomi_aqara_e1_dual_switch_v20': '🔘',
    'xiaomi_aqara_e1_triple_switch_v20': '🔘',
    'xiaomi_aqara_e1_four_switch_v20': '🔘',
    'xiaomi_aqara_e1_dual_switch_v20_with_gnd': '🔘',
    'xiaomi_aqara_e1_triple_switch_v20_with_gnd': '🔘',
    'xiaomi_aqara_e1_four_switch_v20_with_gnd': '🔘',
}

# ============================================
# 2. 类别中文名映射
# ============================================

CATEGORY_NAMES = {
    'lighting': '照明',
    'curtain': '窗帘',
    'socket': '插座',
    'switch': '开关',
    'gateway': '网关',
    'speaker': '音箱',
    'aircon': '空调',
    'sensor': '传感器',
    'camera': '摄像头',
    'lock': '安防',
    'tv': '家电',
    'appliance': '家电',
    'environment': '环境',
    'humidifier': '加湿器',
    'purifier': '净化器',
}

# ============================================
# 3. 颜色变量
# ============================================

COLORS = {
    # 主色调
    'primary': '#667eea',
    'primary_dark': '#764ba2',
    'gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    
    # 辅助色
    'success': '#22c55e',
    'success_bg': '#f0fdf4',
    'warning': '#f59e0b',
    'warning_bg': '#fef3c7',
    'danger': '#ef4444',
    'danger_bg': '#fef2f2',
    'info': '#3b82f6',
    'info_bg': '#eff6ff',
    
    # 中性色
    'bg_primary': '#f0f4f8',
    'bg_secondary': '#ffffff',
    'bg_sidebar': '#f8fafc',
    'text_primary': '#0f172a',
    'text_secondary': '#64748b',
    'text_tertiary': '#94a3b8',
    'border': '#e2e8f0',
    'border_light': '#f1f5f9',
    
    # 状态色
    'online': '#22c55e',
    'offline': '#94a3b8',
    'busy': '#f59e0b',
}

# ============================================
# 4. 场景标签
# ============================================

SCENE_TAGS = ["全部", "客厅", "卧室", "全屋", "娱乐", "安防", "生活"]

# ============================================
# 5. 热门场景预设
# ============================================

HOT_SCENES = [
    {
        'name': '观影模式',
        'description': '打造沉浸式家庭影院体验',
        'keywords': ['观影', '电影', '影院', '投影', '氛围灯'],
        'emoji': '🎬'
    },
    {
        'name': '回家模式',
        'description': '一键开启智能生活',
        'keywords': ['回家', '开门', '入户', '玄关'],
        'emoji': '🏠'
    },
    {
        'name': '睡眠模式',
        'description': '营造舒适睡眠环境',
        'keywords': ['睡眠', '睡觉', '晚安', '关灯'],
        'emoji': '😴'
    },
    {
        'name': '离家模式',
        'description': '安防监控全面开启',
        'keywords': ['离家', '出门', '外出', '安防'],
        'emoji': '🔒'
    },
    {
        'name': '起床模式',
        'description': '自然光唤醒美好一天',
        'keywords': ['起床', '早晨', '醒来', '窗帘'],
        'emoji': '🌅'
    },
    {
        'name': '聚会模式',
        'description': '灯光音乐营造派对氛围',
        'keywords': ['聚会', '派对', '朋友', '音乐'],
        'emoji': '🎉'
    },
]

# ============================================
# 6. 关键词到类别的映射
# ============================================

KEYWORD_CATEGORY_MAP = {
    '照明': ['lighting'],
    '灯': ['lighting'],
    '灯光': ['lighting'],
    '氛围': ['lighting'],
    '窗帘': ['curtain'],
    '电动窗帘': ['curtain'],
    '插座': ['socket'],
    '插排': ['socket'],
    '开关': ['switch'],
    '墙壁开关': ['switch'],
    '网关': ['gateway'],
    '音箱': ['speaker'],
    '语音': ['speaker'],
    '小爱': ['speaker'],
    '天猫精灵': ['speaker'],
    '空调': ['aircon'],
    '冷气': ['aircon'],
    '暖气': ['aircon'],
    '传感器': ['sensor'],
    '人体': ['sensor'],
    '红外': ['sensor'],
    '摄像头': ['camera'],
    '监控': ['camera'],
    '门锁': ['lock'],
    '指纹': ['lock'],
    '电视': ['tv'],
    '家电': ['appliance'],
    '加湿': ['humidifier'],
    '净化': ['purifier'],
    '环境': ['environment'],
    '温湿度': ['environment'],
}

# ============================================
# 7. 联动规则分类（图标 + 主题色）
# ============================================

RULE_CATEGORIES = {
    '灯光自动化': {'icon': '💡', 'color': '#FFD700'},
    '安防防护': {'icon': '🔒', 'color': '#FF4444'},
    '温湿控制': {'icon': '🌡️', 'color': '#4FC3F7'},
    '晨起睡眠': {'icon': '🌅', 'color': '#FF9800'},
    '影音娱乐': {'icon': '🎬', 'color': '#9C27B0'},
    '节能管理': {'icon': '🌱', 'color': '#4CAF50'},
    '关怀模式': {'icon': '❤️', 'color': '#E91E63'},
}
