/**
 * 扩展 Demo 数据 — 对话模式生成的记忆 + 扩充人物实体
 * 将人物从 8 个扩充到 55+ 个，记忆从 50 条扩充到 110+ 条
 * 记忆内容模拟对话提取风格，覆盖工作/家庭/健康/社交/财务/学习等多领域
 */

import type { Person, Memory, PersonConnection } from '../types'

const now = Date.now()
const daysAgo = (d: number) => now - d * 86400000

// ============================================================
// 辅助函数：快速创建有效的人物对象
// ============================================================
function makePerson(opts: {
  id: string
  name: string
  relationship: Person['relationship']
  sentiment: number
  roleInMyLife: string
  myRoleInTheirLife?: string
  powerDynamic?: 'equal' | 'superior' | 'subordinate' | 'complex'
  trustLevel?: number
  intimacyLevel?: number
  gender?: 'male' | 'female' | 'other'
  age?: number
  company?: string
  title?: string
  hometown?: string
  traits?: string[]
  tags?: string[]
  topics?: string[]
  interactionCount?: number
  lastInteractionDays?: number
  description?: string
  connections?: { targetPersonId: string; targetPersonName?: string; relationType: PersonConnection['relationType']; description: string; strength: number }[]
}): Person {
  // 生成 sentimentHistory：基于当前温度模拟过去 6 个月的温度变化
  const currentSent = opts.sentiment
  const history = generateSentimentHistory(currentSent, opts.lastInteractionDays || 30)

  return {
    id: opts.id,
    name: opts.name,
    relationship: opts.relationship,
    sentiment: opts.sentiment,
    sentimentHistory: history,
    profile: {
      identity: {
        fullName: opts.name,
        nicknames: [opts.name],
        gender: opts.gender,
        age: opts.age,
        hometown: opts.hometown,
        currentCity: '杭州',
      },
      career: {
        company: opts.company,
        title: opts.title,
        strengths: [],
        weaknesses: [],
        careerHistory: [],
      },
      personality: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
        description: opts.description || '',
      },
      preferences: {
        likes: [],
        dislikes: [],
        allergies: [],
        dietary: [],
        hobbies: [],
        communicationStyle: '',
      },
      values: {
        coreValues: [],
        motivations: [],
        fears: [],
        goals: [],
      },
      socialRole: {
        roleInMyLife: opts.roleInMyLife,
        myRoleInTheirLife: opts.myRoleInTheirLife || '',
        powerDynamic: opts.powerDynamic || 'equal',
        trustLevel: opts.trustLevel ?? 50,
        intimacyLevel: opts.intimacyLevel ?? 30,
      },
      sharedExperiences: [],
    },
    timeline: [],
    connections: (opts.connections || []).map(c => ({
      targetPersonId: c.targetPersonId,
      targetPersonName: c.targetPersonName || '',
      relationType: c.relationType,
      description: c.description,
      strength: c.strength,
    })),
    traits: opts.traits || [],
    tags: opts.tags || [],
    interactionStats: {
      totalCount: opts.interactionCount || 1,
      lastInteractionAt: daysAgo(opts.lastInteractionDays || 30),
      avgSentiment: opts.sentiment,
      topics: opts.topics || [],
    },
    createdAt: daysAgo(opts.lastInteractionDays || 30),
    updatedAt: now,
    isDemo: 1,
  }
}

/**
 * 生成 sentimentHistory：模拟过去 6 个月的温度变化轨迹
 * - 温度 < 30 的人物：从较高温度逐步下降（关系恶化轨迹）
 * - 温度 30-50 的人物：波动下降趋势
 * - 温度 50-70 的人物：平稳波动
 * - 温度 > 70 的人物：从较低温度逐步上升（关系升温轨迹）
 */
function generateSentimentHistory(currentSent: number, lastInteractionDays: number) {
  const points: { timestamp: number; value: number; reason: string }[] = []
  const totalPoints = 6 + Math.floor(Math.random() * 3) // 6-8 个点
  const timeSpan = 180 // 6个月

  for (let i = totalPoints - 1; i >= 0; i--) {
    const daysBack = Math.round((timeSpan / totalPoints) * i) + lastInteractionDays
    const progress = (totalPoints - 1 - i) / (totalPoints - 1) // 0 → 1

    let value: number
    let reason: string

    if (currentSent < 30) {
      // 关系恶化：从 60-70 逐步下降到当前值
      const startSent = 60 + Math.random() * 10
      value = Math.round(startSent - (startSent - currentSent) * progress + (Math.random() - 0.5) * 8)
      reason = i === 0 ? '初始互动' : progress > 0.6 ? '关系持续降温' : '发生摩擦'
    } else if (currentSent < 50) {
      // 波动下降：从 55-65 波动到当前值
      const startSent = 58 + Math.random() * 8
      value = Math.round(startSent - (startSent - currentSent) * progress + (Math.random() - 0.5) * 10)
      reason = i === 0 ? '初始互动' : '有些疏远'
    } else if (currentSent < 70) {
      // 平稳波动
      value = Math.round(currentSent + (Math.random() - 0.5) * 12)
      reason = i === 0 ? '定期互动' : '日常交流'
    } else {
      // 关系升温：从 50-60 逐步上升到当前值
      const startSent = 52 + Math.random() * 8
      value = Math.round(startSent + (currentSent - startSent) * progress + (Math.random() - 0.5) * 6)
      reason = i === 0 ? '初次深交' : progress > 0.6 ? '关系升温' : '逐渐熟悉'
    }

    value = Math.max(5, Math.min(95, value))
    points.push({ timestamp: daysAgo(daysBack), value, reason })
  }

  // 最后一个点就是当前温度
  points[points.length - 1] = {
    timestamp: daysAgo(lastInteractionDays),
    value: currentSent,
    reason: '最近互动',
  }

  return points
}

// ============================================================
// 扩展人物（43 个新增，加上原有 8 个 = 51 个）
// ============================================================
export const EXPANDED_PEOPLE: Person[] = [
  // --- 公司同事/下属（10人）---
  makePerson({ id: 'p-sunlj', name: '孙丽娟', relationship: 'subordinate', sentiment: 65, roleInMyLife: '运营部内容组长', title: '内容运营组长', company: '杭州云启科技', gender: 'female', age: 32, traits: ['细心', '执行力强'], tags: ['工作', '内容运营'], topics: ['内容策略', '小红书运营'], interactionCount: 28, lastInteractionDays: 2, description: '内容运营骨干，擅长小红书和公众号运营', connections: [
    { targetPersonId: 'p-huangyy', relationType: 'colleague', description: '经常需要产品部配合做内容需求', strength: 55 },
    { targetPersonId: 'p-xujia', relationType: 'colleague', description: '运营部同事，活动策划与内容运营配合', strength: 60 },
    { targetPersonId: 'p-chenxy', relationType: 'other', description: '指导陈晓阳内容运营工作', strength: 45 },
  ] }),
  makePerson({ id: 'p-zhoukf', name: '周凯丰', relationship: 'subordinate', sentiment: 52, roleInMyLife: '运营部数据分析师', title: '高级数据分析师', company: '杭州云启科技', gender: 'male', age: 29, traits: ['逻辑强', '内向'], tags: ['工作', '数据分析'], topics: ['数据报表', '用户分析'], interactionCount: 22, lastInteractionDays: 3, description: '沉默寡言但数据敏感度高，报表做得好，纯工作关系', connections: [
    { targetPersonId: 'p-sunlj', relationType: 'colleague', description: '为内容运营提供数据支持', strength: 40 },
    { targetPersonId: 'p-huangyy', relationType: 'colleague', description: '为产品部提供用户分析报告', strength: 35 },
  ] }),
  makePerson({ id: 'p-chenxy', name: '陈晓阳', relationship: 'subordinate', sentiment: 48, roleInMyLife: '运营部新人', title: '运营专员', company: '杭州云启科技', gender: 'male', age: 25, traits: ['积极', '经验不足'], tags: ['工作', '新人'], topics: ['入职培训', '活动策划'], interactionCount: 15, lastInteractionDays: 5, description: '应届毕业生，积极但需要指导，还在磨合期', connections: [
    { targetPersonId: 'p-xujia', relationType: 'colleague', description: '跟许佳学习活动策划', strength: 50 },
    { targetPersonId: 'p-sunlj', relationType: 'other', description: '孙丽娟指导他内容运营', strength: 45 },
  ] }),
  makePerson({ id: 'p-huangyy', name: '黄雅婷', relationship: 'colleague', sentiment: 65, roleInMyLife: '产品部产品经理', title: '产品经理', company: '杭州云启科技', gender: 'female', age: 31, traits: ['沟通好', '有想法'], tags: ['工作', '产品', '跨部门'], topics: ['产品需求', '用户体验'], interactionCount: 18, lastInteractionDays: 4, description: '产品部对接人，经常需要协调运营需求', connections: [
    { targetPersonId: 'p-tangqh', relationType: 'colleague', description: '产品需求需要技术部实现', strength: 50 },
    { targetPersonId: 'p-sunlj', relationType: 'colleague', description: '运营-产品跨部门协作', strength: 45 },
  ] }),
  makePerson({ id: 'p-tangqh', name: '汤启航', relationship: 'colleague', sentiment: 22, roleInMyLife: '技术部后端负责人', title: '后端技术负责人', company: '杭州云启科技', gender: 'male', age: 35, traits: ['技术强', '直率'], tags: ['工作', '技术', '跨部门'], topics: ['接口对接', '技术排期'], interactionCount: 12, lastInteractionDays: 7, description: '技术部负责人，排期经常冲突，公开说"运营需求优先级最低"', connections: [
    { targetPersonId: 'p-linjie', relationType: 'other', description: 'CTO林杰是汤启航的直接上级', strength: 70 },
    { targetPersonId: 'p-huangyy', relationType: 'colleague', description: '产品需求需要技术部排期', strength: 45 },
    { targetPersonId: 'p-cofounder', relationType: 'colleague', description: '以前在技术部共事过', strength: 35 },
  ] }),
  makePerson({ id: 'p-wumin', name: '吴敏', relationship: 'colleague', sentiment: 62, roleInMyLife: 'HRBP', title: 'HRBP', company: '杭州云启科技', gender: 'female', age: 33, traits: ['善解人意', '专业'], tags: ['工作', 'HR'], topics: ['团队建设', '绩效面谈'], interactionCount: 10, lastInteractionDays: 14, description: '负责运营部门的HRBP，上次聊过团队氛围问题', connections: [
    { targetPersonId: 'p-sunlj', relationType: 'colleague', description: 'HRBP关注运营部团队状态', strength: 40 },
    { targetPersonId: 'p-gaolei', relationType: 'colleague', description: '也负责市场部的HRBP工作', strength: 30 },
  ] }),
  makePerson({ id: 'p-fanbl', name: '范柏林', relationship: 'colleague', sentiment: 18, roleInMyLife: '财务部审批人', title: '财务经理', company: '杭州云启科技', gender: 'male', age: 42, traits: ['严格', '按规章办事'], tags: ['工作', '财务', '审批'], topics: ['预算审批', '报销'], interactionCount: 8, lastInteractionDays: 10, description: '财务审批极严格，预算经常被打回，每次沟通都很头疼', connections: [
    { targetPersonId: 'p-gaolei', relationType: 'colleague', description: '市场部预算也需要范柏林审批', strength: 35 },
    { targetPersonId: 'p-linjie', relationType: 'colleague', description: '向CTO汇报财务状况', strength: 30 },
  ] }),
  makePerson({ id: 'p-xujia', name: '许佳', relationship: 'subordinate', sentiment: 68, roleInMyLife: '运营部活动策划', title: '活动运营', company: '杭州云启科技', gender: 'female', age: 27, traits: ['创意多', '有活力'], tags: ['工作', '活动策划'], topics: ['线下活动', '用户活动'], interactionCount: 20, lastInteractionDays: 3, description: '活动策划能力强，上次618活动效果很好', connections: [
    { targetPersonId: 'p-sunlj', relationType: 'colleague', description: '活动内容需要内容组配合', strength: 55 },
    { targetPersonId: 'p-zhaoli', relationType: 'partner', description: '活动创意跟赵丽的外部创意工坊合作', strength: 40 },
  ] }),
  makePerson({ id: 'p-gaolei', name: '高磊', relationship: 'colleague', sentiment: 28, roleInMyLife: '市场部品牌经理', title: '品牌经理', company: '杭州云启科技', gender: 'male', age: 34, traits: ['有野心', '竞争意识强'], tags: ['工作', '市场', '品牌'], topics: ['品牌合作', '市场预算'], interactionCount: 9, lastInteractionDays: 12, description: '市场部品牌经理，跟运营部有预算竞争，会上公开争执过', connections: [
    { targetPersonId: 'p-fanbl', relationType: 'colleague', description: '市场预算也需要范柏林审批', strength: 30 },
    { targetPersonId: 'p-wangsl', relationType: 'other', description: '王思亮是高磊的上级', strength: 45 },
  ] }),
  makePerson({ id: 'p-linjie', name: '林杰', relationship: 'leader', sentiment: 32, roleInMyLife: '公司CTO', title: 'CTO', company: '杭州云启科技', gender: 'male', age: 45, powerDynamic: 'superior', trustLevel: 40, traits: ['技术思维', '结果导向'], tags: ['工作', '高管'], topics: ['技术架构', '数字化转型'], interactionCount: 5, lastInteractionDays: 20, description: '公司CTO，技术出身，对运营完全不理解，经常质疑运营价值', connections: [
    { targetPersonId: 'p-tangqh', relationType: 'other', description: '汤启航是林杰下属技术负责人', strength: 75 },
    { targetPersonId: 'p-wangsl', relationType: 'colleague', description: '高管团队同事', strength: 50 },
    { targetPersonId: 'p-fanbl', relationType: 'colleague', description: '财务向CTO汇报', strength: 30 },
  ] }),

  // --- 客户/合作伙伴（6人）---
  makePerson({ id: 'p-mali', name: '马丽', relationship: 'client', sentiment: 72, roleInMyLife: '大客户方代表', title: '市场总监', company: '上海锦程集团', gender: 'female', age: 38, traits: ['爽快', '要求高'], tags: ['客户', '大客户'], topics: ['年度合作', '合同续签'], interactionCount: 16, lastInteractionDays: 5, description: '大客户方市场总监，爽快但要求高，年合同500万', connections: [
    { targetPersonId: 'p-zhangmin', relationType: 'partner', description: '马丽的广告投放通过张敏的公司执行', strength: 35 },
  ] }),
  makePerson({ id: 'p-wangbo', name: '王博', relationship: 'client', sentiment: 42, roleInMyLife: '潜在客户', title: '运营副总裁', company: '深圳前海科技', gender: 'male', age: 41, traits: ['谨慎', '数据驱动'], tags: ['客户', '潜在客户'], topics: ['方案评估', '报价'], interactionCount: 4, lastInteractionDays: 8, description: '正在谈的潜在客户，对方案很谨慎，感觉他更倾向竞品', connections: [
    { targetPersonId: 'p-zhangpeng', relationType: 'friend', description: '通过MBA同学张鹏介绍认识', strength: 30 },
  ] }),
  makePerson({ id: 'p-zhangmin', name: '张敏', relationship: 'client', sentiment: 60, roleInMyLife: '供应商对接人', title: '销售经理', company: '杭州广告传媒', gender: 'female', age: 30, traits: ['热情', '服务好'], tags: ['供应商', '广告'], topics: ['广告投放', '素材制作'], interactionCount: 14, lastInteractionDays: 6, description: '广告供应商，投放执行很到位' }),
  makePerson({ id: 'p-liqiang', name: '李强', relationship: 'client', sentiment: 30, roleInMyLife: '渠道合作方', title: '渠道总监', company: '浙江渠道联盟', gender: 'male', age: 37, traits: ['精明', '谈判高手'], tags: ['渠道', '合作'], topics: ['渠道分成', '推广资源'], interactionCount: 7, lastInteractionDays: 15, description: '渠道合作方，分成比例谈判非常艰难，坚持要35%', connections: [
    { targetPersonId: 'p-wangsl', relationType: 'other', description: '最终分成需要王思亮拍板', strength: 25 },
  ] }),
  makePerson({ id: 'p-zhaoli', name: '赵丽', relationship: 'client', sentiment: 75, roleInMyLife: '长期合作伙伴', title: '创始人', company: '杭州创意工坊', gender: 'female', age: 36, traits: ['有创意', '靠谱'], tags: ['合作伙伴', '创意'], topics: ['内容共创', '品牌联名'], interactionCount: 12, lastInteractionDays: 7, description: '长期创意合作伙伴，多次联名活动效果很好', connections: [
    { targetPersonId: 'p-xujia', relationType: 'partner', description: '与运营部许佳对接活动创意', strength: 40 },
  ] }),
  makePerson({ id: 'p-qianwei', name: '钱伟', relationship: 'client', sentiment: 12, roleInMyLife: '难缠客户', title: '采购经理', company: '北京华联集团', gender: 'male', age: 44, traits: ['挑剔', '压价'], tags: ['客户', '难缠'], topics: ['合同条款', '价格谈判'], interactionCount: 6, lastInteractionDays: 18, description: '极度难缠的客户，反复压价修改条款，每次沟通都很痛苦' }),

  // --- 朋友/社交（8人）---
  makePerson({ id: 'p-liutao', name: '刘涛', relationship: 'friend', sentiment: 85, roleInMyLife: '大学室友/铁哥们', myRoleInTheirLife: '大学室友/好兄弟', trustLevel: 90, intimacyLevel: 75, gender: 'male', age: 42, hometown: '杭州', traits: ['豪爽', '仗义', '爱喝酒'], tags: ['朋友', '大学同学'], topics: ['钓鱼', '投资', '家庭'], interactionCount: 35, lastInteractionDays: 4, description: '大学四年室友，现在做外贸，每周钓鱼聚会', connections: [
    { targetPersonId: 'p-zhangpeng', relationType: 'friend', description: '通过刘涛认识了投资圈的张鹏', strength: 30 },
    { targetPersonId: 'p-guoyang', relationType: 'friend', description: '刘涛也跟郭阳一起跑过步', strength: 25 },
  ] }),
  makePerson({ id: 'p-wangfang', name: '王芳', relationship: 'friend', sentiment: 65, roleInMyLife: '邻居/朋友', gender: 'female', age: 39, traits: ['热心', '健谈'], tags: ['朋友', '邻居'], topics: ['孩子教育', '社区活动'], interactionCount: 20, lastInteractionDays: 3, description: '隔壁邻居，孩子跟一诺同班，经常一起接送', connections: [
    { targetPersonId: 'p-linxw', relationType: 'friend', description: '王芳跟晓薇是邻居朋友', strength: 50 },
    { targetPersonId: 'p-tutormom', relationType: 'friend', description: '王芳跟赵妈妈在家长群认识', strength: 25 },
  ] }),
  makePerson({ id: 'p-zhangpeng', name: '张鹏', relationship: 'friend', sentiment: 58, roleInMyLife: 'MBA同学', gender: 'male', age: 40, company: '某投资机构', title: '投资经理', traits: ['精明', '人脉广'], tags: ['朋友', 'MBA', '投资'], topics: ['投资机会', '行业趋势'], interactionCount: 11, lastInteractionDays: 10, description: 'MBA同学，在投资机构工作，偶尔分享投资机会，偏利益交换', connections: [
    { targetPersonId: 'p-investor', relationType: 'friend', description: '张鹏介绍了投资人沈一鸣', strength: 35 },
    { targetPersonId: 'p-wangbo', relationType: 'friend', description: '通过张鹏认识了潜在客户王博', strength: 30 },
  ] }),
  makePerson({ id: 'p-chenling', name: '陈玲', relationship: 'friend', sentiment: 60, roleInMyLife: '前同事/朋友', gender: 'female', age: 38, company: '某互联网公司', title: '市场总监', traits: ['独立', '有主见'], tags: ['朋友', '前同事'], topics: ['职场', '行业动态'], interactionCount: 9, lastInteractionDays: 14, description: '前同事，跳槽后保持联系，偶尔约咖啡聊行业' }),
  makePerson({ id: 'p-guoyang', name: '郭阳', relationship: 'friend', sentiment: 68, roleInMyLife: '健身搭子', gender: 'male', age: 35, traits: ['自律', '阳光'], tags: ['朋友', '健身'], topics: ['健身', '跑步', '饮食'], interactionCount: 25, lastInteractionDays: 2, description: '健身房认识的朋友，每周一起跑步两次', connections: [
    { targetPersonId: 'p-coachzhang', relationType: 'friend', description: '郭阳也是在威尔仕健身，认识张教练', strength: 35 },
  ] }),
  makePerson({ id: 'p-yanghui', name: '杨慧', relationship: 'friend', sentiment: 50, roleInMyLife: '晓薇的闺蜜', gender: 'female', age: 40, traits: ['直率', '热心'], tags: ['朋友', '晓薇闺蜜'], topics: ['晓薇近况', '家庭关系'], interactionCount: 8, lastInteractionDays: 20, description: '晓薇的大学闺蜜，偶尔会透露晓薇的真实想法，关系微妙', connections: [
    { targetPersonId: 'p-linxw', relationType: 'friend', description: '杨慧是晓薇的大学闺蜜', strength: 70 },
  ] }),
  makePerson({ id: 'p-sunwei', name: '孙伟', relationship: 'friend', sentiment: 45, roleInMyLife: '老乡', gender: 'male', age: 43, hometown: '绍兴', traits: ['老实', '念旧'], tags: ['朋友', '老乡'], topics: ['老家', '绍兴', '父母'], interactionCount: 6, lastInteractionDays: 30, description: '绍兴老乡，在杭州做小生意，偶尔聚聚聊老家，联系不多', connections: [
    { targetPersonId: 'p-dad', relationType: 'friend', description: '孙伟认识陈志远的父亲', strength: 20 },
    { targetPersonId: 'p-sister', relationType: 'friend', description: '孙伟也认识陈志远的姐姐', strength: 15 },
  ] }),
  makePerson({ id: 'p-zhouyu', name: '周雨', relationship: 'friend', sentiment: 58, roleInMyLife: '读书会朋友', gender: 'female', age: 33, traits: ['文艺', '有思想'], tags: ['朋友', '读书会'], topics: ['读书', '心理学', '成长'], interactionCount: 10, lastInteractionDays: 8, description: '读书会认识的朋友，推荐了很多心理学书籍' }),

  // --- 健康/医疗（4人）---
  makePerson({ id: 'p-drwang', name: '王医生', relationship: 'other', sentiment: 65, roleInMyLife: '家庭医生/体检医生', title: '主治医师', company: '浙一医院', gender: 'male', age: 50, traits: ['专业', '负责'], tags: ['健康', '医生'], topics: ['体检报告', '脂肪肝', '血压'], interactionCount: 5, lastInteractionDays: 10, description: '体检主治医生，建议控制饮酒和加强运动' }),
  makePerson({ id: 'p-drli', name: '李医生', relationship: 'other', sentiment: 55, roleInMyLife: '心理咨询师', title: '心理咨询师', company: '杭州心晴心理咨询', gender: 'female', age: 38, traits: ['温和', '专业'], tags: ['健康', '心理咨询'], topics: ['压力管理', '焦虑', '睡眠'], interactionCount: 3, lastInteractionDays: 25, description: '心理咨询师，去过3次，帮助管理焦虑和失眠，一次500块' }),
  makePerson({ id: 'p-coachzhang', name: '张教练', relationship: 'other', sentiment: 70, roleInMyLife: '私教', title: '健身教练', company: '威尔仕健身', gender: 'male', age: 28, traits: ['严格', '鼓励型'], tags: ['健康', '健身', '私教'], topics: ['减脂', '力量训练', '体态'], interactionCount: 30, lastInteractionDays: 3, description: '私教，每周两次课，帮助减脂和改善体态' }),
  makePerson({ id: 'p-drchen', name: '陈中医', relationship: 'other', sentiment: 50, roleInMyLife: '中医调理', title: '中医师', company: '方回春堂', gender: 'male', age: 55, traits: ['传统', '耐心'], tags: ['健康', '中医'], topics: ['调理', '肝火', '睡眠'], interactionCount: 4, lastInteractionDays: 15, description: '中医调理师，说肝火旺需要调理，开了中药' }),

  // --- 家庭/亲戚（6人）---
  makePerson({ id: 'p-dad', name: '陈建国', relationship: 'family', sentiment: 65, roleInMyLife: '父亲', myRoleInTheirLife: '儿子', trustLevel: 80, intimacyLevel: 60, gender: 'male', age: 68, hometown: '绍兴', traits: ['传统', '要强', '沉默'], tags: ['家庭', '父亲'], topics: ['退休', '身体', '老家'], interactionCount: 15, lastInteractionDays: 7, description: '父亲，退休教师，性格沉默要强，不太会表达感情', connections: [
    { targetPersonId: 'p-mom', relationType: 'family', description: '夫妻关系', strength: 90 },
    { targetPersonId: 'p-sister', relationType: 'family', description: '父女关系', strength: 80 },
    { targetPersonId: 'p-brother', relationType: 'family', description: '父子关系', strength: 75 },
    { targetPersonId: 'p-uncle', relationType: 'family', description: '兄弟关系', strength: 60 },
  ] }),
  makePerson({ id: 'p-sister', name: '陈志芳', relationship: 'family', sentiment: 70, roleInMyLife: '姐姐', myRoleInTheirLife: '弟弟', trustLevel: 85, intimacyLevel: 70, gender: 'female', age: 45, hometown: '绍兴', traits: ['操心', '能干'], tags: ['家庭', '姐姐'], topics: ['父母', '老家', '家庭'], interactionCount: 18, lastInteractionDays: 5, description: '姐姐，在绍兴照顾父母多，偶尔会抱怨陈志远不够关心家里', connections: [
    { targetPersonId: 'p-dad', relationType: 'family', description: '父女关系', strength: 80 },
    { targetPersonId: 'p-mom', relationType: 'family', description: '母女关系', strength: 85 },
    { targetPersonId: 'p-brother', relationType: 'family', description: '姐弟关系', strength: 65 },
    { targetPersonId: 'p-uncle', relationType: 'family', description: '叔侄关系', strength: 45 },
  ] }),
  makePerson({ id: 'p-brother', name: '陈志军', relationship: 'family', sentiment: 38, roleInMyLife: '弟弟', myRoleInTheirLife: '哥哥', trustLevel: 65, intimacyLevel: 50, gender: 'male', age: 38, hometown: '绍兴', company: '某贸易公司', title: '销售经理', traits: ['活泼', '不安分'], tags: ['家庭', '弟弟'], topics: ['生意', '借钱', '创业'], interactionCount: 10, lastInteractionDays: 12, description: '弟弟，做销售，反复借钱不还，上次借了2万说周转至今没还', connections: [
    { targetPersonId: 'p-dad', relationType: 'family', description: '父子关系', strength: 75 },
    { targetPersonId: 'p-sister', relationType: 'family', description: '姐弟关系', strength: 65 },
    { targetPersonId: 'p-uncle', relationType: 'family', description: '叔侄关系', strength: 40 },
  ] }),
  makePerson({ id: 'p-fatherinlaw', name: '林国华', relationship: 'family', sentiment: 35, roleInMyLife: '岳父', myRoleInTheirLife: '女婿', trustLevel: 50, intimacyLevel: 35, gender: 'male', age: 70, hometown: '宁波', traits: ['严肃', '传统', '重面子'], tags: ['家庭', '岳父'], topics: ['事业', '面子', '外孙'], interactionCount: 8, lastInteractionDays: 30, description: '岳父，退休公务员，对陈志远的事业有期待，觉得他应该更上进，每次通话都有压力', connections: [
    { targetPersonId: 'p-motherinlaw', relationType: 'family', description: '夫妻关系', strength: 90 },
    { targetPersonId: 'p-linxw', relationType: 'family', description: '父女关系', strength: 85 },
  ] }),
  makePerson({ id: 'p-motherinlaw', name: '张秀英', relationship: 'family', sentiment: 58, roleInMyLife: '岳母', myRoleInTheirLife: '女婿', trustLevel: 55, intimacyLevel: 45, gender: 'female', age: 67, hometown: '宁波', traits: ['热心', '唠叨', '心疼女儿'], tags: ['家庭', '岳母'], topics: ['晓薇', '一诺', '家务'], interactionCount: 12, lastInteractionDays: 14, description: '岳母，心疼晓薇全职带娃，偶尔暗示陈志远不够体贴', connections: [
    { targetPersonId: 'p-fatherinlaw', relationType: 'family', description: '夫妻关系', strength: 90 },
    { targetPersonId: 'p-linxw', relationType: 'family', description: '母女关系', strength: 88 },
    { targetPersonId: 'p-chenyn', relationType: 'family', description: '祖孙关系', strength: 70 },
  ] }),
  makePerson({ id: 'p-uncle', name: '陈建军', relationship: 'family', sentiment: 25, roleInMyLife: '叔叔', gender: 'male', age: 62, hometown: '绍兴', traits: ['精明', '爱面子'], tags: ['家庭', '亲戚'], topics: ['老家房子', '遗产'], interactionCount: 4, lastInteractionDays: 60, description: '叔叔，老家有房产纠纷，遗产分配有矛盾，偶尔找陈志远商量但总暗藏算计', connections: [
    { targetPersonId: 'p-dad', relationType: 'family', description: '兄弟关系', strength: 60 },
    { targetPersonId: 'p-sister', relationType: 'family', description: '叔侄关系', strength: 45 },
    { targetPersonId: 'p-brother', relationType: 'family', description: '叔侄关系', strength: 40 },
  ] }),

  // --- 教育/孩子相关（3人）---
  makePerson({ id: 'p-teacherwang', name: '王老师', relationship: 'other', sentiment: 60, roleInMyLife: '一诺的班主任', title: '班主任', company: '学军小学', gender: 'female', age: 35, traits: ['负责', '严格'], tags: ['教育', '一诺', '学校'], topics: ['一诺成绩', '编程比赛', '家长会'], interactionCount: 8, lastInteractionDays: 7, description: '一诺的班主任，说一诺编程有天赋但数学需要加强' }),
  makePerson({ id: 'p-teacherli', name: '李老师', relationship: 'other', sentiment: 70, roleInMyLife: '一诺的编程老师', title: '编程教师', company: '少年创客营', gender: 'male', age: 30, traits: ['有激情', '专业'], tags: ['教育', '一诺', '编程'], topics: ['编程比赛', 'Scratch', 'Python'], interactionCount: 10, lastInteractionDays: 5, description: '一诺的编程课外班老师，推荐一诺参加省赛' }),
  makePerson({ id: 'p-tutormom', name: '赵妈妈', relationship: 'other', sentiment: 40, roleInMyLife: '一诺同学家长', gender: 'female', age: 40, traits: ['焦虑型', '攀比'], tags: ['教育', '家长'], topics: ['补习班', '升学', '竞赛'], interactionCount: 6, lastInteractionDays: 10, description: '一诺同学的妈妈，经常分享补习班信息制造焦虑，晓薇看了压力很大' }),

  // --- 生活服务（4人）---
  makePerson({ id: 'p-barber', name: 'Tony老师', relationship: 'other', sentiment: 58, roleInMyLife: '理发师', title: '发型总监', company: 'QB House', gender: 'male', age: 28, traits: ['健谈', '时尚'], tags: ['生活', '理发'], topics: ['发型', '生活'], interactionCount: 20, lastInteractionDays: 12, description: '固定理发师，每月剪一次头发，聊天很放松' }),
  makePerson({ id: 'p-agent', name: '小陈', relationship: 'other', sentiment: 42, roleInMyLife: '房产中介', title: '房产经纪人', company: '链家', gender: 'male', age: 26, traits: ['勤快', '话多'], tags: ['生活', '房产'], topics: ['学区房', '置换', '房价'], interactionCount: 8, lastInteractionDays: 20, description: '房产中介，在看学区房，一诺要上初中了，纯交易关系' }),
  makePerson({ id: 'p-finance', name: '理财顾问小林', relationship: 'other', sentiment: 40, roleInMyLife: '理财顾问', title: '理财顾问', company: '招商银行', gender: 'female', age: 30, traits: ['专业', '推销型'], tags: ['财务', '理财'], topics: ['基金', '保险', '教育金'], interactionCount: 5, lastInteractionDays: 25, description: '银行理财顾问，推荐教育金和基金定投，偏推销型' }),
  makePerson({ id: 'p-driver', name: '老赵', relationship: 'other', sentiment: 65, roleInMyLife: '网约车司机（常坐）', gender: 'male', age: 50, traits: ['健谈', '热心'], tags: ['生活'], topics: ['路况', '生活'], interactionCount: 15, lastInteractionDays: 2, description: '经常坐他的车去公司，聊得很投机' }),

  // --- 创业相关（2人）---
  makePerson({ id: 'p-investor', name: '沈一鸣', relationship: 'other', sentiment: 38, roleInMyLife: '潜在投资人', title: '合伙人', company: '某天使基金', gender: 'male', age: 43, traits: ['犀利', '直接'], tags: ['创业', '投资人'], topics: ['商业模式', '估值', '融资'], interactionCount: 3, lastInteractionDays: 8, description: '张伟华介绍的投资人，对创业项目感兴趣但估值谈不拢，给了两周找合伙人再谈', connections: [
    { targetPersonId: 'p-zhangwh', relationType: 'friend', description: '张伟华介绍的沈一鸣', strength: 50 },
    { targetPersonId: 'p-zhangpeng', relationType: 'friend', description: '张鹏也在投资圈认识沈一鸣', strength: 30 },
  ] }),
  makePerson({ id: 'p-cofounder', name: '周明', relationship: 'other', sentiment: 62, roleInMyLife: '潜在技术合伙人', title: '技术总监', company: '某大厂', gender: 'male', age: 36, traits: ['技术强', '稳重'], tags: ['创业', '合伙人'], topics: ['技术架构', '创业风险', '股权'], interactionCount: 5, lastInteractionDays: 6, description: '如果创业可能拉他做技术合伙人，在考虑中', connections: [
    { targetPersonId: 'p-tangqh', relationType: 'colleague', description: '周明和汤启航以前在同一家公司', strength: 35 },
  ] }),
]

// ============================================================
// 扩展记忆（60 条新增，加上原有 50 条 = 110 条）
// 模拟对话提取风格，覆盖多领域
// ============================================================
function makeMemory(opts: {
  id: string
  type: Memory['type']
  content: string
  source?: string
  confidence?: 'high' | 'medium' | 'low'
  confirmed?: boolean
  relatedPersonIds?: string[]
  tags: string[]
  daysAgo: number
}): Memory {
  return {
    id: opts.id,
    type: opts.type,
    content: opts.content,
    source: opts.source || 'conversation',
    confidence: opts.confidence || 'high',
    confirmed: opts.confirmed ?? true,
    relatedPersonIds: opts.relatedPersonIds || [],
    relatedMemoryIds: [],
    tags: opts.tags,
    createdAt: daysAgo(opts.daysAgo),
    isDemo: 1,
  }
}

export const EXPANDED_MEMORIES: Memory[] = [
  // --- 工作对话记忆（20条）---
  makeMemory({ id: 'm-ext-001', type: 'event', content: '孙丽娟汇报说小红书账号粉丝突破10万了，但转化率只有0.8%，低于行业平均。她建议调整内容策略，增加产品测评类内容', relatedPersonIds: ['p-sunlj'], tags: ['工作', '小红书', '运营数据', '孙丽娟'], daysAgo: 2 }),
  makeMemory({ id: 'm-ext-002', type: 'insight', content: '周凯丰做的用户分析报告显示，30-35岁用户占比从40%下降到28%，用户老龄化严重。他建议做年轻化转型', relatedPersonIds: ['p-zhoukf'], tags: ['工作', '数据分析', '用户画像', '周凯丰'], daysAgo: 3 }),
  makeMemory({ id: 'm-ext-003', type: 'event', content: '陈晓阳第一次独立策划的线下活动来了80人，比预期少。他有点沮丧，我鼓励他说第一次这样不错了，但需要复盘获客渠道', relatedPersonIds: ['p-chenxy'], tags: ['工作', '活动', '新人成长', '陈晓阳'], daysAgo: 5 }),
  makeMemory({ id: 'm-ext-004', type: 'commitment', content: '答应黄雅婷下周三前给产品部提交Q3运营需求文档，包括3个核心功能的运营方案', relatedPersonIds: ['p-huangyy'], tags: ['工作', '承诺', '产品需求', '黄雅婷'], daysAgo: 4 }),
  makeMemory({ id: 'm-ext-005', type: 'emotion', content: '汤启航在技术排期会上说"运营的需求优先级最低"，当场很尴尬。会后找他沟通，他说不是针对我，是技术资源确实不够', relatedPersonIds: ['p-tangqh'], tags: ['工作', '冲突', '跨部门', '汤启航'], daysAgo: 7 }),
  makeMemory({ id: 'm-ext-006', type: 'insight', content: '吴敏HRBP找我聊，说团队满意度调查结果显示运营部"工作压力"项得分全公司最低。她建议我关注团队burnout风险', relatedPersonIds: ['p-wumin'], tags: ['工作', '团队管理', 'HR', '压力'], daysAgo: 14 }),
  makeMemory({ id: 'm-ext-007', type: 'event', content: '范柏林打回了Q3预算申请，说"获客成本预估偏高，需要砍20%"。重新调整了投放预算，砍了信息流保留了搜索', relatedPersonIds: ['p-fanbl'], tags: ['工作', '预算', '财务', '范柏林'], daysAgo: 10 }),
  makeMemory({ id: 'm-ext-008', type: 'event', content: '许佳策划的618活动GMV做到了800万，超目标30%。她在复盘会上分享了经验：提前两周预热+KOL矩阵+限时秒杀', relatedPersonIds: ['p-xujia'], tags: ['工作', '618', '活动', '许佳', 'GMV'], daysAgo: 8 }),
  makeMemory({ id: 'm-ext-009', type: 'insight', content: '高磊在市场预算分配会上跟我争了起来，他认为品牌投放应该占60%，我认为效果投放更重要。最后王思亮拍板各50%', relatedPersonIds: ['p-gaolei', 'p-wangsl'], tags: ['工作', '预算竞争', '市场', '高磊'], daysAgo: 12 }),
  makeMemory({ id: 'm-ext-010', type: 'event', content: '林杰CTO在全员会上宣布要推数字化转型，要求各部门提交技术需求。运营部需要做数据中台对接，工作量很大', relatedPersonIds: ['p-linjie'], tags: ['工作', '数字化转型', 'CTO', '林杰'], daysAgo: 20 }),
  makeMemory({ id: 'm-ext-011', type: 'commitment', content: '答应马丽下周去上海当面汇报年度合作方案，她特别强调要带数据支撑和明年的增长计划', relatedPersonIds: ['p-mali'], tags: ['客户', '承诺', '上海', '马丽', '年度合作'], daysAgo: 5 }),
  makeMemory({ id: 'm-ext-012', type: 'event', content: '王博说我们的方案"创意不错但ROI模型不够扎实"，要求补充竞品对比和三年财务预测。感觉他比较倾向竞品', relatedPersonIds: ['p-wangbo'], tags: ['客户', '方案', '王博', '竞品'], daysAgo: 8 }),
  makeMemory({ id: 'm-ext-013', type: 'event', content: '张敏反馈说上波广告投放CTR只有1.2%，低于预期的2%。素材需要优化，她建议用短视频替代图文', relatedPersonIds: ['p-zhangmin'], tags: ['供应商', '广告', 'CTR', '张敏'], daysAgo: 6 }),
  makeMemory({ id: 'm-ext-014', type: 'commitment', content: '跟李强谈渠道分成，他坚持要35%，我底线是30%。答应回去请示王思亮后答复，期限是本月底', relatedPersonIds: ['p-liqiang', 'p-wangsl'], tags: ['渠道', '谈判', '分成', '李强'], daysAgo: 15 }),
  makeMemory({ id: 'm-ext-015', type: 'event', content: '赵丽提出做品牌联名款，主题是"城市夜归人"， targeting加班族。创意很好，跟运营数据吻合，决定推进', relatedPersonIds: ['p-zhaoli'], tags: ['合作伙伴', '品牌联名', '赵丽', '创意'], daysAgo: 7 }),
  makeMemory({ id: 'm-ext-016', type: 'emotion', content: '钱伟又发邮件要求修改合同条款，已经是第4次了。真的很烦，但这个客户年单300万不能丢', relatedPersonIds: ['p-qianwei'], tags: ['客户', '难缠', '钱伟', '合同'], daysAgo: 18 }),
  makeMemory({ id: 'm-ext-017', type: 'insight', content: '复盘Q2运营数据：获客成本从120元涨到145元，但LTV从800元涨到950元。整体ROI其实是提升的，但王思亮只看CAC', tags: ['工作', '复盘', 'Q2', 'ROI', '获客成本'], daysAgo: 9 }),
  makeMemory({ id: 'm-ext-018', type: 'event', content: '刘文燕今天主动找我，说她知道上次越级汇报让我不高兴，但她是"为了项目好"。我保持了微笑但心里还是不舒服', relatedPersonIds: ['p-liuwy'], tags: ['工作', '职场政治', '刘文燕', '越级'], daysAgo: 6 }),
  makeMemory({ id: 'm-ext-019', type: 'commitment', content: '答应孙丽娟下季度给她涨薪15%，她目前薪资确实偏低。但需要先跟吴敏走HR流程', relatedPersonIds: ['p-sunlj', 'p-wumin'], tags: ['工作', '涨薪', '承诺', '孙丽娟'], daysAgo: 11 }),
  makeMemory({ id: 'm-ext-020', type: 'event', content: '赵海明私下告诉我，王思亮在管理层会上提到"运营部需要新鲜血液"，可能要空降一个副总监。不知道是不是要架空我', relatedPersonIds: ['p-zhaohm', 'p-wangsl'], tags: ['工作', '职场', '赵海明', '王思亮', '副总监'], daysAgo: 4 }),

  // --- 家庭/生活对话记忆（15条）---
  makeMemory({ id: 'm-ext-021', type: 'event', content: '晓薇说她投了三个人力资源的岗位，但都没回复。她有点灰心，说"全职妈妈5年了，市场不认了"。我安慰她但不知道说什么好', relatedPersonIds: ['p-linxw'], tags: ['家庭', '晓薇', '求职', '全职妈妈'], daysAgo: 3 }),
  makeMemory({ id: 'm-ext-022', type: 'commitment', content: '答应一诺暑假带他去参加浙江省青少年编程大赛，李老师说他有希望拿奖。需要每周六送他去集训', relatedPersonIds: ['p-chenyn', 'p-teacherli'], tags: ['家庭', '一诺', '编程比赛', '承诺', '暑假'], daysAgo: 5 }),
  makeMemory({ id: 'm-ext-023', type: 'event', content: '姐姐陈志芳打电话来，说妈妈最近血压偏高，让她少操劳。姐姐语气有点怪，好像在怪我不够关心妈', relatedPersonIds: ['p-sister', 'p-mom'], tags: ['家庭', '姐姐', '妈妈', '血压'], daysAgo: 5 }),
  makeMemory({ id: 'm-ext-024', type: 'event', content: '弟弟陈志军又来借钱，说生意周转困难要借3万。上次借的2万还没还。这次犹豫了，最后借了1万', relatedPersonIds: ['p-brother'], tags: ['家庭', '弟弟', '借钱'], daysAgo: 12 }),
  makeMemory({ id: 'm-ext-025', type: 'event', content: '岳父林国华来电话，问"志远啊，你那个总监当了几年了？有没有往上走的机会？"感觉他在催我上进', relatedPersonIds: ['p-fatherinlaw'], tags: ['家庭', '岳父', '事业', '压力'], daysAgo: 14 }),
  makeMemory({ id: 'm-ext-026', type: 'event', content: '岳母张秀英来杭州住了一周，帮晓薇带孩子。她做饭时唠叨说"志远啊，你也多帮帮晓薇，她一个人带孩子不容易"', relatedPersonIds: ['p-motherinlaw', 'p-linxw'], tags: ['家庭', '岳母', '晓薇'], daysAgo: 14 }),
  makeMemory({ id: 'm-ext-027', type: 'event', content: '父亲陈建国打电话来，沉默了半天说"你妈想你了，有空回来一趟"。他从来不说想我，这已经是最大表达了', relatedPersonIds: ['p-dad', 'p-mom'], tags: ['家庭', '父亲', '母亲', '绍兴', '想念'], daysAgo: 7 }),
  makeMemory({ id: 'm-ext-028', type: 'commitment', content: '答应晓薇端午节回绍兴看爸妈，但公司可能要加班。晓薇说"你每次都这样"，语气很失望', relatedPersonIds: ['p-linxw', 'p-mom', 'p-dad'], tags: ['家庭', '端午', '承诺', '绍兴', '加班'], daysAgo: 4 }),
  makeMemory({ id: 'm-ext-029', type: 'event', content: '王芳邻居说她儿子数学考了98分，问一诺考得怎么样。一诺考了85分，晓薇回来后有点焦虑说要找补习班', relatedPersonIds: ['p-wangfang', 'p-chenyn', 'p-linxw'], tags: ['家庭', '一诺', '教育', '攀比'], daysAgo: 3 }),
  makeMemory({ id: 'm-ext-030', type: 'event', content: '王老师班主任微信说一诺最近上课走神，可能是编程比赛压力太大。建议家长多关注孩子情绪', relatedPersonIds: ['p-teacherwang', 'p-chenyn'], tags: ['教育', '一诺', '学校', '王老师'], daysAgo: 7 }),
  makeMemory({ id: 'm-ext-031', type: 'event', content: '杨慧（晓薇闺蜜）约晓薇喝下午茶，回来后晓薇心情好了很多。杨慧可能开导了她，但晓薇不跟我说聊了什么', relatedPersonIds: ['p-yanghui', 'p-linxw'], tags: ['家庭', '晓薇', '闺蜜'], daysAgo: 20 }),
  makeMemory({ id: 'm-ext-032', type: 'event', content: '叔叔陈建军打电话来，说老家的房子拆迁有消息了，让我回去商量。可能涉及遗产分配，姐姐和弟弟都要到场', relatedPersonIds: ['p-uncle', 'p-sister', 'p-brother'], tags: ['家庭', '拆迁', '遗产', '绍兴'], daysAgo: 30 }),
  makeMemory({ id: 'm-ext-033', type: 'commitment', content: '答应一诺如果他编程比赛拿了省赛前3名，就给他买他想要的那台Switch。他高兴得跳起来', relatedPersonIds: ['p-chenyn'], tags: ['家庭', '一诺', '承诺', 'Switch', '编程'], daysAgo: 5 }),
  makeMemory({ id: 'm-ext-034', type: 'event', content: '晓薇半夜失眠，坐在客厅发呆。我出来问她怎么了，她说"觉得自己这辈子就这样了"。心里很不是滋味', relatedPersonIds: ['p-linxw'], tags: ['家庭', '晓薇', '失眠', '情绪'], daysAgo: 8 }),
  makeMemory({ id: 'm-ext-035', type: 'event', content: '赵妈妈在家长群里发了一堆暑假集训班信息，晓薇看了更焦虑了。我劝她一诺不需要那么多补习班', relatedPersonIds: ['p-tutormom', 'p-linxw', 'p-chenyn'], tags: ['教育', '家长群', '焦虑', '补习班'], daysAgo: 10 }),

  // --- 健康对话记忆（10条）---
  makeMemory({ id: 'm-ext-036', type: 'event', content: '王医生看了体检报告，说脂肪肝从轻度变成中度了，甘油三酯2.8偏高。明确要求戒酒3个月、每天运动30分钟', relatedPersonIds: ['p-drwang'], tags: ['健康', '体检', '脂肪肝', '甘油三酯', '戒酒'], daysAgo: 10 }),
  makeMemory({ id: 'm-ext-037', type: 'event', content: '李医生心理咨询师说我的焦虑评分从12分升到了16分（GAD-7量表），建议增加咨询频率到每周一次。但一次500块有点贵', relatedPersonIds: ['p-drli'], tags: ['健康', '心理咨询', '焦虑', 'GAD-7'], daysAgo: 25 }),
  makeMemory({ id: 'm-ext-038', type: 'commitment', content: '张教练制定了3个月减脂计划：每周2次力量训练+3次有氧，目标减重8公斤。体脂率从26%降到20%', relatedPersonIds: ['p-coachzhang'], tags: ['健康', '健身', '减脂', '张教练', '承诺'], daysAgo: 3 }),
  makeMemory({ id: 'm-ext-039', type: 'event', content: '陈中医把脉说肝火旺、脾胃虚弱，开了两周中药。说"年轻人少熬夜少喝酒，药只是辅助"。药很苦但坚持在喝', relatedPersonIds: ['p-drchen'], tags: ['健康', '中医', '肝火', '中药'], daysAgo: 15 }),
  makeMemory({ id: 'm-ext-040', type: 'habit', content: '郭阳约我每周二四早上6:30去西湖跑步5公里。已经坚持了两周，感觉精力确实好了一些，但早起很痛苦', relatedPersonIds: ['p-guoyang'], tags: ['健康', '跑步', '习惯', '郭阳', '西湖'], daysAgo: 2 }),
  makeMemory({ id: 'm-ext-041', type: 'event', content: '最近失眠严重，凌晨2-3点才睡着，早上7点闹钟响就头疼。李医生教了4-7-8呼吸法，试了几天有点效果', relatedPersonIds: ['p-drli'], tags: ['健康', '失眠', '呼吸法', '焦虑'], daysAgo: 6 }),
  makeMemory({ id: 'm-ext-042', type: 'insight', content: '张教练说我的体态有圆肩驼背问题，长期伏案导致的。他加了弹力带划船和面拉动作，说至少3个月才能改善', relatedPersonIds: ['p-coachzhang'], tags: ['健康', '体态', '圆肩', '健身'], daysAgo: 5 }),
  makeMemory({ id: 'm-ext-043', type: 'event', content: '王医生说血压135/88处于高血压前期，如果不改善生活方式可能要吃药。这让我有点害怕，决定认真减脂', relatedPersonIds: ['p-drwang'], tags: ['健康', '血压', '高血压前期'], daysAgo: 10 }),
  makeMemory({ id: 'm-ext-044', type: 'habit', content: '最近养成了喝白酒助眠的习惯，每晚2-3两。王医生和李医生都说这样不行，酒精会破坏睡眠质量', tags: ['健康', '白酒', '睡眠', '习惯'], daysAgo: 7 }),
  makeMemory({ id: 'm-ext-045', type: 'event', content: '郭阳推荐了一款睡眠监测手环，数据显示深睡只有45分钟/晚，远低于正常值。难怪白天总是犯困', relatedPersonIds: ['p-guoyang'], tags: ['健康', '睡眠', '手环', '深睡'], daysAgo: 4 }),

  // --- 社交/朋友对话记忆（8条）---
  makeMemory({ id: 'm-ext-046', type: 'event', content: '刘涛钓鱼时说他最近投了50万到一个跨境电商项目，年化收益15%。问我要不要跟投，说"窗口期就这一个月"', relatedPersonIds: ['p-liutao'], tags: ['朋友', '投资', '跨境电商', '刘涛'], daysAgo: 4 }),
  makeMemory({ id: 'm-ext-047', type: 'event', content: '张鹏MBA同学约咖啡，聊到一个SaaS项目正在融资，估值5000万。他说"你要是创业我可以帮你对接"', relatedPersonIds: ['p-zhangpeng'], tags: ['朋友', 'MBA', '投资', 'SaaS', '张鹏'], daysAgo: 10 }),
  makeMemory({ id: 'm-ext-048', type: 'event', content: '陈玲前同事说她公司市场总监离职了，问我要不要试试。薪资比现在高30%但要去上海。有点心动但不想离开杭州', relatedPersonIds: ['p-chenling'], tags: ['朋友', '跳槽', '机会', '上海', '陈玲'], daysAgo: 14 }),
  makeMemory({ id: 'm-ext-049', type: 'event', content: '周雨读书会推荐了《被讨厌的勇气》，说阿德勒心理学对处理人际关系很有帮助。买了一本但还没开始看', relatedPersonIds: ['p-zhouyu'], tags: ['朋友', '读书', '心理学', '阿德勒'], daysAgo: 8 }),
  makeMemory({ id: 'm-ext-050', type: 'event', content: '孙伟老乡从绍兴来杭州，带了自家酿的黄酒和梅干菜。聊了很多老家的事，说爸妈经常念叨我', relatedPersonIds: ['p-sunwei', 'p-mom', 'p-dad'], tags: ['朋友', '老乡', '绍兴', '黄酒'], daysAgo: 30 }),
  makeMemory({ id: 'm-ext-051', type: 'event', content: '王芳邻居说她老公升了部门经理，全家要去千岛湖庆祝。晓薇听了回来跟我说"你看人家多疼老婆"', relatedPersonIds: ['p-wangfang', 'p-linxw'], tags: ['朋友', '邻居', '攀比', '千岛湖'], daysAgo: 12 }),
  makeMemory({ id: 'm-ext-052', type: 'event', content: '刘涛喝多了说"老陈你变了，以前多洒脱的一个人，现在满脑子都是KPI和房贷"。被他说得愣住了', relatedPersonIds: ['p-liutao'], tags: ['朋友', '刘涛', '感悟', '压力'], daysAgo: 4 }),
  makeMemory({ id: 'm-ext-053', type: 'event', content: '陈玲说她从大厂离职了，去了一家创业公司做CMO。说"在大厂太安逸了，想趁年轻拼一把"。有点羡慕她的勇气', relatedPersonIds: ['p-chenling'], tags: ['朋友', '跳槽', '创业', '陈玲'], daysAgo: 14 }),

  // --- 财务/理财记忆（4条）---
  makeMemory({ id: 'm-ext-054', type: 'event', content: '理财顾问小林推荐了一款教育金保险，年缴3万缴10年，一诺18岁可以领30万。在考虑要不要买', relatedPersonIds: ['p-finance'], tags: ['财务', '教育金', '保险', '一诺'], daysAgo: 25 }),
  makeMemory({ id: 'm-ext-055', type: 'insight', content: '算了下家庭月开支：房贷1.2万+一诺学费3000+生活费8000+车贷3500=2.65万。如果创业收入断了，存款只能撑6个月', tags: ['财务', '房贷', '开支', '创业风险'], daysAgo: 9 }),
  makeMemory({ id: 'm-ext-056', type: 'event', content: '小陈房产中介说学区房价格降了，学军小学学区房从8万降到6.5万。如果现在买90平大概580万，首付需要180万', relatedPersonIds: ['p-agent'], tags: ['财务', '学区房', '房产', '一诺'], daysAgo: 20 }),
  makeMemory({ id: 'm-ext-057', type: 'event', content: '理财顾问小林说基金定投组合今年亏了8%，建议继续持有不要割肉。但看着账户亏损有点焦虑', relatedPersonIds: ['p-finance'], tags: ['财务', '基金', '亏损', '定投'], daysAgo: 25 }),

  // --- 创业相关记忆（3条）---
  makeMemory({ id: 'm-ext-058', type: 'event', content: '沈一鸣投资人约了咖啡，说"项目方向不错但团队不完整，你需要一个技术合伙人"。他给了两周时间找合伙人再谈', relatedPersonIds: ['p-investor', 'p-zhangwh'], tags: ['创业', '投资人', '沈一鸣', '合伙人'], daysAgo: 8 }),
  makeMemory({ id: 'm-ext-059', type: 'event', content: '周明技术合伙人说他需要两周考虑，主要顾虑是：1.家庭稳定 2.创业风险 3.股权分配。约了下周当面聊', relatedPersonIds: ['p-cofounder'], tags: ['创业', '合伙人', '周明', '股权'], daysAgo: 6 }),
  makeMemory({ id: 'm-ext-060', type: 'insight', content: '张伟华又催了，说"窗口期就两周，再不决定机会就没了"。但如果创业，晓薇刚想重返职场、一诺要比赛、体检报告也不好...时机真的不对', relatedPersonIds: ['p-zhangwh', 'p-linxw', 'p-chenyn'], tags: ['创业', '张伟华', '时机', '纠结', '家庭', '健康'], daysAgo: 1 }),
]

