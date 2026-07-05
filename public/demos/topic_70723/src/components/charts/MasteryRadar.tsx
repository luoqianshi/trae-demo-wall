import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { Question } from "@/types";

interface MasteryRadarProps {
  questions: Question[];
  height?: number;
}

export function MasteryRadar({ questions, height = 260 }: MasteryRadarProps) {
  // 按章节（chapter）聚合平均掌握度
  const groups = new Map<string, number[]>();
  questions.forEach((q) => {
    if (!groups.has(q.chapter)) groups.set(q.chapter, []);
    groups.get(q.chapter)!.push(q.mastery);
  });
  const data = Array.from(groups.entries())
    .map(([chapter, list]) => ({
      subject: chapter.replace(/^\S+\s·\s/, ""),
      mastery: Math.round(list.reduce((a, b) => a + b, 0) / list.length),
    }))
    .slice(0, 6);

  if (data.length < 3) {
    return (
      <div className="h-[260px] grid place-items-center text-sm text-ink-400">
        数据不足，至少需要 3 个章节
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(22,32,51,0.08)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#5d6b84", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#b7c2d8", fontSize: 10 }}
            stroke="rgba(22,32,51,0.06)"
          />
          <Radar
            dataKey="mastery"
            stroke="#3c63ff"
            fill="#3c63ff"
            fillOpacity={0.32}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
