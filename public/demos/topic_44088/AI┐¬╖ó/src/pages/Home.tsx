import { Link } from "react-router-dom";
import {
  Camera,
  ScanLine,
  Tags,
  Printer,
  ArrowRight,
  Sparkles,
  Clock,
  BookOpen,
  Zap,
  CheckCircle2,
  Quote,
  BarChart3,
  Target,
  TrendingUp,
} from "lucide-react";
import { useQuestionStore } from "@/store/useQuestionStore";

const STEPS = [
  {
    icon: Camera,
    title: "拍照上传",
    desc: "手机对准试卷错题,一键拍摄或拖拽上传,支持批量多张。",
    color: "text-ink-700",
    bg: "bg-ink-100",
  },
  {
    icon: ScanLine,
    title: "AI 识别",
    desc: "自动提取题干文本,智能识别学科与题目结构,无需手抄。",
    color: "text-coral-deep",
    bg: "bg-coral-soft/30",
  },
  {
    icon: Tags,
    title: "知识点归类",
    desc: "匹配对应章节知识点,自动打标签,薄弱环节一目了然。",
    color: "text-mint-deep",
    bg: "bg-mint-soft/30",
  },
  {
    icon: Printer,
    title: "打印复习",
    desc: "勾选错题生成 A4 错题集,导出 PDF 或直接打印,考前复盘。",
    color: "text-highlight-deep",
    bg: "bg-highlight-soft/40",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "3 分钟整理",
    desc: "从拍照到归类完成,把原本 1 小时的抄写压缩到一杯水的时间。",
  },
  {
    icon: Tags,
    title: "智能知识点",
    desc: "覆盖语数英物化等主流学科,自动关联章节考点与知识图谱。",
  },
  {
    icon: BookOpen,
    title: "免费无广告",
    desc: "网页直接打开即用,无需注册充值,普通家庭零门槛使用。",
  },
  {
    icon: Printer,
    title: "一键打印",
    desc: "A4 标准排版预览,勾选所需错题,导出 PDF 或直连打印机。",
  },
];

const STATS = [
  { value: "60", unit: "分钟", label: "传统手抄耗时" },
  { value: "3", unit: "分钟", label: "AI 整理耗时" },
  { value: "20×", unit: "", label: "效率提升" },
];

export default function Home() {
  const total = useQuestionStore((s) => s.questions.length);

  return (
    <div className="bg-paper-grain">
      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-highlight/20 blur-3xl" />
          <div className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-coral-soft/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-mint-soft/30 blur-3xl" />
        </div>

        <div className="container relative grid gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
          {/* 左:文案 */}
          <div className="animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink-200/70 bg-paper-50/80 px-3 py-1 text-xs font-medium text-ink-500 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-highlight-deep" />
              学习工作赛道 · AI 错题整理工具
            </div>

            <h1 className="font-display text-5xl font-semibold leading-[1.05] text-ink-800 sm:text-6xl lg:text-7xl">
              拍一张照片,
              <br />
              <span className="relative inline-block">
                <span className="marker-highlight">错题自动归类</span>
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-500">
              告别手抄错题的低效时光。AI 识别题干、匹配知识点、生成可打印错题集,
              把整理时间从 <span className="font-semibold text-coral-deep">1 小时</span> 压缩到{" "}
              <span className="font-semibold text-mint-deep">3 分钟</span>。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/organize" className="btn-ink group">
                <Camera className="h-4 w-4" />
                立即整理错题
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/collection" className="btn-ghost">
                <BookOpen className="h-4 w-4" />
                查看错题集
              </Link>
            </div>

            {/* 数据条 */}
            <div className="mt-10 flex items-center gap-8">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-display text-3xl font-semibold text-ink-800">{s.value}</span>
                    <span className="text-sm font-medium text-ink-400">{s.unit}</span>
                  </div>
                  <div className="text-xs text-ink-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 右:扫描演示卡片 */}
          <div className="animate-scale-in relative" style={{ animationDelay: "150ms" }}>
            <ScanDemoCard />
          </div>
        </div>
      </section>

      {/* ============ 核心流程 ============ */}
      <section className="relative border-y border-paper-300/50 bg-paper-50/60 py-20">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
              四步搞定
            </span>
            <h2 className="mt-3 font-display text-4xl font-semibold text-ink-800">
              从拍照到打印,一气呵成
            </h2>
            <p className="mt-3 text-ink-500">
              不需要切换工具,不需要复制粘贴,网页里完成全部流程。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="card-paper group relative p-6 hover:-translate-y-1 hover:shadow-card"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.bg}`}>
                      <Icon className={`h-6 w-6 ${step.color}`} strokeWidth={1.8} />
                    </div>
                    <span className="font-display text-4xl font-semibold text-paper-300">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mb-2 font-display text-xl font-semibold text-ink-800">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-500">{step.desc}</p>

                  {/* 连接箭头 */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                      <ArrowRight className="h-5 w-5 text-paper-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ 功能亮点 ============ */}
      <section className="py-20">
        <div className="container">
          <div className="mb-14 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
                为什么选它
              </span>
              <h2 className="mt-3 font-display text-4xl font-semibold text-ink-800">
                为学生而生的
                <span className="red-underline">轻量工具</span>
              </h2>
            </div>
            <p className="text-ink-500 lg:text-right">
              市面同类工具收费高、广告多、操作繁琐。我们做减法:免费、纯净、打开即用。
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="card-paper group p-6 hover:-translate-y-1 hover:shadow-card"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-ink-700 text-highlight transition-transform group-hover:scale-110">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-ink-800">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ 学情分析入口 ============ */}
      <section className="py-20">
        <div className="container">
          <div className="card-paper relative overflow-hidden p-8 lg:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-highlight/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-mint-soft/20 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              {/* 左:文案 */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
                  数据驱动复习
                </span>
                <h2 className="mt-3 font-display text-4xl font-semibold text-ink-800">
                  不只是整理,
                  <br />
                  <span className="marker-highlight">更懂你的薄弱点</span>
                </h2>
                <p className="mt-4 max-w-md text-ink-500">
                  每整理一道错题,系统自动分析学科分布、知识点频次与难度趋势,
                  生成专属学情报告,让复习有的放矢。
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    { icon: Target, text: "智能识别高频错题知识点,精准定位薄弱环节" },
                    { icon: BarChart3, text: "可视化学科与难度分布,一眼看清短板" },
                    { icon: TrendingUp, text: "AI 生成个性化复习建议,告别盲目刷题" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.text} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink-700 text-highlight">
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <p className="pt-1 text-sm text-ink-600">{item.text}</p>
                      </div>
                    );
                  })}
                </div>

                <Link to="/analytics" className="btn-ink group mt-8">
                  <BarChart3 className="h-4 w-4" />
                  查看学情分析
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* 右:模拟分析卡片 */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  {/* 学科分布迷你卡 */}
                  <div className="card-paper p-4">
                    <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-ink-400">
                      <BarChart3 className="h-3.5 w-3.5" />
                      学科分布
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: "数学", pct: 38, color: "bg-ink-700" },
                        { name: "物理", pct: 24, color: "bg-highlight-deep" },
                        { name: "英语", pct: 20, color: "bg-mint-deep" },
                        { name: "化学", pct: 18, color: "bg-purple-500" },
                      ].map((s) => (
                        <div key={s.name}>
                          <div className="mb-1 flex justify-between text-[11px]">
                            <span className="font-medium text-ink-600">{s.name}</span>
                            <span className="text-ink-400">{s.pct}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-paper-200">
                            <div
                              className={`h-full rounded-full ${s.color}`}
                              style={{ width: `${s.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 薄弱知识点卡 */}
                  <div className="card-paper p-4">
                    <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-ink-400">
                      <Target className="h-3.5 w-3.5" />
                      薄弱知识点
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { name: "二次函数", count: 5, hot: true },
                        { name: "动能定理", count: 3, hot: false },
                        { name: "过去完成时", count: 2, hot: false },
                      ].map((kp, i) => (
                        <div
                          key={kp.name}
                          className="flex items-center justify-between rounded-md bg-paper-100 px-2 py-1"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${
                                i === 0
                                  ? "bg-coral-deep text-paper-100"
                                  : "bg-paper-300 text-ink-500"
                              }`}
                            >
                              {i + 1}
                            </span>
                            <span className="text-[11px] font-medium text-ink-700">
                              {kp.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-ink-400">{kp.count}次</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 复习建议卡 */}
                  <div className="card-ink col-span-2 p-4">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-highlight" />
                      <span className="text-xs font-semibold text-paper-100">AI 复习建议</span>
                    </div>
                    <p className="text-xs leading-relaxed text-paper-300">
                      「二次函数」错题频次最高,建议结合课本第 2 章重点复习,
                      并针对单调性、区间分析做专项练习。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 用户证言 ============ */}
      <section className="border-y border-paper-300/50 bg-ink-700 py-20 text-paper-100">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <Quote className="mx-auto mb-6 h-10 w-10 text-highlight" />
            <p className="font-display text-2xl font-medium leading-relaxed text-paper-100 sm:text-3xl">
              "孩子以前整理错题要花一个多小时,现在拍几张照片就自动归类好了,
              <span className="marker-highlight text-ink-800">省下的时间能多刷两套题</span>。"
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-highlight font-display font-semibold text-ink-800">
                李
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-paper-100">李女士 · 初三家长</div>
                <div className="text-xs text-paper-300">使用 3 个月</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 行动召唤 ============ */}
      <section className="py-24">
        <div className="container">
          <div className="card-paper relative overflow-hidden p-10 text-center lg:p-16">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-highlight/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-mint-soft/40 blur-3xl" />

            <div className="relative">
              <h2 className="font-display text-4xl font-semibold text-ink-800 sm:text-5xl">
                现在就开始整理你的错题
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-ink-500">
                已有 <span className="font-semibold text-ink-700">{total + 128}</span> 道错题被整理。
                免费、免登录、打开即用。
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link to="/organize" className="btn-highlight group">
                  <Camera className="h-4 w-4" />
                  拍照整理
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/collection" className="btn-ghost">
                  浏览错题集
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-400">
                {["免注册", "无广告", "本地存储", "支持打印"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-mint-deep" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Hero 右侧的扫描演示卡片 */
function ScanDemoCard() {
  return (
    <div className="relative mx-auto max-w-md">
      {/* 浮动小卡片 1 */}
      <div className="absolute -left-6 top-8 z-20 hidden animate-float rounded-xl border border-paper-300/70 bg-paper-50 p-3 shadow-card sm:block">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-soft/40">
            <Tags className="h-4 w-4 text-mint-deep" />
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
              知识点
            </div>
            <div className="text-xs font-semibold text-ink-700">二次函数 · 单调性</div>
          </div>
        </div>
      </div>

      {/* 浮动小卡片 2 */}
      <div
        className="absolute -right-4 bottom-12 z-20 hidden animate-float rounded-xl border border-paper-300/70 bg-paper-50 p-3 shadow-card sm:block"
        style={{ animationDelay: "1.5s" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral-soft/40">
            <Clock className="h-4 w-4 text-coral-deep" />
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
              用时
            </div>
            <div className="text-xs font-semibold text-ink-700">2.3 秒识别</div>
          </div>
        </div>
      </div>

      {/* 主卡片:模拟试卷照片 + 扫描线 */}
      <div className="card-paper relative overflow-hidden p-5 shadow-lift">
        {/* 顶部栏 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-coral" />
            <span className="h-2.5 w-2.5 rounded-full bg-highlight" />
            <span className="h-2.5 w-2.5 rounded-full bg-mint" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
            试卷照片 · 识别中
          </span>
        </div>

        {/* 模拟试卷内容 */}
        <div className="bg-ruled relative overflow-hidden rounded-lg p-4">
          <div className="space-y-3 text-sm text-ink-700">
            <div className="flex gap-2">
              <span className="font-display font-semibold text-coral-deep">15.</span>
              <div className="flex-1">
                <p className="leading-relaxed">
                  已知函数 <span className="font-mono text-ink-800">f(x) = x² - 2ax + 3</span>,
                  若 f(x) 在区间
                  <span className="marker-highlight font-mono">[1, 2]</span>
                  上单调递增,求实数 a 的取值范围。
                </p>
              </div>
            </div>
            <div className="ml-5 space-y-1.5 text-xs text-ink-400">
              <div className="h-2 w-3/4 rounded bg-paper-200" />
              <div className="h-2 w-2/3 rounded bg-paper-200" />
              <div className="h-2 w-1/2 rounded bg-paper-200" />
            </div>
          </div>

          {/* 扫描线动画 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
            <div className="absolute inset-x-0 h-16 animate-scan bg-gradient-to-b from-transparent via-highlight/40 to-transparent">
              <div className="absolute bottom-0 inset-x-0 h-px bg-highlight-deep shadow-glow" />
            </div>
          </div>
        </div>

        {/* 底部识别结果 */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-ink-700 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-highlight" />
            <span className="text-xs font-medium text-paper-100">AI 识别完成</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-highlight px-2 py-0.5 text-[10px] font-semibold text-ink-800">
              数学
            </span>
            <span className="rounded-md bg-paper-100/20 px-2 py-0.5 text-[10px] font-medium text-paper-100">
              难度 ★★★
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
