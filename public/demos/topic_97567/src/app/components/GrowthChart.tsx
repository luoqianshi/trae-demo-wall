'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GrowthDataPoint {
  date: string;
  snowball_size: number;
  tasks_completed: number;
  records_count: number;
}

interface GrowthChartProps {
  data: GrowthDataPoint[];
}

const GrowthChart = ({ data }: GrowthChartProps) => {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
          <XAxis dataKey="date" stroke="#666666" fontSize={12} />
          <YAxis stroke="#666666" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFF8F0',
              border: '1px solid #E8E8E8',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="snowball_size" stroke="#87CEEB" strokeWidth={2} name="雪球大小" dot={{ fill: '#87CEEB' }} />
          <Line type="monotone" dataKey="tasks_completed" stroke="#FFB6C1" strokeWidth={2} name="完成任务" dot={{ fill: '#FFB6C1' }} />
          <Line type="monotone" dataKey="records_count" stroke="#FFD700" strokeWidth={2} name="记录数" dot={{ fill: '#FFD700' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GrowthChart;
