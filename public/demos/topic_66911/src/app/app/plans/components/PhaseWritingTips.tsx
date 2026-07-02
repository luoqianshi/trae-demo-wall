'use client'

import { useState, useMemo } from 'react'
import {
  BookOpen,
  ListTree,
  PenLine,
  Sparkles,
  Search,
  StickyNote,
  Zap,
  LayoutGrid,
  Target,
  Hash,
  Clock,
  AlignLeft,
  Brain,
  FileCheck,
  Languages,
  GitBranch,
} from 'lucide-react'

/* ============================
   类型定义
   ============================ */

/** 写作阶段枚举 */
type WritingPhase = 'literature' | 'outline' | 'drafting' | 'polishing'

/** 阶段元信息 */
interface PhaseMeta {
  key: WritingPhase
  label: string
  description: string
  /** 进度范围 [start, end) 用于自动判断阶段 */
  range: [number, number]
  /** 阶段对应的图标 */
  icon: React.ReactNode
  /** 阶段对应的主题色 */
  color: string
  /** 阶段对应的浅色背景 */
  bgColor: string
}

/** 单条写作建议 */
interface WritingTip {
  icon: React.ReactNode
  title: string
  description: string
}

/* ============================
   常量：阶段元信息
   ============================ */

const PHASES: PhaseMeta[] = [
  {
    key: 'literature',
    label: '文献调研期',
    description: '广泛阅读文献，建立知识框架',
    range: [0, 25],
    icon: <BookOpen className="w-5 h-5" />,
    color: '#4A6B8A',
    bgColor: '#EBF0F5',
  },
  {
    key: 'outline',
    label: '提纲搭建期',
    description: '规划章节结构，提炼核心论点',
    range: [25, 50],
    icon: <ListTree className="w-5 h-5" />,
    color: '#8B5E3C',
    bgColor: '#F5F0EB',
  },
  {
    key: 'drafting',
    label: '分章撰写期',
    description: '按章节逐步推进，保持写作节奏',
    range: [50, 80],
    icon: <PenLine className="w-5 h-5" />,
    color: '#B54A3A',
    bgColor: '#F5EBEB',
  },
  {
    key: 'polishing',
    label: '修改润色期',
    description: '打磨语言表达，完善逻辑结构',
    range: [80, 101],
    icon: <Sparkles className="w-5 h-5" />,
    color: '#C4A882',
    bgColor: '#F5F2ED',
  },
]

/* ============================
   常量：各阶段写作建议
   ============================ */

const TIPS_MAP: Record<WritingPhase, WritingTip[]> = {
  /* ---------- 文献调研期 ---------- */
  literature: [
    {
      icon: <Search className="w-5 h-5" />,
      title: '系统化文献检索策略',
      description:
        '采用"滚雪球"式检索法：从核心论文出发，追溯其参考文献，同时利用 Google Scholar 的"被引用"功能追踪后续研究。建议先精读 3-5 篇综述性文献，建立领域全貌，再逐步深入到具体研究方向。',
    },
    {
      icon: <StickyNote className="w-5 h-5" />,
      title: '结构化笔记整理方法',
      description:
        '为每篇文献建立标准化阅读笔记，包含：研究问题、方法论、核心发现、局限性、与自身研究的关联。推荐使用"双栏笔记法"——左栏记录原文要点，右栏写下自己的思考与批判。',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: '高效阅读三遍法',
      description:
        '第一遍：快速浏览标题、摘要、结论，判断相关性（5分钟/篇）；第二遍：精读引言和方法论，理解研究框架（30分钟/篇）；第三遍：深度研读结果与讨论，提取可引用素材（1小时/篇）。非核心文献仅执行第一遍即可。',
    },
    {
      icon: <LayoutGrid className="w-5 h-5" />,
      title: '文献矩阵管理',
      description:
        '建立文献对比矩阵表格，横向为研究主题维度，纵向为各篇文献，填入每篇文献在该维度上的核心观点。这有助于发现研究空白、识别学术争议点，为后续的文献综述撰写奠定基础。',
    },
  ],

  /* ---------- 提纲搭建期 ---------- */
  outline: [
    {
      icon: <Target className="w-5 h-5" />,
      title: '核心论点逆向推导',
      description:
        '从研究结论出发，逆向推导支撑该结论所需的核心论据和逻辑链条。每个核心论点对应一个章节，确保全文形成"总—分—总"的严密论证结构。建议先写一页纸的"论点陈述"，反复打磨后再展开为章节提纲。',
    },
    {
      icon: <LayoutGrid className="w-5 h-5" />,
      title: '论文章节结构设计',
      description:
        '采用 IMRaD 结构（引言、方法、结果、讨论）为骨架，根据学科特点灵活调整。引言约占全文 15%-20%，方法占 15%-20%，结果占 25%-30%，讨论占 20%-25%。每个章节下设 2-4 个小节，保持层次清晰。',
    },
    {
      icon: <Hash className="w-5 h-5" />,
      title: '字数分配策略',
      description:
        '根据各章节的论证权重分配字数，而非平均分配。核心论证章节可分配更多篇幅，过渡性章节则精简。建议在提纲阶段就标注每节的目标字数，并预留 10%-15% 的弹性空间用于后续调整。',
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: '逻辑衔接预设计',
      description:
        '在提纲中明确标注章节之间的逻辑过渡关系：是递进、并列、对比还是因果。为每个章节开头设计"承上启下"的过渡段落大纲，确保全文读起来是一个连贯的整体，而非孤立章节的拼凑。',
    },
  ],

  /* ---------- 分章撰写期 ---------- */
  drafting: [
    {
      icon: <Clock className="w-5 h-5" />,
      title: '每日写作节奏管理',
      description:
        '建议采用"晨间写作法"：每天在精力最充沛的时段（通常是上午）进行 2-3 小时的集中写作。设定每日最低字数目标（如 500 字），完成后即可停止，培养持续的写作习惯。切忌"暴饮暴食"式的突击写作。',
    },
    {
      icon: <AlignLeft className="w-5 h-5" />,
      title: '段落结构化写作',
      description:
        '每个段落遵循"主题句—支撑论据—小结过渡"的结构。主题句概括段落核心观点，中间 2-4 句提供证据或分析，末句自然过渡到下一段。写作时先完成所有段落的首句，再逐段填充，可大幅提升写作效率。',
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: '克服写作拖延的"烂草稿"策略',
      description:
        '接受"第一稿不必完美"的理念。写作初期只关注内容的完整性和逻辑的合理性，暂时忽略措辞、格式和引用细节。将修改工作推迟到润色阶段，避免在撰写过程中因追求完美而陷入停滞。',
    },
    {
      icon: <PenLine className="w-5 h-5" />,
      title: '分章节独立推进法',
      description:
        '不必严格按照章节顺序撰写。建议从最有把握、资料最充实的章节开始，快速建立信心和写作惯性。引言和结论可放在最后撰写，因为此时对全文内容的理解最为深入，更容易写出精准的概述。',
    },
  ],

  /* ---------- 修改润色期 ---------- */
  polishing: [
    {
      icon: <FileCheck className="w-5 h-5" />,
      title: '格式校验清单',
      description:
        '逐项检查：标题层级是否统一、图表编号与引用是否对应、参考文献格式是否符合目标期刊要求、页边距与行距是否合规、摘要字数是否在限制范围内。建议打印一份目标期刊的作者指南，逐条对照检查。',
    },
    {
      icon: <Languages className="w-5 h-5" />,
      title: '学术语言润色技巧',
      description:
        '消除口语化表达，将"所以"改为"因此"，将"但是"改为"然而"。避免使用绝对化表述（如"证明了"），改用更审慎的学术用语（如"表明""提示""支持了……的观点"）。检查并消除冗余表述，每句话只传递一个核心信息。',
    },
    {
      icon: <GitBranch className="w-5 h-5" />,
      title: '逻辑链条梳理方法',
      description:
        '采用"段落摘要法"检验逻辑：将每个段落浓缩为一句话，依次排列后检查全文论证脉络是否连贯。重点关注：论点是否有充分证据支撑、因果推断是否合理、是否存在逻辑跳跃。可请导师或同行仅阅读段落摘要，快速发现逻辑漏洞。',
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: '多轮修改策略',
      description:
        '建议至少进行三轮修改：第一轮关注结构与逻辑（章节顺序、论证链条），第二轮关注内容完整性（论据充分性、文献覆盖度），第三轮关注语言与格式（措辞精确性、引用规范性）。每轮修改间隔至少一天，以获得"新鲜视角"。',
    },
  ],
}

/* ============================
   辅助函数
   ============================ */

/**
 * 根据计划进度百分比自动判断当前所处的写作阶段
 * @param progress - 计划进度（0-100）
 * @returns 当前阶段 key
 */
function detectPhase(progress: number): WritingPhase {
  if (progress < 25) return 'literature'
  if (progress < 50) return 'outline'
  if (progress < 80) return 'drafting'
  return 'polishing'
}

/* ============================
   组件属性
   ============================ */

interface PhaseWritingTipsProps {
  /** 当前计划的整体进度百分比（0-100） */
  progress: number
}

/* ============================
   主组件
   ============================ */

export default function PhaseWritingTips({ progress }: PhaseWritingTipsProps) {
  // 根据进度自动检测当前阶段
  const autoPhase = detectPhase(progress)

  // 当前激活的 Tab（默认为自动检测的阶段，支持手动切换）
  const [activePhase, setActivePhase] = useState<WritingPhase>(autoPhase)

  // 当外部进度变化时，同步更新自动阶段（仅在用户未手动切换时）
  const currentPhaseMeta = PHASES.find(p => p.key === activePhase)!
  const currentTips = TIPS_MAP[activePhase]

  // 计算当前阶段在整体进度条中的位置（用于阶段进度指示）
  const phaseProgress = useMemo(() => {
    const meta = PHASES.find(p => p.key === activePhase)!
    const [start, end] = meta.range
    // 将全局进度映射到当前阶段内的局部进度
    if (progress < start) return 0
    if (progress >= end) return 100
    return Math.round(((progress - start) / (end - start)) * 100)
  }, [progress, activePhase])

  return (
    <div className="bg-white border border-[#E5DDD4] rounded-[14px] overflow-hidden transition-all duration-300 hover:border-[#C4A882] hover:shadow-lg">
      {/* ===== 顶部：阶段进度条与标题 ===== */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ backgroundColor: currentPhaseMeta.bgColor, color: currentPhaseMeta.color }}
          >
            {currentPhaseMeta.icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#2C2420]">
              阶段写作建议
            </h3>
            <p className="text-xs text-[#8A7E74]">{currentPhaseMeta.description}</p>
          </div>
        </div>

        {/* 全局四阶段进度条 */}
        <div className="flex items-center gap-1 mb-2">
          {PHASES.map((phase, idx) => {
            const isActive = phase.key === activePhase
            const isPast = progress >= phase.range[1]
            return (
              <button
                key={phase.key}
                onClick={() => setActivePhase(phase.key)}
                className="flex-1 group relative"
                title={phase.label}
              >
                {/* 阶段色块 */}
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isPast
                      ? phase.color
                      : isActive
                        ? phase.color
                        : '#F0EBE5',
                    opacity: isPast ? 0.5 : isActive ? 1 : 1,
                  }}
                />
                {/* 阶段标签 */}
                <p
                  className={`text-[10px] mt-1 text-center transition-colors duration-300 ${
                    isActive ? 'font-medium' : ''
                  }`}
                  style={{ color: isActive ? phase.color : '#B5A99A' }}
                >
                  {phase.label}
                </p>
              </button>
            )
          })}
        </div>

        {/* 当前阶段内的局部进度 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-[#F0EBE5] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${phaseProgress}%`,
                backgroundColor: currentPhaseMeta.color,
              }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: currentPhaseMeta.color }}>
            {phaseProgress}%
          </span>
        </div>
      </div>

      {/* ===== Tab 切换栏 ===== */}
      <div className="px-5 border-t border-[#F0EBE5]">
        <div className="flex gap-1 py-2 overflow-x-auto">
          {PHASES.map(phase => {
            const isActive = phase.key === activePhase
            return (
              <button
                key={phase.key}
                onClick={() => setActivePhase(phase.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  backgroundColor: isActive ? phase.bgColor : 'transparent',
                  color: isActive ? phase.color : '#8A7E74',
                }}
              >
                {phase.icon}
                {phase.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ===== 建议卡片列表 ===== */}
      <div className="p-5 pt-3 space-y-3">
        {currentTips.map((tip, idx) => (
          <div
            key={idx}
            className="flex gap-3 p-4 rounded-xl border border-[#F0EBE5] transition-all duration-200 hover:border-[#C4A882] hover:shadow-sm group"
          >
            {/* 图标区域 */}
            <div
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200"
              style={{
                backgroundColor: currentPhaseMeta.bgColor,
                color: currentPhaseMeta.color,
              }}
            >
              {tip.icon}
            </div>

            {/* 文字内容 */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[#2C2420] mb-1">
                {tip.title}
              </h4>
              <p className="text-xs leading-relaxed text-[#8A7E74]">
                {tip.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
