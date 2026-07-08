// 格式化工具函数
import dayjs from 'dayjs';

export function formatDate(date: string, fmt: string = 'MM-DD'): string {
  return dayjs(date).format(fmt);
}

export function formatRelativeTime(dateStr: string): string {
  const date = dayjs(dateStr);
  const now = dayjs();
  const diffMin = now.diff(date, 'minute');
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = now.diff(date, 'hour');
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = now.diff(date, 'day');
  if (diffDay < 30) return `${diffDay}天前`;
  return date.format('YYYY-MM-DD');
}

export function formatWeekday(date: string): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[dayjs(date).day()];
}

export function formatPrice(price: number): string {
  if (price === 0) return '免费';
  return `¥${price}`;
}

export function formatCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export function getLevelLabel(level: number): string {
  const labels = ['', '新手', '入门', '进阶', '资深', '大师'];
  return labels[level] || '新手';
}

export function getStatusInfo(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    recruiting: { label: '招募中', color: 'accent' },
    matched: { label: '已撮合', color: 'success' },
    ongoing: { label: '进行中', color: 'primary' },
    completed: { label: '已完成', color: 'grey' },
    cancelled: { label: '已取消', color: 'grey' }
  };
  return map[status] || { label: '未知', color: 'grey' };
}
