import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Tag, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { checkoutSchema, validateForm } from '@/lib/validation';
import { wilayas, deliveryTypes, config } from '@/config';
import type { ShippingRate } from '@/types';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { items, getSubtotal, couponCode, applyCoupon, removeCoupon, clearCart } = useCartStore();
  
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [abandonedCartId, setAbandonedCartId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    wilaya_code: '',
    address: '',
    delivery_type: 'office' as 'office' | 'home',
    note: '',
  });

  const subtotal = getSubtotal();
  const selectedWilaya = wilayas.find(w => w.code === formData.wilaya_code);
  const shippingRate = shippingRates.find(r => r.wilaya_code === formData.wilaya_code);
  const shippingCost = shippingRate
    ? (formData.delivery_type === 'home' ? shippingRate.home_price : shippingRate.office_price)
    : 0;
  const total = subtotal - discount + shippingCost;

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    async function fetchShippingRates() {
      setLoading(true);
      const { data } = await supabase
        .from('shipping_rates')
        .select('*')
        .eq('is_active', true);
      setShippingRates(data || []);
      setLoading(false);
    }

    fetchShippingRates();
  }, [items.length, navigate]);

  // Save abandoned cart when user enters info
  const saveAbandonedCart = useCallback(async () => {
    if (!formData.customer_name || !formData.customer_phone) return;

    const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);

    const cartData = {
      session_id: sessionId,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      wilaya_code: formData.wilaya_code || null,
      address: formData.address || null,
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.product.name,
        product_image: item.product.images?.[0]?.image_url,
        quantity: item.quantity,
        price: item.product.sale_price || item.product.price,
        selected_options: item.selected_options,
      })),
      subtotal,
    };

    try {
      if (abandonedCartId) {
        await supabase
          .from('abandoned_carts')
          .update(cartData)
          .eq('id', abandonedCartId);
      } else {
        const { data } = await supabase
          .from('abandoned_carts')
          .insert(cartData)
          .select('id')
          .single();
        if (data) setAbandonedCartId(data.id);
      }
    } catch (error) {
      console.error('Error saving abandoned cart:', error);
    }
  }, [formData, items, subtotal, abandonedCartId]);

  // Debounced save of abandoned cart
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.customer_name && formData.customer_phone) {
        saveAbandonedCart();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData.customer_name, formData.customer_phone, formData.wilaya_code, formData.address, saveAbandonedCart]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    
    setCouponLoading(true);
    try {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponInput.toUpperCase())
        .eq('is_active', true)
        .single();

      if (!coupon) {
        showToast('الكوبون غير صالح', 'error');
        setCouponLoading(false);
        return;
      }

      // Check min order
      if (coupon.min_order && subtotal < coupon.min_order) {
        showToast(`الحد الأدنى للطلب ${coupon.min_order.toLocaleString()} ${config.store.currency}`, 'error');
        setCouponLoading(false);
        return;
      }

      // Check usage limit
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        showToast('تم استنفاد عدد استخدامات هذا الكوبون', 'error');
        setCouponLoading(false);
        return;
      }

      // Check date range
      const now = new Date();
      if (coupon.start_date && new Date(coupon.start_date) > now) {
        showToast('الكوبون لم يبدأ بعد', 'error');
        setCouponLoading(false);
        return;
      }
      if (coupon.end_date && new Date(coupon.end_date) < now) {
        showToast('انتهت صلاحية الكوبون', 'error');
        setCouponLoading(false);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.type === 'percent') {
        discountAmount = Math.floor(subtotal * (coupon.value / 100));
      } else {
        discountAmount = coupon.value;
      }

      setDiscount(Math.min(discountAmount, subtotal));
      applyCoupon(coupon.code);
      showToast('تم تطبيق الكوبون بنجاح', 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء التحقق من الكوبون', 'error');
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setDiscount(0);
    setCouponInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm(checkoutSchema, formData);
    if (!validation.success) {
      setErrors(validation.errors);
      showToast('يرجى تصحيح الأخطاء في النموذج', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Generate order number
      const orderNumber = `MTJ-${Date.now().toString(36).toUpperCase()}`;
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          wilaya_code: formData.wilaya_code,
          wilaya_name: selectedWilaya?.name || '',
          address: formData.address,
          delivery_type: formData.delivery_type,
          note: formData.note || null,
          subtotal,
          shipping: shippingCost,
          discount,
          total,
          coupon_code: couponCode,
          status: 'pending',
          status_history: [{
            status: 'pending',
            timestamp: new Date().toISOString(),
          }],
        })
        .select('id, order_number')
        .single();

      if (orderError || !order) {
        throw new Error('Failed to create order');
      }

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        product_image: item.product.images?.[0]?.image_url || null,
        variant_id: item.variant_id,
        selected_options: item.selected_options,
        quantity: item.quantity,
        price: item.product.sale_price || item.product.price,
        total: (item.product.sale_price || item.product.price) * item.quantity,
      }));

      await supabase.from('order_items').insert(orderItems);

      // Update coupon usage if applied
      if (couponCode) {
        await supabase.rpc('increment_coupon_usage', { coupon_code: couponCode });
      }

      // Delete abandoned cart if exists
      if (abandonedCartId) {
        await supabase.from('abandoned_carts').delete().eq('id', abandonedCartId);
      }

      // Clear cart and redirect
      clearCart();
      navigate(`/order-success/${order.order_number}`);
    } catch (error) {
      console.error('Error creating order:', error);
      showToast('حدث خطأ أثناء إنشاء الطلب', 'error');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/cart" className="text-primary-600 hover:text-primary-700">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إتمام الطلب</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">معلومات العميل</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="الاسم الكامل"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  error={errors.customer_name}
                  placeholder="أدخل اسمك الكامل"
                />
                <Input
                  label="رقم الهاتف"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  error={errors.customer_phone}
                  placeholder="0551234567"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">عنوان التوصيل</h2>
              <div className="space-y-4">
                <Select
                  label="الولاية"
                  name="wilaya_code"
                  value={formData.wilaya_code}
                  onChange={handleChange}
                  error={errors.wilaya_code}
                  placeholder="اختر الولاية"
                  options={wilayas.map(w => ({ value: w.code, label: `${w.code} - ${w.name}` }))}
                />
                
                <Input
                  label="العنوان التفصيلي"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  placeholder="أدخل عنوانك التفصيلي (الحي، الشارع، رقم العمارة...)"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">طريقة التوصيل</label>
                  <div className="grid grid-cols-2 gap-3">
                    {deliveryTypes.map((type) => {
                      const price = shippingRate
                        ? (type.value === 'home' ? shippingRate.home_price : shippingRate.office_price)
                        : 0;
                      return (
                        <label
                          key={type.value}
                          className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                            formData.delivery_type === type.value
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="delivery_type"
                            value={type.value}
                            checked={formData.delivery_type === type.value}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="font-medium text-gray-900">{type.label}</span>
                          {formData.wilaya_code && (
                            <span className="text-sm text-primary-600 mt-1">
                              {price.toLocaleString()} {config.store.currency}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="أي تعليمات خاصة للتوصيل..."
                  />
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">كود الخصم</h2>
              {couponCode ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">{couponCode}</span>
                    <span className="text-sm text-green-600">
                      (-{discount.toLocaleString()} {config.store.currency})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1 text-green-600 hover:text-green-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="أدخل كود الخصم"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyCoupon}
                    isLoading={couponLoading}
                  >
                    تطبيق
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">ملخص الطلب</h2>
              
              {/* Items */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product.images?.[0]?.image_url || 'https://placehold.co/60x60'}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium">
                      {((item.product.sale_price || item.product.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">المجموع الفرعي</span>
                  <span>{subtotal.toLocaleString()} {config.store.currency}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>الخصم</span>
                    <span>-{discount.toLocaleString()} {config.store.currency}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">التوصيل</span>
                  <span>
                    {formData.wilaya_code
                      ? `${shippingCost.toLocaleString()} ${config.store.currency}`
                      : 'اختر الولاية'}
                  </span>
                </div>
              </div>

              <div className="border-t mt-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">المجموع</span>
                  <span className="text-xl font-bold text-primary-600">
                    {total.toLocaleString()} {config.store.currency}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-6"
                isLoading={submitting}
                disabled={!formData.wilaya_code}
              >
                تأكيد الطلب (الدفع عند الاستلام)
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                بالنقر على "تأكيد الطلب"، أنت توافق على شروط الخدمة وسياسة الخصوصية
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
