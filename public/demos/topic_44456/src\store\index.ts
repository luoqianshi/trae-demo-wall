import { create } from 'zustand';
import type { AppState, User, Product, Order, Customer, ARCustomer } from '@/types';

const mockUser: User = {
  id: '1',
  email: 'admin@example.com',
  name: '管理员',
  role: 'admin',
  createdAt: '2024-01-01T00:00:00Z',
};

const mockProducts: Product[] = [
  { 
    id: '1', 
    name: '红烧肉', 
    price: 48, 
    category: '热菜', 
    description: '精选五花肉，慢火炖煮', 
    createdAt: '2024-01-01', 
    updatedAt: '2024-01-01',
    flavors: [
      { id: 'f1-1', name: '微辣', priceAdjust: 0 },
      { id: 'f1-2', name: '中辣', priceAdjust: 2 },
      { id: 'f1-3', name: '特辣', priceAdjust: 4 },
    ]
  },
  { 
    id: '2', 
    name: '清蒸鲈鱼', 
    price: 68, 
    category: '热菜', 
    description: '新鲜鲈鱼，清蒸入味', 
    createdAt: '2024-01-01', 
    updatedAt: '2024-01-01',
    flavors: [
      { id: 'f2-1', name: '原味', priceAdjust: 0 },
      { id: 'f2-2', name: '加葱', priceAdjust: 3 },
    ]
  },
  { 
    id: '3', 
    name: '蒜蓉西兰花', 
    price: 28, 
    category: '素菜', 
    description: '新鲜西兰花，蒜蓉炒制', 
    createdAt: '2024-01-01', 
    updatedAt: '2024-01-01' 
  },
  { 
    id: '4', 
    name: '宫保鸡丁', 
    price: 38, 
    category: '热菜', 
    description: '鸡肉丁配花生米，微辣', 
    createdAt: '2024-01-01', 
    updatedAt: '2024-01-01',
    flavors: [
      { id: 'f4-1', name: '微辣', priceAdjust: 0 },
      { id: 'f4-2', name: '中辣', priceAdjust: 2 },
      { id: 'f4-3', name: '不辣', priceAdjust: 0 },
    ]
  },
  { id: '5', name: '酸辣土豆丝', price: 18, category: '素菜', description: '脆嫩土豆丝，酸辣爽口', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { 
    id: '6', 
    name: '可乐', 
    price: 8, 
    category: '饮料', 
    description: '冰镇可乐', 
    createdAt: '2024-01-01', 
    updatedAt: '2024-01-01',
    flavors: [
      { id: 'f6-1', name: '正常冰', priceAdjust: 0 },
      { id: 'f6-2', name: '少冰', priceAdjust: 0 },
      { id: 'f6-3', name: '去冰', priceAdjust: 0 },
      { id: 'f6-4', name: '常温', priceAdjust: 0 },
    ]
  },
  { id: '7', name: '雪碧', price: 8, category: '饮料', description: '冰镇雪碧', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: '8', name: '米饭', price: 3, category: '主食', description: '白米饭', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

const mockCustomers: Customer[] = [
  { id: '1', name: '张三', phone: '13800138001', createdAt: '2024-01-01' },
  { id: '2', name: '李四', phone: '13800138002', createdAt: '2024-01-01' },
  { id: '3', name: '王五', phone: '13800138003', createdAt: '2024-01-01' },
];

const mockOrders: Order[] = [
  {
    id: '1',
    userId: '1',
    customerId: '1',
    customerName: '张三',
    items: [
      { id: '1-1', productId: '1', productName: '红烧肉', quantity: 1, price: 48 },
      { id: '1-2', productId: '6', productName: '可乐', quantity: 2, price: 8 },
      { id: '1-3', productId: '8', productName: '米饭', quantity: 2, price: 3 },
    ],
    totalAmount: 70,
    status: 'pending',
    createdAt: '2024-01-01T12:00:00Z',
  },
  {
    id: '2',
    userId: '1',
    customerId: '2',
    customerName: '李四',
    items: [
      { id: '2-1', productId: '2', productName: '清蒸鲈鱼', quantity: 1, price: 68 },
      { id: '2-2', productId: '3', productName: '蒜蓉西兰花', quantity: 1, price: 28 },
      { id: '2-3', productId: '8', productName: '米饭', quantity: 1, price: 3 },
    ],
    totalAmount: 99,
    status: 'paid',
    paymentMethod: 'facepay',
    createdAt: '2024-01-01T11:30:00Z',
    paidAt: '2024-01-01T11:35:00Z',
  },
];

const mockARCustomers: ARCustomer[] = [
  { id: '1', name: '张三', position: { x: 20, y: 30 }, isRecognized: true },
  { id: '2', name: '李四', position: { x: 60, y: 40 }, isRecognized: true },
  { id: '3', name: '王五', position: { x: 40, y: 65 }, isRecognized: false },
];

export const useAuthStore = create((set) => ({
  user: mockUser,
  token: 'mock-token',
  isAuthenticated: true,
  login: async (_email: string, _password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    set({ user: mockUser, token: 'mock-token', isAuthenticated: true });
  },
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export const useAppStore = create<AppState>((set, get) => ({
  products: mockProducts,
  orders: mockOrders,
  customers: mockCustomers,
  arCustomers: mockARCustomers,
  selectedCustomerId: null,
  currentOrder: null,
  paymentResult: null,
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  updateProduct: (product) => set((state) => ({
    products: state.products.map(p => p.id === product.id ? product : p),
  })),
  deleteProduct: (id) => set((state) => ({
    products: state.products.filter(p => p.id !== id),
  })),
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
  updateOrderStatus: (id, status) => set((state) => ({
    orders: state.orders.map(o => o.id === id ? { ...o, status, paidAt: status === 'paid' ? new Date().toISOString() : undefined } : o),
    arCustomers: state.arCustomers.map(c => {
      if (c.order?.id === id) {
        return { ...c, order: { ...c.order, status, paidAt: status === 'paid' ? new Date().toISOString() : undefined } };
      }
      return c;
    }),
  })),
  payOrder: (orderId, amount) => {
    const state = get();
    const order = state.orders.find(o => o.id === orderId);
    
    if (!order) {
      const result = {
        success: false,
        orderId,
        paidAmount: amount,
        message: '订单不存在',
      };
      set({ paymentResult: result });
      return result;
    }
    
    if (amount >= order.totalAmount) {
      set((state) => ({
        orders: state.orders.map(o => 
          o.id === orderId ? { ...o, status: 'paid' as const, paidAt: new Date().toISOString(), paymentMethod: 'facepay' } : o
        ),
        arCustomers: state.arCustomers.map(c => {
          if (c.order?.id === orderId) {
            return { ...c, order: { ...c.order, status: 'paid' as const, paidAt: new Date().toISOString() } };
          }
          return c;
        }),
        paymentResult: {
          success: true,
          orderId,
          paidAmount: order.totalAmount,
          message: '支付成功',
        },
      }));
      return {
        success: true,
        orderId,
        paidAmount: order.totalAmount,
        message: '支付成功',
      };
    } else {
      const remaining = order.totalAmount - amount;
      const result = {
        success: false,
        orderId,
        paidAmount: amount,
        remainingAmount: remaining,
        message: `支付不足，还差 ${remaining.toFixed(2)} 元`,
      };
      set({ paymentResult: result });
      return result;
    }
  },
  setCustomers: (customers) => set({ customers }),
  addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
  updateARCustomers: (customers) => set({ arCustomers: customers }),
  selectCustomer: (id) => set({ selectedCustomerId: id }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setPaymentResult: (result) => set({ paymentResult: result }),
}));
