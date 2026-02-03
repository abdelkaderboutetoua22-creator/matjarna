import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Edit2, X, Save, Target, ShoppingBag } from 'lucide-react';

interface UpsellRule {
  id: string;
  name: string;
  type: 'upsell' | 'downsell' | 'cross_sell';
  trigger_type: 'product' | 'category' | 'cart_total';
  trigger_id: string | null;
  trigger_min_amount: number | null;
  target_product_ids: string[];
  display_location: 'product_page' | 'cart' | 'checkout' | 'order_success';
  discount_percent: number | null;
  message_ar: string;
  is_active: boolean;
  priority: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Category {
  id: string;
  name: string;
}

export function UpsellPage() {
  const [rules, setRules] = useState<UpsellRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<UpsellRule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'upsell' as 'upsell' | 'downsell' | 'cross_sell',
    trigger_type: 'product' as 'product' | 'category' | 'cart_total',
    trigger_id: '',
    trigger_min_amount: '',
    target_product_ids: [] as string[],
    display_location: 'product_page' as 'product_page' | 'cart' | 'checkout' | 'order_success',
    discount_percent: '',
    message_ar: '',
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch upsell rules
      const { data: rulesData } = await supabase
        .from('upsell_rules')
        .select('*')
        .order('priority', { ascending: true });

      // Fetch products for dropdowns
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('is_published', true);

      // Fetch categories for dropdowns
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name');

      setRules(rulesData || []);
      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'upsell',
      trigger_type: 'product',
      trigger_id: '',
      trigger_min_amount: '',
      target_product_ids: [],
      display_location: 'product_page',
      discount_percent: '',
      message_ar: '',
      is_active: true,
      priority: 0,
    });
    setEditingRule(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (rule: UpsellRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      trigger_type: rule.trigger_type,
      trigger_id: rule.trigger_id || '',
      trigger_min_amount: rule.trigger_min_amount?.toString() || '',
      target_product_ids: rule.target_product_ids || [],
      display_location: rule.display_location,
      discount_percent: rule.discount_percent?.toString() || '',
      message_ar: rule.message_ar || '',
      is_active: rule.is_active,
      priority: rule.priority,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      type: formData.type,
      trigger_type: formData.trigger_type,
      trigger_id: formData.trigger_type !== 'cart_total' ? formData.trigger_id || null : null,
      trigger_min_amount: formData.trigger_type === 'cart_total' && formData.trigger_min_amount 
        ? parseFloat(formData.trigger_min_amount) 
        : null,
      target_product_ids: formData.target_product_ids,
      display_location: formData.display_location,
      discount_percent: formData.discount_percent ? parseFloat(formData.discount_percent) : null,
      message_ar: formData.message_ar,
      is_active: formData.is_active,
      priority: formData.priority,
    };

    try {
      if (editingRule) {
        await supabase.from('upsell_rules').update(payload).eq('id', editingRule.id);
      } else {
        await supabase.from('upsell_rules').insert([payload]);
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه القاعدة؟')) return;

    try {
      await supabase.from('upsell_rules').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const toggleActive = async (rule: UpsellRule) => {
    try {
      await supabase
        .from('upsell_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);
      fetchData();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'upsell': return 'ترقية (Upsell)';
      case 'downsell': return 'بديل أرخص (Downsell)';
      case 'cross_sell': return 'منتج مكمّل (Cross-sell)';
      default: return type;
    }
  };

  const getTriggerLabel = (rule: UpsellRule) => {
    switch (rule.trigger_type) {
      case 'product':
        const product = products.find(p => p.id === rule.trigger_id);
        return `منتج: ${product?.name || 'غير محدد'}`;
      case 'category':
        const category = categories.find(c => c.id === rule.trigger_id);
        return `تصنيف: ${category?.name || 'غير محدد'}`;
      case 'cart_total':
        return `سلة ≥ ${rule.trigger_min_amount} د.ج`;
      default:
        return rule.trigger_type;
    }
  };

  const getLocationLabel = (location: string) => {
    switch (location) {
      case 'product_page': return 'صفحة المنتج';
      case 'cart': return 'السلة';
      case 'checkout': return 'الدفع';
      case 'order_success': return 'تأكيد الطلب';
      default: return location;
    }
  };

  const toggleTargetProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      target_product_ids: prev.target_product_ids.includes(productId)
        ? prev.target_product_ids.filter(id => id !== productId)
        : [...prev.target_product_ids, productId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العروض والبيع المتقاطع</h1>
          <p className="text-gray-600 mt-1">إدارة قواعد Upsell و Downsell و Cross-sell</p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة قاعدة
        </Button>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-12 text-center">
            <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد قواعد بعد</h3>
            <p className="text-gray-500 mb-4">أضف قواعد لزيادة المبيعات عبر الترقيات والبدائل والمنتجات المكمّلة</p>
            <Button onClick={openAddForm}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة أول قاعدة
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${!rule.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        rule.type === 'upsell' ? 'bg-emerald-100 text-emerald-700' :
                        rule.type === 'downsell' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {getTypeLabel(rule.type)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {rule.is_active ? 'مفعّل' : 'معطّل'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>🎯 {getTriggerLabel(rule)}</span>
                      <span>📍 {getLocationLabel(rule.display_location)}</span>
                      <span>📦 {rule.target_product_ids?.length || 0} منتج مستهدف</span>
                      {rule.discount_percent && (
                        <span className="text-emerald-600">🏷️ خصم {rule.discount_percent}%</span>
                      )}
                    </div>
                    {rule.message_ar && (
                      <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                        "{rule.message_ar}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mr-4">
                    <button
                      onClick={() => toggleActive(rule)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        rule.is_active
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                      }`}
                    >
                      {rule.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button
                      onClick={() => openEditForm(rule)}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingRule ? 'تعديل القاعدة' : 'إضافة قاعدة جديدة'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم القاعدة
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع القاعدة
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['upsell', 'downsell', 'cross_sell'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        formData.type === type
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{getTypeLabel(type)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trigger Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شرط التفعيل
                </label>
                <select
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    trigger_type: e.target.value as 'product' | 'category' | 'cart_total',
                    trigger_id: '',
                    trigger_min_amount: ''
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="product">عند عرض منتج معين</option>
                  <option value="category">عند عرض تصنيف معين</option>
                  <option value="cart_total">عند وصول السلة لمبلغ معين</option>
                </select>
              </div>

              {/* Trigger ID (Product/Category) */}
              {formData.trigger_type === 'product' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المنتج المُفعِّل
                  </label>
                  <select
                    value={formData.trigger_id}
                    onChange={(e) => setFormData({ ...formData, trigger_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">اختر منتج...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.price} د.ج
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.trigger_type === 'category' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التصنيف المُفعِّل
                  </label>
                  <select
                    value={formData.trigger_id}
                    onChange={(e) => setFormData({ ...formData, trigger_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">اختر تصنيف...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.trigger_type === 'cart_total' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحد الأدنى للسلة (د.ج)
                  </label>
                  <input
                    type="number"
                    value={formData.trigger_min_amount}
                    onChange={(e) => setFormData({ ...formData, trigger_min_amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    min="0"
                  />
                </div>
              )}

              {/* Display Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مكان العرض
                </label>
                <select
                  value={formData.display_location}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    display_location: e.target.value as 'product_page' | 'cart' | 'checkout' | 'order_success'
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="product_page">صفحة المنتج</option>
                  <option value="cart">السلة</option>
                  <option value="checkout">صفحة الدفع</option>
                  <option value="order_success">صفحة تأكيد الطلب</option>
                </select>
              </div>

              {/* Target Products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المنتجات المقترحة ({formData.target_product_ids.length} منتج)
                </label>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto p-2">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.target_product_ids.includes(product.id)}
                        onChange={() => toggleTargetProduct(product.id)}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                      <span className="flex-1">{product.name}</span>
                      <span className="text-sm text-gray-500">{product.price} د.ج</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نسبة الخصم (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    max="100"
                    placeholder="مثال: 10"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رسالة العرض (بالعربية)
                </label>
                <textarea
                  value={formData.message_ar}
                  onChange={(e) => setFormData({ ...formData, message_ar: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="مثال: أضف هذا المنتج واحصل على خصم 10%!"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الأولوية (رقم أصغر = أولوية أعلى)
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  min="0"
                />
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
                <span className="font-medium">تفعيل القاعدة</span>
              </label>

              {/* Submit */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button type="submit" className="flex-1">
                  <Save className="w-4 h-4 ml-2" />
                  {editingRule ? 'حفظ التغييرات' : 'إضافة القاعدة'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
