export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDate = (dateStr: string): Date | null => {
  const match = dateStr.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})[日号]?/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return null;
};

export const parseShelfLife = (shelfLifeStr: string): number => {
  const match = shelfLifeStr.match(/(\d+)\s*(天|日|周|月|年)/);
  if (!match) return 365;
  
  const num = Number(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case '天':
    case '日':
      return num;
    case '周':
      return num * 7;
    case '月':
      return num * 30;
    case '年':
      return num * 365;
    default:
      return 365;
  }
};

export const calculateExpiryDate = (productionDate: Date, shelfLifeDays: number): Date => {
  const expiry = new Date(productionDate);
  expiry.setDate(expiry.getDate() + shelfLifeDays);
  return expiry;
};

export const calculateRemainingDays = (expiryDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getStatus = (remainingDays: number): 'normal' | 'warning' | 'expired' => {
  if (remainingDays < 0) return 'expired';
  if (remainingDays <= 7) return 'warning';
  return 'normal';
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
