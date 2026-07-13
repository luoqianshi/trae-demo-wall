import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Activity, TrendingUp, PieChart } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartCardProps {
  type: 'line' | 'bar' | 'doughnut';
  title: string;
  icon: typeof Activity;
  data: any;
  options?: any;
}

export const ChartCard = ({ type, title, icon: Icon, data, options }: ChartCardProps) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: type !== 'doughnut',
        position: 'bottom' as const,
      },
    },
  };

  const chartOptions = options || defaultOptions;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">{title}</h3>
          </div>
        </div>
      </div>
      <div className="h-48">
        {type === 'line' && <Line data={data} options={chartOptions} />}
        {type === 'bar' && <Bar data={data} options={chartOptions} />}
        {type === 'doughnut' && <Doughnut data={data} options={chartOptions} />}
      </div>
    </div>
  );
};