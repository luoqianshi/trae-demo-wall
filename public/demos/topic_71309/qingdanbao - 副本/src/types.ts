export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  totalAmount: number;
  materials: MaterialItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProfit: number;
  totalCost: number;
}
