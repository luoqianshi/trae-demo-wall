import { Check, X, Clock, CreditCard } from 'lucide-react';
import type { Order } from '@/types';
import { formatPrice, formatDate } from '@/utils';

interface OrderCardProps {
  order: Order;
  onPay?: (order: Order) => void;
}

export const OrderCard = ({ order, onPay }: OrderCardProps) => {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-400', label: '黄色菜单', pulse: true },
    paid: { icon: Check, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-400', label: '绿色菜单', pulse: false },
    cancelled: { icon: X, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-300', label: '已取消', pulse: false },
  };

  const StatusIcon = statusConfig[order.status].icon;

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 p-5 hover:shadow-md transition-all duration-300 ${statusConfig[order.status].border} ${statusConfig[order.status].pulse ? 'animate-pulse-border' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">订单号:</span>
            <span className="text-sm font-mono text-gray-700">{order.id.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-gray-500">顾客:</span>
            <span className="text-sm text-gray-700">{order.customerName}</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[order.status].bg}`}>
          <StatusIcon className={`w-4 h-4 ${statusConfig[order.status].color}`} />
          <span className={`text-sm font-medium ${statusConfig[order.status].color}`}>
            {statusConfig[order.status].label}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div className="flex-1">
              <span className="text-gray-700">{item.productName} x{item.quantity}</span>
              {item.flavor && (
                <span className="ml-2 text-xs text-gray-400">({item.flavor})</span>
              )}
            </div>
            <span className="text-gray-500">¥{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
          {order.paidAt && (
            <span className="ml-3 text-xs text-green-600">支付于 {formatDate(order.paidAt)}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-primary-600">¥{formatPrice(order.totalAmount)}</span>
          {order.status === 'pending' && onPay && (
            <button
              onClick={() => onPay(order)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
            >
              <CreditCard className="w-4 h-4" />
              支付
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
