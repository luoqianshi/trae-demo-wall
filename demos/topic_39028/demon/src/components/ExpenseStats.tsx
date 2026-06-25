import { TrendingUp, Wallet } from 'lucide-react';
import type { Expense } from '../data/mockData';

interface ExpenseStatsProps {
  expenses: Expense[];
}

export function ExpenseStats({ expenses }: ExpenseStatsProps) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const maxAmount = Math.max(...expenses.map((e) => e.amount));

  let cumulative = 0;
  const segments = expenses.map((e) => {
    const start = cumulative;
    cumulative += (e.amount / total) * 100;
    return { ...e, start, end: cumulative };
  });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Expense Report</h3>
          <p className="text-sm text-gray-500 mt-1">AI categorized breakdown</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
          <TrendingUp size={14} className="text-green-500" />
          <span className="text-xs font-medium text-green-600">All Tracked</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="14" />
            {segments.map((seg, idx) => (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={`${(seg.end - seg.start) * 2.51327} ${251.327 - (seg.end - seg.start) * 2.51327}`}
                strokeDashoffset={-seg.start * 2.51327}
                className="transition-all duration-500"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Wallet size={20} className="text-gray-400 mb-1" />
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-800">¥{(total / 1000).toFixed(1)}k</p>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          {expenses.map((expense) => (
            <div key={expense.category}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: expense.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{expense.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">
                    ¥{expense.amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {((expense.amount / total) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(expense.amount / maxAmount) * 100}%`,
                    backgroundColor: expense.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
