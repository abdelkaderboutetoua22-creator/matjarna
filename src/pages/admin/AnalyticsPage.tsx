import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/utils/cn';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalVisits: number;
  averageOrderValue: number;
  conversionRate: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByDay: { date: string; orders: number }[];
  topProducts: { id: string; name: string; sales: number; revenue: number }[];
  topCategories: { id: string; name: string; sales: number; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  ordersByWilaya: { wilaya: string; count: number; revenue: number }[];
  revenueChange: number;
  ordersChange: number;
}

interface TooltipData {
  x: number;
  y: number;
  label: string;
  value: string;
  visible: boolean;
}

type DateRange = '7d' | '30d' | '90d' | 'year';

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'revenue' | 'orders'>('revenue');
  const [tooltip, setTooltip] = useState<TooltipData>({ x: 0, y: 0, label: '', value: '', visible: false });
  
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const ordersChartRef = useRef<HTMLCanvasElement>(null);
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const wilayaChartRef = useRef<HTMLCanvasElement>(null);

  const getDateRangeStart = useCallback(() => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7));
      case '30d':
        return new Date(now.setDate(now.getDate() - 30));
      case '90d':
        return new Date(now.setDate(now.getDate() - 90));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setDate(now.getDate() - 30));
    }
  }, [dateRange]);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const startDate = getDateRangeStart().toISOString();
        const endDate = new Date().toISOString();

        // Fetch orders
        const { data: orders } = await supabase
          .from('orders')
          .select('id, total, status, wilaya, created_at')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        // Fetch previous period for comparison
        const prevStartDate = new Date(getDateRangeStart());
        const daysDiff = Math.floor((new Date().getTime() - prevStartDate.getTime()) / (1000 * 60 * 60 * 24));
        prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
        
        const { data: prevOrders } = await supabase
          .from('orders')
          .select('id, total')
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate);

        // Fetch products count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true);

        // Fetch order items for top products
        const { data: orderItems } = await supabase
          .from('order_items')
          .select(`
            quantity,
            price,
            product_id,
            products (id, name, category_id)
          `)
          .gte('created_at', startDate);

        // Process data
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        const totalOrders = orders?.length || 0;
        const prevRevenue = prevOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        const prevOrdersCount = prevOrders?.length || 0;

        // Revenue by day
        const revenueByDay = processRevenueByDay(orders || []);
        const ordersByDay = processOrdersByDay(orders || []);

        // Orders by status
        const statusCounts: Record<string, number> = {};
        orders?.forEach(o => {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });

        // Orders by wilaya
        const wilayaCounts: Record<string, { count: number; revenue: number }> = {};
        orders?.forEach(o => {
          if (!wilayaCounts[o.wilaya]) {
            wilayaCounts[o.wilaya] = { count: 0, revenue: 0 };
          }
          wilayaCounts[o.wilaya].count++;
          wilayaCounts[o.wilaya].revenue += o.total || 0;
        });

        // Top products
        const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
        orderItems?.forEach(item => {
          const pid = item.product_id;
          const pname = (item.products as { name?: string })?.name || 'منتج';
          if (!productSales[pid]) {
            productSales[pid] = { name: pname, sales: 0, revenue: 0 };
          }
          productSales[pid].sales += item.quantity;
          productSales[pid].revenue += item.price * item.quantity;
        });

        // Calculate changes
        const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const ordersChange = prevOrdersCount > 0 ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0;

        setData({
          totalRevenue,
          totalOrders,
          totalProducts: productsCount || 0,
          totalVisits: Math.floor(totalOrders * 15), // Simulated
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          conversionRate: 6.5, // Simulated
          revenueByDay,
          ordersByDay,
          topProducts: Object.entries(productSales)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5),
          topCategories: [],
          ordersByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
          ordersByWilaya: Object.entries(wilayaCounts)
            .map(([wilaya, data]) => ({ wilaya, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          revenueChange,
          ordersChange,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [dateRange, getDateRangeStart]);

  function processRevenueByDay(orders: { created_at: string; total?: number }[]): { date: string; revenue: number }[] {
    const dayMap: Record<string, number> = {};
    
    orders.forEach(order => {
      const day = order.created_at.split('T')[0];
      dayMap[day] = (dayMap[day] || 0) + (order.total || 0);
    });

    return Object.entries(dayMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function processOrdersByDay(orders: { created_at: string }[]): { date: string; orders: number }[] {
    const dayMap: Record<string, number> = {};
    
    orders.forEach(order => {
      const day = order.created_at.split('T')[0];
      dayMap[day] = (dayMap[day] || 0) + 1;
    });

    return Object.entries(dayMap)
      .map(([date, orders]) => ({ date, orders }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Draw Revenue/Orders Line Chart
  useEffect(() => {
    const canvas = activeChart === 'revenue' ? revenueChartRef.current : ordersChartRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chartData = activeChart === 'revenue' ? data.revenueByDay : data.ordersByDay;
    if (chartData.length === 0) return;

    const values = chartData.map(d => activeChart === 'revenue' ? (d as { revenue: number }).revenue : (d as { orders: number }).orders);
    const maxValue = Math.max(...values, 1);

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      const value = maxValue - (maxValue / 5) * i;
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px Cairo, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(formatNumber(value), padding.left - 10, y + 4);
    }

    // Draw line
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, activeChart === 'revenue' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    // Draw area fill
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    
    chartData.forEach((d, i) => {
      const x = padding.left + (chartWidth / (chartData.length - 1 || 1)) * i;
      const value = activeChart === 'revenue' ? (d as { revenue: number }).revenue : (d as { orders: number }).orders;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line on top
    ctx.beginPath();
    ctx.strokeStyle = activeChart === 'revenue' ? '#3B82F6' : '#10B981';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    chartData.forEach((d, i) => {
      const x = padding.left + (chartWidth / (chartData.length - 1 || 1)) * i;
      const value = activeChart === 'revenue' ? (d as { revenue: number }).revenue : (d as { orders: number }).orders;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw data points
    chartData.forEach((d, i) => {
      const x = padding.left + (chartWidth / (chartData.length - 1 || 1)) * i;
      const value = activeChart === 'revenue' ? (d as { revenue: number }).revenue : (d as { orders: number }).orders;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = activeChart === 'revenue' ? '#3B82F6' : '#10B981';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // X-axis labels (show every nth label based on data length)
    const labelInterval = Math.ceil(chartData.length / 7);
    chartData.forEach((d, i) => {
      if (i % labelInterval === 0 || i === chartData.length - 1) {
        const x = padding.left + (chartWidth / (chartData.length - 1 || 1)) * i;
        ctx.fillStyle = '#6B7280';
        ctx.font = '11px Cairo, sans-serif';
        ctx.textAlign = 'center';
        const dateLabel = new Date(d.date).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' });
        ctx.fillText(dateLabel, x, height - 10);
      }
    });

  }, [data, activeChart]);

  // Draw Status Pie Chart
  useEffect(() => {
    const canvas = statusChartRef.current;
    if (!canvas || !data || data.ordersByStatus.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    const total = data.ordersByStatus.reduce((sum, s) => sum + s.count, 0);
    
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      processing: '#3B82F6',
      shipped: '#8B5CF6',
      delivered: '#10B981',
      cancelled: '#EF4444',
    };

    const statusLabels: Record<string, string> = {
      pending: 'قيد الانتظار',
      processing: 'قيد المعالجة',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
    };

    ctx.clearRect(0, 0, width, height);

    let startAngle = -Math.PI / 2;

    data.ordersByStatus.forEach((item) => {
      const sliceAngle = (item.count / total) * Math.PI * 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[item.status] || '#9CA3AF';
      ctx.fill();

      // Draw label
      const labelAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      if (item.count / total > 0.08) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round((item.count / total) * 100)}%`, labelX, labelY);
      }

      startAngle += sliceAngle;
    });

    // Draw center hole (donut)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Draw center text
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 24px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), centerX, centerY - 8);
    ctx.font = '12px Cairo, sans-serif';
    ctx.fillStyle = '#6B7280';
    ctx.fillText('إجمالي', centerX, centerY + 14);

    // Draw legend
    let legendY = 10;
    data.ordersByStatus.forEach((item) => {
      ctx.fillStyle = colors[item.status] || '#9CA3AF';
      ctx.fillRect(width - 120, legendY, 12, 12);
      ctx.fillStyle = '#374151';
      ctx.font = '11px Cairo, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${statusLabels[item.status] || item.status} (${item.count})`, width - 130, legendY + 10);
      legendY += 22;
    });

  }, [data]);

  // Draw Wilaya Bar Chart
  useEffect(() => {
    const canvas = wilayaChartRef.current;
    if (!canvas || !data || data.ordersByWilaya.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 60, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxCount = Math.max(...data.ordersByWilaya.map(w => w.count), 1);
    const barWidth = chartWidth / data.ordersByWilaya.length - 8;

    ctx.clearRect(0, 0, width, height);

    // Draw bars
    data.ordersByWilaya.forEach((item, i) => {
      const barHeight = (item.count / maxCount) * chartHeight;
      const x = padding.left + (chartWidth / data.ordersByWilaya.length) * i + 4;
      const y = padding.top + chartHeight - barHeight;

      // Bar gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#3B82F6');
      gradient.addColorStop(1, '#1D4ED8');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();

      // Bar label (count)
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 11px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.count.toString(), x + barWidth / 2, y - 6);

      // X-axis label (wilaya name - truncated)
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px Cairo, sans-serif';
      ctx.save();
      ctx.translate(x + barWidth / 2, height - 8);
      ctx.rotate(-Math.PI / 4);
      ctx.textAlign = 'right';
      const wilayaName = item.wilaya.length > 8 ? item.wilaya.slice(0, 8) + '...' : item.wilaya;
      ctx.fillText(wilayaName, 0, 0);
      ctx.restore();
    });

  }, [data]);

  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' د.ج';
  }

  // Handle canvas mouse events for interactivity
  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>, chartType: 'main' | 'status' | 'wilaya') {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (!data) return;

    if (chartType === 'main') {
      const chartData = activeChart === 'revenue' ? data.revenueByDay : data.ordersByDay;
      const padding = { left: 60, right: 20, top: 20, bottom: 40 };
      const chartWidth = canvas.width - padding.left - padding.right;
      
      const pointIndex = Math.round((x - padding.left) / (chartWidth / (chartData.length - 1 || 1)));
      
      if (pointIndex >= 0 && pointIndex < chartData.length) {
        const d = chartData[pointIndex];
        const value = activeChart === 'revenue' 
          ? formatCurrency((d as { revenue: number }).revenue)
          : `${(d as { orders: number }).orders} طلب`;
        
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          label: new Date(d.date).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'long' }),
          value,
          visible: true,
        });
      }
    }
  }

  function handleCanvasMouseLeave() {
    setTooltip(prev => ({ ...prev, visible: false }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التحليلات والإحصائيات</h1>
          <p className="text-gray-500 mt-1">نظرة شاملة على أداء متجرك</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { value: '7d', label: '7 أيام' },
            { value: '30d', label: '30 يوم' },
            { value: '90d', label: '3 أشهر' },
            { value: 'year', label: 'سنة' },
          ].map(range => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value as DateRange)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                dateRange === range.value
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            {data && data.revenueChange !== 0 && (
              <span className={cn(
                'flex items-center text-sm font-medium',
                data.revenueChange > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {data.revenueChange > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(data.revenueChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(data?.totalRevenue || 0)}
          </p>
          <p className="text-sm text-gray-500">إجمالي الإيرادات</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            {data && data.ordersChange !== 0 && (
              <span className={cn(
                'flex items-center text-sm font-medium',
                data.ordersChange > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {data.ordersChange > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(data.ordersChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{data?.totalOrders || 0}</p>
          <p className="text-sm text-gray-500">إجمالي الطلبات</p>
        </Card>

        <Card className="p-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(data?.averageOrderValue || 0)}
          </p>
          <p className="text-sm text-gray-500">متوسط قيمة الطلب</p>
        </Card>

        <Card className="p-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{data?.conversionRate || 0}%</p>
          <p className="text-sm text-gray-500">معدل التحويل</p>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">الأداء عبر الزمن</h2>
          <div className="flex gap-2">
            <Button
              variant={activeChart === 'revenue' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('revenue')}
            >
              الإيرادات
            </Button>
            <Button
              variant={activeChart === 'orders' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('orders')}
            >
              الطلبات
            </Button>
          </div>
        </div>
        <div className="relative">
          <canvas
            ref={activeChart === 'revenue' ? revenueChartRef : ordersChartRef}
            width={800}
            height={300}
            className="w-full cursor-crosshair"
            onMouseMove={(e) => handleCanvasMouseMove(e, 'main')}
            onMouseLeave={handleCanvasMouseLeave}
          />
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">توزيع حالات الطلبات</h2>
          <canvas
            ref={statusChartRef}
            width={400}
            height={250}
            className="w-full"
          />
        </Card>

        {/* Wilaya Bar Chart */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">أكثر الولايات طلباً</h2>
          <canvas
            ref={wilayaChartRef}
            width={400}
            height={250}
            className="w-full"
          />
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">أفضل المنتجات مبيعاً</h2>
        {data && data.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-medium text-gray-500">#</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">المنتج</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">المبيعات</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">الإيرادات</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">الحصة</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, index) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      )}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                    <td className="py-3 px-4 text-gray-600">{product.sales} وحدة</td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{formatCurrency(product.revenue)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${(product.revenue / (data.totalRevenue || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          {((product.revenue / (data.totalRevenue || 1)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            لا توجد بيانات كافية
          </div>
        )}
      </Card>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 40,
          }}
        >
          <div className="font-medium">{tooltip.label}</div>
          <div className="text-primary-300">{tooltip.value}</div>
        </div>
      )}
    </div>
  );
}
