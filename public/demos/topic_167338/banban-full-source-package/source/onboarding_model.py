"""
伴伴 - Onboarding 引导逻辑（UCM-8 V2.5 版）

基于 UCM-8 V2.5（用户认知与行为操作模型）规范重构：
- 4 个模块 × 30 道题目
- 每题带权重矩阵，可量化评分
- 输出 UCM8Profile + 兼容 UserModelV2

职责：
1. UCM-8 V2.5 完整 30 题题库（含选项、权重、子指标映射）
2. OnboardingDraft 草稿数据结构
3. calculate_ucm8_scores —— 从答案计算四模块评分
4. build_ucm8_profile —— 构建完整 UCM8Profile
5. build_user_model —— 兼容旧接口，转 UserModelV2
6. build_canvas_candidates —— seeds 转画布候选节点
7. get_question_bank —— 返回完整题库供 API 使用
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from banban_models import (
    UserModelV2,
    DesiredSelf,
    ActionProfile,
    WorkProfile,
    EnhancedCommunicationProfile,
    ReminderPolicy,
    ReminderRule,
    EnergyPattern,
    EnergyHour,
    Hypothesis,
    Evidence,
    UCM8Profile,
    UCMDimension,
    UCMMetric,
    InteractionStrategy,
)


# ============================================================
# UCM-8 四模块定义（V2.5 版）
# 注：保留 UCM8_DIMENSIONS 变量名以兼容旧代码，内容已更新为4模块
# ============================================================

UCM8_DIMENSIONS = [
    {
        "id": "work_cognition_action",
        "name": "工作认知与行动模式",
        "label": "工作认知与行动模式",
        "shortName": "工作模式",
        "en": "Work Cognition & Action",
        "icon": "🧠",
        "coreQuestion": "你怎么思考和推动工作",
        "description": "你在工作中怎么思考问题、怎么推动事情、什么能让你持续投入",
        "outputParams": ["cognitive_style", "motivation", "action_pattern", "planning"],
        "productModules": ["任务拆解", "AI输出格式", "提醒策略"],
    },
    {
        "id": "energy_emotion_cognitive",
        "name": "能量情绪与认知风格",
        "label": "能量情绪与认知风格",
        "shortName": "能量节奏",
        "en": "Energy, Emotion & Cognitive Style",
        "icon": "⚡",
        "coreQuestion": "你的能量从哪来、怎么消耗",
        "description": "你如何获取和消耗能量、如何应对压力和不确定性",
        "outputParams": ["focus_endurance", "recovery_style", "stress_response", "cognitive_depth"],
        "productModules": ["工作节奏建议", "恢复提醒", "压力支持"],
    },
    {
        "id": "time_environment_preference",
        "name": "时间节奏与环境偏好",
        "label": "时间节奏与环境偏好",
        "shortName": "环境偏好",
        "en": "Time Rhythm & Environment Preference",
        "icon": "⏰",
        "coreQuestion": "你在什么环境下最高效",
        "description": "你的作息节律、时间安排偏好和工作环境需求",
        "outputParams": ["morningness", "peak_time", "environment", "collaboration_style"],
        "productModules": ["日程规划", "环境建议", "协作匹配"],
    },
    {
        "id": "real_work_style",
        "name": "真实工作风格画像",
        "label": "真实工作风格画像",
        "shortName": "工作风格",
        "en": "Real Work Style Profile",
        "icon": "🎯",
        "coreQuestion": "你真实的工作方式是什么样",
        "description": "从多个角度描绘你在真实工作中的行为模式和偏好",
        "outputParams": ["output_style", "planning_habit", "work_rhythm", "team_role"],
        "productModules": ["协作建议", "成长路径", "工作方式优化"],
    },
]

DIMENSION_MAP = {d["id"]: d for d in UCM8_DIMENSIONS}

# 兼容旧维度ID到新模块ID的映射（供 _infer_interaction_strategy / build_user_model 等使用）
OLD_DIM_TO_NEW_MODULE = {
    "cognitive_mode": "work_cognition_action",
    "motivation_system": "work_cognition_action",
    "action_mode": "work_cognition_action",
    "time_rhythm": "time_environment_preference",
    "energy_model": "energy_emotion_cognitive",
    "emotional_state": "energy_emotion_cognitive",
    "env_social": "time_environment_preference",
    "ai_pref": "energy_emotion_cognitive",
}


# ============================================================
# UCM-8 30 题题库 V2.5（每题含选项权重和子指标映射）
# 4模块：工作认知与行动模式 / 能量情绪与认知风格 / 时间节奏与环境偏好 / 真实工作风格画像
# ============================================================

UCM8_QUESTIONS = [
    # === M1 工作认知与行动模式 (Q1-Q8) ===
    {
        "id": "Q1",
        "module": "work_cognition_action",
        "dimension": "work_cognition_action",  # 兼容旧字段，值与 module 相同
        "submetric": "cognitive_style",
        "type": "single",
        "question": "周一上午，你接手了一个之前没做过的新项目。你最自然的第一步是？",
        "options": [
            {"id": "A", "text": "先搭个整体框架——把任务拆成几块，理清楚先后顺序和依赖关系", "weights": {"structured": 90, "planning": 60}},
            {"id": "B", "text": "先找关键点——想清楚决定成败的 2-3 件事是什么", "weights": {"analytical": 85, "focus": 60}},
            {"id": "C", "text": "先收集信息——看看别人怎么做的、有什么资料可以参考", "weights": {"exploration": 85, "analytical": 50}},
            {"id": "D", "text": "先动手试试——做个最小版本出来，有反馈再调整", "weights": {"practice": 90, "action": 60}},
        ],
    },
    {
        "id": "Q2",
        "module": "work_cognition_action",
        "dimension": "work_cognition_action",
        "submetric": "cognitive_style",
        "type": "single",
        "question": "开项目讨论会的时候，你通常是什么状态？",
        "options": [
            {"id": "A", "text": "喜欢理清思路——帮大家把混乱的讨论整理成结构", "weights": {"structured": 85, "analytical": 50}},
            {"id": "B", "text": "喜欢深挖本质——追问'为什么要做''假设是什么'", "weights": {"analytical": 90, "depth": 60}},
            {"id": "C", "text": "喜欢发散思路——经常提出新角度和可能性", "weights": {"exploration": 85, "creativity": 50}},
            {"id": "D", "text": "喜欢推进落地——把讨论收敛成下一步行动", "weights": {"action": 85, "practice": 60}},
        ],
    },
    {
        "id": "Q3",
        "module": "work_cognition_action",
        "dimension": "work_cognition_action",
        "submetric": "motivation",
        "type": "single",
        "question": "一项工作你已经做了很久，而且做得还不错。什么最能让你想继续做下去？",
        "options": [
            {"id": "A", "text": "能看到自己越来越熟练、越来越强", "weights": {"growth": 90, "mastery": 60}},
            {"id": "B", "text": "能做出真正有价值、有意义的成果", "weights": {"purpose": 85, "impact": 60}},
            {"id": "C", "text": "能达成有挑战的目标，被认可", "weights": {"achievement": 90, "recognition": 50}},
            {"id": "D", "text": "有足够的自主权，可以按自己的方式来", "weights": {"autonomy": 85, "freedom": 60}},
        ],
    },
    {
        "id": "Q4",
        "module": "work_cognition_action",
        "dimension": "work_cognition_action",
        "submetric": "action_pattern",
        "type": "single",
        "question": "遇到一件你不太想做但又必须做的工作，你通常怎么搞定它？",
        "options": [
            {"id": "A", "text": "先列个计划，拆成小步骤，按部就班来", "weights": {"structured": 85, "planning": 70}},
            {"id": "B", "text": "先做最简单的第一步，开了头就容易继续了", "weights": {"initiation": 80, "action": 60}},
            {"id": "C", "text": "等到截止日前几天，压力来了自然就做了", "weights": {"pressure_driven": 85, "last_minute": 60}},
            {"id": "D", "text": "得先想清楚这件事的意义，不然很难启动", "weights": {"purpose_driven": 85, "meaning": 60}},
        ],
    },
    {
        "id": "Q5",
        "module": "work_cognition_action",
        "dimension": "work_cognition_action",
        "submetric": "action_pattern",
        "type": "multiple",
        "maxSelections": 3,
        "question": "下面哪些情况最容易让你在工作中卡住、停滞不前？（选最有感觉的 3 个）",
        "options": [
            {"id": "A", "text": "目标太大太模糊，不知道从哪下手", "weights": {"unclear_goal": 80}},
            {"id": "B", "text": "信息不够，心里没底，不敢轻举妄动", "weights": {"information_gap": 75}},
            {"id": "C", "text": "频繁被打断，刚进入状态又被拉走", "weights": {"interruption": 80}},
            {"id": "D", "text": "觉得这件事没意义，提不起劲", "weights": {"low_motivation": 85}},
            {"id": "E", "text": "方向老是变，刚做好的又要改", "weights": {"instability": 75}},
            {"id": "F", "text": "怕做不好，反复纠结细节", "weights": {"perfectionism": 80}},
        ],
    },
    {
        "id": "Q6",
        "module": "work_cognition_action",
        "dimension": "work_cognition_action",
        "submetric": "action_pattern",
        "type": "single",
        "question": "做一项重要工作时，你怎么判断'可以了，到此为止'？",
        "options": [
            {"id": "A", "text": "达到了之前说好的完成标准", "weights": {"structured": 85, "closure": 60}},
            {"id": "B", "text": "核心问题解决了，剩下的可以后续再优化", "weights": {"practical": 80, "prioritization": 65}},
            {"id": "C", "text": "差不多了，再投入下去收益不大", "weights": {"efficient": 80, "cost_benefit": 60}},
            {"id": "D", "text": "很难停下来，总觉得还可以更好", "weights": {"perfectionism": 90, "high_standard": 60}},
        ],
    },
    {
        "id": "Q7",
        "module": "work_cognition_action",
        "dimension": "work_cognition_action",
        "submetric": "planning",
        "type": "single",
        "question": "正常情况下，你一天能集中精力搞定几件重要的事？",
        "options": [
            {"id": "A", "text": "1-2 件，多了就质量下降", "weights": {"deep_work": 85, "focus": 70}},
            {"id": "B", "text": "3-4 件，穿插着来没问题", "weights": {"multitask": 75, "flexibility": 60}},
            {"id": "C", "text": "5 件以上，我擅长处理很多碎事", "weights": {"task_switching": 80, "efficiency": 65}},
            {"id": "D", "text": "不一定，看当天状态和事情难度", "weights": {"variable": 80, "adaptive": 50}},
        ],
    },
    {
        "id": "Q8",
        "module": "work_cognition_action",
        "dimension": "work_cognition_action",
        "submetric": "planning",
        "type": "single",
        "question": "如果要你估计一项工作需要多长时间，你通常？",
        "options": [
            {"id": "A", "text": "估得比较准，偏差不大", "weights": {"accurate_estimation": 85, "planning": 70}},
            {"id": "B", "text": "经常低估，实际花的时间更多", "weights": {"underestimation": 80, "optimism_bias": 50}},
            {"id": "C", "text": "会故意多估一点，留缓冲", "weights": {"buffer_planning": 80, "risk_averse": 55}},
            {"id": "D", "text": "很少估，做到哪算哪", "weights": {"spontaneous": 80, "flexible": 50}},
        ],
    },

    # === M2 能量情绪与认知风格 (Q9-Q16) ===
    {
        "id": "Q9",
        "module": "energy_emotion_cognitive",
        "dimension": "energy_emotion_cognitive",
        "submetric": "focus_endurance",
        "type": "single",
        "question": "事情清楚、环境也不吵的时候，你一次能沉浸在里面多久不觉得累？",
        "options": [
            {"id": "A", "text": "半小时左右，需要经常换换脑子", "weights": {"short_focus": 80, "variety": 60}},
            {"id": "B", "text": "一小时左右，中间歇一歇可以继续", "weights": {"medium_focus": 75, "balanced": 55}},
            {"id": "C", "text": "两三个小时没问题，进入状态就忘了时间", "weights": {"deep_focus": 85, "flow": 70}},
            {"id": "D", "text": "大半天都可以，只要是真的感兴趣的事", "weights": {"hyperfocus": 90, "passion_driven": 65}},
        ],
    },
    {
        "id": "Q10",
        "module": "energy_emotion_cognitive",
        "dimension": "energy_emotion_cognitive",
        "submetric": "recovery_style",
        "type": "multiple",
        "maxSelections": 3,
        "question": "累了的时候，下面哪些方式真的能让你恢复精力？（选 3 个最有效的）",
        "options": [
            {"id": "A", "text": "一个人安静待着——刷点不用动脑的东西", "weights": {"solo_recovery": 85, "introvert": 60}},
            {"id": "B", "text": "运动或散步——让身体动起来", "weights": {"physical_recovery": 80, "active": 55}},
            {"id": "C", "text": "和好朋友聊聊天——吐槽或分享近况", "weights": {"social_recovery": 75, "extrovert": 50}},
            {"id": "D", "text": "睡觉或打个盹——什么都不想", "weights": {"sleep_recovery": 90, "rest": 65}},
            {"id": "E", "text": "做点自己感兴趣的事——比如爱好、创作", "weights": {"creative_recovery": 80, "intrinsic": 60}},
            {"id": "F", "text": "看剧打游戏——完全沉浸进去", "weights": {"escapism_recovery": 75, "distraction": 50}},
        ],
    },
    {
        "id": "Q11",
        "module": "energy_emotion_cognitive",
        "dimension": "energy_emotion_cognitive",
        "submetric": "stress_response",
        "type": "multiple",
        "maxSelections": 3,
        "question": "下面哪些事情最消耗你？（选 3 个最累的）",
        "options": [
            {"id": "A", "text": "长时间开会或跟人沟通", "weights": {"social_drain": 85}},
            {"id": "B", "text": "目标不清、方向老是变", "weights": {"ambiguity_drain": 80}},
            {"id": "C", "text": "频繁被打断，一件事做不完", "weights": {"interruption_drain": 85}},
            {"id": "D", "text": "重复机械、没什么技术含量的事", "weights": {"boredom_drain": 75}},
            {"id": "E", "text": "环境太吵、人太多、信息太杂", "weights": {"sensory_drain": 80}},
            {"id": "F", "text": "临近截止、时间紧压力大", "weights": {"pressure_drain": 75}},
        ],
    },
    {
        "id": "Q12",
        "module": "energy_emotion_cognitive",
        "dimension": "energy_emotion_cognitive",
        "submetric": "stress_response",
        "type": "single",
        "question": "工作中出了差错、事情没做好的时候，你第一反应通常是？",
        "options": [
            {"id": "A", "text": "赶紧分析原因，想办法补救", "weights": {"problem_solving": 85, "action_oriented": 60}},
            {"id": "B", "text": "先降低预期，调整范围，保证能交付", "weights": {"adaptive": 80, "pragmatic": 60}},
            {"id": "C", "text": "有点自责，觉得自己没做好", "weights": {"self_blame": 80, "high_standard": 55}},
            {"id": "D", "text": "先放一放，做点别的换换心情", "weights": {"avoidance": 75, "emotional_regulation": 50}},
        ],
    },
    {
        "id": "Q13",
        "module": "energy_emotion_cognitive",
        "dimension": "energy_emotion_cognitive",
        "submetric": "stress_response",
        "type": "single",
        "question": "面对不确定的情况（比如新领域、变化多的项目），你通常感觉？",
        "options": [
            {"id": "A", "text": "有点焦虑，最好先有个明确的计划和边界", "weights": {"structure_need": 85, "certainty_seeking": 65}},
            {"id": "B", "text": "可以接受，边走边看边调整", "weights": {"adaptive": 80, "flexible": 60}},
            {"id": "C", "text": "挺兴奋的，不确定意味着新机会", "weights": {"novelty_seeking": 85, "risk_taking": 60}},
            {"id": "D", "text": "容易想太多，迟迟不敢行动", "weights": {"overthinking": 80, "risk_averse": 55}},
        ],
    },
    {
        "id": "Q14",
        "module": "energy_emotion_cognitive",
        "dimension": "energy_emotion_cognitive",
        "submetric": "cognitive_depth",
        "type": "single",
        "question": "想一个问题的时候，你更习惯？",
        "options": [
            {"id": "A", "text": "往深了想——一定要搞透本质和原理", "weights": {"deep_thinking": 85, "analytical": 65}},
            {"id": "B", "text": "往宽了想——联想各种可能性和关联", "weights": {"divergent_thinking": 85, "creative": 60}},
            {"id": "C", "text": "往实了想——关注怎么做、能不能落地", "weights": {"practical_thinking": 80, "action_oriented": 60}},
            {"id": "D", "text": "边做边想——做着做着就清楚了", "weights": {"learning_by_doing": 85, "practice": 60}},
        ],
    },
    {
        "id": "Q15",
        "module": "energy_emotion_cognitive",
        "dimension": "energy_emotion_cognitive",
        "submetric": "stress_response",
        "type": "single",
        "question": "最近两周，你整体的压力状态更接近？",
        "options": [
            {"id": "A", "text": "比较轻松，基本从容", "weights": {"low_stress": 90, "balanced": 60}},
            {"id": "B", "text": "有压力，但还能 handle", "weights": {"moderate_stress": 80, "coping": 60}},
            {"id": "C", "text": "压力挺大，经常影响专注或休息", "weights": {"high_stress": 85, "overwhelmed": 55}},
            {"id": "D", "text": "压力很大，很多事都有点处理不过来", "weights": {"extreme_stress": 90, "burnout_risk": 60}},
        ],
    },
    {
        "id": "Q16",
        "module": "energy_emotion_cognitive",
        "dimension": "energy_emotion_cognitive",
        "submetric": "stress_response",
        "type": "multiple",
        "maxSelections": 3,
        "question": "当你状态不好的时候，AI 做什么最能帮到你？（选 3 个）",
        "options": [
            {"id": "A", "text": "帮我理清思路，告诉我下一步该做什么", "weights": {"structure_support": 80}},
            {"id": "B", "text": "帮我减负——把任务减少或延后", "weights": {"reduce_load": 85}},
            {"id": "C", "text": "先听我说说，理解我的感受", "weights": {"emotional_support": 75}},
            {"id": "D", "text": "给我看已经完成的进展，让我觉得没那么糟", "weights": {"progress_reminder": 70}},
            {"id": "E", "text": "给我多个选择，让我自己决定", "weights": {"autonomy_support": 70}},
            {"id": "F", "text": "解释原因和逻辑，让我心里有底", "weights": {"clarity_support": 75}},
        ],
    },

    # === M3 时间节奏与环境偏好 (Q17-Q23) ===
    {
        "id": "Q17",
        "module": "time_environment_preference",
        "dimension": "time_environment_preference",
        "submetric": "morningness",
        "type": "single",
        "question": "如果完全不用赶时间、不用上班，你通常几点会自然醒、几点会困？",
        "options": [
            {"id": "A", "text": "早睡早起型——23点前睡，7点前起", "weights": {"morning_type": 90, "early_riser": 70}},
            {"id": "B", "text": "规律作息型——23-24点睡，7-8点起", "weights": {"regular_type": 80, "balanced": 60}},
            {"id": "C", "text": "晚睡晚起型——1点后睡，9点后起", "weights": {"evening_type": 90, "night_owl": 70}},
            {"id": "D", "text": "没个准——看当天情况，波动很大", "weights": {"irregular": 80, "flexible": 50}},
        ],
    },
    {
        "id": "Q18",
        "module": "time_environment_preference",
        "dimension": "time_environment_preference",
        "submetric": "peak_time",
        "type": "single",
        "question": "你一天中效率最高的'黄金时间'通常在？",
        "options": [
            {"id": "A", "text": "上午——刚上班脑子最清楚", "weights": {"morning_peak": 85, "alert_morning": 65}},
            {"id": "B", "text": "下午——进入状态后渐入佳境", "weights": {"afternoon_peak": 75, "sustained": 55}},
            {"id": "C", "text": "晚上——安静了才能真正沉下心", "weights": {"evening_peak": 85, "night_focus": 65}},
            {"id": "D", "text": "不一定——看当天睡的怎么样、做什么事", "weights": {"variable_peak": 80, "context_dependent": 50}},
        ],
    },
    {
        "id": "Q19",
        "module": "time_environment_preference",
        "dimension": "time_environment_preference",
        "submetric": "morningness",
        "type": "single",
        "question": "你的作息和每日节奏更接近哪种？",
        "options": [
            {"id": "A", "text": "很规律——每天差不多时间睡、起、做事", "weights": {"stable_rhythm": 90, "routine": 70}},
            {"id": "B", "text": "工作日规律，周末放飞", "weights": {"weekday_rhythm": 80, "semi_regular": 60}},
            {"id": "C", "text": "随项目和事情变化，但大致有谱", "weights": {"flexible_rhythm": 75, "adaptive": 55}},
            {"id": "D", "text": "经常变，没什么固定节奏", "weights": {"chaotic_rhythm": 80, "spontaneous": 50}},
        ],
    },
    {
        "id": "Q20",
        "module": "time_environment_preference",
        "dimension": "time_environment_preference",
        "submetric": "environment",
        "type": "single",
        "question": "哪种工作安排方式最让你舒服？",
        "options": [
            {"id": "A", "text": "大段整块时间——专注做一件事，不希望被打断", "weights": {"block_time": 85, "deep_work": 70}},
            {"id": "B", "text": "几件事穿插——做累了换换，效率反而更高", "weights": {"interleaved": 75, "variety": 60}},
            {"id": "C", "text": "碎片化也 OK——随时可以开始、随时可以停下", "weights": {"fragmented": 70, "flexible": 55}},
            {"id": "D", "text": "不固定——看当天状态和事情性质", "weights": {"variable_arrangement": 75, "adaptive": 50}},
        ],
    },
    {
        "id": "Q21",
        "module": "time_environment_preference",
        "dimension": "time_environment_preference",
        "submetric": "collaboration_style",
        "type": "single",
        "question": "你理想中的协作密度是怎样的？",
        "options": [
            {"id": "A", "text": "大部分时间独立做，关键节点同步一下就行", "weights": {"low_collaboration": 85, "independent": 70}},
            {"id": "B", "text": "独立推进为主，每天或隔天碰一次", "weights": {"medium_collaboration": 80, "balanced": 60}},
            {"id": "C", "text": "经常讨论，一起决策更快", "weights": {"high_collaboration": 75, "social": 55}},
            {"id": "D", "text": "最好有明确的人来分配和推动", "weights": {"guided_collaboration": 70, "structured": 50}},
        ],
    },
    {
        "id": "Q22",
        "module": "time_environment_preference",
        "dimension": "time_environment_preference",
        "submetric": "environment",
        "type": "multiple",
        "maxSelections": 3,
        "question": "什么样的环境最能让你高效做事？（选 3 个）",
        "options": [
            {"id": "A", "text": "安静、没人打扰", "weights": {"quiet": 85}},
            {"id": "B", "text": "固定的位置、熟悉的设备", "weights": {"familiar": 75}},
            {"id": "C", "text": "目标、流程、责任都很清楚", "weights": {"clear_structure": 80}},
            {"id": "D", "text": "时间和方法都有自由度", "weights": {"autonomy": 80}},
            {"id": "E", "text": "周围有人、有氛围，不孤单", "weights": {"social_atmosphere": 70}},
            {"id": "F", "text": "有变化、有新鲜感，不容易腻", "weights": {"variety": 70}},
        ],
    },
    {
        "id": "Q23",
        "module": "time_environment_preference",
        "dimension": "time_environment_preference",
        "submetric": "environment",
        "type": "single",
        "question": "工作中被临时打断（比如消息、会议、别人找你）之后，你通常？",
        "options": [
            {"id": "A", "text": "很快就能回去继续做", "weights": {"quick_recovery": 80, "resilient": 60}},
            {"id": "B", "text": "得花几分钟重新进入状态", "weights": {"medium_recovery": 75, "context_switch": 55}},
            {"id": "C", "text": "经常就顺势去做别的事了", "weights": {"distraction_prone": 70, "tangential": 50}},
            {"id": "D", "text": "很影响节奏，一天被打断几次就废了", "weights": {"high_sensitivity": 85, "deep_worker": 65}},
        ],
    },

    # === M4 真实工作风格画像 (Q24-Q30) ===
    {
        "id": "Q24",
        "module": "real_work_style",
        "dimension": "real_work_style",
        "submetric": "output_style",
        "type": "single",
        "question": "同事找你讨论一个还没想清楚的问题，你通常的反应是？",
        "options": [
            {"id": "A", "text": "先帮他理清楚——把问题拆解、分类、列出来", "weights": {"structured": 85, "organizing": 65}},
            {"id": "B", "text": "追问核心——'最关键的问题到底是什么'", "weights": {"analytical": 85, "essentialist": 60}},
            {"id": "C", "text": "一起 brainstorm——各种可能性都聊聊", "weights": {"creative": 80, "divergent": 55}},
            {"id": "D", "text": "先试试——'要不先做个版本看看'", "weights": {"practical": 85, "action_oriented": 65}},
        ],
    },
    {
        "id": "Q25",
        "module": "real_work_style",
        "dimension": "real_work_style",
        "submetric": "output_style",
        "type": "single",
        "question": "你做出来的东西，通常是什么风格？",
        "options": [
            {"id": "A", "text": "系统完整——结构清晰、考虑周全、可以长期用", "weights": {"systematic": 85, "thorough": 65}},
            {"id": "B", "text": "深刻独到——有自己的洞见和深度，不是表面功夫", "weights": {"insightful": 85, "deep": 65}},
            {"id": "C", "text": "创意新颖——总能想到别人没想到的角度", "weights": {"creative": 85, "original": 60}},
            {"id": "D", "text": "快速实用——能用就行，快速迭代", "weights": {"pragmatic": 85, "efficient": 60}},
        ],
    },
    {
        "id": "Q26",
        "module": "real_work_style",
        "dimension": "real_work_style",
        "submetric": "planning_habit",
        "type": "single",
        "question": "你的待办清单通常长什么样？",
        "options": [
            {"id": "A", "text": "井井有条——分类、优先级、截止日都很清楚", "weights": {"highly_organized": 85, "structured": 70}},
            {"id": "B", "text": "有个大概，但经常调整和加新东西", "weights": {"semi_organized": 75, "flexible": 60}},
            {"id": "C", "text": "脑子里记着，或者只有个简单的 list", "weights": {"mental_list": 70, "lightweight": 55}},
            {"id": "D", "text": "基本不列，来了什么做什么", "weights": {"reactive": 80, "spontaneous": 55}},
        ],
    },
    {
        "id": "Q27",
        "module": "real_work_style",
        "dimension": "real_work_style",
        "submetric": "planning_habit",
        "type": "single",
        "question": "周一一上班，面对一周的工作，你通常怎么开始？",
        "options": [
            {"id": "A", "text": "先排计划——把这周要做的事理清楚、排好顺序", "weights": {"planner": 85, "proactive": 65}},
            {"id": "B", "text": "先做最重要的那件，其他的再说", "weights": {"prioritizer": 80, "focused": 65}},
            {"id": "C", "text": "先看看邮件消息，处理完紧急的再说", "weights": {"reactor": 70, "responsive": 55}},
            {"id": "D", "text": "先摸会儿鱼，慢慢进入状态", "weights": {"slow_start": 75, "gradual": 50}},
        ],
    },
    {
        "id": "Q28",
        "module": "real_work_style",
        "dimension": "real_work_style",
        "submetric": "work_rhythm",
        "type": "single",
        "question": "如果让你描述自己的工作节奏，最接近哪个？",
        "options": [
            {"id": "A", "text": "稳步推进——每天做一点，持续输出", "weights": {"steady": 85, "consistent": 70}},
            {"id": "B", "text": "弹性调整——忙的时候冲刺，闲的时候放松", "weights": {"elastic": 80, "adaptive": 60}},
            {"id": "C", "text": "deadline 战士——平时磨洋工，截止日前爆发", "weights": {"deadline_driven": 85, "pressure_powered": 65}},
            {"id": "D", "text": "一阵一阵——有灵感的时候疯狂输出，没状态的时候躺平", "weights": {"bursty": 85, "creative_cycle": 60}},
        ],
    },
    {
        "id": "Q29",
        "module": "real_work_style",
        "dimension": "real_work_style",
        "submetric": "team_role",
        "type": "single",
        "question": "团队里你通常扮演什么角色？",
        "options": [
            {"id": "A", "text": "推动者——把事情往前推，确保有结果", "weights": {"driver": 85, "action_oriented": 65}},
            {"id": "B", "text": "思考者——想清楚为什么、怎么做更对", "weights": {"thinker": 85, "analytical": 65}},
            {"id": "C", "text": "连接器——协调大家、搞气氛、拉资源", "weights": {"connector": 80, "social": 60}},
            {"id": "D", "text": "工匠——专注做好自己那块，保证质量", "weights": {"craftsman": 85, "detail_oriented": 65}},
        ],
    },
    {
        "id": "Q30",
        "module": "real_work_style",
        "dimension": "real_work_style",
        "submetric": "output_style",
        "type": "single",
        "question": "如果可以自己选，你最想做什么样的工作？",
        "options": [
            {"id": "A", "text": "有挑战、能成长——不断学新东西", "weights": {"growth": 90, "learning": 65}},
            {"id": "B", "text": "能创造、能表达——做真正属于自己的东西", "weights": {"creativity": 85, "self_expression": 65}},
            {"id": "C", "text": "有结果、有影响——做出来的事能被看见", "weights": {"impact": 85, "recognition": 60}},
            {"id": "D", "text": "自由、自主——自己安排时间和方式", "weights": {"autonomy": 90, "freedom": 65}},
        ],
    },
]

QUESTION_MAP = {q["id"]: q for q in UCM8_QUESTIONS}


# ============================================================
# OnboardingDraft 数据结构（UCM-8 版）
# ============================================================

@dataclass
class OnboardingDraft:
    """
    Onboarding 引导过程中收集的用户草稿数据（UCM-8 V2.5 版）。

    以题ID为key存储答案：
    - 单选题："A" / "B" 等选项ID
    - 多选题：["A", "B", "C"] 选项ID列表
    """
    answers: dict = field(default_factory=dict)  # {question_id: answer_value}
    current_step: int = 0
    completed: bool = False
    skipped: bool = False

    # 兼容旧字段（供已有代码过渡使用）
    industry: str = ""
    seeds: list = field(default_factory=list)
    focus: str = ""

    def to_dict(self) -> dict:
        return {
            "answers": self.answers,
            "currentStep": self.current_step,
            "completed": self.completed,
            "skipped": self.skipped,
            "industry": self.industry,
            "seeds": self.seeds,
            "focus": self.focus,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "OnboardingDraft":
        return cls(
            answers=data.get("answers", {}),
            current_step=data.get("currentStep", data.get("current_step", 0)),
            completed=data.get("completed", False),
            skipped=data.get("skipped", False),
            industry=data.get("industry", ""),
            seeds=data.get("seeds", []),
            focus=data.get("focus", ""),
        )

    def get_answer(self, question_id: str):
        """获取某题的答案"""
        return self.answers.get(question_id)

    def set_answer(self, question_id: str, answer):
        """设置某题的答案"""
        self.answers[question_id] = answer


# ============================================================
# 评分计算
# ============================================================

def _ensure_submetric(dim_data: dict, submetric: str):
    """确保子指标存在于结果中（动态新增，支持V2.5细粒度权重）"""
    if submetric not in dim_data["submetrics"]:
        dim_data["submetrics"][submetric] = {
            "score": 50.0,
            "confidence": 0.0,
            "weighted_sum": 0.0,
            "weight_total": 0.0,
        }


def calculate_ucm8_scores(draft: OnboardingDraft) -> dict:
    """
    根据 onboarding 答案计算 UCM-8 模块评分（V2.5 四模块版）。

    算法：
    1. 遍历每道题，根据选项权重累加到对应子指标
    2. 子指标动态发现：不仅限于 outputParams，weights 中出现的子指标都会被追踪
    3. 每个子指标取加权平均（单选题全量计入，多选题按 maxSelections 归一化）
    4. 模块综合评分 = 各子指标平均分
    5. 置信度 = 已答题数 / 该模块总题数

    返回: {
        module_id: {
            overallScore: 0-100,
            confidence: 0-1,
            submetrics: { submetric_id: {score, confidence} },
            answeredQuestions: [...],
        }
    }
    """
    # 初始化各模块
    result = {}
    for dim in UCM8_DIMENSIONS:
        dim_id = dim["id"]
        result[dim_id] = {
            "overallScore": 0.0,
            "confidence": 0.0,
            "submetrics": {},
            "answeredQuestions": [],
            "totalQuestions": 0,
            "score_sum": 0.0,
            "score_count": 0,
        }
        # 预初始化 outputParams 中的核心子指标
        for param in dim["outputParams"]:
            result[dim_id]["submetrics"][param] = {
                "score": 50.0,
                "confidence": 0.0,
                "weighted_sum": 0.0,
                "weight_total": 0.0,
            }

    # 遍历所有题
    for q in UCM8_QUESTIONS:
        qid = q["id"]
        dim_id = q["dimension"]  # 兼容字段，值与 module 相同
        answer = draft.get_answer(qid)

        if dim_id not in result:
            continue

        result[dim_id]["totalQuestions"] += 1

        if answer is None:
            continue

        result[dim_id]["answeredQuestions"].append(qid)

        is_single = q["type"] == "single"
        max_sel = q.get("maxSelections", 1)

        if is_single:
            # 单选题：直接取该选项权重（权重值本身就是0-100的分数）
            selected_option = next((o for o in q["options"] if o["id"] == answer), None)
            if selected_option:
                weights = selected_option.get("weights", {})
                for submetric, weight in weights.items():
                    _ensure_submetric(result[dim_id], submetric)
                    sm = result[dim_id]["submetrics"][submetric]
                    sm["weighted_sum"] += weight  # weight 本身就是 0-100 的分数
                    sm["weight_total"] += 1.0    # 每题贡献 1 份权重
        else:
            # 多选题：每个选中选项贡献权重，按 maxSelections 归一化
            if isinstance(answer, list) and len(answer) > 0:
                sel_count = min(len(answer), max_sel)
                weight_fraction = 1.0 / max_sel  # 每个选项占 1/maxSelections 的权重
                for opt_id in answer[:sel_count]:
                    selected_option = next((o for o in q["options"] if o["id"] == opt_id), None)
                    if selected_option:
                        weights = selected_option.get("weights", {})
                        for submetric, weight in weights.items():
                            _ensure_submetric(result[dim_id], submetric)
                            sm = result[dim_id]["submetrics"][submetric]
                            sm["weighted_sum"] += weight * weight_fraction
                            sm["weight_total"] += weight_fraction

    # 计算各子指标得分和置信度
    for dim_id, dim_data in result.items():
        dim_score_sum = 0.0
        dim_score_count = 0

        for submetric_id, sm in dim_data["submetrics"].items():
            if sm["weight_total"] > 0:
                sm["score"] = min(100.0, max(0.0, sm["weighted_sum"] / sm["weight_total"]))
                # 置信度基于答题贡献量，满置信阈值 3 份权重
                sm["confidence"] = min(1.0, sm["weight_total"] / 3.0)
            else:
                sm["score"] = 50.0
                sm["confidence"] = 0.0

            dim_score_sum += sm["score"]
            dim_score_count += 1

            # 清理临时字段
            if "weighted_sum" in sm:
                del sm["weighted_sum"]
            if "weight_total" in sm:
                del sm["weight_total"]

        # 模块综合评分
        if dim_score_count > 0:
            dim_data["overallScore"] = round(dim_score_sum / dim_score_count, 1)

        # 模块置信度 = 已答题数 / 总题数
        if dim_data["totalQuestions"] > 0:
            dim_data["confidence"] = round(
                len(dim_data["answeredQuestions"]) / dim_data["totalQuestions"], 2
            )

        # 清理临时字段
        del dim_data["score_sum"]
        del dim_data["score_count"]

    return result


# ============================================================
# 构建 UCM8Profile
# ============================================================

def build_ucm8_profile(draft: OnboardingDraft) -> UCM8Profile:
    """
    从 OnboardingDraft 构建完整的 UCM8Profile。
    """
    scores = calculate_ucm8_scores(draft)

    dimensions = {}
    for dim_def in UCM8_DIMENSIONS:
        dim_id = dim_def["id"]
        dim_score_data = scores.get(dim_id, {})

        submetrics = {}
        for sm_id, sm_data in dim_score_data.get("submetrics", {}).items():
            submetrics[sm_id] = UCMMetric(
                score=sm_data.get("score", 50.0),
                confidence=sm_data.get("confidence", 0.0),
                evidence=[{
                    "source": "onboarding",
                    "detail": f"onboarding 问卷 {len(dim_score_data.get('answeredQuestions', []))} 题",
                    "weight": dim_score_data.get("confidence", 0.0),
                }],
                source="onboarding",
                scope="global",
            )

        dim = UCMDimension(
            dimension_id=dim_id,
            label=dim_def["label"],
            icon=dim_def["icon"],
            core_question=dim_def["coreQuestion"],
            submetrics=submetrics,
            overall_score=dim_score_data.get("overallScore", 50.0),
            confidence=dim_score_data.get("confidence", 0.0),
            interaction_effects=[],  # 可后续推断
        )
        dimensions[dim_id] = dim

    # 推断交互策略
    interaction = _infer_interaction_strategy(scores)

    profile = UCM8Profile(
        version="2.5",
        dimensions=dimensions,
        interaction_strategy=interaction,
        data_sources={"questionnaire": 0.65, "behavior": 0.25, "explicit_feedback": 0.10},
    )

    return profile


def _infer_interaction_strategy(scores: dict) -> InteractionStrategy:
    """
    根据四模块评分推断交互策略（V2.5 版）。

    映射规则：
    - response_structure ← work_cognition_action 认知风格（structured/analytical/exploration/practice）
    - initiative ← 从 planning_habit + autonomy 综合推断
    - explanation_depth ← cognitive_depth（analytical/deep_thinking 等）
    - planning_granularity ← real_work_style.planning_habit + morningness 稳定性
    - notification_policy ← initiative 推导
    - automation_authority ← 从 autonomy + structured 综合推断
    - stress_adjustment ← energy_emotion_cognitive.stress_response（压力水平）
    - tone_style ← cognitive_style + stress_response 综合
    """
    strategy = InteractionStrategy()

    # ---- 模块1：工作认知与行动模式 ----
    wca = scores.get("work_cognition_action", {})
    wca_sm = wca.get("submetrics", {})

    def _sm(sm_dict, key, default=50.0):
        return sm_dict.get(key, {}).get("score", default)

    structured = _sm(wca_sm, "structured")
    analytical = _sm(wca_sm, "analytical")
    exploration = _sm(wca_sm, "exploration")
    practice = _sm(wca_sm, "practice")
    growth = _sm(wca_sm, "growth")
    achievement = _sm(wca_sm, "achievement")
    autonomy = _sm(wca_sm, "autonomy")
    planning = _sm(wca_sm, "planning")
    perfectionism = _sm(wca_sm, "perfectionism")

    # ---- 模块2：能量情绪与认知风格 ----
    eec = scores.get("energy_emotion_cognitive", {})
    eec_sm = eec.get("submetrics", {})

    deep_focus = _sm(eec_sm, "deep_focus")
    hyperfocus = _sm(eec_sm, "hyperfocus")
    low_stress = _sm(eec_sm, "low_stress")
    high_stress = _sm(eec_sm, "high_stress")
    extreme_stress = _sm(eec_sm, "extreme_stress")
    moderate_stress = _sm(eec_sm, "moderate_stress")
    deep_thinking = _sm(eec_sm, "deep_thinking")
    problem_solving = _sm(eec_sm, "problem_solving")
    emotional_support = _sm(eec_sm, "emotional_support")
    structure_support = _sm(eec_sm, "structure_support")
    reduce_load = _sm(eec_sm, "reduce_load")
    clarity_support = _sm(eec_sm, "clarity_support")
    autonomy_support = _sm(eec_sm, "autonomy_support")

    # ---- 模块3：时间节奏与环境偏好 ----
    tep = scores.get("time_environment_preference", {})
    tep_sm = tep.get("submetrics", {})

    stable_rhythm = _sm(tep_sm, "stable_rhythm")
    morning_type = _sm(tep_sm, "morning_type")
    evening_type = _sm(tep_sm, "evening_type")
    low_collaboration = _sm(tep_sm, "low_collaboration")
    high_collaboration = _sm(tep_sm, "high_collaboration")
    block_time = _sm(tep_sm, "block_time")
    high_sensitivity = _sm(tep_sm, "high_sensitivity")

    # ---- 模块4：真实工作风格画像 ----
    rws = scores.get("real_work_style", {})
    rws_sm = rws.get("submetrics", {})

    highly_organized = _sm(rws_sm, "highly_organized")
    planner = _sm(rws_sm, "planner")
    prioritizer = _sm(rws_sm, "prioritizer")
    steady = _sm(rws_sm, "steady")
    deadline_driven = _sm(rws_sm, "deadline_driven")
    bursty = _sm(rws_sm, "bursty")
    systematic = _sm(rws_sm, "systematic")
    insightful = _sm(rws_sm, "insightful")
    creative = _sm(rws_sm, "creative")
    pragmatic = _sm(rws_sm, "pragmatic")
    driver = _sm(rws_sm, "driver")
    thinker = _sm(rws_sm, "thinker")
    craftsman = _sm(rws_sm, "craftsman")

    # === 1. response_structure 回答结构 ===
    # 从认知风格相关子指标综合判断
    cog_scores = {
        "structured": (structured + systematic + highly_organized) / 3,
        "analytical": (analytical + deep_thinking + insightful + thinker) / 4,
        "exploration": (exploration + creative) / 2,
        "practice": (practice + pragmatic) / 2,
    }
    max_cog_style = max(cog_scores, key=cog_scores.get)
    if max_cog_style == "structured":
        strategy.response_structure = "structured"
    elif max_cog_style == "exploration":
        strategy.response_structure = "exploratory"
    elif max_cog_style == "practice":
        strategy.response_structure = "action_oriented"
    else:
        strategy.response_structure = "analytical"

    # === 2. initiative 主动性 ===
    # 综合：规划习惯（主动程度）+ 自主性需求 + 成就驱动
    initiative_score = (
        planner * 0.4 + autonomy * 0.3 + achievement * 0.3
    )

    if initiative_score < 25:
        strategy.initiative = "passive"
    elif initiative_score < 50:
        strategy.initiative = "important_only"
    elif initiative_score < 75:
        strategy.initiative = "risk_aware"
    else:
        strategy.initiative = "proactive"

    # === 3. explanation_depth 解释深度 ===
    expl_depth = (analytical + deep_thinking + insightful + clarity_support) / 4
    if expl_depth < 25:
        strategy.explanation_depth = "conclusion"
    elif expl_depth < 50:
        strategy.explanation_depth = "brief"
    elif expl_depth < 75:
        strategy.explanation_depth = "balanced"
    else:
        strategy.explanation_depth = "full_transparency"

    # === 4. planning_granularity 规划粒度 ===
    plan_granularity = (
        highly_organized * 0.3 + planner * 0.3 + stable_rhythm * 0.2 + structured * 0.2
    )
    if plan_granularity > 75:
        strategy.planning_granularity = "strict_schedule"
    elif plan_granularity > 50:
        strategy.planning_granularity = "flexible_path"
    elif plan_granularity > 25:
        strategy.planning_granularity = "minimum_done"
    else:
        strategy.planning_granularity = "energy_match"

    # === 5. notification_policy 通知策略 ===
    if initiative_score < 20:
        strategy.notification_policy = "none"
    elif initiative_score < 40:
        strategy.notification_policy = "daily_digest"
    elif initiative_score < 60:
        strategy.notification_policy = "suggestive"
    elif initiative_score < 80:
        strategy.notification_policy = "risk_based"
    else:
        strategy.notification_policy = "urgent_only"

    # === 6. automation_authority 自动权限 ===
    # 综合：自主性 + 结构化程度 + 规划习惯
    auto_score = (
        autonomy * 0.35 + structured * 0.25 + highly_organized * 0.2 + planner * 0.2
    )
    if auto_score < 25:
        strategy.automation_authority = "manual"
    elif auto_score < 50:
        strategy.automation_authority = "draft_only"
    elif auto_score < 75:
        strategy.automation_authority = "low_risk_auto"
    else:
        strategy.automation_authority = "rule_based_auto"

    # === 7. stress_adjustment 压力调节 ===
    # 从压力相关子指标综合计算压力水平（0-100，越高压力越大）
    stress_level = (
        high_stress * 0.35 + extreme_stress * 0.35 + moderate_stress * 0.2 + low_stress * 0.1
    )
    # 反转 low_stress 的贡献
    stress_level = max(0, min(100, stress_level - low_stress * 0.5))

    if stress_level > 75:
        strategy.stress_adjustment = "supportive"
    elif stress_level > 55:
        strategy.stress_adjustment = "reduced_load"
    elif stress_level < 30:
        strategy.stress_adjustment = "challenge"
    else:
        strategy.stress_adjustment = "normal"

    # === 8. tone_style 语气风格 ===
    # 直接度 = 行动导向 + 成就驱动 + 结构化
    directness_score = (
        driver * 0.3 + achievement * 0.25 + structured * 0.25 + problem_solving * 0.2
    )
    # 支持需求 = 情绪支持偏好 + 压力水平
    support_need = (
        emotional_support * 0.4 + reduce_load * 0.3 + stress_level * 0.3
    )

    if directness_score > 70 and support_need < 45:
        strategy.tone_style = "direct"
    elif directness_score < 35 and support_need > 55:
        strategy.tone_style = "warm"
    elif analytical > 65 or deep_thinking > 65:
        strategy.tone_style = "analytical"
    else:
        strategy.tone_style = "balanced"

    return strategy


# ============================================================
# 兼容：build_user_model（旧接口）
# ============================================================

def build_user_model(draft: OnboardingDraft) -> UserModelV2:
    """
    兼容旧接口：从 OnboardingDraft 构建 UserModelV2。
    内部先构建 UCM8Profile，再映射到 UserModelV2 结构。

    V2.5 兼容说明：从新的4模块结构映射到旧 UserModelV2 字段。
    """
    ucm8 = build_ucm8_profile(draft)

    # ---- 理想自我 DesiredSelf ----
    desired_self = DesiredSelf(
        description=draft.focus,
        keywords=draft.seeds[:4],
    )

    # ---- 从新模块获取子指标的辅助函数 ----
    def _get_sm(module_id, sm_key, default=50.0):
        dim = ucm8.dimensions.get(module_id, UCMDimension())
        return dim.submetrics.get(sm_key, UCMMetric(score=default)).score

    # 模块1：工作认知与行动模式
    wca_id = "work_cognition_action"
    structured_v = _get_sm(wca_id, "structured")
    analytical_v = _get_sm(wca_id, "analytical")
    exploration_v = _get_sm(wca_id, "exploration")
    practice_v = _get_sm(wca_id, "practice")
    growth_v = _get_sm(wca_id, "growth")
    achievement_v = _get_sm(wca_id, "achievement")
    autonomy_v = _get_sm(wca_id, "autonomy")
    planning_v = _get_sm(wca_id, "planning")
    initiation_v = _get_sm(wca_id, "initiation")

    # 模块2：能量情绪与认知风格
    eec_id = "energy_emotion_cognitive"
    deep_focus_v = _get_sm(eec_id, "deep_focus")
    high_stress_v = _get_sm(eec_id, "high_stress")
    extreme_stress_v = _get_sm(eec_id, "extreme_stress")
    moderate_stress_v = _get_sm(eec_id, "moderate_stress")
    low_stress_v = _get_sm(eec_id, "low_stress")
    problem_solving_v = _get_sm(eec_id, "problem_solving")
    emotional_support_v = _get_sm(eec_id, "emotional_support")

    # 模块3：时间节奏与环境偏好
    tep_id = "time_environment_preference"
    morning_peak_v = _get_sm(tep_id, "morning_peak")
    evening_peak_v = _get_sm(tep_id, "evening_peak")
    stable_rhythm_v = _get_sm(tep_id, "stable_rhythm")
    low_collab_v = _get_sm(tep_id, "low_collaboration")
    high_sensitivity_v = _get_sm(tep_id, "high_sensitivity")

    # 模块4：真实工作风格画像
    rws_id = "real_work_style"
    highly_organized_v = _get_sm(rws_id, "highly_organized")
    planner_v = _get_sm(rws_id, "planner")
    steady_v = _get_sm(rws_id, "steady")
    deadline_driven_v = _get_sm(rws_id, "deadline_driven")
    driver_v = _get_sm(rws_id, "driver")
    thinker_v = _get_sm(rws_id, "thinker")

    # ---- 行动画像 ActionProfile（从新模块映射）----
    # 构造兼容用的伪维度对象
    def _fake_dim(sm_dict):
        dim = UCMDimension()
        for k, v in sm_dict.items():
            dim.submetrics[k] = UCMMetric(score=v)
        return dim

    # 模拟旧 cognitive_mode 维度
    fake_cog = _fake_dim({
        "structured": structured_v,
        "analytical": analytical_v,
        "exploration": exploration_v,
        "practice": practice_v,
    })

    # 模拟旧 action_mode 维度
    fake_action = _fake_dim({
        "planning": (planning_v + highly_organized_v + planner_v) / 3,
        "initiation": (initiation_v + practice_v) / 2,
        "adaptability": (exploration_v + autonomy_v) / 2,
        "persistence": (steady_v + growth_v) / 2,
    })

    # 模拟旧 motivation_system 维度
    fake_motivation = _fake_dim({
        "growth": growth_v,
        "achievement": achievement_v,
        "freedom": autonomy_v,
        "creation": exploration_v,
        "stability": structured_v,
    })

    # 模拟旧 emotional_state 维度
    stress_level_v = (high_stress_v * 0.4 + extreme_stress_v * 0.4 + moderate_stress_v * 0.2 - low_stress_v * 0.3)
    stress_level_v = max(0, min(100, stress_level_v))
    fake_emo = _fake_dim({
        "stress_level": stress_level_v,
        "support_preference": emotional_support_v,
        "resilience": problem_solving_v,
    })

    action_profile = ActionProfile(
        thinking_style=_h_from_ucm(fake_cog, "structured"),
        execution_style=_h_from_ucm(fake_action, "adaptability"),
        start_pattern=_h_from_ucm(fake_action, "initiation"),
        motivation_drivers=_h_from_ucm(fake_motivation, "achievement"),
        risk_patterns=_h_from_ucm(fake_action, "planning"),
        support_needs=_h_from_ucm(fake_emo, "support_preference"),
    )

    # ---- 工作画像 WorkProfile ----
    work_profile = WorkProfile(
        industry_id=draft.industry,
        workflow_stages=["research", "concept", "execute", "review", "deliver"],
    )

    # ---- 沟通画像（从新模块综合推断）----
    # 主动性：从规划习惯+自主性+成就驱动综合
    initiative_val = (planner_v * 0.4 + autonomy_v * 0.3 + achievement_v * 0.3)
    # 直接度：从行动导向+结构化+成就综合
    directness_val = (driver_v * 0.3 + structured_v * 0.25 + achievement_v * 0.25 + analytical_v * 0.2)
    # 细节度：从深度思考+分析+工匠特质综合
    detail_val = (analytical_v * 0.3 + thinker_v * 0.3 + problem_solving_v * 0.2 + deep_focus_v * 0.2)

    # 角色推断（保持旧逻辑风格）
    if initiative_val > 70:
        role = "action_coach"
    elif initiative_val > 50:
        role = "life_rhythm"
    elif initiative_val > 30:
        role = "gentle_companion"
    else:
        role = "quiet_observer"

    directness = int(max(0, min(100, directness_val)))
    detail = int(max(0, min(100, detail_val)))
    init_val = int(max(0, min(100, initiative_val)))

    communication_profile = EnhancedCommunicationProfile(
        role=role,
        warmth=max(10, min(90, 100 - directness)),
        directness=directness,
        detail=detail,
        initiative=init_val,
        rationality=int(ucm8.dimensions.get(wca_id, UCMDimension(overall_score=60)).overall_score),
        interruption_tolerance=_map_interruption(init_val),
        preferred_channels=_map_channels(init_val),
        avoid_styles=["commanding", "anxiety", "frequent_popup"],
    )

    # ---- 提醒策略 ----
    reminder_policy = ReminderPolicy(
        focus_mode=ReminderRule(level=1 if init_val > 50 else 0, channel="silent_card"),
        deviation_mode=ReminderRule(level=2 if directness > 50 else 1, channel="assistant_card"),
        low_energy_mode=ReminderRule(level=1, channel="silent_card"),
        night_mode=ReminderRule(level=0, channel="none"),
    )

    # ---- 能量规律（从新模块映射）----
    # 综合 peak_time 得分（上午型 vs 晚上型）
    peak_time_score = morning_peak_v  # 用上午峰值作为参考
    # 同时考虑晚上型，如果晚上型更高则调整
    if evening_peak_v > morning_peak_v:
        peak_time_score = evening_peak_v + 20  # 偏移到晚上区间

    # 专注时长：从深度专注+敏感程度推断
    focus_dur = (deep_focus_v + (100 - high_sensitivity_v)) / 2

    # 根据 peak_time 推导高能量时段（简化版）
    high_hours = _infer_peak_hours(peak_time_score)

    hourly = []
    energy_dim = ucm8.dimensions.get(tep_id, UCMDimension())
    for hour in range(24):
        base_energy = 0.5
        base_focus = 0.5
        if hour in high_hours:
            base_energy = 0.8
            base_focus = min(0.95, 0.5 + focus_dur / 200.0)
        hourly.append(
            EnergyHour(
                hour=hour,
                energy=base_energy,
                focus=base_focus,
                confidence=energy_dim.confidence,
            ).to_dict()
        )

    energy_pattern = EnergyPattern(timezone="Asia/Shanghai", hourly=hourly)

    # ---- 组装 ----
    user_model = UserModelV2(
        desired_self=desired_self,
        action_profile=action_profile,
        work_profile=work_profile,
        communication_profile=communication_profile,
        reminder_policy=reminder_policy,
        energy_pattern=energy_pattern,
        behavior_patterns=[],
    )

    return user_model


def _h_from_ucm(dim: UCMDimension, submetric: str) -> Hypothesis:
    """从 UCM 维度+子指标构建 Hypothesis（兼容旧接口）"""
    if not dim or submetric not in dim.submetrics:
        return Hypothesis(value=[], confidence=0.5)
    sm = dim.submetrics[submetric]
    return Hypothesis(
        value=[f"{submetric}:{int(sm.score)}"],
        confidence=sm.confidence,
        evidence=sm.evidence,
    )


def _map_interruption(initiative: int) -> str:
    """将主动性分数映射为打扰容忍度"""
    if initiative < 25:
        return "none"
    elif initiative < 45:
        return "silent_only"
    elif initiative < 65:
        return "important_only"
    else:
        return "normal"


def _map_channels(initiative: int) -> list:
    """将主动性分数映射为偏好渠道"""
    base = ["side_panel", "daily_review"]
    if initiative >= 45:
        base.append("silent_card")
    if initiative >= 65:
        base.append("assistant_card")
    if initiative >= 85:
        base.append("notification")
    return base


def _infer_peak_hours(peak_time_score: float) -> set:
    """根据 peak_time 子指标推断高能量时段（简化映射）"""
    # 默认下午
    if peak_time_score < 30:
        return set(range(14, 18))  # 下午
    elif peak_time_score < 50:
        return set(range(9, 12))  # 上午
    elif peak_time_score < 70:
        return set(range(14, 18))  # 下午
    elif peak_time_score < 85:
        return set(range(19, 23))  # 晚上
    else:
        return set([22, 23, 0, 1])  # 深夜


# ============================================================
# 画布候选节点（保持兼容）
# ============================================================

def build_canvas_candidates(draft: OnboardingDraft) -> list:
    """
    将 draft.seeds 转换为画布候选节点列表（最多 6 个）。
    保持与旧版兼容的接口。
    """
    candidates = []
    for index, seed in enumerate(draft.seeds[:6]):
        info = classify_seed(seed, draft.focus)
        candidate = {
            "id": f"onboarding_seed_{index}",
            "source": "onboarding",
            "originalText": seed,
            "proposal": {
                "title": seed,
                "kind": info["kind"],
                "commitment": info["commitment"],
                "phase": "candidate",
                "source": "onboarding",
                "confidence": info["confidence"],
                "needsConfirmation": True,
                "aiReason": info["aiReason"],
            },
            "status": "pending",
            "createdAt": _now_iso(),
        }
        candidates.append(candidate)
    return candidates


def classify_seed(seed: str, focus: str) -> dict:
    """对 seed 进行分类（保持旧版逻辑）"""
    if any(kw in seed for kw in ["每天", "每周", "习惯", "坚持"]):
        return {"kind": "habit", "commitment": "intended", "confidence": 0.68,
                "aiReason": "包含习惯/周期相关关键词，推测为习惯意向"}
    if focus and seed == focus:
        return {"kind": "goal", "commitment": "committed", "confidence": 0.88,
                "aiReason": "与用户核心关注一致，判定为已承诺目标"}
    if any(kw in seed for kw in ["整理", "完成", "做", "写", "搭", "画", "研究"]):
        return {"kind": "desire", "commitment": "interested", "confidence": 0.68,
                "aiReason": "包含行动动词，推测为具体愿望"}
    return {"kind": "inspiration", "commitment": "observed", "confidence": 0.68,
            "aiReason": "暂归类为灵感，待进一步确认"}


# ============================================================
# 工具函数
# ============================================================

def _now_iso() -> str:
    return datetime.now().isoformat()


# ============================================================
# API: 获取题库
# ============================================================

def get_question_bank() -> dict:
    """
    返回完整 UCM-8 onboarding 题库（V2.5 四模块版），供 API 消费。
    每个模块内包含其对应的 questions 列表，方便前端按模块分组展示。

    返回数据同时包含内部字段（供评分使用）和前端字段（供展示使用）：
    - 题目：question (内部) + questionText (前端)
    - 选项：id/text/weights (内部) + value/label (前端)
    - 模块：已有 name / shortName 字段
    """
    # 构建按模块分组的题目
    dim_questions = {}
    for q in UCM8_QUESTIONS:
        dim_id = q["dimension"]  # 兼容字段，值与 module 相同
        if dim_id not in dim_questions:
            dim_questions[dim_id] = []
        dim_questions[dim_id].append(q)

    # 组装带题目信息的模块列表
    dimensions_with_questions = []
    for dim in UCM8_DIMENSIONS:
        dim_copy = dict(dim)
        # 统一字段名：name 用于前端展示
        dim_copy["name"] = dim.get("name", dim.get("label", dim["id"]))
        dim_copy["shortName"] = dim.get("shortName", dim.get("label", dim["id"]))

        # 转换每道题，添加前端需要的字段，保留内部字段
        questions = dim_questions.get(dim["id"], [])
        frontend_questions = []
        for q in questions:
            q_copy = dict(q)
            # 添加前端题干字段
            q_copy["questionText"] = q["question"]

            # 转换选项：添加 value/label 字段，保留 id/text/weights
            options_with_frontend = []
            for opt in q["options"]:
                opt_copy = dict(opt)
                opt_copy["value"] = opt["id"]       # 选项值
                opt_copy["label"] = opt["text"]      # 选项文本
                # desc 和 icon 为可选字段，暂不设置
                options_with_frontend.append(opt_copy)
            q_copy["options"] = options_with_frontend

            frontend_questions.append(q_copy)

        dim_copy["questions"] = frontend_questions
        dimensions_with_questions.append(dim_copy)

    return {
        "version": "UCM-8 v2.5",
        "dimensions": dimensions_with_questions,
        "totalQuestions": len(UCM8_QUESTIONS),
    }
