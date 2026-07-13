import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Sparkles, Clock, Moon, CalendarDays, Plus, Zap, Play, Loader2, Hand } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTourStore, TOUR_STAGES, type TourStageId } from '@/store/tourStore';

// ===== 阶段配置 =====
interface StageConfig {
  // 需要导航到的路由（undefined 表示不导航，停留当前页）
  route?: string;
  // 需要高亮的目标元素选择器（undefined 表示居中卡片，不高亮具体元素）
  targetSelector?: string;
  // 功能名称（标注卡标题）
  title: string;
  // 功能说明（标注卡正文）
  description: string;
  // 提示卡位置：'center' 居中卡片；其他表示高亮阶段的标注卡位置
  arrow: 'top' | 'bottom' | 'left' | 'right' | 'center';
  // 图标
  icon: React.ReactNode;
  // 主题色（用于图标背景）
  color: string;
  // 是否必须点击高亮元素才能推进（true 时不显示"知道了"按钮）
  // routine-complete: 必须点击"完成设置"才能进入计划环节
  // planner-focus: 必须点击"专注"开始专注才能完成引导
  requireClick?: boolean;
}

const STAGE_CONFIG: Record<TourStageId, StageConfig> = {
  // ===== 固定作息设置引导 =====
  'routine-intro': {
    title: '⏰ 设置固定作息',
    description:
      '告诉我们你的日常作息，系统会据此计算空闲时间。\n接下来逐一介绍每个按钮的功能。',
    arrow: 'center',
    icon: <Clock size={32} className="text-white" />,
    color: 'bg-corgi-orange',
  },
  'routine-mode': {
    route: '/routine',
    targetSelector: '[data-tour="routine-mode"]',
    title: '作息模式切换',
    description: '工作日、周末、假期三套作息独立设置，互不影响',
    arrow: 'bottom',
    icon: <CalendarDays size={20} className="text-white" />,
    color: 'bg-corgi-dark',
  },
  'routine-sleep': {
    route: '/routine',
    targetSelector: '[data-tour="routine-sleep"]',
    title: '睡眠时段',
    description: '设置睡觉和起床时间，建议保证 8 小时以上睡眠',
    arrow: 'bottom',
    icon: <Moon size={20} className="text-white" />,
    color: 'bg-indigo-500',
  },
  'routine-item': {
    route: '/routine',
    targetSelector: '[data-tour="routine-item"]',
    title: '作息项',
    description: '可调整开始/结束时间、⭐标记重要、🗑删除、设置重复日',
    arrow: 'bottom',
    icon: <Clock size={20} className="text-white" />,
    color: 'bg-berry-rose',
  },
  'routine-add': {
    route: '/routine',
    targetSelector: '[data-tour="routine-add"]',
    title: '添加作息项',
    description: '点击此按钮可添加新的作息项',
    arrow: 'bottom',
    icon: <Plus size={20} className="text-white" />,
    color: 'bg-mint-deep',
  },
  'routine-complete': {
    route: '/routine',
    targetSelector: '[data-tour="routine-complete"]',
    title: '完成设置',
    description: '设置完成后点击此按钮，进入计划制定环节',
    arrow: 'bottom',
    icon: <Check size={20} className="text-white" />,
    color: 'bg-corgi-orange',
    requireClick: true,
  },
  // ===== 时间规划引导 =====
  'planner-intro': {
    route: '/planner',
    title: '📋 制定计划',
    description:
      '作息设置完成！\n接下来带你制定今日计划并体验专注。',
    arrow: 'center',
    icon: <Sparkles size={32} className="text-white" />,
    color: 'bg-corgi-orange',
  },
  'planner-calc': {
    route: '/planner',
    targetSelector: '[data-tour="calc-free-btn"]',
    title: '① 自动计算空闲时间',
    description: '系统根据固定作息自动算出每天可用空闲时段',
    arrow: 'bottom',
    icon: <Clock size={20} className="text-white" />,
    color: 'bg-mint-deep',
  },
  'planner-add-task': {
    route: '/planner',
    targetSelector: '[data-tour="add-task-btn"]',
    title: '② 增加项目',
    description: '添加作业、自习、爱好等项目，设置预估时间',
    arrow: 'bottom',
    icon: <Plus size={20} className="text-white" />,
    color: 'bg-corgi-dark',
  },
  'planner-generate': {
    route: '/planner',
    targetSelector: '[data-tour="generate-plan-btn"]',
    title: '③ 生成计划',
    description: '系统自动把项目排入空闲时段，生成今日计划表',
    arrow: 'bottom',
    icon: <Zap size={20} className="text-white" />,
    color: 'bg-corgi-yellow',
  },
  'planner-focus': {
    route: '/planner',
    targetSelector: '[data-tour="focus-btn"]',
    title: '⑤ 开始专注',
    description: '点击「专注」开始计时，引导会自动隐藏，专注结束后自动完成',
    arrow: 'bottom',
    icon: <Play size={20} className="text-white" />,
    color: 'bg-blue-500',
    requireClick: true,
  },
  'focus-running': {
    title: '专注进行中…',
    description: '好好专注吧！专注结束后引导自动完成。',
    arrow: 'center',
    icon: <Loader2 size={32} className="text-white animate-spin" />,
    color: 'bg-blue-500',
  },
  'focus-done': {
    title: '🎉 新手引导完成！',
    description:
      '你已经掌握了核心功能。\n养成、盲盒、好友、总结等更多功能，留给你自行探索～',
    arrow: 'center',
    icon: <Check size={32} className="text-white" />,
    color: 'bg-mint-deep',
  },
};

interface OnboardingGuideProps {
  onComplete: () => void;
}

export default function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const navigate = useNavigate();
  const { isActive, stageIndex, focusActive, startTour, nextStage, completeTour, skipTour } = useTourStore();
  // 目标元素的位置信息（用于遮罩挖洞 + 定位标注卡）
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  // 目标元素是否已找到（用于展示加载态）
  const [targetFound, setTargetFound] = useState(false);
  // 是否正在导航中（导航后需等待页面渲染完成再查找元素）
  const navigatingRef = useRef(false);

  const stageId = TOUR_STAGES[stageIndex];
  const config = STAGE_CONFIG[stageId];

  // 挂载时启动引导
  useEffect(() => {
    if (!isActive) startTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== 阶段变化时导航到对应路由 =====
  useEffect(() => {
    if (!config.route) return;
    navigatingRef.current = true;
    setTargetFound(false);
    setTargetRect(null);
    navigate(config.route);
    // 导航后清除标志，允许后续查找元素
    const t = setTimeout(() => { navigatingRef.current = false; }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIndex]);

  // ===== 查找并跟踪高亮目标元素 =====
  const findTarget = useCallback(() => {
    if (!config.targetSelector) {
      setTargetRect(null);
      setTargetFound(true);
      return;
    }
    if (navigatingRef.current) return;
    const el = document.querySelector(config.targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
      setTargetFound(true);
    } else {
      setTargetFound(false);
    }
  }, [config.targetSelector]);

  // 首次查找 + 定时重试（等待页面渲染 / tab 切换）
  useEffect(() => {
    if (!config.targetSelector) {
      setTargetFound(true);
      return;
    }
    setTargetFound(false);
    findTarget();
    const interval = setInterval(() => {
      const el = document.querySelector(config.targetSelector!);
      if (el) {
        // 将目标元素滚动到可视区域，确保高亮可见
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTargetRect(el.getBoundingClientRect());
        setTargetFound(true);
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [stageIndex, config.targetSelector, findTarget]);

  // 滚动 / 缩放时更新目标位置
  useEffect(() => {
    if (!config.targetSelector) return;
    const update = () => findTarget();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [config.targetSelector, findTarget]);

  // ===== 点击高亮元素推进阶段 =====
  // 用户点击高亮元素时，先让其执行真实操作，再推进到下一阶段
  // 注意：planner-focus 阶段不使用 click listener，由专注状态联动专属处理
  // （避免 click listener 与 focusActive 联动双重推进，跳过 focus-running 阶段）
  useEffect(() => {
    if (!config.targetSelector || !targetFound) return;
    if (stageId === 'planner-focus') return; // 专注阶段由 focusActive 联动推进
    const el = document.querySelector(config.targetSelector);
    if (!el) return;
    const handler = () => {
      // 延迟推进，确保真实点击事件先执行
      setTimeout(() => nextStage(), 200);
    };
    el.addEventListener('click', handler, { once: true });
    return () => el.removeEventListener('click', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId, targetFound, config.targetSelector]);

  // ===== 专注状态联动 =====
  // planner-focus 阶段：用户点击专注 → focusActive=true → 进入 focus-running
  useEffect(() => {
    if (stageId === 'planner-focus' && focusActive) {
      nextStage();
    }
    // focus-running 阶段：专注结束 → focusActive=false → 进入 focus-done
    if (stageId === 'focus-running' && !focusActive) {
      nextStage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId, focusActive]);

  // ===== 按钮处理 =====
  const handleNext = () => {
    if (stageIndex < TOUR_STAGES.length - 1) {
      nextStage();
    } else {
      completeTour();
      onComplete();
    }
  };

  const handleSkip = () => {
    skipTour();
    onComplete();
  };

  // focus-running 阶段不渲染任何引导覆盖层（引导隐藏）
  if (stageId === 'focus-running') return null;

  // ===== 居中卡片阶段（routine-intro / planner-intro / focus-done）=====
  if (config.arrow === 'center') {
    // 根据阶段确定按钮文案
    const buttonText = stageId === 'focus-done' ? '完成' : stageId === 'routine-intro' ? '开始' : '下一步';
    const buttonIcon = stageId === 'focus-done' ? <Check size={18} /> : <Sparkles size={18} />;
    return (
      <div className="fixed inset-0 z-50 bg-corgi-deep/60 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-warm-light rounded-3xl w-full max-w-sm overflow-hidden shadow-puffy animate-pop-in relative">
          {/* 顶部装饰 */}
          <div className={cn('h-28 flex items-center justify-center', config.color)}>
            {config.icon}
          </div>
          {/* 内容 */}
          <div className="p-6 text-center">
            <h2 className="font-display text-xl text-text-primary mb-3 whitespace-pre-line">{config.title}</h2>
            <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed mb-6">{config.description}</p>
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-corgi-orange to-berry-rose text-white font-bold text-sm shadow-soft hover:shadow-puffy transition-all btn-press"
            >
              {buttonIcon}
              {buttonText}
            </button>
          </div>
          {/* 跳过按钮 */}
          {stageId !== 'focus-done' && (
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/15 flex items-center justify-center text-text-primary hover:bg-black/25 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ===== 标注卡位置计算 =====
  const getAnnotationStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const cardWidth = 240;
    const margin = 16;
    switch (config.arrow) {
      case 'bottom':
        // 标注卡在高亮元素下方
        return {
          top: targetRect.bottom + margin,
          left: Math.max(8, Math.min(targetRect.left + targetRect.width / 2 - cardWidth / 2, window.innerWidth - cardWidth - 8)),
          width: cardWidth,
        };
      case 'top':
        return {
          top: Math.max(8, targetRect.top - 180),
          left: Math.max(8, Math.min(targetRect.left + targetRect.width / 2 - cardWidth / 2, window.innerWidth - cardWidth - 8)),
          width: cardWidth,
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: cardWidth };
    }
  };

  // ===== 高亮目标阶段：半透明灰遮罩 + 挖洞 + 小箭头 + "点它" + 功能标注 =====
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* 半透明暖灰色遮罩：用 box-shadow 在高亮元素周围"挖洞" */}
      {/* pointer-events-none 让点击穿透到高亮元素，用户可直接点击 */}
      {targetRect && targetFound && (
        <div
          className="fixed pointer-events-none transition-all duration-200"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: 16,
            boxShadow: '0 0 0 9999px rgba(70, 55, 40, 0.55)',
          }}
        >
          {/* 高亮边框动画 */}
          <div className="absolute inset-0 rounded-2xl border-4 border-corgi-orange animate-pulse pointer-events-none" />
        </div>
      )}

      {/* 未找到目标时的整屏遮罩 */}
      {!targetRect && (
        <div className="fixed inset-0 bg-corgi-deep/55 pointer-events-auto flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-warm-light text-sm font-bold">
            <Loader2 size={18} className="animate-spin" />
            <span>加载中…</span>
            <span className="text-[11px] text-warm-light/60 font-normal">若长时间无响应，请确认已完成前置步骤或跳过引导</span>
          </div>
        </div>
      )}

      {/* 功能标注卡 + 小箭头 + "点它" + "知道了" */}
      {targetFound && targetRect && (
        <div
          className="fixed pointer-events-none z-50 animate-pop-in"
          style={getAnnotationStyle()}
        >
          <div className={cn('rounded-2xl shadow-puffy overflow-hidden border-2 border-white/40', config.color)}>
            {/* 功能名称 + 图标 */}
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                {config.icon}
              </div>
              <h3 className="font-display text-sm text-white font-bold">{config.title}</h3>
            </div>
            {/* 功能说明 */}
            <div className="bg-warm-light px-3 py-2">
              <p className="text-[11px] text-text-secondary leading-relaxed">{config.description}</p>
              {/* "点它" 提示 + "知道了" 按钮 */}
              <div className="flex items-center justify-between mt-1.5 gap-2">
                <div className="flex items-center gap-1 bg-corgi-orange/15 rounded-full px-2 py-0.5">
                  <Hand size={11} className="text-corgi-orange animate-bounce" />
                  <span className="text-corgi-orange text-[11px] font-bold">点它</span>
                </div>
                {/* requireClick=true 时不显示"知道了"按钮，强制用户点击高亮元素 */}
                {!config.requireClick && (
                  <button
                    onClick={handleNext}
                    className="pointer-events-auto bg-corgi-orange text-white text-[11px] font-bold px-3 py-0.5 rounded-full hover:bg-corgi-dark transition-colors"
                  >
                    知道了
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* 小箭头：从标注卡指向高亮元素 */}
          {config.arrow === 'bottom' && (
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '9px solid transparent',
                borderRight: '9px solid transparent',
                borderBottom: '10px solid white',
              }}
            />
          )}
        </div>
      )}

      {/* 跳过按钮（右上角，始终可用以便用户退出） */}
      <button
        onClick={handleSkip}
        className="fixed top-4 right-4 z-50 pointer-events-auto px-3 py-1.5 rounded-full bg-corgi-deep/60 text-warm-light text-xs font-bold hover:bg-corgi-deep/80 transition-colors flex items-center gap-1"
      >
        <X size={12} />
        跳过引导
      </button>
    </div>
  );
}
