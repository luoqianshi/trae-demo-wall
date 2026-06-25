export const formatDate = (dateString: string, format: 'relative' | 'date' | 'time' = 'relative'): string => {
  const date = new Date(dateString);
  
  if (format === 'date') {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (format === 'time') {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return '今天';
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else if (days < 30) {
    return `${Math.floor(days / 7)}周前`;
  } else if (days < 365) {
    return `${Math.floor(days / 30)}个月前`;
  } else {
    return `${Math.floor(days / 365)}年前`;
  }
};

export const formatDateFull = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatMonth = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long'
  });
};

export const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

export const formatPercent = (num: number): string => {
  return Math.round(num * 100) + '%';
};

export const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number): T => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
};

export const throttle = <T extends (...args: unknown[]) => void>(fn: T, limit: number): T => {
  let inThrottle = false;
  return ((...args: unknown[]) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const getTodayString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const calculateStreakDays = (lastLoginDate?: string): number => {
  if (!lastLoginDate) return 0;
  
  const today = new Date();
  const lastDate = new Date(lastLoginDate);
  
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 1;
  if (diffDays === 1) return 2;
  return 1;
};

export const getProgressToNextLevel = (experience: number): { current: number; next: number; percent: number } => {
  const nextLevelExp = 100;
  const currentLevel = Math.floor(experience / nextLevelExp);
  const currentExp = experience % nextLevelExp;
  const percent = Math.round((currentExp / nextLevelExp) * 100);
  
  return {
    current: currentLevel + 1,
    next: currentLevel + 2,
    percent
  };
};

export const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
};
