# -*- coding: utf-8 -*-
"""
TimeForge X - 多智能体系统
10个AI角色 + 群聊讨论模式 + 智能流水线
"""
import json
import random
import requests
from datetime import datetime, date, timedelta

from config import Config
from database import get_db, dict_from_row, dicts_from_rows

# =============================================
# 智能体定义
# =============================================
AGENT_DEFINITIONS = {
    "time_manager": {
        "name": "time_manager",
        "display_name": "时间管理师",
        "role": "专业的时间管理专家，精通GTD、番茄工作法、时间块等方法论。擅长帮助用户合理分配时间，制定高效日程。",
        "emoji": "⏰",
        "color": "#6366F1",
        "speaking_style": "理性、结构化、善于用数据和具体时间节点说话",
    },
    "study_planner": {
        "name": "study_planner",
        "display_name": "学习规划师",
        "role": "学习路径设计专家，精通认知科学和学习方法论。根据用户目标制定科学的学习计划，拆解知识点。",
        "emoji": "📚",
        "color": "#10B981",
        "speaking_style": "系统化、由浅入深、善于将复杂知识拆解为可执行步骤",
    },
    "exam_mentor": {
        "name": "exam_mentor",
        "display_name": "考研导师",
        "role": "考研辅导专家，熟悉全国高校招生政策、考试大纲和备考策略。提供院校分析、科目规划和复习建议。",
        "emoji": "🎓",
        "color": "#F59E0B",
        "speaking_style": "严谨、权威、以数据说话，强调阶段性目标和真题训练",
    },
    "career_advisor": {
        "name": "career_advisor",
        "display_name": "职业顾问",
        "role": "职业发展规划专家，熟悉各行业发展趋势和人才需求。提供职业测评、行业分析和职业路径规划。",
        "emoji": "💼",
        "color": "#3B82F6",
        "speaking_style": "前瞻性、务实、善于发现个人优势与市场机会的匹配点",
    },
    "psych_coach": {
        "name": "psych_coach",
        "display_name": "心理教练",
        "role": "积极心理学专家，擅长动机激励、拖延症干预和压力管理。帮助用户建立健康的学习习惯和心态。",
        "emoji": "🧠",
        "color": "#EC4899",
        "speaking_style": "温暖、鼓励性、善用心理学原理给出具体可行的建议",
    },
    "efficiency_analyst": {
        "name": "efficiency_analyst",
        "display_name": "效率分析师",
        "role": "数据驱动效率专家，通过分析用户的学习数据和行为模式，发现效率瓶颈并提出优化方案。",
        "emoji": "📊",
        "color": "#8B5CF6",
        "speaking_style": "以数据为依据、可视化思维、善于发现隐藏的问题和趋势",
    },
    "project_manager": {
        "name": "project_manager",
        "display_name": "项目经理",
        "role": "项目管理专家，精通敏捷开发、WBS分解、风险管理。帮助用户将大目标分解为可管理的小任务。",
        "emoji": "📋",
        "color": "#14B8A6",
        "speaking_style": "结构化、条理清晰、关注里程碑和风险点",
    },
    "resume_advisor": {
        "name": "resume_advisor",
        "display_name": "简历顾问",
        "role": "简历优化专家，熟悉HR筛选标准和ATS系统。帮助用户打造专业、有竞争力的简历。",
        "emoji": "📝",
        "color": "#F97316",
        "speaking_style": "专业、注重细节、善于用STAR法则提炼亮点",
    },
    "interviewer": {
        "name": "interviewer",
        "display_name": "面试官",
        "role": "资深面试官，熟悉技术面、行为面和群面等各类面试流程。提供模拟面试和反馈建议。",
        "emoji": "🎤",
        "color": "#EF4444",
        "speaking_style": "犀利、直接、善于发现候选人短板并给出改进建议",
    },
    "startup_mentor": {
        "name": "startup_mentor",
        "display_name": "创业导师",
        "role": "创业指导专家，熟悉商业模式设计、融资策略和市场验证。帮助创业者从0到1构建产品。",
        "emoji": "🚀",
        "color": "#06B6D4",
        "speaking_style": "创新思维、实用主义、强调MVP和快速迭代",
    },
}

# =============================================
# 流水线模式定义
# =============================================
PIPELINE_MODES = {
    "paper": {
        "name": "论文模式",
        "icon": "📄",
        "desc": "学术论文全流程辅助",
        "phases": ["需求分析", "文献调研", "方案制定", "实验设计", "数据分析", "论文撰写", "修改润色", "最终定稿"],
        "agents": ["study_planner", "time_manager", "efficiency_analyst", "project_manager"],
    },
    "course_design": {
        "name": "课程设计模式",
        "icon": "💻",
        "desc": "课程设计项目全流程",
        "phases": ["需求分析", "系统设计", "数据库设计", "前端开发", "后端开发", "测试验证", "文档撰写", "答辩准备"],
        "agents": ["project_manager", "study_planner", "time_manager", "efficiency_analyst"],
    },
    "competition": {
        "name": "竞赛模式",
        "icon": "🏆",
        "desc": "学科竞赛备战全流程",
        "phases": ["赛题分析", "方案设计", "原型开发", "算法优化", "测试验证", "文档撰写", "答辩准备", "提交评审"],
        "agents": ["project_manager", "study_planner", "time_manager", "efficiency_analyst"],
    },
    "postgraduate": {
        "name": "考研模式",
        "icon": "🎓",
        "desc": "考研备考全流程规划",
        "phases": ["院校分析", "科目规划", "基础复习", "强化训练", "真题实战", "模拟冲刺", "查漏补缺", "考前准备"],
        "agents": ["exam_mentor", "study_planner", "time_manager", "psych_coach"],
    },
    "startup": {
        "name": "创业模式",
        "icon": "🚀",
        "desc": "创业项目全流程指导",
        "phases": ["市场调研", "商业模式", "MVP设计", "产品开发", "用户测试", "融资准备", "市场推广", "运营迭代"],
        "agents": ["startup_mentor", "project_manager", "career_advisor", "efficiency_analyst"],
    },
}

# =============================================
# 课程作业模板
# =============================================
COURSE_TEMPLATES = {
    "软件工程实验报告": {
        "tasks": ["需求分析说明书", "用例图设计", "类图设计", "时序图设计", "数据库ER图", "代码实现", "单元测试", "实验报告撰写"],
        "estimated_hours": 24,
        "difficulty": 3,
    },
    "数据库课程设计": {
        "tasks": ["需求分析", "概念结构设计(ER图)", "逻辑结构设计", "物理结构设计", "SQL建表与数据插入", "查询与视图设计", "存储过程与触发器", "前端界面开发", "测试与文档"],
        "estimated_hours": 40,
        "difficulty": 4,
    },
    "操作系统实验": {
        "tasks": ["进程管理实验", "内存管理实验", "文件系统实验", "设备管理实验", "Shell编程实验", "系统调用实验", "实验报告撰写"],
        "estimated_hours": 20,
        "difficulty": 4,
    },
    "数据结构大作业": {
        "tasks": ["问题分析", "数据结构选型", "算法设计", "代码实现", "复杂度分析", "测试用例设计", "性能对比", "文档撰写"],
        "estimated_hours": 30,
        "difficulty": 4,
    },
    "计算机网络实验": {
        "tasks": ["网络拓扑设计", "IP地址规划", "路由协议配置", "VLAN配置", "防火墙配置", "抓包分析", "实验报告"],
        "estimated_hours": 18,
        "difficulty": 3,
    },
    "编译原理课程设计": {
        "tasks": ["词法分析器", "语法分析器", "语义分析", "中间代码生成", "代码优化", "目标代码生成", "测试与文档"],
        "estimated_hours": 35,
        "difficulty": 5,
    },
}

# =============================================
# 考研科目模板
# =============================================
EXAM_SUBJECTS = {
    "数学一": {"topics": ["高等数学", "线性代数", "概率论与数理统计"], "weight": 150},
    "数学二": {"topics": ["高等数学", "线性代数"], "weight": 150},
    "数学三": {"topics": ["高等数学", "线性代数", "概率论与数理统计"], "weight": 150},
    "英语一": {"topics": ["完形填空", "阅读理解", "新题型", "翻译", "写作"], "weight": 100},
    "英语二": {"topics": ["完形填空", "阅读理解", "新题型", "翻译", "写作"], "weight": 100},
    "政治": {"topics": ["马原", "毛中特", "史纲", "思修法基", "时政"], "weight": 100},
    "408计算机": {"topics": ["数据结构", "计算机组成原理", "操作系统", "计算机网络"], "weight": 150},
}

# =============================================
# 职业岗位模板
# =============================================
CAREER_POSITIONS = {
    "前端开发工程师": {
        "skills": ["HTML/CSS", "JavaScript", "React/Vue", "TypeScript", "Webpack/Vite", "Node.js基础", "Git", "响应式设计"],
        "salary_range": "15-40K",
        "industry": "互联网/科技",
    },
    "后端开发工程师": {
        "skills": ["Java/Python/Go", "Spring Boot/Django", "MySQL/PostgreSQL", "Redis", "Docker/K8s", "微服务架构", "系统设计", "Linux"],
        "salary_range": "18-45K",
        "industry": "互联网/科技",
    },
    "算法工程师": {
        "skills": ["Python", "机器学习", "深度学习", "PyTorch/TensorFlow", "数据结构与算法", "数学基础", "论文阅读", "模型部署"],
        "salary_range": "25-60K",
        "industry": "AI/科技",
    },
    "产品经理": {
        "skills": ["需求分析", "竞品分析", "原型设计(Figma)", "数据分析", "项目管理", "用户研究", "技术理解", "沟通协作"],
        "salary_range": "15-35K",
        "industry": "互联网/科技",
    },
    "数据分析师": {
        "skills": ["SQL", "Python/R", "Excel高级", "Tableau/PowerBI", "统计学", "A/B测试", "业务分析", "数据可视化"],
        "salary_range": "12-30K",
        "industry": "全行业",
    },
}

# =============================================
# 院校数据
# =============================================
UNIVERSITIES = [
    {"name": "清华大学", "level": "985/211", "difficulty": "极高", "score_line": "400+"},
    {"name": "北京大学", "level": "985/211", "difficulty": "极高", "score_line": "395+"},
    {"name": "浙江大学", "level": "985/211", "difficulty": "极高", "score_line": "390+"},
    {"name": "上海交通大学", "level": "985/211", "difficulty": "极高", "score_line": "390+"},
    {"name": "复旦大学", "level": "985/211", "difficulty": "极高", "score_line": "385+"},
    {"name": "华中科技大学", "level": "985/211", "difficulty": "高", "score_line": "360+"},
    {"name": "武汉大学", "level": "985/211", "difficulty": "高", "score_line": "365+"},
    {"name": "中山大学", "level": "985/211", "difficulty": "高", "score_line": "360+"},
    {"name": "电子科技大学", "level": "985/211", "difficulty": "高", "score_line": "340+"},
    {"name": "华南理工大学", "level": "985/211", "difficulty": "较高", "score_line": "350+"},
    {"name": "北京邮电大学", "level": "211", "difficulty": "较高", "score_line": "340+"},
    {"name": "西安电子科技大学", "level": "211", "difficulty": "较高", "score_line": "330+"},
    {"name": "深圳大学", "level": "双非", "difficulty": "中等", "score_line": "320+"},
    {"name": "杭州电子科技大学", "level": "双非", "difficulty": "中等", "score_line": "300+"},
    {"name": "南京邮电大学", "level": "双非", "difficulty": "中等", "score_line": "310+"},
]

# =============================================
# 模拟AI回复生成
# =============================================
def generate_agent_response(agent_name, user_message, conversation_history=None):
    """生成单个智能体的回复"""
    agent = AGENT_DEFINITIONS.get(agent_name, AGENT_DEFINITIONS["time_manager"])
    responses = _get_agent_response_templates(agent_name, agent, user_message)
    return random.choice(responses)


def _get_agent_response_templates(agent_name, agent, user_message):
    """根据智能体类型返回回复模板"""
    base = {
        "time_manager": [
            f"📊 分析你的任务后，我建议将时间分配如下：\n\n"
            f"• 上午8:00-11:00：高难度任务（大脑最清醒时段）\n"
            f"• 下午14:00-17:00：中等难度任务\n"
            f"• 晚上19:00-21:00：复习整理\n\n"
            f"采用番茄工作法（25分钟专注+5分钟休息），每4个番茄钟休息15分钟。\n\n"
            f"💡 关键建议：每天保证7小时睡眠，避免熬夜学习。",
            f"⏰ 基于你的目标，我制定了一个时间优化方案：\n\n"
            f"首先，识别出你每天的高效时间段。建议用一周时间记录精力波动。\n"
            f"然后，将最重要的任务安排在高效时段。\n\n"
            f"📋 推荐工具：时间块法 + 番茄钟，双管齐下效果最佳。",
        ],
        "study_planner": [
            f"📚 针对你的学习目标，我建议按以下路径规划：\n\n"
            f"第一阶段（基础期）：建立知识框架，理解核心概念\n"
            f"第二阶段（强化期）：深度学习重点章节，完成习题训练\n"
            f"第三阶段（冲刺期）：模拟测试，查漏补缺\n\n"
            f"🎯 关键原则：先理解再记忆，先框架再细节。",
            f"📖 学习路线规划：\n\n"
            f"1. 先通读教材目录，建立整体认知\n"
            f"2. 每周完成2-3个知识模块\n"
            f"3. 每个模块学习后立即做配套练习\n"
            f"4. 周末进行知识回顾和错题整理\n\n"
            f"建议使用费曼学习法：学完后尝试讲给别人听。",
        ],
        "exam_mentor": [
            f"🎓 考研备考建议：\n\n"
            f"📊 当前阶段评估：基础复习期\n"
            f"📅 倒计时规划：\n"
            f"• 基础阶段（3-6月）：完成数学和专业课第一轮复习\n"
            f"• 强化阶段（7-9月）：真题训练，攻克重点难点\n"
            f"• 冲刺阶段（10-12月）：模拟考试，查漏补缺\n\n"
            f"💪 每天保持8-10小时有效学习时间，周末适当休息。",
            f"🎯 院校选择建议：\n\n"
            f"选择院校要考虑三个维度：\n"
            f"1. 院校实力（985/211/双一流）\n"
            f"2. 专业排名（学科评估等级）\n"
            f"3. 录取难度（报录比、分数线）\n\n"
            f"建议选择1-2个梯队院校，形成'冲-稳-保'的报考策略。",
        ],
        "career_advisor": [
            f"💼 职业规划分析：\n\n"
            f"📈 行业发展前景：互联网/科技行业持续增长\n"
            f"🎯 建议职业路径：\n"
            f"• 短期（1-2年）：积累技术基础，建立专业能力\n"
            f"• 中期（3-5年）：深耕细分领域，成长为高级工程师\n"
            f"• 长期（5年+）：技术专家或管理路线\n\n"
            f"💡 关键技能：持续学习能力 + 系统设计思维 + 沟通协作能力",
            f"📊 职位匹配分析：\n\n"
            f"根据你的背景，我推荐以下方向：\n"
            f"1. 软件开发工程师（匹配度：85%）\n"
            f"2. 数据分析师（匹配度：70%）\n"
            f"3. 产品经理（匹配度：60%）\n\n"
            f"建议优先选择匹配度最高的方向，然后逐步扩展技能树。",
        ],
        "psych_coach": [
            f"🧠 心理状态分析：\n\n"
            f"拖延往往是完美主义的表现。记住：\n"
            f"完成比完美重要。\n\n"
            f"💡 实用建议：\n"
            f"• 2分钟法则：如果一件事2分钟内能完成，立刻做\n"
            f"• 5分钟启动法：告诉自己只做5分钟，通常做完5分钟就停不下来了\n"
            f"• 奖励机制：每完成一个任务给自己一个小奖励\n\n"
            f"你比自己想象的更强大！",
            f"💪 克服拖延的三个步骤：\n\n"
            f"1. 识别触发因素：是什么让你想拖延？\n"
            f"2. 降低任务门槛：把大任务拆成超小的步骤\n"
            f"3. 建立正向反馈：完成小任务后及时奖励自己\n\n"
            f"记住，行动是治愈焦虑的良药。",
        ],
        "efficiency_analyst": [
            f"📊 效率分析报告：\n\n"
            f"📈 学习效率评分：72/100\n"
            f"⏱ 日均专注时长：4.2小时\n"
            f"🎯 任务完成率：68%\n\n"
            f"🔍 瓶颈分析：\n"
            f"• 下午14:00-16:00效率低谷（建议安排轻松任务）\n"
            f"• 手机干扰是最大效率杀手（建议使用专注模式）\n\n"
            f"💡 优化建议：关闭手机通知，每2小时集中处理一次消息。",
            f"📉 拖延指数分析：\n\n"
            f"当前拖延指数：中等偏高\n"
            f"主要表现：\n"
            f"• 任务开始前过度准备\n"
            f"• 容易分心到社交媒体\n"
            f"• 低估任务所需时间\n\n"
            f"💡 建议：使用时间记录工具追踪每项任务的实际耗时，建立准确的时间感知。",
        ],
        "project_manager": [
            f"📋 项目分解方案：\n\n"
            f"采用WBS(工作分解结构)方法：\n"
            f"一级：项目总目标\n"
            f"二级：核心模块（5-7个）\n"
            f"三级：具体任务（每个模块3-5个）\n\n"
            f"📅 里程碑设置：\n"
            f"• M1：方案设计完成\n"
            f"• M2：核心功能开发完成\n"
            f"• M3：测试验证通过\n"
            f"• M4：文档和交付完成\n\n"
            f"⚠ 风险提示：技术难点需要提前验证，不要放到最后。",
            f"📊 甘特图规划：\n\n"
            f"第一周：需求分析和方案设计\n"
            f"第二周：核心模块开发\n"
            f"第三周：功能完善和联调\n"
            f"第四周：测试和Bug修复\n"
            f"第五周：文档撰写和答辩准备\n\n"
            f"每个阶段设置检查点，确保进度可控。",
        ],
        "resume_advisor": [
            f"📝 简历优化建议：\n\n"
            f"1. 使用STAR法则描述项目经历\n"
            f"   - Situation: 项目背景\n"
            f"   - Task: 你的任务\n"
            f"   - Action: 你采取的行动\n"
            f"   - Result: 取得的成果（量化！）\n\n"
            f"2. 关键词优化：根据目标岗位JD调整技能关键词\n"
            f"3. 格式规范：一页纸，PDF格式，清晰排版\n\n"
            f"💡 HR平均看简历时间只有6-10秒，前1/3页面最重要！",
            f"📋 简历结构建议：\n\n"
            f"1. 个人信息（简洁）\n"
            f"2. 求职意向（明确）\n"
            f"3. 教育背景（GPA 3.5+可写）\n"
            f"4. 技术栈（分类展示）\n"
            f"5. 项目经历（2-3个核心项目）\n"
            f"6. 实习经历（如有）\n"
            f"7. 竞赛获奖/证书\n\n"
            f"每个项目经历用1-2行量化成果，避免流水账。",
        ],
        "interviewer": [
            f"🎤 模拟面试场景：\n\n"
            f"面试官：请介绍一下你做过的最有挑战性的项目？\n\n"
            f"建议回答框架：\n"
            f"1. 项目背景（1句话）\n"
            f"2. 你的角色和职责\n"
            f"3. 遇到的最大挑战\n"
            f"4. 你是如何解决的\n"
            f"5. 最终成果和收获\n\n"
            f"⏱ 控制在2-3分钟内，重点突出你的思考和贡献。",
            f"💡 面试准备清单：\n\n"
            f"技术面准备：\n"
            f"• 算法与数据结构（LeetCode刷题）\n"
            f"• 系统设计（设计短链接/Twitter等）\n"
            f"• 项目深挖（每个项目准备3个追问）\n\n"
            f"行为面准备：\n"
            f"• 准备5-8个STAR案例\n"
            f"• 练习自我介绍（1分钟版本）\n\n"
            f"🎯 面试前研究公司产品和文化，准备2-3个有深度的问题反问面试官。",
        ],
        "startup_mentor": [
            f"🚀 创业项目评估：\n\n"
            f"📊 商业模式画布分析：\n"
            f"• 价值主张：你的产品解决什么问题？\n"
            f"• 目标客户：谁是最迫切需要你的用户？\n"
            f"• 收入模式：如何实现盈利？\n\n"
            f"💡 MVP建议：\n"
            f"用最小可行产品验证核心假设，不要追求完美。\n"
            f"先找到10个愿意付费的用户，再考虑规模化。\n\n"
            f"⚠ 创业第一原则：解决真实问题，而不是想象中的问题。",
            f"📈 创业路线图：\n\n"
            f"阶段一：idea验证（1-2周）\n"
            f"• 与50个潜在用户聊天\n"
            f"• 确认问题真实存在且足够痛\n\n"
            f"阶段二：MVP开发（2-4周）\n"
            f"• 只做核心功能\n"
            f"• 快速上线，小范围测试\n\n"
            f"阶段三：产品迭代（持续）\n"
            f"• 根据用户反馈优化\n"
            f"• 找到PMF（产品市场匹配）\n\n"
            f"🎯 关键指标：用户留存率 > 增长率。",
        ],
    }
    return base.get(agent_name, base["time_manager"])


# =============================================
# 多智能体群聊讨论
# =============================================
def generate_group_discussion(user_message, selected_agents=None):
    """生成多智能体群聊讨论"""
    if selected_agents is None:
        selected_agents = ["time_manager", "study_planner", "efficiency_analyst", "psych_coach"]

    discussion = []
    for agent_name in selected_agents:
        agent = AGENT_DEFINITIONS.get(agent_name, AGENT_DEFINITIONS["time_manager"])
        response = generate_agent_response(agent_name, user_message)
        discussion.append({
            "agent": agent_name,
            "display_name": agent["display_name"],
            "emoji": agent["emoji"],
            "color": agent["color"],
            "content": response,
            "phase": "discussing",
        })

    # 添加共识
    discussion.append({
        "agent": "consensus",
        "display_name": "团队共识",
        "emoji": "🤝",
        "color": "#10B981",
        "content": _generate_consensus(discussion, user_message),
        "phase": "consensus",
    })

    return discussion


def _generate_consensus(discussion, user_message):
    return (
        f"🤝 **团队共识**\n\n"
        f"经过{len(discussion)}位专家的讨论，我们达成以下共识：\n\n"
        f"1. **目标明确**：清晰定义你要达成的具体目标\n"
        f"2. **分步执行**：将大目标拆分为可执行的小步骤\n"
        f"3. **时间管理**：合理分配时间，避免过度疲劳\n"
        f"4. **持续反馈**：定期检查进度，及时调整策略\n"
        f"5. **心态建设**：保持积极心态，允许自己犯错\n\n"
        f"📋 **下一步行动建议**：\n"
        f"• 立即开始第一个小任务，建立行动惯性\n"
        f"• 设置每日最小工作量（如每天专注2小时）\n"
        f"• 一周后回顾进展，调整计划\n\n"
        f"💪 团队会持续关注你的进展，加油！"
    )


# =============================================
# 流水线模式执行
# =============================================
def execute_pipeline(mode_key, user_input):
    """执行智能流水线模式"""
    pipeline = PIPELINE_MODES.get(mode_key)
    if not pipeline:
        return {"success": False, "message": "未知的流水线模式"}

    phases = pipeline["phases"]
    agents = pipeline["agents"]
    results = []

    for i, phase in enumerate(phases):
        progress = round((i + 1) / len(phases) * 100)
        agent_name = agents[i % len(agents)]
        agent = AGENT_DEFINITIONS.get(agent_name, AGENT_DEFINITIONS["time_manager"])

        results.append({
            "phase": phase,
            "phase_index": i + 1,
            "total_phases": len(phases),
            "progress": progress,
            "agent": agent_name,
            "agent_display": agent["display_name"],
            "agent_emoji": agent["emoji"],
            "content": _generate_phase_content(phase, mode_key, user_input, agent),
            "estimated_days": _estimate_phase_days(phase, mode_key),
        })

    return {
        "success": True,
        "mode": pipeline["name"],
        "mode_icon": pipeline["icon"],
        "phases": results,
        "summary": _generate_pipeline_summary(mode_key, user_input, results),
    }


def _generate_phase_content(phase, mode_key, user_input, agent):
    """生成每个阶段的AI分析内容"""
    contents = {
        "需求分析": f"📋 **{phase}阶段**\n\n对「{user_input}」进行需求分析：\n\n1. 核心目标梳理\n2. 关键需求识别\n3. 约束条件分析\n4. 成功标准定义\n\n建议优先明确核心需求，避免范围蔓延。",
        "文献调研": f"📚 **{phase}阶段**\n\n文献调研策略：\n\n1. 关键词检索（中文+英文）\n2. 近5年核心论文筛选\n3. 文献分类与笔记整理\n4. 研究空白识别\n\n建议使用Zotero管理文献，Notion整理笔记。",
        "方案制定": f"📐 **{phase}阶段**\n\n方案设计要点：\n\n1. 技术路线选型\n2. 系统架构设计\n3. 模块划分与接口定义\n4. 风险评估与应对\n\n建议多方案对比，选择最优解。",
        "实验设计": f"🔬 **{phase}阶段**\n\n实验设计原则：\n\n1. 控制变量法\n2. 对比实验设置\n3. 数据采集方案\n4. 评估指标定义\n\n确保实验可复现，数据可追溯。",
        "数据分析": f"📊 **{phase}阶段**\n\n数据分析框架：\n\n1. 数据清洗与预处理\n2. 描述性统计分析\n3. 可视化展示\n4. 结论与建议\n\n建议使用Python(Jupyter)或R进行数据分析。",
        "论文撰写": f"✍ **{phase}阶段**\n\n论文结构建议：\n\n1. 摘要（目的、方法、结果、结论）\n2. 引言（背景、问题、贡献）\n3. 相关工作\n4. 方法\n5. 实验\n6. 讨论\n7. 结论\n\n先写大纲，再填充内容，最后润色。",
        "修改润色": f"✨ **{phase}阶段**\n\n润色检查清单：\n\n1. 逻辑连贯性检查\n2. 语法拼写校对\n3. 图表编号统一\n4. 参考文献格式\n5. 查重率控制\n\n建议使用Grammarly辅助润色。",
        "最终定稿": f"✅ **{phase}阶段**\n\n最终检查：\n\n1. 格式符合要求\n2. 所有章节完整\n3. 图表清晰\n4. 参考文献完整\n5. 查重通过\n\n🎉 恭喜完成！",
        "系统设计": f"🏗 **{phase}阶段**\n\n系统设计要点：\n\n1. 架构设计（MVC/微服务）\n2. 技术栈选型\n3. 数据库设计\n4. 接口设计\n5. 安全设计\n\n建议使用UML图辅助设计沟通。",
        "数据库设计": f"🗄 **{phase}阶段**\n\n数据库设计步骤：\n\n1. 概念结构设计（ER图）\n2. 逻辑结构设计（关系模式）\n3. 物理结构设计（索引优化）\n4. SQL脚本编写\n\n遵循3NF范式，合理设置索引。",
        "前端开发": f"🎨 **{phase}阶段**\n\n前端开发清单：\n\n1. 页面结构搭建\n2. 组件开发\n3. 状态管理\n4. API对接\n5. 响应式适配\n6. 性能优化\n\n建议使用组件化开发，先静态后动态。",
        "后端开发": f"⚙ **{phase}阶段**\n\n后端开发清单：\n\n1. 项目初始化\n2. 数据库连接\n3. API接口开发\n4. 业务逻辑实现\n5. 中间件集成\n6. 单元测试\n\n建议RESTful API设计，做好错误处理。",
        "测试验证": f"🧪 **{phase}阶段**\n\n测试策略：\n\n1. 单元测试\n2. 集成测试\n3. 系统测试\n4. 验收测试\n\n建议编写测试用例，覆盖正常和异常场景。",
        "文档撰写": f"📝 **{phase}阶段**\n\n文档清单：\n\n1. 需求文档\n2. 设计文档\n3. 用户手册\n4. 部署文档\n5. API文档\n\n文档要简洁清晰，便于维护。",
        "答辩准备": f"🎤 **{phase}阶段**\n\n答辩准备：\n\n1. PPT制作\n2. Demo演示\n3. 常见问题准备\n4. 模拟答辩演练\n\n重点突出创新点和实际成果。",
        "赛题分析": f"🔍 **{phase}阶段**\n\n赛题分析要点：\n\n1. 赛题要求解读\n2. 评分标准分析\n3. 往届作品调研\n4. 创新点挖掘\n\n明确评委关注的核心维度。",
        "原型开发": f"🛠 **{phase}阶段**\n\n原型开发策略：\n\n1. 核心功能实现\n2. 最小可行产品\n3. 快速迭代\n4. 持续集成\n\n先跑通核心流程，再逐步完善。",
        "算法优化": f"⚡ **{phase}阶段**\n\n算法优化方向：\n\n1. 时间复杂度优化\n2. 空间复杂度优化\n3. 准确率/召回率提升\n4. 推理速度优化\n\n用数据说话，每个优化都要有对比实验。",
        "提交评审": f"📤 **{phase}阶段**\n\n提交前检查：\n\n1. 所有材料齐全\n2. 格式符合要求\n3. 代码可运行\n4. 文档完整\n5. 演示视频 OK\n\n🎉 预祝取得好成绩！",
        "院校分析": f"🏫 **{phase}阶段**\n\n院校选择分析：\n\n1. 目标院校梯队划分\n2. 报录比分析\n3. 分数线趋势\n4. 专业课难度评估\n\n建议制定'冲-稳-保'三级策略。",
        "科目规划": f"📖 **{phase}阶段**\n\n科目复习规划：\n\n1. 各科目权重分析\n2. 薄弱科目识别\n3. 时间分配方案\n4. 资料选择建议\n\n建议每天保持4个科目的轮换学习。",
        "基础复习": f"📚 **{phase}阶段**\n\n基础复习策略：\n\n1. 教材通读2遍\n2. 课后习题全做\n3. 知识框架整理\n4. 错题本建立\n\n基础不牢，地动山摇。这个阶段最重要！",
        "强化训练": f"💪 **{phase}阶段**\n\n强化训练方案：\n\n1. 重点难点突破\n2. 经典题型训练\n3. 解题技巧总结\n4. 限时训练\n\n建议每天每科至少完成5道典型题。",
        "真题实战": f"📝 **{phase}阶段**\n\n真题实战策略：\n\n1. 近10年真题全做\n2. 严格计时模拟\n3. 错题深度分析\n4. 命题规律总结\n\n真题是最好的复习资料，至少做3遍！",
        "模拟冲刺": f"🏃 **{phase}阶段**\n\n冲刺阶段安排：\n\n1. 每周2套模拟题\n2. 查漏补缺\n3. 重点回顾\n4. 心态调整\n\n保持手感，但不要过度疲劳。",
        "查漏补缺": f"🔍 **{phase}阶段**\n\n查漏补缺方法：\n\n1. 错题本回顾\n2. 薄弱知识点强化\n3. 易错题型专项训练\n4. 知识点串联\n\n重点攻克经常出错的题型。",
        "考前准备": f"🎯 **{phase}阶段**\n\n考前一周准备：\n\n1. 调整作息\n2. 准备考试用品\n3. 考场踩点\n4. 心态放松\n\n保持平常心，正常发挥就是胜利！",
        "市场调研": f"🔍 **{phase}阶段**\n\n市场调研方法：\n\n1. 竞品分析\n2. 用户访谈\n3. 问卷调查\n4. 数据分析\n\n找到真实痛点，而不是想象中的需求。",
        "商业模式": f"💡 **{phase}阶段**\n\n商业模式设计：\n\n1. 价值主张\n2. 客户细分\n3. 收入来源\n4. 成本结构\n5. 关键伙伴\n\n使用商业模式画布工具梳理。",
        "MVP设计": f"🛠 **{phase}阶段**\n\nMVP设计原则：\n\n1. 只做核心功能\n2. 快速上线验证\n3. 收集用户反馈\n4. 数据驱动迭代\n\nMVP不是半成品，是最小可行产品。",
        "产品开发": f"💻 **{phase}阶段**\n\n产品开发流程：\n\n1. 需求评审\n2. 技术方案\n3. 开发实现\n4. 测试验收\n5. 上线部署\n\n采用敏捷开发，2周一个迭代。",
        "用户测试": f"🧪 **{phase}阶段**\n\n用户测试方法：\n\n1. 可用性测试\n2. A/B测试\n3. 用户访谈\n4. 数据分析\n\n找真实用户测试，不要自己猜。",
        "融资准备": f"💰 **{phase}阶段**\n\n融资准备：\n\n1. BP撰写\n2. 财务预测\n3. 竞品分析\n4. 团队介绍\n5. 路演准备\n\n数据要真实，故事要动人。",
        "市场推广": f"📢 **{phase}阶段**\n\n推广策略：\n\n1. 内容营销\n2. 社交媒体\n3. SEO/ASO\n4. KOL合作\n5. 付费投放\n\n先小范围测试，再规模投放。",
        "运营迭代": f"🔄 **{phase}阶段**\n\n运营迭代：\n\n1. 数据监控\n2. 用户反馈收集\n3. 功能优化\n4. 增长策略\n\n持续迭代是创业的常态。",
    }
    return contents.get(phase, f"📋 **{phase}阶段**\n\n正在执行{phase}阶段的任务分析和规划...\n\n请确保：\n1. 明确本阶段的交付物\n2. 设定完成标准\n3. 预估所需时间\n4. 识别潜在风险")


def _estimate_phase_days(phase, mode_key):
    estimates = {
        "需求分析": 2, "文献调研": 3, "方案制定": 3, "实验设计": 2,
        "数据分析": 3, "论文撰写": 5, "修改润色": 2, "最终定稿": 1,
        "系统设计": 3, "数据库设计": 2, "前端开发": 5, "后端开发": 5,
        "测试验证": 3, "文档撰写": 3, "答辩准备": 2,
        "赛题分析": 2, "原型开发": 5, "算法优化": 5, "提交评审": 1,
        "院校分析": 3, "科目规划": 2, "基础复习": 30, "强化训练": 30,
        "真题实战": 20, "模拟冲刺": 15, "查漏补缺": 10, "考前准备": 7,
        "市场调研": 5, "商业模式": 3, "MVP设计": 5, "产品开发": 20,
        "用户测试": 5, "融资准备": 10, "市场推广": 10, "运营迭代": 30,
    }
    return estimates.get(phase, 3)


def _generate_pipeline_summary(mode_key, user_input, results):
    total_days = sum(r["estimated_days"] for r in results)
    return {
        "total_phases": len(results),
        "total_days": total_days,
        "total_weeks": round(total_days / 7, 1),
        "recommendation": f"针对「{user_input}」，我们已完成{len(results)}个阶段的详细规划。预计总耗时{total_days}天（约{round(total_days / 7, 1)}周）。建议按计划分阶段执行，每周检查进度。",
    }


# =============================================
# 课程作业规划
# =============================================
def plan_course_assignment(course_name, deadline_str, custom_tasks=None):
    """规划课程作业，生成甘特图数据"""
    template = COURSE_TEMPLATES.get(course_name)
    if not template:
        tasks = custom_tasks or ["需求分析", "设计", "实现", "测试", "文档"]
        estimated_hours = 20
        difficulty = 3
    else:
        tasks = template["tasks"]
        estimated_hours = template["estimated_hours"]
        difficulty = template["difficulty"]

    try:
        dl = datetime.strptime(deadline_str, "%Y-%m-%d").date()
        remaining_days = max(1, (dl - date.today()).days)
    except (ValueError, TypeError):
        remaining_days = 14

    hours_per_task = round(estimated_hours / len(tasks), 1)
    days_per_task = max(1, remaining_days // len(tasks))

    plan = []
    start_date = date.today()
    gantt_data = []

    for i, task in enumerate(tasks):
        task_start = start_date + timedelta(days=i * days_per_task)
        task_end = task_start + timedelta(days=days_per_task - 1)
        priority = "高" if i < 3 else ("中" if i < len(tasks) - 2 else "低")

        plan.append({
            "task": task,
            "index": i + 1,
            "estimated_hours": hours_per_task,
            "start_date": task_start.strftime("%m/%d"),
            "end_date": task_end.strftime("%m/%d"),
            "priority": priority,
            "difficulty": min(5, difficulty + (1 if i < 3 else 0)),
        })

        gantt_data.append({
            "name": task,
            "start": task_start.strftime("%Y-%m-%d"),
            "end": task_end.strftime("%Y-%m-%d"),
            "progress": 0,
            "priority": priority,
        })

    return {
        "success": True,
        "course_name": course_name,
        "deadline": deadline_str,
        "remaining_days": remaining_days,
        "total_hours": estimated_hours,
        "difficulty": difficulty,
        "daily_hours": round(estimated_hours / remaining_days, 1),
        "tasks": plan,
        "gantt_data": gantt_data,
        "suggestion": f"课程作业「{course_name}」已拆解为{len(tasks)}个任务，共需{estimated_hours}小时。建议每天投入{round(estimated_hours / remaining_days, 1)}小时，{remaining_days}天内完成。",
    }


# =============================================
# 考研规划
# =============================================
def plan_exam_prep(target_school, target_major, exam_date_str, subjects):
    """考研规划"""
    try:
        exam_date = datetime.strptime(exam_date_str, "%Y-%m-%d").date()
        remaining_days = max(0, (exam_date - date.today()).days)
    except (ValueError, TypeError):
        exam_date = date.today() + timedelta(days=180)
        remaining_days = 180

    # 院校分析
    school_info = next((u for u in UNIVERSITIES if u["name"] == target_school), None)
    admission_probability = _estimate_admission_probability(target_school, target_major)

    # 科目分析
    subject_analysis = []
    for subject in subjects:
        sub_info = EXAM_SUBJECTS.get(subject, {"topics": [subject], "weight": 100})
        weakness = random.randint(30, 70)
        subject_analysis.append({
            "name": subject,
            "weight": sub_info["weight"],
            "topics": sub_info["topics"],
            "weakness_score": weakness,
            "suggested_hours_per_day": round(sub_info["weight"] / 500 * 8, 1),
        })

    # 每日计划
    phases = ["基础复习", "强化训练", "真题实战", "模拟冲刺", "查漏补缺"]
    phase_days = [
        max(7, remaining_days * 40 // 100),
        max(7, remaining_days * 30 // 100),
        max(7, remaining_days * 15 // 100),
        max(5, remaining_days * 10 // 100),
        max(3, remaining_days * 5 // 100),
    ]

    daily_plan = []
    current_date = date.today()
    for i, phase in enumerate(phases):
        daily_plan.append({
            "phase": phase,
            "days": phase_days[i],
            "start_date": current_date.strftime("%Y-%m-%d"),
            "end_date": (current_date + timedelta(days=phase_days[i])).strftime("%Y-%m-%d"),
            "focus": ["知识框架", "课后习题", "真题训练", "模拟考试", "错题回顾"][i],
        })
        current_date += timedelta(days=phase_days[i])

    return {
        "success": True,
        "target_school": target_school,
        "target_major": target_major,
        "exam_date": exam_date_str,
        "countdown_days": remaining_days,
        "school_info": school_info,
        "admission_probability": admission_probability,
        "subject_analysis": subject_analysis,
        "daily_plan": daily_plan,
        "total_phases": len(phases),
        "suggestion": f"距离考研还有{remaining_days}天。建议每天保持8-10小时有效学习时间，合理分配各科目时间。",
    }


def _estimate_admission_probability(school, major):
    school_tier = {
        "清华大学": 95, "北京大学": 95, "浙江大学": 90, "上海交通大学": 90,
        "复旦大学": 88, "华中科技大学": 80, "武汉大学": 78, "中山大学": 75,
        "电子科技大学": 70, "华南理工大学": 65, "北京邮电大学": 60,
        "西安电子科技大学": 55, "深圳大学": 45, "杭州电子科技大学": 35,
        "南京邮电大学": 40,
    }
    base = school_tier.get(school, 50)
    return {
        "score": round(base + random.randint(-10, 5)),
        "level": "高" if base > 80 else ("中等" if base > 50 else "需要努力"),
        "factors": ["院校实力", "专业热度", "报录比", "历年分数线"],
    }


# =============================================
# 职业规划
# =============================================
def plan_career(target_position, target_industry):
    """职业规划"""
    position_info = CAREER_POSITIONS.get(target_position, {
        "skills": ["专业技能", "沟通能力", "团队协作", "学习能力"],
        "salary_range": "10-25K",
        "industry": target_industry or "互联网/科技",
    })

    # 技能差距分析
    skill_gaps = []
    for i, skill in enumerate(position_info["skills"]):
        proficiency = random.randint(30, 90)
        skill_gaps.append({
            "skill": skill,
            "current_level": proficiency,
            "target_level": 80,
            "gap": max(0, 80 - proficiency),
            "priority": "高" if proficiency < 50 else ("中" if proficiency < 70 else "低"),
        })

    # 职业路线图
    roadmap = [
        {"phase": "短期（0-1年）", "goal": f"掌握{position_info['skills'][0]}和{position_info['skills'][1]}", "actions": ["系统学习核心技能", "完成2-3个实战项目", "建立专业作品集"]},
        {"phase": "中期（1-3年）", "goal": "成长为独立负责模块的中级工程师", "actions": ["深入一个技术领域", "参与开源项目", "积累项目经验", "拓宽技术视野"]},
        {"phase": "长期（3-5年）", "goal": "成为高级工程师或技术专家", "actions": ["系统设计能力提升", "技术分享与团队协作", "领域深耕", "管理能力培养"]},
    ]

    # 薪资预测
    salary_range = position_info["salary_range"]
    salary_prediction = {
        "entry": salary_range.split("-")[0] if "-" in salary_range else "10K",
        "mid": salary_range.split("-")[1] if "-" in salary_range else "20K",
        "senior": str(int(salary_range.split("-")[1].replace("K", "")) * 1.5) + "K" if "-" in salary_range else "30K",
    }

    return {
        "success": True,
        "position": target_position,
        "industry": target_industry,
        "required_skills": position_info["skills"],
        "skill_gaps": skill_gaps,
        "salary_range": salary_range,
        "salary_prediction": salary_prediction,
        "roadmap": roadmap,
        "suggestion": f"作为{target_position}，建议优先提升核心技能，建立项目经验，持续学习行业新技术。",
    }


# =============================================
# 拖延症分析
# =============================================
def analyze_procrastination(user_id=None):
    """分析拖延症数据"""
    conn = get_db()
    activities = dicts_from_rows(conn.execute(
        "SELECT * FROM activities WHERE user_id = ? ORDER BY date DESC LIMIT 30",
        (user_id or 1,)
    ).fetchall())
    conn.close()

    if not activities:
        return _generate_default_procrastination_analysis()

    avg_focus = sum(a["focus_minutes"] for a in activities) / len(activities)
    avg_tasks = sum(a["tasks_done"] for a in activities) / len(activities)

    procrastination_index = max(0, min(100, round(100 - (avg_focus / 240) * 70 - (avg_tasks / 5) * 30)))
    focus_score = max(0, min(100, round((avg_focus / 240) * 100)))
    efficiency_score = max(0, min(100, round((avg_tasks / 8) * 100)))

    return {
        "success": True,
        "procrastination_index": procrastination_index,
        "procrastination_level": "重度" if procrastination_index > 70 else ("中度" if procrastination_index > 40 else "轻度"),
        "focus_score": focus_score,
        "efficiency_score": efficiency_score,
        "avg_focus_minutes": round(avg_focus),
        "avg_tasks_done": round(avg_tasks, 1),
        "suggestions": _get_procrastination_suggestions(procrastination_index),
        "habit_plan": _generate_habit_plan(),
        "growth_path": _generate_growth_path(),
    }


def _generate_default_procrastination_analysis():
    return {
        "success": True,
        "procrastination_index": 55,
        "procrastination_level": "中度",
        "focus_score": 65,
        "efficiency_score": 60,
        "avg_focus_minutes": 120,
        "avg_tasks_done": 3.5,
        "suggestions": _get_procrastination_suggestions(55),
        "habit_plan": _generate_habit_plan(),
        "growth_path": _generate_growth_path(),
    }


def _get_procrastination_suggestions(index):
    if index > 70:
        return [
            "⚠ 你的拖延指数偏高，建议立即行动",
            "从每天完成1个小任务开始建立信心",
            "使用番茄钟强制自己专注25分钟",
            "关闭手机通知，减少干扰源",
            "找一个学习伙伴互相监督",
        ]
    elif index > 40:
        return [
            "📊 你的拖延指数处于中等水平",
            "建立每日任务清单，明确优先级",
            "尝试'吃掉那只青蛙'——先做最难的事",
            "设置明确的截止日期和奖励机制",
            "每周回顾进展，调整策略",
        ]
    else:
        return [
            "✅ 你的拖延指数较低，保持良好习惯",
            "可以尝试挑战更高难度的任务",
            "帮助身边有拖延习惯的同学",
            "持续优化时间管理方法",
            "保持工作与休息的平衡",
        ]


def _generate_habit_plan():
    return [
        {"week": 1, "habit": "每天固定时间开始学习", "goal": "建立学习仪式感", "difficulty": "简单"},
        {"week": 2, "habit": "使用番茄工作法", "goal": "提高单次专注时长", "difficulty": "简单"},
        {"week": 3, "habit": "睡前规划明日任务", "goal": "减少决策疲劳", "difficulty": "中等"},
        {"week": 4, "habit": "每周复盘总结", "goal": "持续优化学习策略", "difficulty": "中等"},
    ]


def _generate_growth_path():
    return [
        {"stage": "初学者", "milestone": "连续7天打卡", "reward": "解锁'初露锋芒'成就"},
        {"stage": "进阶者", "milestone": "累计专注100小时", "reward": "解锁'专注达人'成就"},
        {"stage": "高手", "milestone": "完成50个任务", "reward": "解锁'效率大师'成就"},
        {"stage": "大师", "milestone": "连续30天打卡", "reward": "解锁'自律之王'成就"},
        {"stage": "传说", "milestone": "累计专注500小时", "reward": "解锁'时间领主'成就"},
    ]


# =============================================
# 成长仪表盘数据
# =============================================
def get_growth_dashboard(user_id=None):
    """获取成长仪表盘数据"""
    conn = get_db()
    user = dict_from_row(conn.execute(
        "SELECT * FROM users WHERE id = ?", (user_id or 1,)
    ).fetchone())

    activities = dicts_from_rows(conn.execute(
        "SELECT * FROM activities WHERE user_id = ? ORDER BY date ASC",
        (user_id or 1,)
    ).fetchall())

    tasks = dicts_from_rows(conn.execute(
        "SELECT * FROM tasks WHERE user_id = ?",
        (user_id or 1,)
    ).fetchall())
    conn.close()

    # 计算等级信息
    from auth import calculate_level_info
    level_info = calculate_level_info(user["experience"]) if user else calculate_level_info(0)

    # 检查今日打卡
    today_str = date.today().isoformat()
    checkin_dates = json.loads(user.get("checkin_dates", "[]")) if user else []

    # 热力图数据
    heatmap = []
    for a in activities:
        heatmap.append({
            "date": a["date"],
            "value": a["focus_minutes"],
            "level": 1 if a["focus_minutes"] < 60 else (2 if a["focus_minutes"] < 120 else (3 if a["focus_minutes"] < 180 else 4)),
        })

    # 拖延趋势
    procrastination_trend = []
    for a in activities:
        procrastination_trend.append({
            "date": a["date"],
            "value": a.get("procrastination_index", random.randint(30, 70)),
        })

    # 效率趋势
    efficiency_trend = []
    for a in activities:
        efficiency_trend.append({
            "date": a["date"],
            "value": a.get("efficiency_score", random.randint(50, 90)),
        })

    # 完成任务统计
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t["status"] == "已完成"])
    completion_rate = round((completed_tasks / max(total_tasks, 1)) * 100, 1)

    # 周统计
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_data = []
    for i in range(7):
        day = week_start + timedelta(days=i)
        day_str = day.isoformat()
        day_activity = next((a for a in activities if a["date"] == day_str), None)
        week_data.append({
            "date": day_str,
            "day_name": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i],
            "focus_minutes": day_activity["focus_minutes"] if day_activity else 0,
            "tasks_done": day_activity["tasks_done"] if day_activity else 0,
        })

    from auth import calculate_level_info
    return {
        "success": True,
        "user": user,
        "level_info": level_info,
        "streak": user.get("streak", 0) if user else 0,
        "max_streak": user.get("max_streak", 0) if user else 0,
        "today_checked_in": today_str in checkin_dates,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_rate": completion_rate,
        "focus_hours": user.get("focus_hours", 0) if user else 0,
        "ai_collaborations": user.get("ai_collaborations", 0) if user else 0,
        "heatmap": heatmap,
        "procrastination_trend": procrastination_trend,
        "efficiency_trend": efficiency_trend,
        "week_data": week_data,
        "achievements": _get_achievements(user),
    }


def _get_achievements(user):
    if not user:
        return []
    achievements = [
        {"name": "初来乍到", "icon": "👋", "desc": "完成首次登录", "unlocked": True},
        {"name": "初露锋芒", "icon": "🌟", "desc": "连续7天打卡", "unlocked": user.get("streak", 0) >= 7},
        {"name": "专注达人", "icon": "🎯", "desc": "累计专注100小时", "unlocked": user.get("focus_hours", 0) >= 100},
        {"name": "效率大师", "icon": "⚡", "desc": "完成50个任务", "unlocked": user.get("tasks_completed", 0) >= 50},
        {"name": "自律之王", "icon": "👑", "desc": "连续30天打卡", "unlocked": user.get("streak", 0) >= 30},
        {"name": "AI伙伴", "icon": "🤖", "desc": "AI协作100次", "unlocked": user.get("ai_collaborations", 0) >= 100},
        {"name": "知识探索者", "icon": "🔍", "desc": "使用5种流水线模式", "unlocked": False},
        {"name": "社交达人", "icon": "💬", "desc": "发布10篇社区帖子", "unlocked": False},
    ]
    return achievements