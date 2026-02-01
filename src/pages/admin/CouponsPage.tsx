import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { config } from '@/config';
import { format } from 'date-fns';

export function CouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
    
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) {
      showToast('حدث خطأ أثناء الحذف', 'error');
    } else {
      showToast('تم حذف الكوبون بنجاح', 'success');
      fetchCoupons();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">الكوبونات</h1>
        <Button onClick={() => { setEditingCoupon(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة كوبون
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="py-12"><Loader size="lg" className="mx-auto" /></div>
        ) : coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-right border-b">
                  <th className="pb-3 font-medium text-gray-500 text-sm">الكود</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">النوع</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">القيمة</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">الاستخدام</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">الصلاحية</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">الحالة</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const isExpired = coupon.end_date && new Date(coupon.end_date) < new Date();
                  const isExhausted = coupon.max_uses && coupon.used_count >= coupon.max_uses;

                  return (
                    <tr key={coupon.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-primary-600" />
                          <span className="font-mono font-medium">{coupon.code}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        {coupon.type === 'percent' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                      </td>
                      <td className="py-4 font-medium">
                        {coupon.type === 'percent' 
                          ? `${coupon.value}%`
                          : `${coupon.value.toLocaleString()} ${config.store.currency}`
                        }
                      </td>
                      <td className="py-4">
                        <span className={coupon.max_uses && coupon.used_count >= coupon.max_uses ? 'text-red-600' : ''}>
                          {coupon.used_count} / {coupon.max_uses || '∞'}
                        </span>
                      </td>
                      <td className="py-4 text-sm">
                        {coupon.end_date 
                          ? format(new Date(coupon.end_date), 'dd/MM/yyyy')
                          : 'غير محدد'
                        }
                      </td>
                      <td className="py-4">
                        <Badge variant={
                          !coupon.is_active ? 'default' :
                          isExpired || isExhausted ? 'danger' : 'success'
                        }>
                          {!coupon.is_active ? 'معطل' :
                           isExpired ? 'منتهي' :
                           isExhausted ? 'مستنفد' : 'نشط'}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingCoupon(coupon); setShowModal(true); }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد كوبونات</p>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCoupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}>
        <CouponForm
          coupon={editingCoupon}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchCoupons(); }}
        />
      </Modal>
    </div>
  );
}

function CouponForm({ coupon, onClose, onSuccess }: any) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    type: coupon?.type || 'percent',
    value: coupon?.value || '',
    min_order: coupon?.min_order || 0,
    max_uses: coupon?.max_uses || '',
    start_date: coupon?.start_date ? coupon.start_date.split('T')[0] : '',
    end_date: coupon?.end_date ? coupon.end_date.split('T')[0] : '',
    is_active: coupon?.is_active ?? true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      ...formData,
      code: formData.code.toUpperCase(),
      value: parseFloat(formData.value as string) || 0,
      min_order: parseFloat(formData.min_order as string) || 0,
      max_uses: formData.max_uses ? parseInt(formData.max_uses as string) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null
    };

    let error;
    if (coupon) {
      ({ error } = await supabase.from('coupons').update(data).eq('id', coupon.id));
    } else {
      ({ error } = await supabase.from('coupons').insert(data));
    }

    if (error) {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } else {
      showToast(coupon ? 'تم تحديث الكوبون بنجاح' : 'تم إضافة الكوبون بنجاح', 'success');
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="الكود"
        name="code"
        value={formData.code}
        onChange={handleChange}
        placeholder="SAVE20"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="percent">نسبة مئوية (%)</option>
            <option value="fixed">مبلغ ثابت ({config.store.currency})</option>
          </select>
        </div>
        <Input
          label="القيمة"
          name="value"
          type="number"
          value={formData.value}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={`الحد الأدنى للطلب (${config.store.currency})`}
          name="min_order"
          type="number"
          value={formData.min_order}
          onChange={handleChange}
        />
        <Input
          label="الحد الأقصى للاستخدام"
          name="max_uses"
          type="number"
          value={formData.max_uses}
          onChange={handleChange}
          placeholder="غير محدود"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="تاريخ البداية"
          name="start_date"
          type="date"
          value={formData.start_date}
          onChange={handleChange}
        />
        <Input
          label="تاريخ النهاية"
          name="end_date"
          type="date"
          value={formData.end_date}
          onChange={handleChange}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
          تفعيل الكوبون
        </label>
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" isLoading={loading}>
          {coupon ? 'تحديث' : 'إضافة'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
