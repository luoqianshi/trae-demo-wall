import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Question, ReviewRecord } from "@/types";

interface TrendLineProps {
  questions: Question[];
  reviewRecords: ReviewRecord[];
  days?: number;
  height?: number;
}

export function TrendLine({
  questions,
  reviewRecords,
  days = 30,
  height = 260,
}: TrendLineProps) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const startTs = today.getTime() - (days - 1) * 24 * 3600 * 1000;
  const start = new Date(startTs);
  start.setHours(0, 0, 0, 0);

  // 初始化日期桶
  const buckets: { date: string; label: string; added: number; reviewed: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 24 * 3600 * 1000);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    buckets.push({
      date: d.toISOString().slice(0, 10),
      label,
      added: 0,
      reviewed: 0,
    });
  }
  const index = new Map(buckets.map((b, i) => [b.date, i]));

  // 统计新增
  questions.forEach((q) => {
    const key = new Date(q.createdAt).toISOString().slice(0, 10);
    const i = index.get(key);
    if (i !== undefined) buckets[i].added += 1;
  });
  // 统计复习
  reviewRecords.forEach((r) => {
    const key = new Date(r.reviewedAt).toISOString().slice(0, 10);
    const i = index.get(key);
    if (i !== undefined) buckets[i].reviewed += 1;
  });

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={buckets} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-added" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3c63ff" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#3c63ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-reviewed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4fd2c2" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#4fd2c2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,32,51,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#7d8aa6", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(days / 8)}
          />
          <YAxis
            tick={{ fill: "#7d8aa6", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 14,
              border: "none",
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 10px 30px rgba(22,32,51,0.12)",
              fontSize: 12,
            }}
            labelStyle={{ fontWeight: 700, color: "#162033" }}
          />
          <Area
            type="monotone"
            dataKey="added"
            name="新增错题"
            stroke="#3c63ff"
            strokeWidth={2}
            fill="url(#grad-added)"
          />
          <Area
            type="monotone"
            dataKey="reviewed"
            name="复习题数"
            stroke="#4fd2c2"
            strokeWidth={2}
            fill="url(#grad-reviewed)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
