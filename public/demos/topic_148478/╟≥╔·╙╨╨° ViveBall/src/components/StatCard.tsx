import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

export function StatCard({ icon, value, label, suffix = '', prefix = '' }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">
        {prefix}{formatNumber(displayValue)}{suffix}
      </div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
  );
}
