"""规则引擎 —— 必填三件套硬约束过滤 + 选填增强软打分

设计依据「优化标准」：
- 必填三件套（决定方案能否成立）：出发地 / 人数构成 / 时间预算
- 选填增强（决定方案是否个性化）：兴趣 / 心情 / 体力 / 预算上限 / 交通方式
"""
import random
import re
import logging

from app.models import Activity, Weather
from app.seed import SLOTS
from app.weather_service import get_real_weather

logger = logging.getLogger(__name__)

# 体力等级映射（用于按强度偏好打分）
ENERGY_LEVEL = {'虚弱': 1, '偏疲': 2, '适中': 3, '充沛': 4}


def _parse_temp(temp_str):
    """从温度字符串中提取最低温度数字，用于判断冷暖"""
    nums = re.findall(r'-?\d+', temp_str)
    if nums:
        return int(nums[0])
    return 20


def _slot_available(slot, depart_time, return_time):
    """判断该时段是否落在用户的时间预算窗口 [depart_time, return_time) 内。

    时间均为 "HH:MM" 零填充字符串，可直接字典序比较。
    """
    t = slot['time']
    return depart_time <= t < return_time


def score_activity(act, mood, energy, interests, group=None):
    """
    计算活动与用户状态的契合度分数（选填增强项均为软打分）。
    心情匹配 +3，体力匹配 +2，兴趣匹配每个 +2，人群/体力适配额外加分，加少量随机扰动。
    """
    score = 0
    if mood and mood in act.mood:
        score += 3
    if energy and energy in act.energy:
        score += 2
    for i in interests:
        if i in act.interests:
            score += 2

    # 人群构成适配（必填维度，参与个性化排序）
    if group:
        if group == '带长辈/小孩':
            # 合并选项：同时考虑亲子友好与低强度
            if '亲子' in act.interests:
                score += 2
            if act.intensity <= 2:
                score += 1.5
        if group == '情侣' and act.type in ('自然', '休闲'):
            score += 1
        if group == '朋友结伴' and act.type in ('美食', '运动'):
            score += 1
        if group == '独行' and act.type in ('人文', '休闲'):
            score += 0.5

    # 体力强度偏好：体力低则偏好低强度，体力充沛可上高强度
    if energy:
        el = ENERGY_LEVEL.get(energy, 3)
        if el <= 2 and act.intensity <= 2:
            score += 1
        if el == 4 and act.intensity >= 3:
            score += 1

    score += random.random() * 0.8
    return score


def _build_transit(prev_act, curr_act, transport):
    """生成两个相邻活动之间的交通衔接提示。

    根据前一个活动的 tip 中提及的地铁站/出口和当前活动的 tip 中的信息，
    给出"从 A 到 B"的简明衔接提示。若无法提取具体站点，则给出通用建议。
    """
    prev_loc = prev_act.get('location') or prev_act.get('name', '上一站')
    curr_loc = curr_act.get('location') or curr_act.get('name', '下一站')

    # 尝试从前一个活动的 tip 中提取地铁站
    prev_metro = _extract_metro(prev_act.get('tip', ''))
    curr_metro = _extract_metro(curr_act.get('tip', ''))

    if prev_metro and curr_metro:
        return '从 {}（{}）前往 {}（{}），约15-30分钟。'.format(
            prev_loc, prev_metro, curr_loc, curr_metro)
    elif prev_metro:
        return '从 {}（{}）出发前往 {}，建议导航前往。'.format(
            prev_loc, prev_metro, curr_loc)
    elif curr_metro:
        return '从 {} 前往 {}（{}），约15-30分钟。'.format(
            prev_loc, curr_loc, curr_metro)
    else:
        if transport == '步行':
            return '从 {} 步行前往 {}，约10-20分钟。'.format(prev_loc, curr_loc)
        elif transport == '自驾':
            return '从 {} 驾车前往 {}，约10-15分钟，注意停车位。'.format(prev_loc, curr_loc)
        else:
            return '从 {} 前往 {}，可乘公交或地铁，约20-30分钟。'.format(prev_loc, curr_loc)


def _extract_metro(tip):
    """从 tip 文本中提取地铁站信息"""
    import re
    m = re.search(r'地铁[0-9/\u4e00-\u9fff]+号线?([\u4e00-\u9fff]+站)', tip)
    if m:
        return m.group(0)
    m = re.search(r'地铁[0-9/\u4e00-\u9fff]+号线?([A-Za-z0-9\u4e00-\u9fff]+口)', tip)
    if m:
        return m.group(0)
    return None


def generate_plan(db, city, group, days, depart_time='09:00', return_time='21:00',
                  interests=None, mood=None, energy=None, budget_ceiling=None,
                  transport=None):
    """
    根据用户输入生成游玩方案。

    必填三件套：city(出发地) + group(人数构成) + days/depart_time/return_time(时间预算)
    选填增强：interests / mood / energy / budget_ceiling / transport

    流程：
    1. 硬约束过滤：城市 + 人群 + 交通方式
    2. 时间预算：按出发/返回时间裁剪可用时段
    3. 按时段分组并软打分（心情/体力/兴趣/人群）
    4. 预算感知填充：天数 × 时段，总花费不超过预算上限
    5. 汇总预算区间与总时长
    6. 附带天气信息与避坑提醒
    """
    interests = interests or []
    mood = mood or None
    energy = energy or None

    # 1. 硬约束过滤：城市 + 人群 + 交通
    all_activities = db.query(Activity).all()
    pool = [a for a in all_activities if city in a.city and group in a.groups]
    if transport:
        pool = [a for a in pool if transport in a.transport]
    # 放宽：若硬约束后池子过小，退化为仅按城市
    if len(pool) < 3:
        pool = [a for a in all_activities if city in a.city]

    # 1.5 优先使用城市专属活动：若该城市有专属活动，则移除通用活动
    city_specific = [a for a in pool if a.location and a.address and
                     a.address != '各城市中心公园' and
                     not a.address.startswith('各城市')]
    if len(city_specific) >= 3:
        pool = city_specific

    # 2. 时间预算：裁剪可用时段
    active_slots = [s for s in SLOTS if _slot_available(s, depart_time, return_time)]
    if not active_slots:
        active_slots = list(SLOTS)  # 放宽：时间窗异常时保留全部时段

    # 3. 按时段分组并打分
    by_slot = {s['key']: [] for s in active_slots}
    for act in pool:
        if act.slot not in by_slot:
            continue
        score = score_activity(act, mood, energy, interests, group)
        by_slot[act.slot].append({'act': act, 'score': score})
    for k in by_slot:
        by_slot[k].sort(key=lambda x: x['score'], reverse=True)

    # 4. 预算感知：按天数 × 时段填充，避免重复，控制总花费
    used_ids = set()
    days_plan = []
    grand_cost = 0
    for d in range(days):
        day_plan = {'day': d + 1, 'items': []}
        for s in active_slots:
            candidates = [c for c in by_slot[s['key']]
                          if c['act'].id not in used_ids]
            pick = None

            if budget_ceiling is not None:
                # 优先选预算内的高分活动
                for c in candidates:
                    if grand_cost + c['act'].cost <= budget_ceiling:
                        pick = c
                        break
                # 若高分活动都超预算，退而选最便宜的可选项（含免费）
                if not pick and candidates:
                    pick = min(candidates, key=lambda x: x['act'].cost)
            else:
                pick = candidates[0] if candidates else None

            # 回退：放宽人群/交通过滤，仅按城市 + 时段 + 未用
            if not pick:
                fallback = [a for a in all_activities
                            if city in a.city and a.slot == s['key']
                            and a.id not in used_ids]
                if fallback:
                    if budget_ceiling is not None:
                        affordable = [a for a in fallback
                                      if grand_cost + a.cost <= budget_ceiling]
                        fb = affordable[0] if affordable else min(fallback, key=lambda x: x.cost)
                    else:
                        fb = fallback[0]
                    pick = {'act': fb, 'score': 0}

            if pick:
                used_ids.add(pick['act'].id)
                grand_cost += pick['act'].cost
                day_plan['items'].append({
                    'slot': s,
                    'act': pick['act'].to_dict(),
                })
        days_plan.append(day_plan)

    # 4.5 交通衔接：在每日相邻活动间插入 transit 提示
    for dp in days_plan:
        items = dp['items']
        for i in range(1, len(items)):
            prev = items[i - 1]['act']
            curr = items[i]['act']
            items[i]['transit'] = _build_transit(prev, curr, transport)

    # 5. 汇总预算与时长
    total_min = 0
    total_cost = 0
    count = 0
    for d in days_plan:
        for item in d['items']:
            total_min += item['act']['duration']
            total_cost += item['act']['cost']
            count += 1

    budget_min = max(0, round(total_cost * 0.8))
    budget_max = round(total_cost * 1.2)

    # 6. 天气：优先真实 API，失败回退数据库模拟数据
    weather_data = get_real_weather(city, days)
    if not weather_data:
        logger.info('真实天气查询失败，回退模拟数据: %s', city)
        weather = db.query(Weather).filter_by(city=city).first()
        weather_data = weather.to_dict() if weather else {
            'text': '晴', 'temp': '20–25°C', 'icon': '☀️'}

    # 将逐日天气预报附加到每一天
    forecast = weather_data.get('forecast', [])
    for i, dp in enumerate(days_plan):
        dp['weather'] = forecast[i] if i < len(forecast) else None

    # 避坑提醒
    tips = build_tips(mood, energy, interests, city, weather_data, budget_max,
                      budget_min, group, budget_ceiling, transport)

    return {
        'days': days_plan,
        'totalMin': total_min,
        'budgetMin': budget_min,
        'budgetMax': budget_max,
        'count': count,
        'weather': weather_data,
        'tips': tips,
        # 回显输入，便于前端展示
        'input': {
            'city': city,
            'group': group,
            'days': days,
            'depart_time': depart_time,
            'return_time': return_time,
            'interests': interests,
            'mood': mood,
            'energy': energy,
            'budget_ceiling': budget_ceiling,
            'transport': transport,
            'active_slots': [s['label'] for s in active_slots],
        },
    }


def build_tips(mood, energy, interests, city, weather, budget_max, budget_min,
               group=None, budget_ceiling=None, transport=None):
    """根据天气、体力、心情、人群、预算、交通生成避坑提醒"""
    tips = []

    # 天气相关
    if weather['text'] == '小雨':
        tips.append('{}今日有小雨，记得带伞，路面湿滑慢行。'.format(city))
    temp_low = _parse_temp(weather['temp'])
    if temp_low > 24:
        tips.append('白天气温偏高（{}），多补水，避开正午暴晒。'.format(weather['temp']))
    if temp_low < 20:
        tips.append('气温偏凉（{}），带件外套，早晚温差大。'.format(weather['temp']))

    # 体力相关（选填）
    if energy in ('虚弱', '偏疲'):
        tips.append('体力有限，行程已优先安排低强度活动，中途可随时休息。')
    if energy == '充沛':
        tips.append('体力充沛，行程包含步行较多的活动，注意适时补水。')

    # 心情相关（选填）
    if mood == '低落':
        tips.append('心情低落时，自然与慢节奏活动有助于舒缓，已为你多安排绿意空间。')
    if mood == '兴奋':
        tips.append('状态在线，行程节奏较丰富，注意留出用餐与休息间隔。')

    # 人群构成相关（必填）
    if group == '带长辈/小孩':
        tips.append('已为老幼同行优选低强度、可随时歇脚的活动，注意看护小孩、备好常用药品与零食饮水。')
    if group == '独行':
        tips.append('独自出行，留意个人财物与返程交通时间。')

    # 预算上限相关（选填）
    if budget_ceiling is not None:
        if budget_max > budget_ceiling:
            tips.append('为控制在 {} 元预算内，部分高消费项目已替换为免费/低价活动。'.format(budget_ceiling))
        else:
            tips.append('本次花费约 {}–{} 元，在你的预算上限 {} 元之内。'.format(
                budget_min, budget_max, budget_ceiling))
    elif budget_max > 300:
        tips.append('本次预算约 {}–{} 元，可按需删减收费项目。'.format(budget_min, budget_max))

    # 交通方式相关（选填）
    if transport == '步行':
        tips.append('步行出行，活动已优先安排在步行可达的市区点位。')
    if transport == '自驾':
        tips.append('自驾出行，注意停车点位与限行政策，提前查好停车场。')
    if transport == '公交':
        tips.append('公交出行，留意末班车时间，返程预留充足余量。')

    # 安全提醒
    tips.append('贵重物品贴身存放，人多场所注意防扒。')
    tips.append('如遇身体不适，及时中止行程并联系家人。')

    return tips
