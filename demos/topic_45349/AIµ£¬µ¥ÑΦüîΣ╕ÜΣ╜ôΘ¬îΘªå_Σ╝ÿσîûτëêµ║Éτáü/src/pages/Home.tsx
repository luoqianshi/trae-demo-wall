import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ICONS } from "@/lib/icons";
import Layout from "@/components/Layout";
import HolographicScene from "@/components/HolographicScene";
import TiltCard from "@/components/TiltCard";
import MagneticButton from "@/components/MagneticButton";
import AnimatedCounter from "@/components/AnimatedCounter";
import { CAREERS } from "@/data/careers";
import { useAppStore } from "@/store/useAppStore";

const { ArrowRight, BrainCircuit, Compass, Sparkles, Rocket, ClipboardList, Eye, FileText, Zap, ShieldCheck, TrendingUp, GraduationCap } = ICONS;

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "AI 智能推荐",
    desc: "基于兴趣、科目、性格与避雷项，从扩展职业库中锁定你的 Top 3",
    accent: "cyan" as const,
  },
  {
    icon: Eye,
    title: "沉浸式场景体验",
    desc: "全屏动态场景 + 关键决策挑战，让你真正“参与”职业的一天",
    accent: "magenta" as const,
  },
  {
    icon: FileText,
    title: "个性化体验报告",
    desc: "生成可打印的《未来职业体验报告》，含推荐依据、路线与风险预警",
    accent: "gold" as const,
  },
];

const STEPS = [
  { icon: ClipboardList, title: "输入画像", desc: "兴趣 / 性格 / 科目 / 偏好 / 期待", step: "01" },
  { icon: Sparkles, title: "AI 推荐", desc: "生成 3 个最匹配的未来职业", step: "02" },
  { icon: Eye, title: "沉浸体验", desc: "走进职业的一天，感受真实节奏", step: "03" },
  { icon: FileText, title: "获取报告", desc: "下载你的未来职业体验报告", step: "04" },
];

const accentClass = {
  cyan: { text: "text-neon-cyan", border: "border-neon-cyan/40", bg: "bg-neon-cyan/10", glow: "shadow-neon-cyan" },
  magenta: { text: "text-neon-magenta", border: "border-neon-magenta/40", bg: "bg-neon-magenta/10", glow: "shadow-neon-magenta" },
  gold: { text: "text-neon-gold", border: "border-neon-gold/40", bg: "bg-neon-gold/10", glow: "shadow-neon-gold" },
  green: { text: "text-neon-green", border: "border-neon-green/40", bg: "bg-neon-green/10", glow: "shadow-neon-green" },
};

/* 首页展示的职业预览 */
const FEATURED_CAREERS = CAREERS.slice(0, 6);

export default function Home() {
  const navigate = useNavigate();
  const setBrowseMode = useAppStore((s) => s.setBrowseMode);

  const handleBrowseAll = () => {
    setBrowseMode(true);
    navigate("/results");
  };

  return (
    <Layout>
      {/* ============ Hero 区 ============ */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden">
        <HolographicScene />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          {/* 顶部标签 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-cyan/70" />
            </span>
            <span className="font-mono text-xs tracking-wider text-ink-300">
              TRAE AI CREATIVITY COMPETITION · 2026
            </span>
          </motion.div>

          {/* 主标题 */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl font-black leading-tight tracking-tight text-ink-100 sm:text-6xl md:text-7xl lg:text-8xl"
          >
            <span className="block">AI 未来</span>
            <span className="block gradient-text">职业体验馆</span>
          </motion.h1>

          {/* 英文副标题 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-4 font-mono text-sm tracking-[0.3em] text-ink-300 sm:text-base"
          >
            FUTURE CAREER EXPERIENCE HALL
          </motion.p>

          {/* 描述 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-ink-200 sm:text-lg"
          >
            用 2 分钟完成画像，预演未来职业的一天。
            <br className="hidden sm:block" />
            从推荐依据、工作场景到学习路线，生成一份真正可行动的职业体验报告。
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link to="/input">
              <MagneticButton size="lg" className="group w-full sm:w-auto">
                <Rocket className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                开启未来体验
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </Link>
            <MagneticButton variant="ghost" size="lg" onClick={handleBrowseAll}>
              <Compass className="h-5 w-5" />
              浏览全部职业
            </MagneticButton>
          </motion.div>

          {/* 数据统计 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4"
          >
            {[
              { value: CAREERS.length, suffix: "+", label: "未来职业库" },
              { value: 12, suffix: "种", label: "沉浸式场景" },
              { value: 100, suffix: "%", label: "个性化推荐" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4">
                <div className="font-display text-2xl font-bold gradient-text sm:text-3xl">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-1 font-mono text-xs text-ink-300">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* 底部滚动提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-ink-400">
            <span className="font-mono text-[10px] tracking-widest">SCROLL</span>
            <motion.div
              animate={{ scaleY: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-8 w-px bg-gradient-to-b from-neon-cyan to-transparent"
            />
          </div>
        </motion.div>
      </section>

      {/* ============ 特性卡片区 ============ */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="font-mono text-sm tracking-widest text-neon-cyan">CORE FEATURES</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-ink-100 sm:text-5xl">
              为什么选择<span className="gradient-text">体验馆</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-300">
              不是枯燥的职业测评，而是一场关于未来的沉浸式预演
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const accent = accentClass[feature.accent];
              const glowMap: Record<string, string> = {
                cyan: "rgba(0, 240, 255, 0.22)",
                magenta: "rgba(255, 46, 136, 0.22)",
                gold: "rgba(255, 184, 0, 0.22)",
                green: "rgba(57, 255, 20, 0.22)",
              };
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <TiltCard className="glass-card glass-card-hover group h-full p-8" glowColor={glowMap[feature.accent]}>
                    <div
                      className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border ${accent.border} ${accent.bg} transition-transform duration-500 group-hover:scale-110`}
                    >
                      <Icon className={`h-7 w-7 ${accent.text}`} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-ink-100">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-300">{feature.desc}</p>
                    <div className={`mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent`} />
                    <div className={`mt-4 font-mono text-xs ${accent.text}`}>
                      0{i + 1} / 03
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ 精选职业预览 ============ */}
      <section className="relative py-24">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="font-mono text-sm tracking-widest text-neon-gold">CAREER PREVIEW</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-ink-100 sm:text-5xl">
              探索<span className="gradient-text-gold">热门职业</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-300">
              AI 工程师、医生、律师、建筑设计师等多类职业等你来体验
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_CAREERS.map((career, i) => {
              const Icon = ICONS[career.icon] || ICONS.Compass;
              const accent = accentClass[career.accentColor as keyof typeof accentClass] || accentClass.cyan;
              return (
                <motion.div
                  key={career.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Link
                    to={`/experience/${career.id}`}
                    className="glass-card glass-card-hover group flex items-center gap-4 p-4"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${accent.border} ${accent.bg}`}>
                      <Icon className={`h-5 w-5 ${accent.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-sm font-bold text-ink-100 truncate">{career.name}</h4>
                      <p className="font-mono text-[10px] text-ink-400 truncate">{career.enName}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1">
                      {career.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 font-mono text-[9px] text-ink-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-400 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link to="/results">
              <MagneticButton variant="ghost" size="lg" className="group">
                查看全部 24+ 职业
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ 流程指引区 ============ */}
      <section className="relative py-24">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="font-mono text-sm tracking-widest text-neon-magenta">HOW IT WORKS</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-ink-100 sm:text-5xl">
              四步开启<span className="gradient-text-gold">未来之旅</span>
            </h2>
          </div>

          <div className="relative grid gap-8 md:grid-cols-4">
            {/* 连接线 */}
            <div className="absolute left-0 top-12 hidden h-px w-full bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/40 to-neon-magenta/0 md:block" />

            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative text-center"
                >
                  {/* 序号徽章 */}
                  <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-neon-cyan/20 bg-space-800/80 backdrop-blur-sm" />
                    <div className="absolute inset-2 rounded-full border border-neon-cyan/30" />
                    <Icon className="h-8 w-8 text-neon-cyan" />
                    <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-neon-magenta/50 bg-space-900 font-mono text-xs font-bold text-neon-magenta">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink-100">{step.title}</h3>
                  <p className="mt-2 text-sm text-ink-300">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <Link to="/input">
              <MagneticButton size="lg" className="group">
                <Zap className="h-5 w-5 transition-transform group-hover:scale-110" />
                立即开始体验
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============ 底部信任区 ============ */}
      <section className="relative border-t border-white/[0.04] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "AI 驱动", desc: "神经匹配引擎精准推荐" },
              { icon: TrendingUp, title: "持续更新", desc: "职业库与场景不断扩充" },
              { icon: GraduationCap, title: "教育导向", desc: "每条路线参考真实路径" },
              { icon: Sparkles, title: "开源精神", desc: "基于社区反馈持续优化" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <item.icon className="mx-auto h-6 w-6 text-ink-400" />
                <h4 className="mt-3 font-display text-sm font-bold text-ink-200">{item.title}</h4>
                <p className="mt-1 font-mono text-[10px] text-ink-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}