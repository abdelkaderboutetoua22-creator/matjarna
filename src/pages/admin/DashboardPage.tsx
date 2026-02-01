import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  DollarSign,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import { config } from '@/config';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  recentOrders: any[];
  topProducts: any[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(7);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const startDate = startOfDay(subDays(new Date(), dateRange));
        const endDate = endOfDay(new Date());

        // Fetch orders
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });

        const ordersList = orders || [];
        
        // Calculate stats
        const totalRevenue = ordersList
          .filter(o => o.status !== 'cancelled' && o.status !== 'returned')
          .reduce((sum, o) => sum + o.total, 0);
        
        const totalOrders = ordersList.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const pendingOrders = ordersList.filter(o => o.status === 'pending').length;

        // Revenue by day
        const revenueByDay: { date: string; revenue: number; orders: number }[] = [];
        for (let i = dateRange; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayOrders = ordersList.filter(o => 
            format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr &&
            o.status !== 'cancelled' && o.status !== 'returned'
          );
          revenueByDay.push({
            date: format(date, 'EEE', { locale: ar }),
            revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
            orders: dayOrders.length,
          });
        }

        // Recent orders
        const recentOrders = ordersList.slice(0, 5);

        // Top products
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('product_name, quantity, total')
          .gte('created_at', startDate.toISOString());

        const productSales: Record<string, { quantity: number; revenue: number }> = {};
        (orderItems || []).forEach(item => {
          if (!productSales[item.product_name]) {
            productSales[item.product_name] = { quantity: 0, revenue: 0 };
          }
          productSales[item.product_name].quantity += item.quantity;
          productSales[item.product_name].revenue += item.total;
        });

        const topProducts = Object.entries(productSales)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setStats({
          totalRevenue,
          totalOrders,
          averageOrderValue,
          pendingOrders,
          recentOrders,
          topProducts,
          revenueByDay,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
      setLoading(false);
    }

    fetchStats();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'إجمالي الإيرادات',
      value: `${stats.totalRevenue.toLocaleString()} ${config.store.currency}`,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: 12,
    },
    {
      title: 'عدد الطلبات',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      trend: 8,
    },
    {
      title: 'متوسط قيمة الطلب',
      value: `${Math.round(stats.averageOrderValue).toLocaleString()} ${config.store.currency}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      trend: -3,
    },
    {
      title: 'طلبات قيد الانتظار',
      value: stats.pendingOrders.toString(),
      icon: Package,
      color: 'bg-yellow-500',
      trend: 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm mt-1">نظرة عامة على أداء المتجر</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={7}>آخر 7 أيام</option>
            <option value={14}>آخر 14 يوم</option>
            <option value={30}>آخر 30 يوم</option>
            <option value={90}>آخر 90 يوم</option>
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                {stat.trend !== 0 && (
                  <div className={`flex items-center gap-1 mt-2 text-sm ${
                    stat.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    <span>{Math.abs(stat.trend)}%</span>
                  </div>
                )}
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">الإيرادات اليومية</h3>
          <div className="h-64 flex items-end gap-2">
            {stats.revenueByDay.map((day, index) => {
              const maxRevenue = Math.max(...stats.revenueByDay.map(d => d.revenue));
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">
                      {day.revenue > 0 ? `${(day.revenue / 1000).toFixed(0)}k` : '0'}
                    </span>
                    <div
                      className="w-full bg-primary-500 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{day.date}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Products */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">المنتجات الأكثر مبيعاً</h3>
          {stats.topProducts.length > 0 ? (
            <div className="space-y-4">
              {stats.topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} قطعة</p>
                  </div>
                  <span className="font-medium text-primary-600">
                    {product.revenue.toLocaleString()} {config.store.currency}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">لا توجد بيانات</p>
          )}
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">آخر الطلبات</h3>
          <Link to="/dashboard/orders" className="text-sm text-primary-600 hover:text-primary-700">
            عرض الكل
          </Link>
        </div>
        {stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-right border-b">
                  <th className="pb-3 font-medium text-gray-500 text-sm">رقم الطلب</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">العميل</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">المبلغ</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">الحالة</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link to={`/dashboard/orders/${order.id}`} className="text-primary-600 hover:underline font-mono text-sm">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-900">{order.customer_name}</td>
                    <td className="py-3 font-medium">{order.total.toLocaleString()} {config.store.currency}</td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status === 'pending' ? 'قيد الانتظار' :
                         order.status === 'confirmed' ? 'مؤكد' :
                         order.status === 'processing' ? 'قيد التجهيز' :
                         order.status === 'shipped' ? 'تم الشحن' :
                         order.status === 'delivered' ? 'تم التوصيل' :
                         order.status === 'cancelled' ? 'ملغي' : 'مرتجع'}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">لا توجد طلبات</p>
        )}
      </Card>
    </div>
  );
}
