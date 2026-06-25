import { Edit2, Trash2 } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/utils';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductCard = ({ product, onEdit, onDelete }: ProductCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <span className="inline-block px-3 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-full mb-2">
            {product.category}
          </span>
          <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
          <p className="text-gray-500 text-sm mt-1">{product.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-600">¥{formatPrice(product.price)}</p>
        </div>
      </div>
      
      {product.flavors && product.flavors.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">可选口味</p>
          <div className="flex flex-wrap gap-2">
            {product.flavors.map(flavor => (
              <span
                key={flavor.id}
                className="inline-block px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md"
              >
                {flavor.name}
                {flavor.priceAdjust && flavor.priceAdjust > 0 && (
                  <span className="ml-1 text-primary-500">+¥{formatPrice(flavor.priceAdjust)}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors duration-200"
        >
          <Edit2 className="w-4 h-4" />
          <span className="text-sm font-medium">编辑</span>
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">删除</span>
        </button>
      </div>
    </div>
  );
};
