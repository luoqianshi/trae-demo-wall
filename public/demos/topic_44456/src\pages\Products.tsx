import { useState } from 'react';
import { Plus, Search, X, Minus } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Product, FlavorOption } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { categories, generateId } from '@/utils';

export const Products = () => {
  const products = useAppStore((state) => state.products);
  const addProduct = useAppStore((state) => state.addProduct);
  const updateProduct = useAppStore((state) => state.updateProduct);
  const deleteProduct = useAppStore((state) => state.deleteProduct);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
  });
  const [flavors, setFlavors] = useState<FlavorOption[]>([]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        description: product.description,
      });
      setFlavors(product.flavors || []);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', category: '', description: '' });
      setFlavors([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '', category: '', description: '' });
    setFlavors([]);
  };

  const handleAddFlavor = () => {
    setFlavors([...flavors, { id: generateId(), name: '', priceAdjust: 0 }]);
  };

  const handleRemoveFlavor = (index: number) => {
    setFlavors(flavors.filter((_, i) => i !== index));
  };

  const handleFlavorChange = (index: number, field: 'name' | 'priceAdjust', value: string | number) => {
    const newFlavors = [...flavors];
    if (field === 'name') {
      newFlavors[index] = { ...newFlavors[index], name: value as string };
    } else {
      newFlavors[index] = { ...newFlavors[index], priceAdjust: Number(value) || 0 };
    }
    setFlavors(newFlavors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    const validFlavors = flavors.filter(f => f.name.trim());
    
    const productData: Product = {
      id: editingProduct?.id || generateId(),
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category || '其他',
      description: formData.description,
      flavors: validFlavors.length > 0 ? validFlavors : undefined,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingProduct) {
      updateProduct(productData);
    } else {
      addProduct(productData);
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个商品吗？')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">商品管理</h1>
          <p className="text-gray-500 mt-1">管理您的商品库，添加、编辑或删除商品</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 shadow-lg shadow-primary-500/25"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">添加商品</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索商品名称或描述..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all duration-200"
        >
          <option value="">全部分类</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">没有找到匹配的商品</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProduct ? '编辑商品' : '添加商品'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">价格</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">可选口味</label>
                  <button
                    type="button"
                    onClick={handleAddFlavor}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加口味
                  </button>
                </div>
                
                {flavors.map((flavor, index) => (
                  <div key={flavor.id} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={flavor.name}
                      onChange={(e) => handleFlavorChange(index, 'name', e.target.value)}
                      placeholder={`口味 ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                    />
                    <input
                      type="number"
                      value={flavor.priceAdjust || ''}
                      onChange={(e) => handleFlavorChange(index, 'priceAdjust', e.target.value)}
                      placeholder="加价"
                      step="0.01"
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFlavor(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                >
                  {editingProduct ? '保存修改' : '添加商品'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};