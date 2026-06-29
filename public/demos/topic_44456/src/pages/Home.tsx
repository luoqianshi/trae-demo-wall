import { Package, FileText, DollarSign, Users, TrendingUp, ArrowUpRight, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatPrice } from '@/utils';
import { OrderCard } from '@/components/OrderCard';

export const Home = () => {
  const products = useAppStore((state) => state.products);
  const orders = useAppStore((state) => state.orders);
  const customers = useAppStore((state) => state.customers);

  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayOrders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = todayOrders.filter(o => o.status === 'pending').length;
  const paidCount = todayOrders.filter(o => o.status === 'paid').length;

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { icon: Package, label: '商品数量', value: products.length, color: 'bg-gradient-to-br from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { icon: FileText, label: '今日订单', value: todayOrders.length, color: 'bg-gradient-to-br from-primary-500 to-primary-600', bgColor: 'bg-primary-50', textColor: 'text-primary-600' },
    { icon: DollarSign, label: '今日营收', value: `¥${formatPrice(todayRevenue)}`, color: 'bg-gradient-to-br from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    { icon: Users, label: '顾客数量', value: customers.length, color: 'bg-gradient-to-br from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">欢迎回来</h1>
          <p className="text-gray-500 mt-1">今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-full animate-pulse-glow">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">{pendingCount} 笔待支付订单</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-primary-200 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1 animate-count-up">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg shadow-black/10`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-800">黄色菜单 - 待支付</h3>
            <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">{pendingCount}</span>
          </div>
          <div className="text-3xl font-bold text-yellow-600">¥{formatPrice(todayOrders.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.totalAmount, 0))}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-800">绿色菜单 - 已支付</h3>
            <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">{paidCount}</span>
          </div>
          <div className="text-3xl font-bold text-green-600">¥{formatPrice(todayRevenue)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">最新订单</h2>
            <button className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors">
              查看全部 <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order, index) => (
              <div key={order.id} className="animate-slide-in-left" style={{ animationDelay: `${index * 100}ms` }}>
                <OrderCard order={order} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">商品分类</h2>
          <div className="space-y-3">
            {['热菜', '素菜', '饮料', '主食'].map((category, index) => {
              const count = products.filter(p => p.category === category).length;
              const percentage = products.length > 0 ? Math.round((count / products.length) * 100) : 0;
              return (
                <div key={category} className="animate-fade-in" style={{ animationDelay: `${(index + 4) * 100}ms` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="text-sm text-gray-500">{count} 种</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">快捷操作</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all hover:shadow-md">
                <Package className="w-5 h-5" />
                <span className="text-sm font-medium">添加商品</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all hover:shadow-md">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">新建订单</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
