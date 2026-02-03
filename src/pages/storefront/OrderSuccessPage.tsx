import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Home, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UpsellWidget } from '@/components/storefront/UpsellWidget';
import { config } from '@/config';

export function OrderSuccessPage() {
  const { orderNumber } = useParams();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-lg mx-auto text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-14 h-14 text-green-600" />
        </div>

        {/* Message */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          تم استلام طلبك بنجاح!
        </h1>
        <p className="text-gray-600 mb-6">
          شكراً لتسوقك من متجرنا. سنقوم بالتواصل معك قريباً لتأكيد الطلب.
        </p>

        {/* Order Number */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <p className="text-sm text-gray-500 mb-1">رقم الطلب</p>
          <p className="text-2xl font-bold text-primary-600 font-mono">{orderNumber}</p>
          <p className="text-xs text-gray-400 mt-2">
            احتفظ بهذا الرقم للمتابعة
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl p-6 shadow-sm text-right mb-8">
          <h2 className="font-bold text-gray-900 mb-4">الخطوات القادمة:</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
              <span>سيتم مراجعة طلبك وتأكيده خلال 24 ساعة</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
              <span>سنتواصل معك عبر الهاتف لتأكيد العنوان</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
              <span>سيتم شحن طلبك وتتبعه حتى التسليم</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
              <span>الدفع عند الاستلام (COD)</span>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="bg-blue-50 rounded-xl p-4 mb-8">
          <p className="text-sm text-blue-800 mb-2">للاستفسارات تواصل معنا:</p>
          <a
            href={`tel:${config.store.phone}`}
            className="inline-flex items-center gap-2 text-blue-600 font-medium"
          >
            <Phone className="w-4 h-4" />
            <span dir="ltr">{config.store.phone}</span>
          </a>
        </div>

        {/* Upsell Offers */}
        <UpsellWidget location="order_success" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="primary" size="lg">
              <Home className="w-5 h-5 ml-2" />
              العودة للرئيسية
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" size="lg">
              <MapPin className="w-5 h-5 ml-2" />
              تصفح المزيد
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
