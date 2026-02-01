import { useState, useEffect } from 'react';
import { ShoppingBag, Phone, MapPin, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { config } from '@/config';
import { format } from 'date-fns';

export function AbandonedCartsPage() {
  const { showToast } = useToast();
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCarts();
  }, []);

  async function fetchCarts() {
    setLoading(true);
    const { data } = await supabase
      .from('abandoned_carts')
      .select('*')
      .order('updated_at', { ascending: false });
    setCarts(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه السلة؟')) return;
    
    const { error } = await supabase.from('abandoned_carts').delete().eq('id', id);
    if (error) {
      showToast('حدث خطأ أثناء الحذف', 'error');
    } else {
      showToast('تم حذف السلة بنجاح', 'success');
      fetchCarts();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">السلات المتروكة</h1>
          <p className="text-gray-500 text-sm mt-1">
            العملاء الذين أدخلوا معلوماتهم ولم يكملوا الطلب
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {carts.length} سلة متروكة
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="py-12"><Loader size="lg" className="mx-auto" /></div>
        ) : carts.length > 0 ? (
          <div className="space-y-4">
            {carts.map((cart) => (
              <div key={cart.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Customer Info */}
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      {cart.customer_name && (
                        <span className="font-medium text-gray-900">{cart.customer_name}</span>
                      )}
                      {cart.customer_phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span dir="ltr">{cart.customer_phone}</span>
                        </div>
                      )}
                      {cart.wilaya_code && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>ولاية {cart.wilaya_code}</span>
                        </div>
                      )}
                    </div>

                    {/* Cart Items */}
                    {cart.items && cart.items.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {cart.items.slice(0, 4).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                            {item.product_image && (
                              <img src={item.product_image} alt="" className="w-10 h-10 object-cover rounded" />
                            )}
                            <div>
                              <p className="text-xs font-medium truncate max-w-[150px]">{item.product_name}</p>
                              <p className="text-xs text-gray-500">x{item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        {cart.items.length > 4 && (
                          <span className="text-xs text-gray-500 self-center">
                            +{cart.items.length - 4} منتجات أخرى
                          </span>
                        )}
                      </div>
                    )}

                    {/* Address */}
                    {cart.address && (
                      <p className="text-sm text-gray-600 mb-2">{cart.address}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-primary-600">
                        {cart.subtotal?.toLocaleString() || 0} {config.store.currency}
                      </span>
                      <span className="text-gray-400">
                        {format(new Date(cart.updated_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {cart.customer_phone && (
                      <a
                        href={`tel:${cart.customer_phone}`}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(cart.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد سلات متروكة</p>
          </div>
        )}
      </Card>
    </div>
  );
}
