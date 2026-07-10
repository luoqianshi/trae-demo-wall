'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { SnowballStage } from '@/lib/snowball-score';

interface NavSnowballProps {
  /** 今日得分 */
  todayGrowth: number;
  /** 总分 */
  totalGrowth: number;
  /** 当前雪球阶段 */
  currentStage: SnowballStage;
  /** 连续天数 */
  streakDays?: number;
  /** 隐藏的页面路径 */
  hideOnPages?: string[];
}

/**
 * 导航栏雪球组件
 * 方案2+4结合：进度胶囊 + 下拉触发完整卡片
 */
export function NavSnowball({
  todayGrowth,
  totalGrowth,
  currentStage,
  streakDays = 0,
  hideOnPages = ['/', '/review'],
}: NavSnowballProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉（必须在所有 early return 之前，避免违反 React Hooks 规则）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 在指定页面隐藏（early return 必须在所有 hook 之后）
  const shouldHide = hideOnPages.some(page => pathname === page);
  if (shouldHide) return null;

  // 获取雪球图片路径
  const getSnowballImage = () => {
    const stageMap: Record<SnowballStage, string> = {
      snowflake: '/images/snowball-stages/stage-1.webp',
      small_ball: '/images/snowball-stages/stage-2.webp',
      ball: '/images/snowball-stages/stage-3.webp',
    };
    return stageMap[currentStage];
  };

  // 阶段标签
  const stageLabels: Record<SnowballStage, string> = {
    snowflake: '雪粒',
    small_ball: '小雪球',
    ball: '雪球',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 触发器：进度胶囊 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-gray-100 rounded-full hover:border-pink-200 hover:shadow-md transition-all duration-200"
      >
        {/* 迷你雪球图标 */}
        <div 
          className="w-7 h-7 rounded-full bg-gradient-to-br from-white to-blue-100 shadow-sm relative overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #fff, #E8F4F8)',
          }}
        >
          <div 
            className="absolute w-2 h-2 bg-white/90 rounded-full"
            style={{ top: '5px', left: '6px' }}
          />
        </div>
        
        {/* 进度信息 */}
        <div className="text-left">
          <div className="text-[10px] text-gray-400 leading-tight">今日得分</div>
          <div className="text-xs font-semibold text-gray-700">+{todayGrowth}</div>
        </div>
        
        {/* 下拉箭头 */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 text-xs"
        >
          ▼
        </motion.span>
      </button>

      {/* 下拉卡片 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            {/* 卡片头部 */}
            <div className="p-4 bg-gradient-to-br from-pink-50 to-blue-50">
              <div className="flex items-center gap-3">
                {/* 雪球图片 */}
                <div className="w-14 h-14 relative">
                  <img
                    src={getSnowballImage()}
                    alt={stageLabels[currentStage]}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* 阶段信息 */}
                <div>
                  <div className="text-sm font-semibold text-gray-800">
                    ⛄ {stageLabels[currentStage]}
                  </div>
                  <div className="text-xs text-gray-500">
                    今日 +{todayGrowth}分 · 连续滚雪球 {streakDays} 天
                  </div>
                </div>
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="px-4 py-3 border-t border-gray-50">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>总分</span>
                <span>{totalGrowth}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalGrowth}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #FFB6C1, #87CEEB)',
                  }}
                />
              </div>
            </div>
            
            {/* 快捷入口 */}
            <div className="px-4 py-3 border-t border-gray-50 flex gap-2">
              <a
                href="/records"
                className="flex-1 text-center text-xs text-gray-600 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                查看记录
              </a>
              <a
                href="/"
                className="flex-1 text-center text-xs text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #FFB6C1, #87CEEB)',
                }}
              >
                回到首页
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
