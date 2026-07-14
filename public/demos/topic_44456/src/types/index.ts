export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  createdAt: string;
}

export interface FlavorOption {
  id: string;
  name: string;
  priceAdjust?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl?: string;
  flavors?: FlavorOption[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  faceEncoding?: string;
  phone?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  flavor?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod?: string;
  createdAt: string;
  paidAt?: string;
}

export interface ARCustomer {
  id: string;
  name: string;
  position: { x: number; y: number };
  order?: Order;
  isRecognized: boolean;
}

export interface PaymentResult {
  success: boolean;
  orderId: string;
  paidAmount: number;
  remainingAmount?: number;
  message: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface AppState {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  arCustomers: ARCustomer[];
  selectedCustomerId: string | null;
  currentOrder: Order | null;
  paymentResult: PaymentResult | null;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  payOrder: (orderId: string, amount: number) => PaymentResult;
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateARCustomers: (customers: ARCustomer[]) => void;
  selectCustomer: (id: string | null) => void;
  setCurrentOrder: (order: Order | null) => void;
  setPaymentResult: (result: PaymentResult | null) => void;
}
