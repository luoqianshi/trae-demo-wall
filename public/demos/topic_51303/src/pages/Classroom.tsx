import { useEffect, useState } from "react";
import { Play, Radio, BookOpen, Eye } from "lucide-react";
import SubPageLayout from "@/components/SubPageLayout";
import { getCourses } from "@/services/api";
import { useAppStore } from "@/store/app";
import Empty from "@/components/Empty";
import type { CourseItem } from "@/types";

const categories: (CourseItem["category"] | "全部")[] = ["全部", "视频教程", "病害图鉴", "专家直播"];

const coverStyles: Record<string, { gradient: string; emoji: string }> = {
  "mushroom-color": { gradient: "linear-gradient(135deg, #07c160 0%, #4caf50 100%)", emoji: "🍄" },
  "disease-green": { gradient: "linear-gradient(135deg, #689f38 0%, #afb42b 100%)", emoji: "🦠" },
  "live-cool": { gradient: "linear-gradient(135deg, #10aeff 0%, #07c160 100%)", emoji: "❄️" },
  "oyster-water": { gradient: "linear-gradient(135deg, #26a69a 0%, #80cbc4 100%)", emoji: "💧" },
  contamination: { gradient: "linear-gradient(135deg, #fa9d3b 0%, #ffcc80 100%)", emoji: "⚠️" },
};

export default function Classroom() {
  const showToast = useAppStore((s) => s.showToast);
  const [active, setActive] = useState<CourseItem["category"] | "全部">("全部");
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCourses(active).then((list) => {
      setCourses(list);
      setLoading(false);
    });
  }, [active]);

  return (
    <SubPageLayout title="农技课堂">
      {/* 分类筛选 */}
      <div
        className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto"
        style={{ padding: "12px 16px", background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-rule)" }}
      >
        {categories.map((c) => {
          const isActive = active === c;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className="inline-flex shrink-0 items-center justify-center whitespace-nowrap"
              style={{
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-caption)",
                fontWeight: isActive ? 600 : 400,
                background: isActive ? "var(--color-primary)" : "var(--color-bg-deep)",
                color: isActive ? "#fff" : "var(--color-text-secondary)",
                height: 28,
                border: "none",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div style={{ padding: 12 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse" style={{ height: 100, background: "var(--color-bg-deep)", borderRadius: "var(--radius-md)", marginBottom: 10 }} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Empty icon="🎓" title="暂无内容" desc="敬请期待更多农技课程" />
        ) : (
          <div style={{ padding: 12 }}>
            {courses.map((c, i) => (
              <CourseCard key={c.id} course={c} delay={i * 70} onClick={() => showToast(c.live ? "直播即将开始" : `开始播放《${c.title}》`)} />
            ))}
          </div>
        )}
      </div>
    </SubPageLayout>
  );
}

function CourseCard({ course, onClick, delay }: { course: CourseItem; onClick: () => void; delay: number }) {
  const style = coverStyles[course.cover] ?? coverStyles["mushroom-color"];
  const Icon = course.category === "专家直播" ? Radio : course.category === "病害图鉴" ? BookOpen : Play;

  return (
    <button
      onClick={onClick}
      className="animate-fade-in-up flex w-full items-stretch text-left transition active:opacity-90"
      style={{
        background: "var(--color-bg-elevated)",
        borderRadius: "var(--radius-md)",
        marginBottom: 10,
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
        border: "none",
        animationDelay: `${delay}ms`,
      }}
    >
      {/* 封面 */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 110, background: style.gradient, flexShrink: 0 }}
      >
        <span style={{ fontSize: 36 }}>{style.emoji}</span>
        {course.live ? (
          <span
            className="absolute flex items-center gap-1"
            style={{ top: 6, left: 6, background: "var(--state-error)", color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: "var(--radius-full)", fontWeight: 600 }}
          >
            ● 直播
          </span>
        ) : null}
        {course.duration ? (
          <span
            className="absolute"
            style={{ bottom: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: "var(--radius-xs)" }}
          >
            {course.duration}
          </span>
        ) : null}
      </div>

      {/* 信息 */}
      <div className="flex flex-1 flex-col justify-between" style={{ padding: 12, minWidth: 0 }}>
        <div>
          <div className="flex items-center gap-1" style={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 500, marginBottom: 4 }}>
            <Icon size={12} /> {course.category}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)", lineHeight: "var(--leading-snug)" }}>
            {course.title}
          </div>
        </div>
        <div className="flex items-center gap-1" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
          <Eye size={12} /> {course.views.toLocaleString()} 次学习
        </div>
      </div>
    </button>
  );
}
