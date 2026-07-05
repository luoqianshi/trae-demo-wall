import { useState, useEffect } from 'react';
import { Order, Stats } from '../types';

const STORAGE_KEY = 'qingdanbao_orders';

export const useOrders = () => {
  // 初始化时直接从 localStorage 读取
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 保存数据到 localStorage 的辅助函数
  const saveToStorage = (newOrders: Order[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  };

  // 添加订单
  const addOrder = (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      orderNumber: `OD${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newOrders = [newOrder, ...orders];
    setOrders(newOrders);
    saveToStorage(newOrders);
    return newOrder;
  };

  // 更新订单
  const updateOrder = (id: string, updates: Partial<Order>) => {
    const newOrders = orders.map(order => 
      order.id === id 
        ? { ...order, ...updates, updatedAt: new Date().toISOString() }
        : order
    );
    setOrders(newOrders);
    saveToStorage(newOrders);
  };

  // 删除订单
  const deleteOrder = (id: string) => {
    const newOrders = orders.filter(order => order.id !== id);
    setOrders(newOrders);
    saveToStorage(newOrders);
  };

  // 获取统计数据
  const getStats = (): Stats => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCost = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => 
      sum + o.materials.reduce((mSum, m) => mSum + m.quantity * m.unitPrice, 0), 0
    );
    const totalProfit = totalRevenue - totalCost;

    return {
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalCost,
      totalProfit,
    };
  };

  return {
    orders,
    addOrder,
    updateOrder,
    deleteOrder,
    getStats,
  };
};
