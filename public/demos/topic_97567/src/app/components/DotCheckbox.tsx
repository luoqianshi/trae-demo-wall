'use client';

import { motion } from 'framer-motion';

interface DotCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: number;
}

/**
 * 品牌渐变圆点复选框
 * 未选中：圆形边框
 * 选中：品牌渐变填充（淡粉→淡蓝）
 */
export function DotCheckbox({ 
  checked, 
  onChange, 
  disabled = false,
  size = 22 
}: DotCheckboxProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="relative flex items-center justify-center rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:ring-offset-1"
      style={{
        width: size,
        height: size,
        borderColor: checked ? 'transparent' : '#ddd',
        background: checked 
          ? 'linear-gradient(135deg, #FFB6C1, #87CEEB)' 
          : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      animate={checked ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {checked && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-white text-xs font-bold"
          style={{ fontSize: size * 0.5 }}
        >
          ✓
        </motion.span>
      )}
    </motion.button>
  );
}
