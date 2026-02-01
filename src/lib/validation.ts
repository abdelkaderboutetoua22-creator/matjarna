import { z } from 'zod';

// ============================================
// CHECKOUT VALIDATION
// ============================================
export const checkoutSchema = z.object({
  customer_name: z
    .string()
    .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل')
    .max(100, 'الاسم طويل جداً'),
  customer_phone: z
    .string()
    .regex(/^(0)(5|6|7)[0-9]{8}$/, 'رقم الهاتف غير صحيح (مثال: 0551234567)'),
  wilaya_code: z
    .string()
    .min(1, 'يرجى اختيار الولاية'),
  address: z
    .string()
    .min(10, 'العنوان يجب أن يكون 10 أحرف على الأقل')
    .max(500, 'العنوان طويل جداً'),
  delivery_type: z
    .enum(['office', 'home'], { message: 'يرجى اختيار طريقة التوصيل' }),
  note: z
    .string()
    .max(500, 'الملاحظة طويلة جداً')
    .optional(),
  coupon_code: z
    .string()
    .optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ============================================
// ADMIN LOGIN VALIDATION
// ============================================
export const loginSchema = z.object({
  email: z
    .string()
    .email('البريد الإلكتروني غير صحيح'),
  password: z
    .string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ============================================
// PRODUCT VALIDATION (Admin)
// ============================================
export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'اسم المنتج يجب أن يكون 3 أحرف على الأقل')
    .max(200, 'اسم المنتج طويل جداً'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط')
    .optional(),
  description: z
    .string()
    .max(5000, 'الوصف طويل جداً')
    .optional(),
  price: z
    .number()
    .positive('السعر يجب أن يكون أكبر من صفر'),
  sale_price: z
    .number()
    .positive('سعر التخفيض يجب أن يكون أكبر من صفر')
    .optional()
    .nullable(),
  sku: z
    .string()
    .max(50, 'رمز المنتج طويل جداً')
    .optional(),
  stock: z
    .number()
    .int('الكمية يجب أن تكون عدد صحيح')
    .min(0, 'الكمية لا يمكن أن تكون سالبة'),
  category_id: z
    .string()
    .uuid('التصنيف غير صحيح')
    .optional()
    .nullable(),
  is_published: z
    .boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ============================================
// CATEGORY VALIDATION (Admin)
// ============================================
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'اسم التصنيف يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم التصنيف طويل جداً'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'الرابط يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط'),
  description: z
    .string()
    .max(500, 'الوصف طويل جداً')
    .optional(),
  parent_id: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  position: z
    .number()
    .int()
    .min(0)
    .optional(),
  is_active: z
    .boolean(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// ============================================
// COUPON VALIDATION (Admin)
// ============================================
export const couponSchema = z.object({
  code: z
    .string()
    .min(3, 'الكود يجب أن يكون 3 أحرف على الأقل')
    .max(20, 'الكود طويل جداً')
    .regex(/^[A-Z0-9]+$/, 'الكود يجب أن يحتوي على حروف إنجليزية كبيرة وأرقام فقط'),
  type: z
    .enum(['percent', 'fixed']),
  value: z
    .number()
    .positive('القيمة يجب أن تكون أكبر من صفر'),
  min_order: z
    .number()
    .min(0, 'الحد الأدنى لا يمكن أن يكون سالب')
    .optional(),
  max_uses: z
    .number()
    .int()
    .positive('عدد الاستخدامات يجب أن يكون أكبر من صفر')
    .optional()
    .nullable(),
  start_date: z
    .string()
    .optional(),
  end_date: z
    .string()
    .optional(),
  is_active: z
    .boolean(),
});

export type CouponFormData = z.infer<typeof couponSchema>;

// ============================================
// REVIEW VALIDATION (Storefront)
// ============================================
export const reviewSchema = z.object({
  customer_name: z
    .string()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم طويل جداً'),
  rating: z
    .number()
    .int()
    .min(1, 'التقييم يجب أن يكون 1 على الأقل')
    .max(5, 'التقييم يجب أن يكون 5 كحد أقصى'),
  text: z
    .string()
    .min(10, 'التعليق يجب أن يكون 10 أحرف على الأقل')
    .max(1000, 'التعليق طويل جداً'),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// ============================================
// SHIPPING RATE VALIDATION (Admin)
// ============================================
export const shippingRateSchema = z.object({
  wilaya_code: z
    .string()
    .min(1, 'رمز الولاية مطلوب')
    .max(2, 'رمز الولاية غير صحيح'),
  wilaya_name: z
    .string()
    .min(2, 'اسم الولاية مطلوب'),
  office_price: z
    .number()
    .min(0, 'السعر لا يمكن أن يكون سالب'),
  home_price: z
    .number()
    .min(0, 'السعر لا يمكن أن يكون سالب'),
  is_active: z
    .boolean(),
});

export type ShippingRateFormData = z.infer<typeof shippingRateSchema>;

// ============================================
// ORDER STATUS UPDATE VALIDATION (Admin)
// ============================================
export const orderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
  ]),
  note: z
    .string()
    .max(500, 'الملاحظة طويلة جداً')
    .optional(),
});

export type OrderStatusFormData = z.infer<typeof orderStatusSchema>;

// ============================================
// HELPER: Validate with error extraction
// ============================================
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  const issues = result.error.issues || [];
  issues.forEach((issue: z.ZodIssue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });
  
  return { success: false, errors };
}
