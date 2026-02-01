// Configuration - Replace with your actual values
export const config = {
  // Supabase (use environment variables in production)
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
  },
  
  // Cloudflare Images
  cloudflare: {
    accountId: import.meta.env.VITE_CF_ACCOUNT_ID || '',
    imageDeliveryUrl: import.meta.env.VITE_CF_IMAGE_DELIVERY_URL || 'https://imagedelivery.net',
  },
  
  // Tracking (optional)
  tracking: {
    facebookPixelId: import.meta.env.VITE_FB_PIXEL_ID || '',
    tiktokPixelId: import.meta.env.VITE_TIKTOK_PIXEL_ID || '',
    googleAnalyticsId: import.meta.env.VITE_GA_ID || '',
  },
  
  // Store info
  store: {
    name: 'متجرنا',
    nameEn: 'Matjarna',
    currency: 'د.ج',
    currencyCode: 'DZD',
    phone: '+213 XX XX XX XX',
    email: 'support@matjarna.com',
  },
};

// 58 Algerian Wilayas
export const wilayas = [
  { code: '01', name: 'أدرار' },
  { code: '02', name: 'الشلف' },
  { code: '03', name: 'الأغواط' },
  { code: '04', name: 'أم البواقي' },
  { code: '05', name: 'باتنة' },
  { code: '06', name: 'بجاية' },
  { code: '07', name: 'بسكرة' },
  { code: '08', name: 'بشار' },
  { code: '09', name: 'البليدة' },
  { code: '10', name: 'البويرة' },
  { code: '11', name: 'تمنراست' },
  { code: '12', name: 'تبسة' },
  { code: '13', name: 'تلمسان' },
  { code: '14', name: 'تيارت' },
  { code: '15', name: 'تيزي وزو' },
  { code: '16', name: 'الجزائر' },
  { code: '17', name: 'الجلفة' },
  { code: '18', name: 'جيجل' },
  { code: '19', name: 'سطيف' },
  { code: '20', name: 'سعيدة' },
  { code: '21', name: 'سكيكدة' },
  { code: '22', name: 'سيدي بلعباس' },
  { code: '23', name: 'عنابة' },
  { code: '24', name: 'قالمة' },
  { code: '25', name: 'قسنطينة' },
  { code: '26', name: 'المدية' },
  { code: '27', name: 'مستغانم' },
  { code: '28', name: 'المسيلة' },
  { code: '29', name: 'معسكر' },
  { code: '30', name: 'ورقلة' },
  { code: '31', name: 'وهران' },
  { code: '32', name: 'البيض' },
  { code: '33', name: 'إليزي' },
  { code: '34', name: 'برج بوعريريج' },
  { code: '35', name: 'بومرداس' },
  { code: '36', name: 'الطارف' },
  { code: '37', name: 'تندوف' },
  { code: '38', name: 'تيسمسيلت' },
  { code: '39', name: 'الوادي' },
  { code: '40', name: 'خنشلة' },
  { code: '41', name: 'سوق أهراس' },
  { code: '42', name: 'تيبازة' },
  { code: '43', name: 'ميلة' },
  { code: '44', name: 'عين الدفلى' },
  { code: '45', name: 'النعامة' },
  { code: '46', name: 'عين تموشنت' },
  { code: '47', name: 'غرداية' },
  { code: '48', name: 'غليزان' },
  { code: '49', name: 'المغير' },
  { code: '50', name: 'المنيعة' },
  { code: '51', name: 'أولاد جلال' },
  { code: '52', name: 'برج باجي مختار' },
  { code: '53', name: 'بني عباس' },
  { code: '54', name: 'تيميمون' },
  { code: '55', name: 'تقرت' },
  { code: '56', name: 'جانت' },
  { code: '57', name: 'عين صالح' },
  { code: '58', name: 'عين قزام' },
];

export const deliveryTypes = [
  { value: 'office', label: 'مكتب التوصيل' },
  { value: 'home', label: 'التوصيل للمنزل' },
] as const;

export const orderStatuses = [
  { value: 'pending', label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'مؤكد', color: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'قيد التجهيز', color: 'bg-purple-100 text-purple-800' },
  { value: 'shipped', label: 'تم الشحن', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered', label: 'تم التوصيل', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-red-100 text-red-800' },
  { value: 'returned', label: 'مرتجع', color: 'bg-gray-100 text-gray-800' },
] as const;
