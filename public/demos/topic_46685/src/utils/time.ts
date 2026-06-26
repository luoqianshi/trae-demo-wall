/**
 * 时间工具函数
 */

/**
 * 格式化当前时间，用于聊天记录
 */
export function formatCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 获取友好的时间提示
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 17) return '下午好';
  if (hour < 19) return '傍晚好';
  if (hour < 22) return '晚上好';
  return '夜深了';
}

/**
 * 获取模拟的天气信息
 */
export function getMockWeather(): { temp: number; condition: string; tip: string } {
  const hour = new Date().getHours();
  const baseTemp = 20 + Math.floor(Math.random() * 10);
  
  let condition = '晴朗';
  let tip = '今天天气不错！';
  
  if (hour > 6 && hour < 18) {
    const conditions = ['晴朗', '多云', '阴天'];
    condition = conditions[Math.floor(Math.random() * conditions.length)];
    tip = '记得适量饮水，保重身体！';
  } else {
    condition = '晴好';
    tip = '晚上注意保暖，早点休息！';
  }

  return {
    temp: baseTemp,
    condition,
    tip
  };
}
