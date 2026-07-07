export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分钟`;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
};

export const formatPrice = (price: number): string => {
  return `¥${price}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 ${weekday}`;
};

export const getTransportIcon = (type: string): string => {
  const icons: Record<string, string> = {
    flight: '✈️',
    train: '🚄',
    bus: '🚌',
    car: '🚗',
  };
  return icons[type] || '🚀';
};

export const getRouteTypeTagClass = (type: string): string => {
  const classes: Record<string, string> = {
    boomerang: 'tag-boomerang',
    open_jaw: 'tag-open-jaw',
    same_train: 'tag-same-train',
    normal: 'tag-normal',
    nunchaku: 'tag-nunchaku',
  };
  return classes[type] || 'tag-normal';
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const getTotalLayoverDuration = (layovers: { duration: number }[]): number => {
  return layovers.reduce((total, layover) => total + layover.duration, 0);
};
