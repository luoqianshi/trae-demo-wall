import { useState } from 'react';
import { Sun, Snowflake, Calendar, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VacationModalProps {
  vacationType: 'summer' | 'winter';
  onComplete: (startDate: string, endDate: string) => void;
  onSkip: () => void;
}

// 假期配置
interface VacationConfig {
  title: string;
  description: string;
  Icon: typeof Sun;
  iconWrapperClass: string;
  iconClass: string;
  defaultStart: string;
  defaultEnd: string;
}

// 根据假期类型获取对应配置（默认值使用当前年份）
function getVacationConfig(vacationType: 'summer' | 'winter'): VacationConfig {
  const year = new Date().getFullYear();
  if (vacationType === 'summer') {
    return {
      title: '暑假模式设置',
      description: '设置暑假日期范围，假期内将自动切换到轻松模式',
      Icon: Sun,
      iconWrapperClass: 'bg-corgi-orange/15',
      iconClass: 'text-corgi-orange',
      defaultStart: `${year}-07-01`,
      defaultEnd: `${year}-08-31`,
    };
  }
  return {
    title: '寒假模式设置',
    description: '设置寒假日期范围，假期内将自动切换到轻松模式',
    Icon: Snowflake,
    iconWrapperClass: 'bg-mint-fresh/20',
    iconClass: 'text-mint-deep',
    defaultStart: `${year}-01-15`,
    defaultEnd: `${year}-02-28`,
  };
}

export default function VacationModal({ vacationType, onComplete, onSkip }: VacationModalProps) {
  const config = getVacationConfig(vacationType);
  const { title, description, Icon, iconWrapperClass, iconClass, defaultStart, defaultEnd } = config;
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // 校验日期范围是否有效（开始日期不晚于结束日期）
  const isValid = Boolean(startDate && endDate && startDate <= endDate);

  const handleConfirm = () => {
    if (isValid) {
      onComplete(startDate, endDate);
    }
  };

  return (
    <>
      {/* 遮罩 */}
      <div className="fixed inset-0 z-40 bg-black/20 animate-pop-in" />

      {/* 弹窗主体 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-pop-in">
        <div className="w-full max-w-sm bg-warm-light rounded-puffy shadow-puffy border-4 border-corgi-yellow/40 overflow-hidden">
          {/* 头部 */}
          <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-4 bg-warm-cream/60">
            <div className={cn('w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-soft', iconWrapperClass)}>
              <Icon size={28} className={iconClass} />
            </div>
            <h2 className="font-display text-xl text-text-primary">{title}</h2>
            <p className="text-xs text-text-secondary text-center">{description}</p>
          </div>

          {/* 日期选择区 */}
          <div className="px-6 py-5 space-y-4">
            {/* 假期开始日期 */}
            <div className="bg-warm-cream/60 rounded-2xl p-4 border-2 border-corgi-yellow/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-corgi-orange" />
                <span className="text-sm font-bold text-text-primary">假期开始日期</span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border-2 border-corgi-yellow/20 text-text-primary text-sm focus:outline-none focus:border-corgi-orange"
              />
            </div>

            {/* 假期结束日期 */}
            <div className="bg-warm-cream/60 rounded-2xl p-4 border-2 border-corgi-yellow/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-corgi-orange" />
                <span className="text-sm font-bold text-text-primary">假期结束日期</span>
              </div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border-2 border-corgi-yellow/20 text-text-primary text-sm focus:outline-none focus:border-corgi-orange"
              />
            </div>

            {/* 日期范围错误提示 */}
            {!isValid && (
              <p className="text-xs text-berry-rose text-center">结束日期不能早于开始日期</p>
            )}
          </div>

          {/* 按钮区 */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={onSkip}
              className="btn-press flex-1 py-3 rounded-2xl bg-gray-200/60 text-gray-500 font-bold text-sm hover:bg-gray-300/60 transition-colors"
            >
              暂不设置
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValid}
              className={cn(
                'btn-press flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 transition-colors',
                isValid
                  ? 'bg-corgi-orange text-white hover:bg-corgi-dark'
                  : 'bg-corgi-orange/40 text-white/60 cursor-not-allowed'
              )}
            >
              <Check size={16} />
              确认
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
