import { useState, useMemo } from 'react';
import { Order, OrderStatus, MaterialItem } from './types';
import { useOrders } from './hooks/useOrders';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Clock, 
  Edit, 
  Trash2,
  ChevronDown,
  X,
  CheckCircle2,
  Truck,
  LayoutDashboard,
  ListOrdered
} from 'lucide-react';

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  processing: { label: '制作中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  shipped: { label: '已发货', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100' },
  cancelled: { label: '已取消', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

function App() {
  const { orders, addOrder, updateOrder, deleteOrder, getStats } = useOrders();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders'>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const stats = getStats();

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.customerName.includes(searchTerm) || 
        order.orderNumber.includes(searchTerm) ||
        order.productName.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const materials: MaterialItem[] = [];
    const materialNames = formData.getAll('materialName') as string[];
    const materialQuantities = formData.getAll('materialQuantity') as string[];
    const materialPrices = formData.getAll('materialPrice') as string[];
    
    materialNames.forEach((name, index) => {
      if (name.trim()) {
        materials.push({
          id: Date.now() + index.toString(),
          name,
          quantity: parseFloat(materialQuantities[index]) || 0,
          unitPrice: parseFloat(materialPrices[index]) || 0,
        });
      }
    });

    const orderData = {
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      productName: formData.get('productName') as string,
      totalAmount: parseFloat(formData.get('totalAmount') as string) || 0,
      materials,
      status: (formData.get('status') as OrderStatus) || 'pending',
      notes: formData.get('notes') as string,
    };

    if (editingOrder) {
      updateOrder(editingOrder.id, orderData);
    } else {
      addOrder(orderData);
    }
    
    setShowModal(false);
    setEditingOrder(null);
    e.currentTarget.reset();
  };

  const calculateMaterialCost = (materials: MaterialItem[]) => {
    return materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);
  };

  const calculateProfit = (order: Order) => {
    const cost = calculateMaterialCost(order.materials);
    return order.totalAmount - cost;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">轻单宝</h1>
                <p className="text-sm text-gray-500">智能订单管家</p>
              </div>
            </div>
            <button 
              onClick={() => { setEditingOrder(null); setShowModal(true); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">新建订单</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'dashboard' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                数据概览
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'orders' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5" />
                订单管理
              </div>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">总订单数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ListOrdered className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">待处理</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">总收入</p>
                    <p className="text-2xl font-bold text-green-600">¥{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">总利润</p>
                    <p className="text-2xl font-bold text-primary-600">¥{stats.totalProfit.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">最近订单</h2>
                <button onClick={() => setActiveTab('orders')} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  查看全部 →
                </button>
              </div>
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <OrderItem 
                    key={order.id} 
                    order={order} 
                    onEdit={() => { setEditingOrder(order); setShowModal(true); }}
                    onDelete={() => deleteOrder(order.id)}
                    onStatusChange={(status) => updateOrder(order.id, { status })}
                    calculateProfit={calculateProfit}
                  />
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>还没有订单，点击"新建订单"开始吧</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="card">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="搜索订单号、客户名或产品..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">全部状态</option>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <option key={status} value={status}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <OrderItem 
                  key={order.id} 
                  order={order} 
                  onEdit={() => { setEditingOrder(order); setShowModal(true); }}
                  onDelete={() => deleteOrder(order.id)}
                  onStatusChange={(status) => updateOrder(order.id, { status })}
                  calculateProfit={calculateProfit}
                />
              ))}
              {filteredOrders.length === 0 && (
                <div className="card text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>没有找到匹配的订单</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 ${
              activeTab === 'dashboard' ? 'text-primary-600' : 'text-gray-500'
            }`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-xs">概览</span>
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 ${
              activeTab === 'orders' ? 'text-primary-600' : 'text-gray-500'
            }`}
          >
            <ListOrdered className="w-6 h-6" />
            <span className="text-xs">订单</span>
          </button>
          <button 
            onClick={() => { setEditingOrder(null); setShowModal(true); }}
            className="flex-1 py-4 flex flex-col items-center gap-1 text-primary-600"
          >
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center -mt-6 shadow-lg">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs">新建</span>
          </button>
        </div>
      </nav>

      {/* Modal */}
      {showModal && (
        <OrderModal 
          order={editingOrder}
          onClose={() => { setShowModal(false); setEditingOrder(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function OrderItem({ 
  order, 
  onEdit, 
  onDelete, 
  onStatusChange,
  calculateProfit
}: { 
  order: Order; 
  onEdit: () => void; 
  onDelete: () => void;
  onStatusChange: (status: OrderStatus) => void;
  calculateProfit: (order: Order) => number;
}) {
  const [showActions, setShowActions] = useState(false);
  const config = statusConfig[order.status];
  const profit = calculateProfit(order);
  const cost = order.materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0);

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-gray-500">{order.orderNumber}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
              {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 truncate">{order.productName}</h3>
          <p className="text-sm text-gray-600">{order.customerName} · {order.customerPhone}</p>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span className="text-gray-600">
              收入: <span className="font-semibold text-green-600">¥{order.totalAmount.toLocaleString()}</span>
            </span>
            <span className="text-gray-600">
              成本: <span className="font-semibold text-orange-600">¥{cost.toLocaleString()}</span>
            </span>
            <span className="text-gray-600">
              利润: <span className={`font-semibold ${profit >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                ¥{profit.toLocaleString()}
              </span>
            </span>
          </div>
          {order.materials.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              物料: {order.materials.map(m => m.name).join(', ')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            {showActions && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => { onStatusChange(status as OrderStatus); setShowActions(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                      order.status === status ? 'bg-gray-50' : ''
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}></span>
                    改为{config.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded-lg">
            <Edit className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderModal({ 
  order, 
  onClose, 
  onSubmit 
}: { 
  order: Order | null; 
  onClose: () => void; 
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; 
}) {
  const [materialCount, setMaterialCount] = useState(order?.materials.length || 1);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {order ? '编辑订单' : '新建订单'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名 *</label>
              <input 
                type="text" 
                name="customerName" 
                defaultValue={order?.customerName}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入客户姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
              <input 
                type="tel" 
                name="customerPhone" 
                defaultValue={order?.customerPhone}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入联系电话"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
            <input 
              type="text" 
              name="productName" 
              defaultValue={order?.productName}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请输入产品名称"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">订单金额 *</label>
            <input 
              type="number" 
              name="totalAmount" 
              defaultValue={order?.totalAmount}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请输入订单金额"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">物料清单</label>
              <button 
                type="button"
                onClick={() => setMaterialCount(n => n + 1)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                添加物料
              </button>
            </div>
            <div className="space-y-3">
              {Array.from({ length: materialCount }).map((_, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <input 
                      type="text" 
                      name="materialName" 
                      defaultValue={order?.materials[index]?.name}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="物料名称"
                    />
                  </div>
                  <div className="col-span-3">
                    <input 
                      type="number" 
                      name="materialQuantity" 
                      defaultValue={order?.materials[index]?.quantity || 1}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="数量"
                    />
                  </div>
                  <div className="col-span-3">
                    <input 
                      type="number" 
                      name="materialPrice" 
                      defaultValue={order?.materials[index]?.unitPrice || 0}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="单价"
                    />
                  </div>
                  <div className="col-span-1">
                    {materialCount > 1 && (
                      <button 
                        type="button"
                        onClick={() => setMaterialCount(n => n - 1)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">订单状态</label>
            <select 
              name="status"
              defaultValue={order?.status || 'pending'}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea 
              name="notes"
              defaultValue={order?.notes}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="添加备注信息..."
            />
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              取消
            </button>
            <button 
              type="submit"
              className="flex-1 btn-primary"
            >
              {order ? '保存修改' : '创建订单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
