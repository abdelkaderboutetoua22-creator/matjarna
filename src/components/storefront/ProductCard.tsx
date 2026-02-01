import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import type { Product } from '@/types';
import { config } from '@/config';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/Button';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const hasOptions = product.options && product.options.length > 0;
  
  const primaryImage = product.images?.find((img) => img.is_primary)?.image_url 
    || product.images?.[0]?.image_url
    || 'https://placehold.co/300x300/e2e8f0/64748b?text=منتج';

  const finalPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  const handleQuickAdd = () => {
    if (!hasOptions) {
      addItem(product, 1, {});
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <Link to={`/product/${product.slug || product.id}`} className="block relative aspect-square overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{discountPercent}%
          </span>
        )}

        {/* Out of Stock */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium">نفذت الكمية</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Link
            to={`/product/${product.slug || product.id}`}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 hover:text-white transition-colors"
          >
            <Eye className="w-5 h-5" />
          </Link>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <span className="text-xs text-primary-600 font-medium">{product.category.name}</span>
        )}

        {/* Name */}
        <Link to={`/product/${product.slug || product.id}`}>
          <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600">
            {finalPrice.toLocaleString()} {config.store.currency}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {product.price.toLocaleString()} {config.store.currency}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <Link to={`/product/${product.slug || product.id}`} className="flex-1">
            <Button variant="primary" size="sm" className="w-full">
              اطلب الآن
            </Button>
          </Link>
          {!hasOptions && product.stock > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickAdd}
              className="!px-3"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
