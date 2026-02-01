import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import { config, orderStatuses } from '@/config';
import { format } from 'date-fns';

export function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  }

  const filteredOrders = orders.filter(order =>
    order.customer_name.includes(searchQuery) ||
    order.customer_phone.includes(searchQuery) ||
    order.order_number.includes(searchQuery)
  );

  const getStatusStyle = (status: string) => {
    const s = orderStatuses.find(os => os.value === status);
    return s?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const s = orderStatuses.find(os => os.value === status);
    return s?.label || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">الطلبيات</h1>
        <Button variant="outline" onClick={() => {}}>
          <Download className="w-4 h-4 ml-2" />
          تصدير
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الطلب، الاسم، أو الهاتف..."
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">جميع الحالات</option>
            {orderStatuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-12"><Loader size="lg" className="mx-auto" /></div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-right border-b">
                  <th className="pb-3 font-medium text-gray-500 text-sm">رقم الطلب</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">العميل</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">الولاية</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">المبلغ</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">الحالة</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">التاريخ</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-4 font-mono text-sm text-primary-600">{order.order_number}</td>
                    <td className="py-4">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-gray-500" dir="ltr">{order.customer_phone}</p>
                    </td>
                    <td className="py-4 text-sm">{order.wilaya_name}</td>
                    <td className="py-4 font-medium">{order.total.toLocaleString()} {config.store.currency}</td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-500">
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="py-4">
                      <Link
                        to={`/dashboard/orders/${order.id}`}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg inline-flex"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">لا توجد طلبات</p>
        )}
      </Card>
    </div>
  );
}
