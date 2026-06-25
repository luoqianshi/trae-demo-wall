import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ICONS } from "@/lib/icons";
import Layout from "@/components/Layout";
import NeonButton from "@/components/NeonButton";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useAppStore } from "@/store/useAppStore";
import {
  INTEREST_OPTIONS,
  SUBJECT_OPTIONS,
  DISLIKED_WORK_OPTIONS,
  PERSONALITY_DIMENSIONS,
  type UserProfile,
} from "@/types";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS = [
  { id: "female" as const, label: "女生", icon: "UserRound" },
  { id: "male" as const, label: "男生", icon: "User" },
  { id: "other" as const, label: "其他", icon: "Smile" },
];

export default function Input() {
  const navigate = useNavigate();
  const { userProfile, setUserProfile, generateRecommendations, setBrowseMode } = useAppStore();

  const [form, setForm] = useState<UserProfile>(userProfile);
  const [loading, setLoading] = useState(false);

  const toggleArray = (key: "interests" | "strongSubjects" | "dislikedWork", value: string) => {
    setForm((prev) => {
      const arr = prev[key];
      const isActive = arr.includes(value);
      const maxCount = key === "interests" || key === "strongSubjects" ? 4 : 6;
      if (!isActive && arr.length >= maxCount) return prev;
      return {
        ...prev,
        [key]: isActive ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const setPersonality = (key: keyof UserProfile["personality"], value: number) => {
    setForm((prev) => ({
      ...prev,
      personality: { ...prev.personality, [key]: value },
    }));
  };

  const setGender = (gender: UserProfile["gender"]) => {
    setForm((prev) => ({ ...prev, gender }));
  };

  const handleSkipToExplore = () => {
    setBrowseMode(true);
    navigate("/results");
  };

  const canSubmit =
    form.interests.length >= 2 &&
    form.interests.length <= 4 &&
    form.strongSubjects.length >= 2 &&
    form.strongSubjects.length <= 4 &&
    form.dislikedWork.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setUserProfile(form);
    setLoading(true);
  };

  const handleLoadingComplete = useCallback(() => {
    generateRecommendations();
    setLoading(false);
    navigate("/results");
  }, [generateRecommendations, navigate]);

  if (loading) {
    return <LoadingOverlay onComplete={handleLoadingComplete} duration={2800} />;
  }

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-4rem)] py-12">
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-neon-cyan/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6">
          {/* 标题 */}
          <div className="mb-8 text-center">
            <p className="font-mono text-sm tracking-widest text-neon-cyan">STEP 01 · USER PROFILE</p>
            <h1 className="mt-3 font-display text-4xl font-bold text-ink-100 sm:text-5xl">
              告诉 AI 关于<span className="gradient-text">你自己</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-ink-300">
              越真实的输入，越精准的推荐。请花 2 分钟完成以下五维画像。
            </p>
          </div>

          {/* 跳过入口 */}
          <div className="mb-10 flex items-center justify-center gap-3">
            <span className="font-mono text-xs text-ink-400">不想填问卷？</span>
            <button
              onClick={handleSkipToExplore}
              className="group inline-flex items-center gap-1.5 rounded-full border border-neon-magenta/30 bg-neon-magenta/5 px-4 py-1.5 font-mono text-xs text-neon-magenta transition-all hover:border-neon-magenta/60 hover:bg-neon-magenta/10"
            >
              <ICONS.Compass className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
              直接浏览全部职业
              <ICONS.ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* 进度指示 */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
            {[
              { label: "性别", done: !!form.gender, optional: true },
              { label: "兴趣", done: form.interests.length > 0, optional: false },
              { label: "性格", done: true, optional: false },
              { label: "科目", done: form.strongSubjects.length > 0, optional: false },
              { label: "偏好", done: form.dislikedWork.length > 0, optional: false },
              { label: "期待", done: form.futureExpectation.trim().length > 0, optional: true },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs transition-all",
                    item.done
                      ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan"
                      : item.optional
                        ? "border-white/10 text-ink-400"
                        : "border-white/10 text-ink-400"
                  )}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>{item.label}</span>
                  {item.optional && !item.done && (
                    <span className="text-[9px] text-ink-400">选填</span>
                  )}
                  {item.done && <ICONS.Check className="h-3 w-3" />}
                </div>
                {i < 5 && <div className="mx-1 h-px w-3 bg-white/10" />}
              </div>
            ))}
          </div>

          {/* 表单卡片 */}
          <div className="space-y-6">
            {/* 0. 性别 */}
            <section className="glass-card animate-fade-up p-6 sm:p-8">
              <SectionHeader
                index="00"
                title="你的性别"
                desc="用于生成符合职业形象的卡通人物（可选）"
                icon="UserCircle"
              />
              <div className="mt-6 flex flex-wrap gap-3">
                {GENDER_OPTIONS.map((opt) => {
                  const Icon = ICONS[opt.icon] || ICONS.Circle;
                  const active = form.gender === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGender(opt.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-5 py-3 transition-all",
                        active
                          ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan"
                          : "border-white/10 bg-white/[0.02] text-ink-300 hover:border-white/20"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 1. 兴趣 */}
            <section className="glass-card animate-fade-up p-6 sm:p-8">
              <SectionHeader
                index="01"
                title="你的兴趣领域"
                desc="选择 2-4 个你最感兴趣的领域"
                icon="Sparkles"
              />
              <div className="mt-6 flex flex-wrap gap-2.5">
                {INTEREST_OPTIONS.map((opt) => {
                  const Icon = ICONS[opt.icon] || ICONS.Circle;
                  const active = form.interests.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleArray("interests", opt.id)}
                      aria-pressed={active}
                      disabled={!active && form.interests.length >= 4}
                      className={cn("tag-chip flex items-center gap-1.5", active && "tag-chip-active", !active && form.interests.length >= 4 && "cursor-not-allowed opacity-40")}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. 性格 */}
            <section className="glass-card animate-fade-up p-6 sm:p-8" style={{ animationDelay: "100ms" }}>
              <SectionHeader
                index="02"
                title="你的性格画像"
                desc="拖动滑块，在两极之间找到你的位置"
                icon="Brain"
              />
              <div className="mt-8 space-y-7">
                {PERSONALITY_DIMENSIONS.map((dim) => {
                  const value = form.personality[dim.key];
                  return (
                    <div key={dim.key}>
                      <label className="mb-2 flex items-center justify-between font-mono text-xs" htmlFor={`personality-${dim.key}`}>
                        <span className="text-ink-300">{dim.leftLabel}</span>
                        <span className="rounded border border-neon-cyan/30 bg-neon-cyan/5 px-2 py-0.5 text-neon-cyan">
                          {value}
                        </span>
                        <span className="text-ink-300">{dim.rightLabel}</span>
                      </label>
                      <input
                        id={`personality-${dim.key}`}
                        type="range"
                        min={0}
                        max={100}
                        value={value}
                        onChange={(e) => setPersonality(dim.key, Number(e.target.value))}
                        className="neon-slider"
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 3. 擅长科目 */}
            <section className="glass-card animate-fade-up p-6 sm:p-8" style={{ animationDelay: "150ms" }}>
              <SectionHeader
                index="03"
                title="你擅长的科目"
                desc="选择 2-4 个你成绩较好或学得轻松的科目"
                icon="GraduationCap"
              />
              <div className="mt-6 flex flex-wrap gap-2.5">
                {SUBJECT_OPTIONS.map((opt) => {
                  const active = form.strongSubjects.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleArray("strongSubjects", opt.id)}
                      aria-pressed={active}
                      disabled={!active && form.strongSubjects.length >= 4}
                      className={cn("tag-chip", active && "tag-chip-active", !active && form.strongSubjects.length >= 4 && "cursor-not-allowed opacity-40")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. 讨厌的工作类型 */}
            <section className="glass-card animate-fade-up p-6 sm:p-8" style={{ animationDelay: "200ms" }}>
              <SectionHeader
                index="04"
                title="你讨厌的工作类型"
                desc="选择你希望尽量避免的工作方式"
                icon="ThumbsDown"
              />
              <div className="mt-6 flex flex-wrap gap-2.5">
                {DISLIKED_WORK_OPTIONS.map((opt) => {
                  const Icon = ICONS[opt.icon] || ICONS.X;
                  const active = form.dislikedWork.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleArray("dislikedWork", opt.id)}
                      aria-pressed={active}
                      className={cn(
                        "tag-chip flex items-center gap-1.5",
                        active && "tag-chip-active border-neon-magenta/60 bg-neon-magenta/10 text-neon-magenta"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 5. 未来期待 */}
            <section className="glass-card animate-fade-up p-6 sm:p-8" style={{ animationDelay: "250ms" }}>
              <SectionHeader
                index="05"
                title="你对未来的期待"
                desc="描述你理想的工作状态、薪资期待或生活方式（选填，不填也可继续）"
                icon="Rocket"
                optional
              />
              <textarea
                value={form.futureExpectation}
                onChange={(e) => setForm((prev) => ({ ...prev, futureExpectation: e.target.value }))}
                placeholder="例如：我希望工作有创造性，薪资能支撑自由生活，能不断学习新事物，不想被重复劳动束缚...（也可以留空直接提交）"
                rows={4}
                maxLength={300}
                className="mt-6 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink-100 placeholder:text-ink-400 transition-all focus:border-neon-cyan/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-neon-cyan/20"
              />
              <div className="mt-2 flex justify-end font-mono text-xs text-ink-400">
                {form.futureExpectation.length} / 300
              </div>
            </section>

            {/* 提交 */}
            <div className="flex flex-col items-center gap-4 pt-4">
              <NeonButton
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="group w-full sm:w-auto"
              >
                <ICONS.BrainCircuit className="h-5 w-5 transition-transform group-hover:scale-110" />
                开始 AI 体验
                <ICONS.ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </NeonButton>
              {!canSubmit && (
                <p className="font-mono text-xs text-ink-400">
                  请至少选择 2 个兴趣、2 个擅长科目和 1 个希望避免的工作类型，或直接浏览全部职业
                </p>
              )}
              {canSubmit && (
                <p className="font-mono text-xs text-ink-400">
                  准备好了，点击开启你的未来职业之旅 ✨
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SectionHeader({
  index,
  title,
  desc,
  icon,
  optional = false,
}: {
  index: string;
  title: string;
  desc: string;
  icon: string;
  optional?: boolean;
}) {
  const Icon = ICONS[icon] || ICONS.Circle;
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neon-cyan/30 bg-neon-cyan/5">
        <Icon className="h-6 w-6 text-neon-cyan" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-neon-cyan">{index}</span>
          <h2 className="font-display text-xl font-bold text-ink-100">{title}</h2>
          {optional && (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-ink-400">
              选填
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-300">{desc}</p>
      </div>
    </div>
  );
}
