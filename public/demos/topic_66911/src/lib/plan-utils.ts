import { type Milestone } from './milestone-store'
export { type Milestone, getMilestones, setMilestones } from './milestone-store'

export interface PlanTemplate {
  id: string
  name: string
  description: string
  icon?: React.ReactNode
  tasks: string[]
  milestones: Omit<Milestone, 'id'>[]
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'bachelor',
    name: '本科毕业论文',
    description: '适用于本科毕业设计/论文写作',
    tasks: [
      '确定选题并撰写开题报告',
      '收集整理相关文献资料',
      '完成文献综述',
      '确定研究方法和实验方案',
      '开展实验/调研/数据收集',
      '撰写论文初稿（引言、方法、结果）',
      '完善论文讨论和结论部分',
      '修改论文格式和参考文献',
      '导师审阅与修改',
      '论文查重与降重',
      '准备答辩PPT',
      '参加论文答辩',
    ],
    milestones: [
      { name: '完成开题报告', deadline: '', completed: false },
      { name: '完成文献综述', deadline: '', completed: false },
      { name: '完成初稿', deadline: '', completed: false },
      { name: '定稿提交', deadline: '', completed: false },
    ],
  },
  {
    id: 'master',
    name: '硕士毕业论文',
    description: '适用于硕士研究生学位论文',
    tasks: [
      '选题论证与开题答辩',
      '系统文献调研与综述撰写',
      '研究方案设计与方法论学习',
      '实验/调研/数据收集阶段一',
      '实验/调研/数据收集阶段二',
      '数据分析与初步结果整理',
      '撰写论文核心章节',
      '中期检查与汇报',
      '补充实验与完善分析',
      '撰写论文全文初稿',
      '导师多轮审阅修改',
      '论文查重与格式审查',
      '预答辩准备与演练',
      '正式答辩',
    ],
    milestones: [
      { name: '通过开题答辩', deadline: '', completed: false },
      { name: '完成中期检查', deadline: '', completed: false },
      { name: '完成论文初稿', deadline: '', completed: false },
      { name: '通过预答辩', deadline: '', completed: false },
      { name: '正式答辩通过', deadline: '', completed: false },
    ],
  },
  {
    id: 'journal',
    name: '期刊论文',
    description: '适用于学术期刊投稿',
    tasks: [
      '确定研究问题和创新点',
      '文献调研与相关工作梳理',
      '实验设计与数据收集',
      '数据分析与结果可视化',
      '撰写论文框架',
      '撰写引言与相关工作',
      '撰写方法与实验',
      '撰写结果与讨论',
      '撰写摘要与结论',
      '内部审阅与修改',
      '选择目标期刊并调整格式',
      '投稿前查重与润色',
      '提交稿件',
      '回复审稿意见（Revision）',
      '最终校对与发表',
    ],
    milestones: [
      { name: '完成实验与数据分析', deadline: '', completed: false },
      { name: '完成初稿', deadline: '', completed: false },
      { name: '投稿成功', deadline: '', completed: false },
      { name: '接收发表', deadline: '', completed: false },
    ],
  },
]
