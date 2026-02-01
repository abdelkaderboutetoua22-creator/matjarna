import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Phone, MapPin, Truck, Package } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { config, orderStatuses } from '@/config';
import { format } from 'date-fns';

export function OrderDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  async function fetchOrder() {
    if (!id) return;
    setLoading(true);
    
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    setOrder(orderData);
    setItems(itemsData || []);
    setLoading(false);
  }

  async function updateStatus(newStatus: string) {
    if (!order) return;
    setUpdating(true);
    
    const newHistory = [
      ...(order.status_history || []),
      { status: newStatus, timestamp: new Date().toISOString() }
    ];

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, status_history: newHistory })
      .eq('id', order.id);

    if (error) {
      showToast('حدث خطأ أثناء تحديث الحالة', 'error');
    } else {
      showToast('تم تحديث الحالة بنجاح', 'success');
      fetchOrder();
    }
    setUpdating(false);
  }

  if (loading) {
    return <div className="py-12"><Loader size="lg" className="mx-auto" /></div>;
  }

  if (!order) {
    return <p className="text-center text-gray-500 py-12">الطلب غير موجود</p>;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'cancelled':
      case 'returned': return 'danger';
      case 'pending': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تفاصيل الطلب</h1>
          <p className="text-gray-500 font-mono">{order.order_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              المنتجات
            </h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={item.product_image || 'https://placehold.co/80x80/e2e8f0/64748b?text=منتج'}
                    alt={item.product_name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(item.selected_options).map(([key, value]) => (
                          <span key={key} className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-500">
                        {item.price.toLocaleString()} {config.store.currency} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {item.total.toLocaleString()} {config.store.currency}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>المجموع الفرعي</span>
                <span>{order.subtotal.toLocaleString()} {config.store.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>التوصيل</span>
                <span>{order.shipping.toLocaleString()} {config.store.currency}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>الخصم</span>
                  <span>-{order.discount.toLocaleString()} {config.store.currency}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>المجموع</span>
                <span className="text-primary-600">{order.total.toLocaleString()} {config.store.currency}</span>
              </div>
            </div>
          </Card>

          {/* Status History */}
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">سجل الحالة</h2>
            <div className="space-y-3">
              {(order.status_history || []).map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                  <div>
                    <Badge variant={getStatusBadgeVariant(entry.status)}>
                      {orderStatuses.find(s => s.value === entry.status)?.label || entry.status}
                    </Badge>
                    <span className="text-xs text-gray-500 mr-2">
                      {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">معلومات العميل</h2>
            <div className="space-y-3">
              <p className="font-medium">{order.customer_name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span dir="ltr">{order.customer_phone}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5" />
                <div>
                  <p>{order.wilaya_name}</p>
                  <p>{order.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-4 h-4" />
                <span>{order.delivery_type === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب'}</span>
              </div>
            </div>
            {order.note && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">ملاحظات:</p>
                <p className="text-sm">{order.note}</p>
              </div>
            )}
          </Card>

          {/* Update Status */}
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">تحديث الحالة</h2>
            <div className="space-y-2">
              {orderStatuses.map((s) => (
                <Button
                  key={s.value}
                  variant={order.status === s.value ? 'primary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => updateStatus(s.value)}
                  disabled={updating || order.status === s.value}
                >
                  <span className={`w-2 h-2 rounded-full ml-2 ${s.color.split(' ')[0]}`} />
                  {s.label}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
