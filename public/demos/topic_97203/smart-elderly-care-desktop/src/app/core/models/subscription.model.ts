export type SubscriptionPlan = 'basic' | 'premium' | 'flagship';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  price: number;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  plan: string;
  amount: number;
  paymentMethod: 'wechat' | 'alipay';
  status: 'paid' | 'refunded';
  paidAt: Date;
}

export interface PlanInfo {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  features: { label: string; included: boolean | string }[];
  recommended?: boolean;
}
