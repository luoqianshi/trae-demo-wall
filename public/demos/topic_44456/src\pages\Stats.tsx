import { DollarSign, TrendingUp, ShoppingCart, Users, AlertTriangle, CheckCircle, XCircle, Award, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatPrice } from '@/utils';

export const Stats = () => {
  const orders = useAppStore((state) => state.orders);
  const products = useAppStore((state) => state.products);

  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.status === 'paid').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;
  const paymentRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

  const categoryStats = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = { count: 0, totalPrice: 0 };
    }
    acc[product.category].count++;
    acc[product.category].totalPrice += product.price;
    return acc;
  }, {} as Record<string, { count: number; totalPrice: number }>);

  const productSales = products.map(product => {
    const soldCount = orders.flatMap(o => o.items).filter(item => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
    const revenue = soldCount * product.price;
    return { ...product, soldCount, revenue };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const stats = [
    { icon: DollarSign, label: '总营收', value: `¥${formatPrice(totalRevenue)}`, color: 'from-green-400 to-green-600', trend: '+12.5%' },
    { icon: ShoppingCart, label: '订单总数', value: totalOrders, color: 'from-primary-400 to-primary-600', trend: '+8.3%' },
    { icon: TrendingUp, label: '支付率', value: `${paymentRate.toFixed(1)}%`, color: 'from-blue-400 to-blue-600', trend: '+2.1%' },
    { icon: Users, label: '客单价', value: `¥${formatPrice(averageOrderValue)}`, color: 'from-purple-400 to-purple-600', trend: '+5.2%' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">销售统计</h1>
          <p className="text-gray-500 mt-1">查看业务数据和销售趋势</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">实时数据</span>
        </div>
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
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs text-green-600">{stat.trend}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg shadow-black/10`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">黄色菜单</h3>
              <p className="text-sm text-gray-500">待支付订单</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-yellow-600">{pendingOrders}</div>
          <div className="mt-2 text-sm text-yellow-600">
            待收金额: ¥{formatPrice(orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.totalAmount, 0))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">绿色菜单</h3>
              <p className="text-sm text-gray-500">已支付订单</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-green-600">{paidOrders}</div>
          <div className="mt-2 text-sm text-green-600">
            已收金额: ¥{formatPrice(totalRevenue)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">已取消</h3>
              <p className="text-sm text-gray-500">取消订单</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-red-500">{cancelledOrders}</div>
          <div className="mt-2 text-sm text-red-500">
            流失金额: ¥{formatPrice(orders.filter(o => o.status === 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">商品分类统计</h2>
          <div className="space-y-4">
            {Object.entries(categoryStats).map(([category, data], index) => {
              const percentage = products.length > 0 ? (data.count / products.length) * 100 : 0;
              return (
                <div key={category} className="animate-fade-in" style={{ animationDelay: `${(index + 4) * 100}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="text-sm text-gray-500">{data.count} 种商品</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">热销商品排行</h2>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {productSales.map((product, index) => (
              <div key={product.id} className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-50' : index === 2 ? 'bg-amber-50' : 'hover:bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                  index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 
                  index === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-500">销量: {product.soldCount} | ¥{formatPrice(product.revenue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600">¥{formatPrice(product.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">订单状态分布</h2>
        <div className="flex items-center gap-8">
          {[
            { label: '黄色菜单', sublabel: '待支付', value: pendingOrders, color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
            { label: '绿色菜单', sublabel: '已支付', value: paidOrders, color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
            { label: '已取消', sublabel: '取消订单', value: cancelledOrders, color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
          ].map((item, index) => {
            const percentage = totalOrders > 0 ? (item.value / totalOrders) * 100 : 0;
            return (
              <div key={index} className="flex-1 text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 ${item.color} rounded-full text-white font-bold text-2xl mb-3 shadow-lg`}>
                  {percentage.toFixed(0)}%
                </div>
                <p className="font-bold text-gray-800">{item.label}</p>
                <p className="text-sm text-gray-500">{item.sublabel}</p>
                <p className={`text-lg font-bold mt-1 ${item.textColor}`}>{item.value} 笔</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
