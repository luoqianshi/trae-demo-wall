import { useState } from 'react';
import {
  X,
  Hand,
  MousePointer2,
  Pencil,
  Shapes,
  Move,
  Zap,
  Download,
  Upload,
  Search,
  Locate,
  ChevronRight,
  ChevronLeft,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useRouteStore } from '../../store/useRouteStore';

const steps = [
  {
    title: '欢迎使用 RouteForge',
    description: '专业的跑步路线生成器，帮助你轻松规划跑步路线',
    icon: <MapPin size={32} className="text-sky-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 text-sm leading-relaxed">
          RouteForge 让你可以在地图上自由绘制路线，并自动吸附到步行道路，同时生成详细的运动数据统计。
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <FeatureCard icon={<MousePointer2 size={18} />} label="点选绘制" desc="逐点点击画线" />
          <FeatureCard icon={<Pencil size={18} />} label="自由绘制" desc="按住鼠标拖动画线" />
          <FeatureCard icon={<Shapes size={18} />} label="形状模板" desc="爱心/圆形/星形" />
          <FeatureCard icon={<Zap size={18} />} label="道路吸附" desc="匹配到真实道路" />
        </div>
      </div>
    ),
  },
  {
    title: '绘制模式',
    icon: <Pencil size={28} className="text-blue-400" />,
    description: '选择适合你的绘制方式',
    content: (
      <div className="space-y-3">
        <ToolItem
          icon={<MousePointer2 size={20} />}
          title="点选绘制"
          desc="在地图上逐点点击，在两点间连线，适合精确规划路线"
          color="text-blue-400"
        />
        <ToolItem
          icon={<Pencil size={20} />}
          title="自由绘制"
          desc="按住鼠标左键拖动，像画笔一样自由绘制路线"
          color="text-emerald-400"
        />
        <ToolItem
          icon={<Shapes size={20} />}
          title="形状模板"
          desc="选择预设形状（爱心、圆形、星形等），一键生成创意路线"
          color="text-orange-400"
        />
        <ToolItem
          icon={<Hand size={20} />}
          title="移动浏览"
          desc="拖拽地图、缩放浏览，不进行绘制操作"
          color="text-slate-400"
        />
      </div>
    ),
  },
  {
    title: '编辑路线',
    icon: <Move size={28} className="text-violet-400" />,
    description: '绘制完成后可以精细调整',
    content: (
      <div className="space-y-3">
        <ListItem>
          <strong className="text-white">拖拽控制点</strong>
          <span className="text-slate-400"> — 拖动蓝色圆点调整路线形状</span>
        </ListItem>
        <ListItem>
          <strong className="text-white">点击线段</strong>
          <span className="text-slate-400"> — 在路线上点击插入新的控制点</span>
        </ListItem>
        <ListItem>
          <strong className="text-white">右键点击</strong>
          <span className="text-slate-400"> — 删除附近的控制点</span>
        </ListItem>
        <ListItem>
          <strong className="text-white">撤销操作</strong>
          <span className="text-slate-400"> — 绘制时右键或点击撤销按钮回退</span>
        </ListItem>
      </div>
    ),
  },
  {
    title: '吸附与导出',
    icon: <Zap size={28} className="text-amber-400" />,
    description: '让路线更贴合真实道路',
    content: (
      <div className="space-y-3">
        <ListItem icon={<Zap size={18} className="text-amber-400" />}>
          <strong className="text-white">吸附道路</strong>
          <span className="text-slate-400">：将绘制的轨迹匹配到 OpenStreetMap 的步行道路网络</span>
        </ListItem>
        <ListItem icon={<Search size={18} className="text-sky-400" />}>
          <strong className="text-white">搜索地点</strong>
          <span className="text-slate-400">：快速定位到目标城市或地标</span>
        </ListItem>
        <ListItem icon={<Locate size={18} className="text-emerald-400" />}>
          <strong className="text-white">定位</strong>
          <span className="text-slate-400">：一键跳转到你当前所在位置</span>
        </ListItem>
        <ListItem icon={<Download size={18} className="text-teal-400" />}>
          <strong className="text-white">导出 GPX</strong>
          <span className="text-slate-400">：导出标准 GPX 文件，可导入到手表、Strava 等</span>
        </ListItem>
        <ListItem icon={<Upload size={18} className="text-cyan-400" />}>
          <strong className="text-white">导入 GPX</strong>
          <span className="text-slate-400">：导入已有路线文件继续编辑</span>
        </ListItem>
      </div>
    ),
  },
  {
    title: '准备出发！',
    icon: <CheckCircle2 size={32} className="text-emerald-400" />,
    description: '现在开始创建你的第一条跑步路线吧',
    content: (
      <div className="text-center py-4">
        <p className="text-slate-300 text-sm mb-6">
          选择一种绘制模式，在地图上开始创作你的路线。<br />
          你可以随时点击右上角设置图标，调整运动参数和地图样式。
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-xl text-xs text-slate-400">
          <span className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
            <MousePointer2 size={14} />
          </span>
          提示：点击工具栏上的 <span className="text-sky-400">?</span> 按钮随时查看帮助
        </div>
      </div>
    ),
  },
];

export function OnboardingModal() {
  const { isOnboardingOpen, closeOnboarding } = useRouteStore();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOnboardingOpen) return null;

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900/98 backdrop-blur-2xl border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="relative p-6 pb-4">
          <button
            onClick={closeOnboarding}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
              {step.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{step.title}</h2>
              <p className="text-sm text-slate-400">{step.description}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="bg-slate-800/40 rounded-2xl p-5 min-h-[260px]">
            {step.content}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-6 bg-sky-500'
                    : i < currentStep
                    ? 'w-1.5 bg-sky-500/60'
                    : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <ChevronLeft size={16} />
                上一步
              </button>
            )}

            {isLastStep ? (
              <button
                onClick={closeOnboarding}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 transition-all"
              >
                开始使用
                <CheckCircle2 size={16} />
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1 px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/25 transition-all"
              >
                下一步
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/30">
      <div className="text-sky-400 mb-1.5">{icon}</div>
      <div className="text-sm font-medium text-white">{label}</div>
      <div className="text-xs text-slate-500">{desc}</div>
    </div>
  );
}

function ToolItem({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/60 transition-colors">
      <div className={`mt-0.5 ${color}`}>{icon}</div>
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function ListItem({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      {!icon && <span className="mt-2 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />}
      <div>{children}</div>
    </div>
  );
}
