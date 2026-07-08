// 订单全局状态（用户发布的订单）
import { create } from 'zustand';
import type { Order } from '../types/order';

interface OrderState {
  userOrders: Order[];
  addOrder: (order: Order) => void;
  getOrderById: (id: string) => Order | undefined;
  getAllOrders: () => Order[];
}

export const useOrderStore = create<OrderState>((set, get) => ({
  userOrders: [],
  addOrder: (order) => set((s) => ({ userOrders: [order, ...s.userOrders] })),
  getOrderById: (id) => get().userOrders.find((o) => o.id === id),
  getAllOrders: () => get().userOrders
}));
