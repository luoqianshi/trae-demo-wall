from .rule_engine import match_by_rules, load_rules, load_devices
from .local_ai import match_by_local_ai, generate_multi_plans_with_budget, detect_scene_type, SCENE_TYPE_CN
from .ai_providers import get_ai_provider, DEFAULT_CONFIGS, PROVIDER_INFO
import os
import sys

# 项目根目录
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ============================================
# 1.1 综合排序算法 - 多因子加权
# ============================================

# 中文 category → 英文标准化映射（device_library.json 中 category 是中文）
CATEGORY_CN_TO_EN = {
    '照明': 'lighting',
    '窗帘': 'curtain',
    '插座': 'socket',
    '开关': 'switch',
    '网关': 'gateway',
    '音箱': 'speaker',
    '空调': 'aircon',
    '传感器': 'sensor',
    '摄像头': 'camera',
    '环境': 'environment',
    '门锁': 'lock',
    '电视': 'tv',
    '家电': 'appliance',
}

def _normalize_category(device):
    """将设备的中文 category 标准化为英文枚举"""
    cat = device.get('category', '')
    return CATEGORY_CN_TO_EN.get(cat, cat.lower() if isinstance(cat, str) else '')

# 设备热度模拟数据（按 type 字段匹配，与 device_library.json 的 type 一致）
DEVICE_POPULARITY = {
    'xiaomi_light': 95,
    'xiaomi_plug': 90,
    'xiaomi_switch': 75,
    'xiaomi_speaker': 88,
    'xiaomi_motion': 65,
    'xiaomi_door': 55,
    'xiaomi_camera': 70,
    'xiaomi_curtain': 60,
    'xiaomi_aircon': 68,
    'xiaomi_gateway': 50,
    'xiaomi_humidifier': 40,
    'xiaomi_purifier': 35
}

# 场景关键词权重（用于计算场景匹配度）
SCENE_KEYWORDS = {
    '客厅': ['客厅', '沙发', '电视', '影院', '观影', '会客'],
    '卧室': ['卧室', '睡觉', '起床', '起夜', '睡眠', '床头'],
    '厨房': ['厨房', '做饭', '烹饪', '油烟'],
    '卫生间': ['卫生间', '洗澡', '浴室', '马桶'],
    '阳台': ['阳台', '晾衣', '晒太阳'],
    '玄关': ['玄关', '进门', '门口', '入户'],
    '全屋': ['全屋', '全家', '整套', '所有房间', '全部']
}

# 品类定义（英文枚举）
CATEGORIES = ['lighting', 'curtain', 'socket', 'switch', 'sensor', 'speaker', 'aircon', 'camera', 'gateway', 'environment']


def calculate_rank_score(device, user_input, budget, all_devices=None):
    """
    计算设备综合排序得分
    因子权重：
    - 场景匹配度：40%
    - 价格匹配度：25%
    - 品类覆盖率：20%
    - 用户热度：15%
    """
    device_id = device.get('id', '')
    device_type = device.get('type', '')
    device_category = _normalize_category(device)
    device_price = device.get('price', 0)
    
    # --- 1. 场景匹配度（40%）---
    scene_score = 0.0
    for scene, keywords in SCENE_KEYWORDS.items():
        for kw in keywords:
            if kw in user_input:
                if scene == '客厅' and device_category in ['lighting', 'speaker', 'curtain', 'camera']:
                    scene_score += 1.0
                elif scene == '卧室' and device_category in ['lighting', 'curtain', 'sensor', 'environment']:
                    scene_score += 1.0
                elif scene == '厨房' and device_category in ['socket', 'sensor']:
                    scene_score += 1.0
                elif scene == '卫生间' and device_category in ['sensor', 'lighting']:
                    scene_score += 1.0
                elif scene == '全屋' and device_category in ['gateway', 'socket', 'switch']:
                    scene_score += 1.0
                else:
                    scene_score += 0.3  # 弱相关
    scene_score = min(scene_score / 3.0, 1.0)
    
    # --- 2. 价格匹配度（25%）---
    if budget <= 0:
        price_score = 0.5
    else:
        median_budget = budget * 0.6
        if device_price <= budget:
            ratio = device_price / median_budget
            if ratio <= 1:
                price_score = ratio
            else:
                price_score = max(0, 1 - (ratio - 1) * 0.5)
        else:
            price_score = max(0, 1 - (device_price - budget) / budget * 2)
    price_score = max(0, min(1, price_score))
    
    # --- 3. 品类覆盖率（20%）---
    if all_devices:
        categories_in_plan = set(_normalize_category(d) for d in all_devices)
        category_count = sum(1 for d in all_devices if _normalize_category(d) == device_category)
        if category_count == 1:
            category_score = 0.8
        else:
            category_score = 0.4
        # 品类多样性奖励
        diversity_bonus = min(len(categories_in_plan) / len(CATEGORIES), 1.0) * 0.2
        category_score = min(category_score + diversity_bonus, 1.0)
    else:
        category_score = 0.5
    
    # --- 4. 用户热度（15%）--- 使用 type 字段匹配
    popularity = DEVICE_POPULARITY.get(device_type, 50)
    popularity_score = popularity / 100.0
    
    # --- 综合加权 ---
    total_score = (
        scene_score * 0.40 +
        price_score * 0.25 +
        category_score * 0.20 +
        popularity_score * 0.15
    )
    
    return round(total_score, 4)


def get_device_rank_label(rank_index, score):
    """根据排序位置和得分返回标签"""
    if rank_index == 0 and score > 0.7:
        return ("🏆 最佳匹配", "background: #fef3c7; color: #92400e;")
    elif rank_index <= 1 and score > 0.6:
        return ("👍 热门选择", "background: #dbeafe; color: #1e40af;")
    elif score > 0.5:
        return ("💡 高性价比", "background: #dcfce7; color: #166534;")
    else:
        return ("✨ 推荐", "background: #f1f5f9; color: #475569;")


# ============================================
# 1.2 关键词提取 + 未匹配兜底
# ============================================

# 关键词到设备类别的映射表
KEYWORD_CATEGORY_MAP = {
    # 空间类
    '客厅': ['lighting', 'speaker', 'curtain', 'camera'],
    '卧室': ['lighting', 'curtain', 'sensor', 'humidifier', 'speaker'],
    '厨房': ['socket', 'sensor', 'purifier'],
    '卫生间': ['sensor', 'lighting', 'humidifier'],
    '阳台': ['sensor', 'lighting'],
    '玄关': ['sensor', 'camera', 'lighting'],
    
    # 功能类
    '灯光': ['lighting', 'switch'],
    '照明': ['lighting', 'switch'],
    '灯': ['lighting'],
    '窗帘': ['curtain'],
    '空调': ['aircon'],
    '音箱': ['speaker'],
    '音响': ['speaker'],
    '音乐': ['speaker'],
    '监控': ['camera'],
    '安防': ['camera', 'sensor', 'gateway'],
    '安全': ['camera', 'sensor'],
    '传感': ['sensor'],
    '插座': ['socket'],
    '开关': ['switch'],
    '网关': ['gateway'],
    '加湿': ['humidifier'],
    '净化': ['purifier'],
    
    # 体验类
    '科技感': ['lighting', 'speaker', 'curtain', 'gateway'],
    '智能': ['gateway', 'speaker', 'sensor'],
    '舒适': ['aircon', 'humidifier', 'purifier', 'curtain'],
    '氛围': ['lighting', 'speaker', 'curtain'],
    '便捷': ['socket', 'switch', 'speaker'],
    '节能': ['socket', 'switch', 'aircon'],
    '省电': ['socket', 'aircon'],
    
    # 场景类
    '观影': ['lighting', 'curtain', 'speaker'],
    '电影': ['lighting', 'curtain', 'speaker'],
    '起夜': ['sensor', 'lighting'],
    '起床': ['curtain', 'lighting', 'speaker'],
    '离家': ['socket', 'camera', 'gateway'],
    '回家': ['lighting', 'aircon', 'sensor'],
    '睡眠': ['curtain', 'lighting', 'humidifier'],
    '做饭': ['socket', 'sensor', 'purifier']
}


def keyword_extraction(user_input):
    """
    从用户输入中提取核心关键词
    返回：关键词列表（包含设备相关关键词 + 标准场景标签：照明/安防/舒适/节能）
    """
    keywords = []

    # === 1. 原有：基于 KEYWORD_CATEGORY_MAP 的关键词匹配（保留）===
    for kw in KEYWORD_CATEGORY_MAP.keys():
        if kw in user_input:
            keywords.append(kw)

    # 如果没有匹配到任何关键词，提取高频字
    if not keywords:
        common_words = ['客厅', '卧室', '厨房', '卫生间', '阳台', '玄关',
                       '灯光', '窗帘', '空调', '音箱', '监控', '插座', '开关',
                       '智能', '舒适', '氛围', '便捷', '节能']
        for word in common_words:
            if word in user_input:
                keywords.append(word)

    # === 2. 新增：同义词映射到标准场景标签 ===
    synonym_map = {
        # → 照明
        '灯光': '照明', '亮': '照明', '暗': '照明', '色温': '照明', '调光': '照明',
        '照明': '照明', '灯泡': '照明', '灯带': '照明', '氛围灯': '照明', '护眼': '照明',
        # → 安防
        '小偷': '安防', '入侵': '安防', '门窗': '安防', '报警': '安防',
        '监控': '安防', '摄像头': '安防', '防盗': '安防', '门锁': '安防',
        '安防': '安防', '安全': '安防', '警戒': '安防', '布防': '安防', '闯入': '安防',
        # → 舒适
        '窗帘': '舒适', '空调': '舒适', '温度': '舒适', '音乐': '舒适',
        '音箱': '舒适', '舒适': '舒适', '懒': '舒适', '背景音乐': '舒适',
        '加湿': '舒适', '净化': '舒适', '恒湿': '舒适',
        # → 节能
        '电费': '节能', '省电': '节能', '插座': '节能', '待机': '节能',
        '能耗': '节能', '节能': '节能', '断电': '节能', '低碳': '节能', '环保': '节能',
    }

    scene_labels = []
    for word, label in synonym_map.items():
        if word in user_input and label not in scene_labels:
            scene_labels.append(label)

    # 合并结果（去重）
    merged = []
    seen = set()
    for kw in keywords + scene_labels:
        if kw not in seen:
            merged.append(kw)
            seen.add(kw)

    # === 3. 兜底机制：若结果为空，根据户型返回默认场景 ===
    if not merged:
        try:
            import streamlit as st
            floorplan = st.session_state.get('selected_floorplan', '')
            floorplan_defaults = {
                '一室一厅': ['照明', '安防'],
                '两室一厅': ['照明', '安防', '舒适'],
                '三室一厅': ['照明', '安防', '舒适', '节能'],
            }
            merged = floorplan_defaults.get(floorplan, ['照明', '安防'])
        except Exception:
            merged = ['照明', '安防']

    # （可选）调试输出 — 默认注释掉
    # try:
    #     import streamlit as st
    #     st.info(f"提取到的关键词：{', '.join(merged)}")
    # except Exception:
    #     pass

    return merged


EN_TO_CN_CATEGORY = {
    'lighting': '照明',
    'curtain': '窗帘',
    'socket': '插座',
    'switch': '开关',
    'gateway': '网关',
    'speaker': '音箱',
    'aircon': '空调',
    'sensor': '传感器',
    'camera': '摄像头',
    'humidifier': '环境',
    'purifier': '环境',
    'environment': '环境',
    'lock': '安防',
    'tv': '家电',
    'appliance': '家电',
}


def generate_fallback_plan(user_input, budget=3000):
    """
    未匹配到规则时的兜底方案生成
    基于关键词拆解 + 设备多样性推荐
    """
    keywords = keyword_extraction(user_input)
    
    target_categories_en = set()
    for kw in keywords:
        if kw in KEYWORD_CATEGORY_MAP:
            for cat in KEYWORD_CATEGORY_MAP[kw]:
                target_categories_en.add(cat)
    
    if not target_categories_en:
        target_categories_en = {'lighting', 'speaker', 'gateway'}
    
    target_categories_cn = set(EN_TO_CN_CATEGORY.get(c, c) for c in target_categories_en)
    
    try:
        devices_dict = load_devices()
        all_devices = list(devices_dict.values()) if devices_dict else []
    except Exception:
        all_devices = []
    
    selected_devices = []
    need_gateway = False
    
    for cat_en in target_categories_en:
        cat_cn = EN_TO_CN_CATEGORY.get(cat_en, cat_en)
        category_devices = [d for d in all_devices if d.get('category') == cat_cn]
        category_devices.sort(key=lambda x: x.get('price', 9999))
        
        if not category_devices:
            continue
        
        for dev in category_devices:
            if dev.get('gateway_required'):
                need_gateway = True
            
            current_total = sum(d.get('price', 0) for d in selected_devices)
            if current_total + dev.get('price', 0) <= budget:
                selected_devices.append(dev)
                break
    
    if need_gateway and budget >= 299:
        gateway_already_selected = any(d.get('category') == '网关' for d in selected_devices)
        if not gateway_already_selected:
            gateways = [d for d in all_devices if d.get('category') == '网关']
            gateways.sort(key=lambda x: x.get('price', 9999))
            for gw in gateways:
                current_total = sum(d.get('price', 0) for d in selected_devices)
                if current_total + gw.get('price', 0) <= budget:
                    selected_devices.append(gw)
                    break
    
    actions = []
    if 'lighting' in target_categories_en:
        actions.append("💡 智能灯根据场景自动调节亮度和色温")
    if 'curtain' in target_categories_en:
        actions.append("🪟 智能窗帘根据时间/光线自动开合")
    if 'sensor' in target_categories_en:
        actions.append("🚶 人体传感器触发灯光和安防联动")
    if 'aircon' in target_categories_en:
        actions.append("❄️ 空调自动调节到舒适温度")
    if 'speaker' in target_categories_en:
        actions.append("🔊 语音控制所有设备，解放双手")
    if 'camera' in target_categories_en:
        actions.append("📷 摄像头实时监控，移动侦测报警")
    if 'lock' in target_categories_en:
        actions.append("🔒 智能门锁指纹解锁，异常报警")
    if 'environment' in target_categories_en:
        actions.append("🌬️ 温湿度自动调节，保持舒适环境")
    if len(actions) == 0:
        actions.append("设备联动，打造智能化生活体验")
    
    for i, dev in enumerate(selected_devices):
        score = calculate_rank_score(dev, user_input, budget, selected_devices)
        selected_devices[i] = {**dev, 'rank_score': score}
    
    selected_devices.sort(key=lambda x: x.get('rank_score', 0), reverse=True)
    
    return {
        'scene_name': f"基于「{'、'.join(keywords[:3])}」的智能方案",
        'description': f"根据您提到的{'、'.join(keywords[:3])}等需求，为您推荐以下智能设备组合",
        'devices': selected_devices,
        'actions': actions,
        'source': 'keyword_fallback',
        'matched_keywords': keywords,
        'confidence': 0.6
    }


# ============================================
# 1.3 用户行为反馈闭环（接口函数）
# ============================================

def get_user_preferences(user_history=None):
    """
    根据用户历史行为获取偏好
    返回：偏好字典 { 'preferred_tier': 'balanced', 'preferred_categories': [...], 'favorite_devices': [...] }
    """
    prefs = {
        'preferred_tier': 'balanced',  # 默认 L3 场景智能
        'preferred_categories': [],
        'favorite_devices': []
    }
    
    if user_history:
        # 分析历史偏好
        # 实际项目中可以做更复杂的用户画像
        pass
    
    return prefs


def apply_preferences_to_plan(plan, preferences):
    """将用户偏好应用到方案中（调整排序权重）"""
    # 简单实现：偏好设备排序提前
    return plan


# ============================================
# 主入口函数（增强版）
# ============================================

def generate_plan_local(user_input, floorplan=None, budget_tier=None, budget=3000):
    """
    【新增】本地规则生成方案。
    匹配链路：关键词 → tags → scenes → rooms（match_by_rules 优先），
    失败则走关键词拆解兜底（generate_fallback_plan），再失败走本地 AI。
    按匹配度排序，置信度 > 60% 视为高置信度。
    返回格式：{"devices":[...], "total_price":数字, "confidence":0.85, "source":"local"}
    """
    if not user_input or not user_input.strip():
        return None

    input_stripped = user_input.strip()

    # 第一步：规则匹配（最高优先级）
    result = match_by_rules(input_stripped, budget)
    if result and result.get('devices'):
        devices = result.get('devices', [])
        for i, dev in enumerate(devices):
            score = calculate_rank_score(dev, input_stripped, budget, devices)
            devices[i] = {**dev, 'rank_score': score}
        devices.sort(key=lambda x: x.get('rank_score', 0), reverse=True)
        result['devices'] = devices
        result['source'] = 'local'
        result['confidence'] = result.get('confidence', 0.75)
        result['total_price'] = sum(d.get('price', 0) * d.get('quantity', 1) for d in devices)
        result['reason'] = f"本地规则匹配了 {len(result.get('matched_keywords', []))} 个关键词，筛选出 {len(devices)} 个设备"
        return result

    # 第二步：关键词拆解兜底
    result = generate_fallback_plan(input_stripped, budget)
    if result and result.get('devices'):
        devices = result.get('devices', [])
        for i, dev in enumerate(devices):
            score = calculate_rank_score(dev, input_stripped, budget, devices)
            devices[i] = {**dev, 'rank_score': score}
        devices.sort(key=lambda x: x.get('rank_score', 0), reverse=True)
        result['devices'] = devices
        result['source'] = 'local'
        result['total_price'] = sum(d.get('price', 0) * d.get('quantity', 1) for d in devices)
        result['reason'] = f"本地规则匹配了 {len(result.get('matched_keywords', []))} 个关键词，筛选出 {len(devices)} 个设备"
        return result

    # 第三步：本地 AI
    result = match_by_local_ai(input_stripped, budget)
    if result and result.get('devices'):
        devices = result.get('devices', [])
        for i, dev in enumerate(devices):
            score = calculate_rank_score(dev, input_stripped, budget, devices)
            devices[i] = {**dev, 'rank_score': score}
        devices.sort(key=lambda x: x.get('rank_score', 0), reverse=True)
        result['devices'] = devices
        result['source'] = 'local'
        result['confidence'] = result.get('confidence', 0.55)
        result['total_price'] = sum(d.get('price', 0) * d.get('quantity', 1) for d in devices)
        result['reason'] = f"本地 AI 模型推荐了 {len(devices)} 个设备"
        return result

    # 终极兜底
    result = generate_plan_fallback(input_stripped, budget)
    if result:
        result['source'] = 'local'
        result['total_price'] = sum(d.get('price', 0) * d.get('quantity', 1) for d in result.get('devices', []))
        result['reason'] = '本地规则未命中，使用基础设备组合'
    return result


def generate_plan(user_input, budget=3000, user_preferences=None, mode='auto', floorplan=None, budget_tier=None):
    """
    【增强版】智能路由函数，支持双模式生成：
    - mode='local': 仅调用本地规则（generate_plan_local）
    - mode='ai':    仅调用 AI（失败降级到本地）
    - mode='auto':  先调用本地规则
        * 若 confidence >= 60%，直接返回本地结果（节省 AI 成本）
        * 若 confidence < 60%，调用 AI；AI 失败则返回本地结果

    返回结果统一格式：
    {"devices":[...], "total_price":数字, "source":"local"|"ai:xxx", "confidence":0.85, "reason":"xxx"}
    """
    # 输入校验
    if not user_input or not isinstance(user_input, str):
        return None

    input_stripped = user_input.strip()
    if not input_stripped:
        return None

    # 提取关键词并存入 session_state（供推荐页展示系统理解摘要）
    try:
        import streamlit as st
        st.session_state['extracted_keywords'] = keyword_extraction(input_stripped)
    except Exception:
        pass

    # 读取 AI 开关（auto 模式下判断是否启用 AI）
    try:
        import streamlit as st
        use_ai = st.session_state.get('use_ai', False)
    except Exception:
        use_ai = False

    # ---------- local 模式 ----------
    if mode == 'local' or (mode == 'auto' and not use_ai):
        result = generate_plan_local(input_stripped, floorplan, budget_tier, budget)
        _log_generation(result, mode, budget)
        return result

    # ---------- ai 模式 ----------
    if mode == 'ai':
        ai_result = generate_plan_ai(input_stripped, floorplan, budget_tier)
        if ai_result and ai_result.get('devices'):
            devices = ai_result.get('devices', [])
            for i, dev in enumerate(devices):
                score = calculate_rank_score(dev, input_stripped, budget, devices)
                devices[i] = {**dev, 'rank_score': score}
            devices.sort(key=lambda x: x.get('rank_score', 0), reverse=True)
            ai_result['devices'] = devices
            ai_result['total_price'] = sum(d.get('price', 0) * d.get('quantity', 1) for d in devices)
            _log_generation(ai_result, mode, budget)
            return ai_result
        # AI 失败，降级到本地规则
        result = generate_plan_local(input_stripped, floorplan, budget_tier, budget)
        _log_generation(result, 'ai_fallback', budget)
        return result

    # ---------- auto 模式 ----------
    # 先调用本地规则
    local_result = generate_plan_local(input_stripped, floorplan, budget_tier, budget)
    if local_result:
        confidence = local_result.get('confidence', 0)
        # 高置信度（>= 60%）：直接返回本地结果，不调用 AI，节省成本
        if confidence >= 0.6:
            _log_generation(local_result, 'auto_local', budget)
            return local_result
        # 低置信度（< 60%）：尝试调用 AI 增强
        ai_result = generate_plan_ai(input_stripped, floorplan, budget_tier)
        if ai_result and ai_result.get('devices'):
            devices = ai_result.get('devices', [])
            for i, dev in enumerate(devices):
                score = calculate_rank_score(dev, input_stripped, budget, devices)
                devices[i] = {**dev, 'rank_score': score}
            devices.sort(key=lambda x: x.get('rank_score', 0), reverse=True)
            ai_result['devices'] = devices
            ai_result['total_price'] = sum(d.get('price', 0) * d.get('quantity', 1) for d in devices)
            _log_generation(ai_result, 'auto_ai', budget)
            return ai_result
        # AI 失败，返回本地结果（即使置信度低）
        _log_generation(local_result, 'auto_local_low', budget)
        return local_result

    # 本地也失败，终极兜底
    result = generate_plan_fallback(input_stripped, budget)
    if result:
        result['source'] = 'fallback'
        result['total_price'] = sum(d.get('price', 0) * d.get('quantity', 1) for d in result.get('devices', []))
        result['reason'] = '本地规则与 AI 均未匹配成功，使用基础设备组合'
    _log_generation(result, 'fallback', budget)
    return result


def _log_generation(result, mode, budget):
    """将生成日志写入 session_state，供推荐页展示生成摘要。"""
    try:
        import streamlit as st
        if result is None:
            st.session_state['generation_log'] = '生成失败，未获得有效方案'
            return
        source = result.get('source', 'unknown')
        devices = result.get('devices', [])
        dev_count = len(devices)
        reason = result.get('reason', '')
        matched_kw = result.get('matched_keywords', [])

        if source.startswith('ai:'):
            provider_name = source.split(':', 1)[1]
            st.session_state['generation_log'] = (
                f"🧠 AI 引擎（{provider_name}）理解您的需求，从设备库中精选了 {dev_count} 个设备。"
                f"{' 推荐理由：' + reason if reason else ''}"
            )
        elif source == 'fallback':
            st.session_state['generation_log'] = (
                f"🔄 本地规则与 AI 均未精准匹配，已为您准备基础智能设备组合（{dev_count} 个设备）。"
            )
        else:
            kw_text = '、'.join(matched_kw[:3]) if matched_kw else '智能生活'
            st.session_state['generation_log'] = (
                f"📋 本地规则匹配了 {len(matched_kw)} 个关键词（{kw_text}），筛选出 {dev_count} 个设备。"
                f"{' ' + reason if reason else ''}"
            )
        st.session_state['current_generation_mode'] = mode
    except Exception:
        pass


def generate_plan_ai(user_input, floorplan=None, budget_tier=None):
    """
    【增强】调用 AI 引擎生成方案。
    从 st.session_state 读取 ai_provider / ai_api_keys / ai_custom_configs。
    返回结果带 source（如 'ai:deepseek'）、provider、total_price、reason 字段，失败返回 None。
    """
    if not user_input or not user_input.strip():
        return None

    try:
        import streamlit as st
        provider_name = st.session_state.get('ai_provider', 'deepseek')
        api_keys = st.session_state.get('ai_api_keys', {}) or {}
        custom_configs = st.session_state.get('ai_custom_configs', {}) or {}
        max_devices = 200
        timeout = 15
    except Exception:
        return None

    api_key = api_keys.get(provider_name, '') or ''
    custom = custom_configs.get(provider_name, {}) or {}

    # 构造 provider config
    prov_config = {
        'api_key': api_key,
        'timeout': timeout,
    }
    if custom.get('api_url'):
        prov_config['api_url'] = custom['api_url']
    if custom.get('model'):
        prov_config['model'] = custom['model']

    provider = get_ai_provider(provider_name, prov_config)
    if provider is None:
        return None

    # 加载设备库
    try:
        devices_dict = load_devices()
        all_devices = list(devices_dict.values()) if devices_dict else []
    except Exception:
        all_devices = []

    if not all_devices:
        return None

    # Ollama 无需 api_key，其他 provider 需要
    if provider_name != 'ollama' and not api_key:
        return None

    try:
        result = provider.generate_plan(
            user_input=user_input.strip(),
            floorplan=floorplan or '',
            budget_tier=budget_tier or '',
            devices=all_devices[:max_devices],
        )
    except Exception:
        return None

    if not result:
        return None

    # 增强：补充 provider / total_price / reason 字段
    result['provider'] = provider_name
    result['total_price'] = sum(
        d.get('price', 0) * d.get('quantity', 1) for d in result.get('devices', [])
    )
    result['reason'] = result.get('description') or (
        f"AI 引擎 {provider_name} 根据您的需求，从 {len(all_devices)} 个设备中精选了 "
        f"{len(result.get('devices', []))} 个设备"
    )
    return result


# ============================================
# 联动规则匹配（用于推荐页展示自动化场景）
# ============================================

def _load_rule_library():
    """加载 data/rule_library.json，返回规则列表。失败返回空列表。"""
    try:
        import json
        rule_path = os.path.join(project_root, 'data', 'rule_library.json')
        with open(rule_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('rules', []) or []
    except Exception:
        return []


def _normalize_dev_id(s):
    """将设备 ID 归一化用于模糊匹配：去前缀、去分隔符、转小写。
    例如 'xiaomi_smoke_detector' → 'smokedetector'，'lock_door' → 'lockdoor'。
    """
    if not s:
        return ''
    s = str(s).lower().replace('_', '').replace('-', '').replace(' ', '')
    # 去除常见品牌前缀
    for prefix in ['xiaomi', 'aqara', 'yeelight', 'mi']:
        if s.startswith(prefix):
            s = s[len(prefix):]
            break
    return s


def _device_matches_rule_dev(device, rule_dev_id, normalized_rule_ids=None):
    """检查方案中的单个设备是否匹配规则所需设备 ID。
    匹配策略（任一命中即视为匹配）：
    1. 精确 ID 匹配
    2. 归一化后子串匹配（设备 id/type 归一化后包含规则 ID 归一化，或反之）
    3. 规则 required_device_types 与设备 category 的中文子串匹配
    """
    did = device.get('id', '')
    dtype = device.get('type', '')
    dcat = device.get('category', '')

    # 1. 精确匹配
    if did == rule_dev_id or dtype == rule_dev_id:
        return True

    # 2. 归一化子串匹配
    norm_rule = _normalize_dev_id(rule_dev_id)
    if norm_rule:
        norm_did = _normalize_dev_id(did)
        norm_dtype = _normalize_dev_id(dtype)
        if norm_rule in norm_did or norm_rule in norm_dtype:
            return True
        if norm_did and norm_did in norm_rule:
            return True

    # 3. 中文类别子串匹配（rule_dev_id 可能是英文，跳过）
    return False


def _build_device_match_index(devices):
    """预处理方案设备，返回 (设备列表, 归一化ID集合) 供批量匹配。"""
    return devices


def get_matched_scenes(devices):
    """
    【新增】扫描 devices，提取所有关联的场景名称。
    通过模糊匹配 rule_library 中规则的所需设备与方案设备，返回场景名称列表。
    """
    if not devices:
        return []

    rules = _load_rule_library()
    if not rules:
        return []

    scenes = []
    seen = set()
    for rule in rules:
        required = rule.get('devices', []) or []
        if not required:
            continue
        # 若方案包含该规则至少 1 个所需设备（模糊匹配），则视为关联场景
        matched_any = False
        for rid in required:
            for dev in devices:
                if _device_matches_rule_dev(dev, rid):
                    matched_any = True
                    break
            if matched_any:
                break
        if matched_any:
            scene_name = rule.get('scene_name', '')
            if scene_name and scene_name not in seen:
                seen.add(scene_name)
                scenes.append(scene_name)
    return scenes


def match_rules(devices, top_n=5, min_match_rate=0.3):
    """
    【新增】联动规则匹配。
    遍历 rule_library.json 中所有规则，用模糊匹配计算匹配度：
    匹配度 = 已包含的所需设备数 / 所需设备总数
    匹配度 > min_match_rate（默认 30%）的规则进入候选，按匹配度排序返回 Top N。
    每条返回结果附带 match_rate 和 matched_devices 信息。
    """
    if not devices:
        return []

    rules = _load_rule_library()
    if not rules:
        return []

    candidates = []
    for rule in rules:
        required = rule.get('devices', []) or []
        if not required:
            continue
        # 模糊匹配：检查每个所需设备是否在方案中
        matched = []
        for rid in required:
            for dev in devices:
                if _device_matches_rule_dev(dev, rid):
                    matched.append(rid)
                    break
        match_rate = len(matched) / len(required) if required else 0
        if match_rate > min_match_rate:
            candidates.append({
                'id': rule.get('id', ''),
                'name': rule.get('scene_name', rule.get('name', '')),
                'category': rule.get('category', ''),
                'icon': rule.get('icon', ''),
                'description': rule.get('description', ''),
                'trigger': rule.get('trigger', {}),
                'actions': rule.get('actions', []) or [],
                'required_devices': required,
                'matched_devices': matched,
                'match_rate': round(match_rate, 2),
                'applicable_areas': rule.get('applicable_areas', []) or [],
            })

    # 按匹配度降序，再按规则名称排序
    candidates.sort(key=lambda x: (-x['match_rate'], x['name']))
    return candidates[:top_n]


# ============================================
# 设备坐标分配（用于户型图布局展示）
# ============================================

# 户型名称 → 模板文件名映射
_FLOORPLAN_FILE_MAP = {
    '一室一厅': 'one_bedroom.json',
    '两室一厅': 'two_bedroom.json',
    '三室一厅': 'three_bedroom.json',
    '一居室': 'one_bedroom.json',
    '两居室': 'two_bedroom.json',
    '三居室': 'three_bedroom.json',
}

# 设备类别 → 推荐房间（用于未在 device_positions 中找到时的回退分配）
_CATEGORY_ROOM_MAP = {
    '网关': '客厅',
    '照明': '客厅',
    '开关': '客厅',
    '插座': '客厅',
    '窗帘': '客厅',
    '音箱': '客厅',
    '空调': '客厅',
    '摄像头': '客厅',
    '传感器': '客厅',
    '门锁': '玄关',
    '环境': '客厅',
}


def assign_device_positions(devices, floorplan_type=''):
    """
    【新增】为方案中的设备分配在户型图上的坐标。
    1. 加载对应户型模板的 device_positions 映射
    2. 优先使用模板中预定义的坐标
    3. 未找到的设备按类别匹配房间，在房间内分配位置（带随机偏移避免重叠）
    返回 dict: {device_id: {"room": "客厅", "x": 250, "y": 80, ...}}
    """
    if not devices:
        return {}

    # 加载户型模板
    template = None
    template_file = _FLOORPLAN_FILE_MAP.get(floorplan_type, 'two_bedroom.json')
    template_path = os.path.join(project_root, 'data', 'floorplan_templates', template_file)
    try:
        import json
        with open(template_path, 'r', encoding='utf-8') as f:
            template = json.load(f)
    except Exception:
        template = None

    if not template:
        return {}

    device_positions_map = template.get('device_positions', {}) or {}
    rooms = template.get('rooms', []) or []

    # 构建房间名 → 房间区域映射
    room_map = {}
    for room in rooms:
        room_map[room.get('name', '')] = room

    import random
    result = {}
    # 跟踪每个房间已分配的设备数，用于偏移
    room_device_count = {}

    for device in devices:
        if not isinstance(device, dict):
            continue
        dev_id = device.get('id', '')
        if not dev_id:
            continue

        # 1. 优先使用模板预定义坐标
        if dev_id in device_positions_map:
            pos = device_positions_map[dev_id]
            result[dev_id] = {
                'room': pos.get('room', ''),
                'x': pos.get('x', 100),
                'y': pos.get('y', 100),
                'name': device.get('name', dev_id),
                'category': device.get('category', ''),
                'price': device.get('price', 0),
                'protocol': device.get('protocol', ''),
                'emoji': device.get('emoji', ''),
            }
            continue

        # 2. 回退：按类别匹配房间
        category = device.get('category', '')
        applicable_area = device.get('applicable_area', '')

        # 尝试从 applicable_area 提取房间名
        target_room = ''
        if applicable_area:
            for room_name in room_map.keys():
                if room_name in applicable_area:
                    target_room = room_name
                    break

        # 如果 applicable_area 没匹配到，用类别映射
        if not target_room:
            target_room = _CATEGORY_ROOM_MAP.get(category, '客厅')

        # 如果目标房间不在模板中，用第一个房间
        if target_room not in room_map and rooms:
            target_room = rooms[0].get('name', '客厅')

        room_data = room_map.get(target_room, {})
        if not room_data:
            room_data = rooms[0] if rooms else {}

        # 在房间内分配位置（中心 + 偏移）
        rx = room_data.get('x', 50)
        ry = room_data.get('y', 50)
        rw = room_data.get('width', 200)
        rh = room_data.get('height', 200)

        # 随机偏移避免重叠（±20% 房间尺寸）
        count = room_device_count.get(target_room, 0)
        offset_x = random.uniform(-0.15, 0.15) * rw + (count % 3 - 1) * 30
        offset_y = random.uniform(-0.15, 0.15) * rh + (count // 3) * 30
        px = rx + rw / 2 + offset_x
        py = ry + rh / 2 + offset_y

        # 确保在房间范围内
        px = max(rx + 10, min(rx + rw - 10, px))
        py = max(ry + 10, min(ry + rh - 10, py))

        room_device_count[target_room] = count + 1

        result[dev_id] = {
            'room': target_room,
            'x': int(px),
            'y': int(py),
            'name': device.get('name', dev_id),
            'category': device.get('category', ''),
            'price': device.get('price', 0),
            'protocol': device.get('protocol', ''),
            'emoji': device.get('emoji', ''),
        }

    return result


def generate_plan_fallback(user_input='', budget=3000):
    """
    【新增】终极兜底方案。
    返回 3 个基础设备（网关×1 + 灯泡×2），标记 source: "fallback"。
    """
    try:
        devices_dict = load_devices()
        all_devices = list(devices_dict.values()) if devices_dict else []
    except Exception:
        all_devices = []

    # 找一个网关
    gateway = None
    for d in all_devices:
        if d.get('category') == '网关':
            gateway = d
            break

    # 找两个灯泡
    bulbs = [d for d in all_devices if d.get('category') == '照明'][:2]

    selected = []
    if gateway:
        selected.append(gateway)
    selected.extend(bulbs)
    # 去重
    seen = set()
    deduped = []
    for d in selected:
        did = d.get('id', '')
        if did not in seen:
            seen.add(did)
            deduped.append(d)
    selected = deduped[:3]

    if not selected:
        return None

    # 计算排序得分
    for i, dev in enumerate(selected):
        score = calculate_rank_score(dev, user_input, budget, selected)
        selected[i] = {**dev, 'rank_score': score}

    return {
        'scene_name': '基础智能方案（兜底）',
        'description': 'AI 与本地规则均未匹配成功，已为您准备基础智能设备组合',
        'devices': selected,
        'actions': ['💡 灯泡支持语音和手机远程控制', '🌐 网关统一管理所有设备'],
        'source': 'fallback',
        'matched_keywords': [],
        'confidence': 0.3,
    }


def generate_multi_plans_route(user_input, budget=3000, user_preferences=None):
    """
    【增强版】生成多方案路由
    根据预算档位（经济/平衡/高端）和场景类型（安防/照明/舒适/节能）返回差异化设备组合
    """
    if not user_input or not isinstance(user_input, str) or not user_input.strip():
        return None

    # 检测场景类型
    scene_type = detect_scene_type(user_input.strip())
    scene_cn = SCENE_TYPE_CN.get(scene_type, '智能')

    # 使用场景类型生成多方案
    plans = generate_multi_plans_with_budget(user_input.strip(), budget, scene_type=scene_type)

    if plans:
        # 为每个方案的设备计算排序得分
        for tier in ['economy', 'balanced', 'premium']:
            if tier in plans:
                devices = plans[tier].get('devices', [])
                for i, dev in enumerate(devices):
                    score = calculate_rank_score(dev, user_input, budget, devices)
                    devices[i] = {**dev, 'rank_score': score}
                # 按得分排序
                devices.sort(key=lambda x: x.get('rank_score', 0), reverse=True)
                plans[tier]['devices'] = devices
                plans[tier]['scene_type'] = scene_type
                plans[tier]['scene_type_cn'] = scene_cn

    return plans
