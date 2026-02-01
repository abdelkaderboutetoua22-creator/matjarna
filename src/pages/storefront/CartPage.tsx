import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/cart';
import { config } from '@/config';

export function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">سلتك فارغة</h1>
          <p className="text-gray-500 mb-6">لم تقم بإضافة أي منتجات إلى سلة التسوق</p>
          <Link to="/products">
            <Button size="lg">
              تصفح المنتجات
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">سلة التسوق</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = item.product.sale_price || item.product.price;
            const primaryImage = item.product.images?.find((img) => img.is_primary)?.image_url
              || item.product.images?.[0]?.image_url
              || 'https://placehold.co/100x100/e2e8f0/64748b?text=منتج';

            return (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex gap-4">
                  {/* Image */}
                  <Link to={`/product/${item.product.slug || item.product.id}`}>
                    <img
                      src={primaryImage}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1">
                    <Link
                      to={`/product/${item.product.slug || item.product.id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {item.product.name}
                    </Link>

                    {/* Selected Options */}
                    {Object.keys(item.selected_options).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(item.selected_options).map(([key, value]) => (
                          <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price */}
                    <div className="mt-2">
                      <span className="text-primary-600 font-bold">
                        {price.toLocaleString()} {config.store.currency}
                      </span>
                      {item.product.sale_price && (
                        <span className="text-sm text-gray-400 line-through mr-2">
                          {item.product.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">ملخص الطلب</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">المجموع الفرعي</span>
                <span className="font-medium">{subtotal.toLocaleString()} {config.store.currency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">التوصيل</span>
                <span className="text-sm text-gray-500">يحسب عند الدفع</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">المجموع</span>
                <span className="text-xl font-bold text-primary-600">
                  {subtotal.toLocaleString()} {config.store.currency}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">+ تكلفة التوصيل</p>
            </div>

            <Link to="/checkout">
              <Button size="lg" className="w-full">
                إتمام الطلب
              </Button>
            </Link>

            <Link
              to="/products"
              className="block text-center text-primary-600 hover:text-primary-700 mt-4 text-sm font-medium"
            >
              متابعة التسوق
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
