import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download, Eye, Calendar, FileSpreadsheet, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import { config, orderStatuses, algerianWilayas } from '@/config';
import { format } from 'date-fns';

export function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, wilayaFilter, dateFrom, dateTo]);

  async function fetchOrders() {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    
    if (wilayaFilter) {
      query = query.eq('wilaya_code', wilayaFilter);
    }
    
    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00`);
    }
    
    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59`);
    }

    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  }

  const filteredOrders = orders.filter(order =>
    order.customer_name?.includes(searchQuery) ||
    order.customer_phone?.includes(searchQuery) ||
    order.order_number?.includes(searchQuery)
  );

  const getStatusStyle = (status: string) => {
    const s = orderStatuses.find(os => os.value === status);
    return s?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const s = orderStatuses.find(os => os.value === status);
    return s?.label || status;
  };

  // تصدير CSV
  function exportToCSV() {
    setExporting(true);
    try {
      const headers = [
        'رقم الطلب',
        'اسم العميل',
        'الهاتف',
        'الولاية',
        'العنوان',
        'نوع التوصيل',
        'المجموع الفرعي',
        'الشحن',
        'الخصم',
        'الإجمالي',
        'الحالة',
        'التاريخ',
        'ملاحظات'
      ];
      
      const rows = filteredOrders.map(order => [
        order.order_number,
        order.customer_name,
        order.customer_phone,
        order.wilaya_name,
        order.address,
        order.delivery_type === 'home' ? 'منزل' : 'مكتب',
        order.subtotal,
        order.shipping_cost,
        order.discount || 0,
        order.total,
        getStatusLabel(order.status),
        format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
        order.notes || ''
      ]);

      // BOM for UTF-8
      const BOM = '\uFEFF';
      const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `orders_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } catch (error) {
      console.error('Export error:', error);
    }
    setExporting(false);
    setShowExportMenu(false);
  }

  // تصدير Excel (XLSX format via CSV with .xls extension for compatibility)
  function exportToExcel() {
    setExporting(true);
    try {
      const headers = [
        'رقم الطلب',
        'اسم العميل',
        'الهاتف',
        'الولاية',
        'العنوان',
        'نوع التوصيل',
        'المجموع الفرعي',
        'الشحن',
        'الخصم',
        'الإجمالي',
        'الحالة',
        'التاريخ',
        'ملاحظات'
      ];
      
      const rows = filteredOrders.map(order => [
        order.order_number,
        order.customer_name,
        order.customer_phone,
        order.wilaya_name,
        order.address,
        order.delivery_type === 'home' ? 'منزل' : 'مكتب',
        order.subtotal,
        order.shipping_cost,
        order.discount || 0,
        order.total,
        getStatusLabel(order.status),
        format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
        order.notes || ''
      ]);

      // Create HTML table for Excel
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>الطلبات</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayRightToLeft/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            table { border-collapse: collapse; direction: rtl; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
            th { background: #f0f0f0; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `orders_${format(new Date(), 'yyyy-MM-dd')}.xls`;
      link.click();
    } catch (error) {
      console.error('Export error:', error);
    }
    setExporting(false);
    setShowExportMenu(false);
  }

  // إحصائيات سريعة
  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    processing: filteredOrders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length,
    delivered: filteredOrders.filter(o => o.status === 'delivered').length,
    cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
    totalRevenue: filteredOrders
      .filter(o => o.status !== 'cancelled' && o.status !== 'returned')
      .reduce((sum, o) => sum + (o.total || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">الطلبيات</h1>
        <div className="relative">
          <Button 
            variant="outline" 
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={exporting || filteredOrders.length === 0}
          >
            <Download className="w-4 h-4 ml-2" />
            {exporting ? 'جاري التصدير...' : 'تصدير'}
          </Button>
          
          {showExportMenu && (
            <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
              <button
                onClick={exportToCSV}
                className="w-full flex items-center gap-2 px-4 py-3 text-right hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4 text-green-600" />
                <span>تصدير CSV</span>
              </button>
              <button
                onClick={exportToExcel}
                className="w-full flex items-center gap-2 px-4 py-3 text-right hover:bg-gray-50 transition-colors border-t"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span>تصدير Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">الإجمالي</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <p className="text-sm text-yellow-700">قيد الانتظار</p>
          <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-700">قيد المعالجة</p>
          <p className="text-2xl font-bold text-blue-800">{stats.processing}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-700">تم التوصيل</p>
          <p className="text-2xl font-bold text-green-800">{stats.delivered}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-700">ملغي</p>
          <p className="text-2xl font-bold text-red-800">{stats.cancelled}</p>
        </div>
        <div className="bg-primary-50 rounded-lg border border-primary-200 p-4">
          <p className="text-sm text-primary-700">الإيرادات</p>
          <p className="text-lg font-bold text-primary-800">{stats.totalRevenue.toLocaleString()} {config.store.currency}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الطلب، الاسم، أو الهاتف..."
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          {/* Status Filter */}
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
          
          {/* Wilaya Filter */}
          <select
            value={wilayaFilter}
            onChange={(e) => setWilayaFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">جميع الولايات</option>
            {algerianWilayas.map((w: { code: string; name: string }) => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </select>
          
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pr-8 pl-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="من"
              />
            </div>
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 px-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="إلى"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(statusFilter || wilayaFilter || dateFrom || dateTo || searchQuery) && (
          <div className="mb-4">
            <button
              onClick={() => {
                setStatusFilter('');
                setWilayaFilter('');
                setDateFrom('');
                setDateTo('');
                setSearchQuery('');
              }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              مسح جميع الفلاتر
            </button>
          </div>
        )}

        {/* Orders Table */}
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
                  <th className="pb-3 font-medium text-gray-500 text-sm">التوصيل</th>
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
                    <td className="py-4 text-sm">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        order.delivery_type === 'home' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {order.delivery_type === 'home' ? 'منزل' : 'مكتب'}
                      </span>
                    </td>
                    <td className="py-4 font-medium">{order.total?.toLocaleString()} {config.store.currency}</td>
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
