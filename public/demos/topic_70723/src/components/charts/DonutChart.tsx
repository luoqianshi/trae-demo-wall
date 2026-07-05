import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Question, Subject } from "@/types";
import { getSubject } from "@/data/subjects";

interface DonutChartProps {
  questions: Question[];
  height?: number;
}

export function DonutChart({ questions, height = 220 }: DonutChartProps) {
  // 按学科聚合
  const counts = new Map<Subject, number>();
  questions.forEach((q) => counts.set(q.subject, (counts.get(q.subject) ?? 0) + 1));
  const data = Array.from(counts.entries()).map(([subject, value]) => ({
    name: getSubject(subject).name,
    value,
    color: getSubject(subject).color,
  }));
  // 按数量降序
  data.sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="h-[220px] grid place-items-center text-sm text-ink-400">
        暂无数据
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="100%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "none",
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 10px 30px rgba(22,32,51,0.12)",
              fontSize: 12,
            }}
            formatter={(v: number) => [`${v} 道`, "数量"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="num-display text-3xl font-bold text-ink-900">{total}</div>
          <div className="text-[11px] text-ink-400 mt-0.5">错题总数</div>
        </div>
      </div>
    </div>
  );
}
