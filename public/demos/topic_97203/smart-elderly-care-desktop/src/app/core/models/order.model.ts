export type ServiceType = 'cleaning' | 'cooking' | 'accompany' | 'nursing' | 'repair' | 'other';
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'completed' | 'cancelled';

export interface ServiceOrder {
  id: number;
  elderId: number;
  orderedBy: number;
  serviceType: ServiceType;
  serviceName: string;
  status: OrderStatus;
  amount: number;
  orderedAt: Date;
  completedAt?: Date | null;
}

export interface ServiceCategory {
  type: ServiceType;
  name: string;
  description: string;
  icon: string;
  buttonText: string;
  color: string;
}
