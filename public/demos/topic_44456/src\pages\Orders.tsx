import { useState } from 'react';
import { Search, Filter, X, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Order } from '@/types';
import { OrderCard } from '@/components/OrderCard';
import { formatPrice } from '@/utils';

export const Orders = () => {
  const orders = useAppStore((state) => state.orders);
  const payOrder = useAppStore((state) => state.payOrder);
  const paymentResult = useAppStore((state) => state.paymentResult);
  const setPaymentResult = useAppStore((state) => state.setPaymentResult);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const handlePayClick = (order: Order) => {
    setCurrentOrder(order);
    setPayAmount(order.totalAmount.toString());
    setShowPayModal(true);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !payAmount) return;
    
    const amount = parseFloat(payAmount);
    const result = payOrder(currentOrder.id, amount);
    
    if (result.success) {
      setShowPayModal(false);
      setCurrentOrder(null);
      setPayAmount('');
    }
  };

  const handleClosePayModal = () => {
    setShowPayModal(false);
    setCurrentOrder(null);
    setPayAmount('');
    setPaymentResult(null);
  };

  const handleClosePaymentResult = () => {
    setPaymentResult(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">订单管理</h1>
          <p className="text-gray-500 mt-1">查看和管理所有订单记录</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">全部订单</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{statusCounts.all}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-200">
          <div className="text-sm text-yellow-600">黄色菜单</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{statusCounts.pending}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
          <div className="text-sm text-green-600">绿色菜单</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{statusCounts.paid}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
          <div className="text-sm text-red-500">已取消</div>
          <div className="text-2xl font-bold text-red-500 mt-1">{statusCounts.cancelled}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索顾客名称或商品..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200"
          >
            <option value="">全部状态 ({statusCounts.all})</option>
            <option value="pending">黄色菜单 ({statusCounts.pending})</option>
            <option value="paid">绿色菜单 ({statusCounts.paid})</option>
            <option value="cancelled">已取消 ({statusCounts.cancelled})</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedOrders.map(order => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onPay={handlePayClick}
          />
        ))}
      </div>

      {sortedOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">没有找到匹配的订单</p>
        </div>
      )}

      {showPayModal && currentOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">订单支付</h2>
              <button
                onClick={handleClosePayModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">顾客</span>
                <span className="font-medium">{currentOrder.customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">订单金额</span>
                <span className="text-xl font-bold text-primary-600">¥{formatPrice(currentOrder.totalAmount)}</span>
              </div>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">支付金额</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">¥</span>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all text-xl"
                    required
                  />
                </div>
                {parseFloat(payAmount) < currentOrder.totalAmount && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    支付金额不足，还差 ¥{formatPrice(currentOrder.totalAmount - parseFloat(payAmount))}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClosePayModal}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
                >
                  确认支付
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentResult && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50`}>
          <div className={`rounded-2xl w-full max-w-md p-6 text-center ${paymentResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            {paymentResult.success ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
            
            <h2 className={`text-xl font-bold mb-2 ${paymentResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {paymentResult.success ? '支付成功' : '支付失败'}
            </h2>
            <p className={`text-sm mb-4 ${paymentResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {paymentResult.message}
            </p>
            
            {paymentResult.remainingAmount !== undefined && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">实际支付金额</p>
                <p className="text-xl font-bold text-gray-800">¥{formatPrice(paymentResult.paidAmount)}</p>
                <p className="text-sm text-red-500 mt-1">还差 ¥{formatPrice(paymentResult.remainingAmount)} 需要补付</p>
              </div>
            )}
            
            <button
              onClick={handleClosePaymentResult}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${paymentResult.success ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
};