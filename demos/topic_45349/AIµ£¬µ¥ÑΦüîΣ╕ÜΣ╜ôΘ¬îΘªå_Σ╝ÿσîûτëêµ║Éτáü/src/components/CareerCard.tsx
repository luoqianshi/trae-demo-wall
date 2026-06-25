import { Link } from "react-router-dom";
import { ICONS } from "@/lib/icons";
import type { Recommendation } from "@/types";
import { cn } from "@/lib/utils";

const accentMap = {
  cyan: {
    text: "text-neon-cyan",
    border: "border-neon-cyan/40",
    bg: "bg-neon-cyan/10",
    glow: "shadow-neon-cyan",
    from: "from-neon-cyan/20",
    ring: "ring-neon-cyan/30",
  },
  magenta: {
    text: "text-neon-magenta",
    border: "border-neon-magenta/40",
    bg: "bg-neon-magenta/10",
    glow: "shadow-neon-magenta",
    from: "from-neon-magenta/20",
    ring: "ring-neon-magenta/30",
  },
  gold: {
    text: "text-neon-gold",
    border: "border-neon-gold/40",
    bg: "bg-neon-gold/10",
    glow: "shadow-neon-gold",
    from: "from-neon-gold/20",
    ring: "ring-neon-gold/30",
  },
  green: {
    text: "text-neon-green",
    border: "border-neon-green/40",
    bg: "bg-neon-green/10",
    glow: "shadow-[0_0_20px_rgba(57,255,20,0.4)]",
    from: "from-neon-green/20",
    ring: "ring-neon-green/30",
  },
};

interface CareerCardProps {
  recommendation: Recommendation;
  index: number;
  browseMode?: boolean;
}

export default function CareerCard({ recommendation, index, browseMode = false }: CareerCardProps) {
  const { career, matchScore, reason } = recommendation;
  const accent = accentMap[career.accentColor];
  const Icon = ICONS[career.icon] || ICONS.Compass;

  // 环形进度
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (matchScore / 100) * circumference;

  return (
    <article
      className={cn(
        "glass-card glass-card-hover group relative overflow-hidden p-6",
        "animate-fade-up"
      )}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* 装饰光晕 */}
      <div
        className={cn(
          "pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br to-transparent opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40",
          accent.from
        )}
      />

      {/* 头部 */}
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-xl border backdrop-blur-sm",
              accent.border,
              accent.bg
            )}
          >
            <Icon className={cn("h-7 w-7", accent.text)} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-ink-100">{career.name}</h3>
            <p className="font-mono text-xs text-ink-300">{career.enName}</p>
          </div>
        </div>

        {/* 匹配度环 */}
        <div className="relative h-24 w-24 shrink-0">
          {browseMode ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className={cn("flex h-14 w-14 items-center justify-center rounded-full border", accent.border, accent.bg)}>
                <Icon className={cn("h-7 w-7", accent.text)} />
              </div>
            </div>
          ) : (
            <>
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className={accent.text}
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("font-display text-lg font-bold", accent.text)}>
                  {matchScore}%
                </span>
                <span className="font-mono text-[9px] text-ink-300">MATCH</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 标语 */}
      <p className={cn("mt-4 font-mono text-sm italic", accent.text)}>「{career.tagline}」</p>

      {/* 标签 */}
      <div className="mt-3 flex flex-wrap gap-2">
        {career.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-ink-200"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* 推荐依据 */}
      {!browseMode && recommendation.scoreBreakdown && (
        <div className="mt-5 grid grid-cols-4 gap-1.5">
          {[
            ["兴趣", recommendation.scoreBreakdown.interests],
            ["科目", recommendation.scoreBreakdown.subjects],
            ["性格", recommendation.scoreBreakdown.personality],
            ["避雷", recommendation.scoreBreakdown.dislike],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-2 text-center">
              <div className={cn("font-display text-sm font-bold", accent.text)}>{value}%</div>
              <div className="mt-0.5 font-mono text-[9px] text-ink-400">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* 推荐理由 */}
      <div className="mt-5 rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-300">
          <ICONS.Sparkles className="h-3 w-3" />
          AI 推荐理由
        </p>
        <p className="text-sm leading-relaxed text-ink-200">{reason}</p>
      </div>

      {/* 操作 */}
      <Link
        to={`/experience/${career.id}`}
        className={cn(
          "mt-5 flex items-center justify-center gap-2 rounded-lg border py-3 font-medium transition-all duration-300",
          "border-white/10 bg-white/[0.03] text-ink-200 hover:border-white/20 hover:bg-white/[0.06] hover:text-ink-100"
        )}
      >
        <ICONS.Play className="h-4 w-4" />
        进入一天体验
        <ICONS.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </article>
  );
}
