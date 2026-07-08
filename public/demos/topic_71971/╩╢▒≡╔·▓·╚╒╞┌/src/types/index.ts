export interface DateResult {
  id: string;
  imageUrl: string;
  productName: string;
  productionDate: string;
  shelfLife: string;
  shelfLifeDays: number;
  expiryDate: string;
  remainingDays: number;
  status: 'normal' | 'warning' | 'expired';
  createTime: string;
}

export interface RecognitionState {
  isLoading: boolean;
  result: DateResult | null;
  error: string | null;
}
