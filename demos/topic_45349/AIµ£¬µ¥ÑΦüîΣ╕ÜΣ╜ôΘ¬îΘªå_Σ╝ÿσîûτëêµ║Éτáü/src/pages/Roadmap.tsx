import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ICONS } from "@/lib/icons";
import Layout from "@/components/Layout";
import NeonButton from "@/components/NeonButton";
import { getCareerById } from "@/data/careers";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const accentMap = {
  cyan: { text: "text-neon-cyan", border: "border-neon-cyan/40", bg: "bg-neon-cyan/10", stroke: "#00f0ff" },
  magenta: { text: "text-neon-magenta", border: "border-neon-magenta/40", bg: "bg-neon-magenta/10", stroke: "#ff2e88" },
  gold: { text: "text-neon-gold", border: "border-neon-gold/40", bg: "bg-neon-gold/10", stroke: "#ffb800" },
  green: { text: "text-neon-green", border: "border-neon-green/40", bg: "bg-neon-green/10", stroke: "#39ff14" },
};

export default function Roadmap() {
  const { careerId } = useParams();
  const navigate = useNavigate();
  const { hasInput } = useAppStore();

  const career = careerId ? getCareerById(careerId) : undefined;

  useEffect(() => {
    if (!hasInput) navigate("/input");
  }, [hasInput, navigate]);

  if (!career) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-ink-300">未找到该职业</p>
            <Link to="/results" className="mt-4 inline-block">
              <NeonButton>返回推荐列表</NeonButton>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const accent = accentMap[career.accentColor];
  const Icon = ICONS[career.icon] || ICONS.Compass;

  // 雷达图坐标
  const abilities = career.abilities;
  const radarSize = 220;
  const radarCenter = radarSize / 2;
  const radarRadius = 80;
  const radarPoints = abilities.map((ability, i) => {
    const angle = (Math.PI * 2 * i) / abilities.length - Math.PI / 2;
    const r = (ability.level / 100) * radarRadius;
    return {
      x: radarCenter + Math.cos(angle) * r,
      y: radarCenter + Math.sin(angle) * r,
      labelX: radarCenter + Math.cos(angle) * (radarRadius + 20),
      labelY: radarCenter + Math.sin(angle) * (radarRadius + 20),
      ...ability,
    };
  });
  const radarPath = radarPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-4rem)] py-12">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />

        <div className="relative mx-auto max-w-5xl px-6">
          {/* 返回 */}
          <Link
            to={`/experience/${career.id}`}
            className="mb-8 inline-flex items-center gap-1.5 font-mono text-xs text-ink-300 transition-colors hover:text-neon-cyan"
          >
            <ICONS.ArrowLeft className="h-3 w-3" />
            返回一天体验
          </Link>

          {/* 头部 */}
          <div className="glass-card mb-8 animate-fade-up p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl border", accent.border, accent.bg)}>
                <Icon className={cn("h-8 w-8", accent.text)} />
              </div>
              <div className="flex-1">
                <p className="font-mono text-xs text-ink-300">LEARNING ROADMAP · 学习路线</p>
                <h1 className="font-display text-3xl font-bold text-ink-100">{career.name}</h1>
                <p className={cn("mt-1 font-mono text-sm italic", accent.text)}>「{career.tagline}」</p>
              </div>
            </div>
          </div>

          {/* 能力雷达图 */}
          <section className="glass-card mb-8 animate-fade-up p-6 sm:p-8" style={{ animationDelay: "100ms" }}>
            <div className="mb-6 flex items-center gap-2">
              <ICONS.Target className={cn("h-4 w-4", accent.text)} />
              <h2 className="font-display text-lg font-bold text-ink-100">所需能力雷达</h2>
              <span className="ml-auto font-mono text-xs text-ink-300">ABILITY RADAR</span>
            </div>
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
              {/* SVG 雷达图 */}
              <div className="shrink-0">
                <svg width={radarSize} height={radarSize} className="overflow-visible">
                  {/* 网格圈 */}
                  {[0.25, 0.5, 0.75, 1].map((ratio) => (
                    <circle
                      key={ratio}
                      cx={radarCenter}
                      cy={radarCenter}
                      r={radarRadius * ratio}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />
                  ))}
                  {/* 轴线 */}
                  {radarPoints.map((p, i) => (
                    <line
                      key={i}
                      x1={radarCenter}
                      y1={radarCenter}
                      x2={radarCenter + Math.cos((Math.PI * 2 * i) / abilities.length - Math.PI / 2) * radarRadius}
                      y2={radarCenter + Math.sin((Math.PI * 2 * i) / abilities.length - Math.PI / 2) * radarRadius}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />
                  ))}
                  {/* 数据区域 */}
                  <polygon points={radarPath} fill={accent.stroke} fillOpacity="0.15" stroke={accent.stroke} strokeWidth="2" />
                  {/* 数据点 */}
                  {radarPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill={accent.stroke} />
                  ))}
                  {/* 标签 */}
                  {radarPoints.map((p, i) => (
                    <text
                      key={i}
                      x={p.labelX}
                      y={p.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-ink-200 font-mono"
                      style={{ fontSize: "10px" }}
                    >
                      {p.name}
                    </text>
                  ))}
                </svg>
              </div>

              {/* 能力列表 */}
              <div className="flex-1 space-y-3">
                {abilities.map((ability) => (
                  <div key={ability.name}>
                    <div className="mb-1 flex items-center justify-between font-mono text-xs">
                      <span className="text-ink-200">{ability.name}</span>
                      <span className={accent.text}>{ability.level}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${ability.level}%`, backgroundColor: accent.stroke }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 学习路线 */}
          <section className="mb-8">
            <div className="mb-6 flex items-center gap-2">
              <ICONS.Map className={cn("h-4 w-4", accent.text)} />
              <h2 className="font-display text-lg font-bold text-ink-100">学习路线图</h2>
              <span className="ml-auto font-mono text-xs text-ink-300">LEARNING PATH</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {career.roadmap.map((stage, i) => (
                <div
                  key={stage.stage}
                  className="glass-card glass-card-hover group animate-fade-up p-6"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className={cn("font-display text-3xl font-black", accent.text)}>{stage.stage}</span>
                    <div className="flex-1">
                      <h3 className="font-display text-lg font-bold text-ink-100">{stage.title}</h3>
                      <p className="font-mono text-xs text-ink-300">{stage.duration}</p>
                    </div>
                    <ICONS.Flag className={cn("h-5 w-5", accent.text)} />
                  </div>
                  <ul className="space-y-2">
                    {stage.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-ink-200">
                        <span className={cn("mt-1.5 h-1 w-1 shrink-0 rounded-full", accent.text)} style={{ backgroundColor: accent.stroke }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* 入门项目 */}
          <section className="glass-card mb-8 animate-fade-up p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <ICONS.Rocket className={cn("h-4 w-4", accent.text)} />
              <h2 className="font-display text-lg font-bold text-ink-100">入门项目</h2>
              <span className="ml-auto font-mono text-xs text-ink-300">STARTER PROJECT</span>
            </div>
            <div className={cn("rounded-xl border p-5", accent.border, accent.bg)}>
              <h3 className="font-display text-xl font-bold text-ink-100">{career.starterProject.name}</h3>
              <p className="mt-2 text-sm text-ink-200">{career.starterProject.desc}</p>
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-3 font-mono text-xs uppercase tracking-wider text-ink-300">实施步骤</p>
                <ol className="space-y-2">
                  {career.starterProject.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-ink-200">
                      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]", accent.border, accent.text)}>
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {/* 风险提醒 */}
          <section className="glass-card mb-8 animate-fade-up p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <ICONS.AlertTriangle className="h-4 w-4 text-neon-magenta" />
              <h2 className="font-display text-lg font-bold text-ink-100">职业风险提醒</h2>
              <span className="ml-auto font-mono text-xs text-ink-300">RISK ALERT</span>
            </div>
            <div className="space-y-4">
              {career.risks.map((risk, i) => (
                <div key={i} className="rounded-xl border border-neon-magenta/20 bg-neon-magenta/5 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neon-magenta/40 bg-neon-magenta/10">
                      <ICONS.AlertCircle className="h-4 w-4 text-neon-magenta" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-base font-bold text-ink-100">{risk.title}</h3>
                      <p className="mt-1 text-sm text-ink-200">{risk.desc}</p>
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 p-3">
                        <ICONS.ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
                        <div>
                          <p className="font-mono text-xs text-neon-cyan">应对建议</p>
                          <p className="mt-1 text-sm text-ink-200">{risk.mitigation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 底部操作 */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
            <Link to={`/experience/${career.id}`}>
              <NeonButton variant="ghost">
                <ICONS.ArrowLeft className="h-4 w-4" />
                返回一天体验
              </NeonButton>
            </Link>
            <Link to="/report">
              <NeonButton variant="secondary" className="group">
                <ICONS.FileText className="h-4 w-4" />
                生成未来职业体验报告
                <ICONS.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </NeonButton>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
