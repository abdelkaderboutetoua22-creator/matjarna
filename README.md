# 🛒 متجرنا | Matjarna

منصة تجارة إلكترونية عربية (RTL) للجزائر مع الدفع عند الاستلام (COD) والتوصيل لجميع الـ 58 ولاية.

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com/)

---

## 🌟 المميزات

### واجهة المتجر (matjarna.com)
- ✅ صفحة رئيسية احترافية مع بانرات وعروض
- ✅ عرض المنتجات مع خيارات (مقاس/لون)
- ✅ سلة تسوق ذكية
- ✅ دفع عند الاستلام (COD)
- ✅ حساب تلقائي للشحن حسب الولاية
- ✅ تتبع السلات المتروكة
- ✅ تقييمات العملاء مع صور

### لوحة الإدارة (admin.matjarna.com)
- ✅ إدارة الطلبات مع التصفية والتصدير
- ✅ إدارة المنتجات مع متغيرات
- ✅ التصنيفات المتداخلة
- ✅ أسعار الشحن (58 ولاية) مع استيراد/تصدير Excel
- ✅ كوبونات الخصم
- ✅ مراجعة التقييمات
- ✅ لوحة إحصائيات

---

## 🛠️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| **Vite + React 18** | إطار العمل |
| **TypeScript** | أمان الأنواع |
| **TailwindCSS** | التصميم |
| **Zustand** | إدارة الحالة |
| **Supabase** | قاعدة البيانات + المصادقة + RLS |
| **Cloudflare Images** | تخزين الصور |
| **Zod** | التحقق من البيانات |

---

## 📁 هيكل المشروع

```
matjarna/
├── src/
│   ├── components/        # المكونات المشتركة
│   │   └── ui/           # مكونات واجهة المستخدم
│   ├── pages/
│   │   ├── storefront/   # صفحات المتجر
│   │   └── admin/        # صفحات الإدارة
│   ├── layouts/          # التخطيطات
│   ├── lib/              # المكتبات والأدوات
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   └── App.tsx           # التوجيه الرئيسي
├── supabase/
│   ├── migrations/       # ملفات الترحيل
│   └── seed.sql          # بيانات أولية
├── docs/
│   ├── database/         # توثيق قاعدة البيانات
│   ├── security/         # توثيق الأمان
│   └── tracking/         # توثيق التتبع
├── public/               # الملفات الثابتة
└── .env.example          # نموذج المتغيرات
```

---

## 🚀 دليل النشر الكامل

### المرحلة 1: التحضير المحلي

#### 1.1 التأكد من نجاح البناء
```bash
# تثبيت الحزم
npm install

# بناء المشروع
npm run build

# يجب أن ترى: ✓ built in X.XXs
# المخرجات في مجلد dist/
```

#### 1.2 إنشاء ملف المتغيرات
```bash
# انسخ ملف المثال
cp .env.example .env.local

# عدّل القيم حسب حساباتك
```

#### 1.3 اختبار محلي
```bash
npm run dev
# افتح http://localhost:5173
```

---

### المرحلة 2: رفع الكود على GitHub

#### 2.1 إنشاء Repository جديد
1. اذهب إلى [github.com/new](https://github.com/new)
2. اسم المستودع: `matjarna`
3. اجعله **Private** (خاص)
4. لا تضف README (لدينا واحد)

#### 2.2 رفع الكود
```bash
# تهيئة Git (إذا لم يكن موجوداً)
git init

# إضافة الملفات
git add .

# أول commit
git commit -m "Initial commit: Matjarna e-commerce"

# ربط بـ GitHub
git remote add origin https://github.com/USERNAME/matjarna.git

# رفع الكود
git branch -M main
git push -u origin main
```

⚠️ **تنبيه أمني**: تأكد أن `.env.local` موجود في `.gitignore`

---

### المرحلة 3: إعداد Supabase

#### 3.1 إنشاء مشروع جديد
1. اذهب إلى [supabase.com/dashboard](https://supabase.com/dashboard)
2. اضغط **New Project**
3. اختر:
   - **Name**: `matjarna`
   - **Database Password**: كلمة مرور قوية (احفظها!)
   - **Region**: أقرب منطقة (مثل Frankfurt)
4. انتظر 2-3 دقائق للإنشاء

#### 3.2 تطبيق الـ Migrations
1. اذهب إلى **SQL Editor** في Supabase
2. انسخ محتوى `supabase/migrations/001_initial_schema.sql`
3. اضغط **Run**

#### 3.3 الحصول على المفاتيح
اذهب إلى **Settings > API**:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` → `VITE_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **سري جداً!**

#### 3.4 إعداد المصادقة (للأدمن فقط)
1. اذهب إلى **Authentication > Providers**
2. تأكد أن **Email** مفعل
3. اذهب إلى **Authentication > URL Configuration**
4. أضف في **Redirect URLs**:
   ```
   https://admin.matjarna.com/dashboard
   https://admin.matjarna.com/login
   ```

#### 3.5 إنشاء مستخدم أدمن
في **SQL Editor**:
```sql
-- إنشاء مستخدم أدمن
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  role
) VALUES (
  'admin@matjarna.com',
  crypt('YOUR_STRONG_PASSWORD', gen_salt('bf')),
  now(),
  'authenticated'
);

-- أو استخدم Authentication > Users > Invite user
```

---

### المرحلة 4: النشر على Cloudflare Pages

#### 4.1 ربط GitHub
1. اذهب إلى [dash.cloudflare.com](https://dash.cloudflare.com)
2. اختر **Workers & Pages** من القائمة
3. اضغط **Create application**
4. اختر **Pages**
5. اضغط **Connect to Git**
6. سجل دخول GitHub واختر مستودع `matjarna`

#### 4.2 إعدادات البناء
```
Framework preset: None (أو Vite)
Build command: npm run build
Build output directory: dist
Root directory: / (اتركه فارغ)
Node.js version: 18 (أو 20)
```

#### 4.3 المتغيرات البيئية
اضغط **Environment variables** وأضف:

| Variable Name | Value |
|--------------|-------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` |
| `VITE_CLOUDFLARE_ACCOUNT_ID` | `your_account_id` |
| `VITE_FB_PIXEL_ID` | `123456789` (اختياري) |
| `VITE_TIKTOK_PIXEL_ID` | `XXXXX` (اختياري) |
| `VITE_GA_ID` | `G-XXXXXXX` (اختياري) |

⚠️ **لا تضف** `SUPABASE_SERVICE_ROLE_KEY` هنا! (للسيرفر فقط)

#### 4.4 النشر
اضغط **Save and Deploy**

انتظر 2-3 دقائق. ستحصل على رابط مثل:
`https://matjarna-xxx.pages.dev`

---

### المرحلة 5: إعداد النطاقات (Domains)

#### 5.1 إضافة النطاقات في Cloudflare Pages
1. في صفحة المشروع، اذهب إلى **Custom domains**
2. اضغط **Set up a custom domain**
3. أضف: `matjarna.com`
4. كرر وأضف: `admin.matjarna.com`

#### 5.2 إعداد DNS في Namecheap
1. سجل دخول [namecheap.com](https://namecheap.com)
2. اذهب إلى **Domain List** > **Manage** بجانب نطاقك
3. اختر **Advanced DNS**
4. أضف السجلات التالية:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| `CNAME` | `@` | `matjarna-xxx.pages.dev` | Auto |
| `CNAME` | `admin` | `matjarna-xxx.pages.dev` | Auto |
| `CNAME` | `www` | `matjarna.com` | Auto |

> 💡 **ملاحظة**: استبدل `matjarna-xxx.pages.dev` بالرابط الفعلي من Cloudflare

#### 5.3 انتظار انتشار DNS
- عادة 5-30 دقيقة
- يمكن أن يستغرق حتى 48 ساعة
- تحقق من [dnschecker.org](https://dnschecker.org)

---

### المرحلة 6: إعداد Cloudflare Images

#### 6.1 تفعيل Cloudflare Images
1. في Cloudflare Dashboard، اذهب إلى **Images**
2. اشترك في الخطة ($5/شهر لـ 100K صورة)
3. احصل على **Account ID** من الصفحة الرئيسية

#### 6.2 إنشاء API Token
1. اذهب إلى **My Profile > API Tokens**
2. اضغط **Create Token**
3. اختر **Custom token**
4. الصلاحيات:
   - `Account > Cloudflare Images > Edit`
5. احفظ الـ Token

#### 6.3 اختبار الرفع
```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/images/v1" \
  -H "Authorization: Bearer API_TOKEN" \
  -F "file=@test-image.jpg"
```

---

### المرحلة 7: إعداد التتبع (Tracking)

#### 7.1 Facebook Pixel
1. اذهب إلى [Facebook Events Manager](https://business.facebook.com/events_manager)
2. أنشئ Pixel جديد
3. احصل على **Pixel ID**
4. أضفه كـ `VITE_FB_PIXEL_ID`

#### 7.2 TikTok Pixel
1. اذهب إلى [TikTok Ads Manager](https://ads.tiktok.com)
2. أنشئ Pixel
3. احصل على **Pixel ID**
4. أضفه كـ `VITE_TIKTOK_PIXEL_ID`

#### 7.3 Google Analytics
1. اذهب إلى [analytics.google.com](https://analytics.google.com)
2. أنشئ Property جديد (GA4)
3. احصل على **Measurement ID** (يبدأ بـ G-)
4. أضفه كـ `VITE_GA_ID`

---

## 🔧 استكشاف الأخطاء

### ❌ فشل البناء (Build Failed)

#### 1. خطأ TypeScript
```bash
# تحقق من الأخطاء محلياً
npm run build

# إذا ظهرت أخطاء، أصلحها قبل الرفع
```

#### 2. متغيرات بيئية مفقودة
```
Error: VITE_SUPABASE_URL is not defined
```
**الحل**: تأكد من إضافة جميع المتغيرات في Cloudflare Pages

#### 3. إصدار Node.js خاطئ
```
Error: Node.js version X.X is not supported
```
**الحل**: في Cloudflare Pages، أضف متغير `NODE_VERSION` = `18`

#### 4. مجلد الإخراج خاطئ
**الحل**: تأكد أن Build output = `dist`

### ❌ الصفحات لا تعمل (404)

هذا لأن Cloudflare لا يعرف أنه SPA.

**الحل**: أنشئ ملف `public/_redirects`:
```
/* /index.html 200
```

أو ملف `public/_routes.json`:
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": []
}
```

### ❌ مشاكل CORS مع Supabase
**الحل**: في Supabase Dashboard:
1. Settings > API
2. أضف نطاقاتك في **Additional Redirect URLs**

### ❌ الأدمن لا يعمل على admin.matjarna.com
**الحل**: تأكد من:
1. إضافة النطاق في Custom domains
2. سجلات DNS صحيحة
3. انتظار انتشار DNS

---

## ✅ قائمة Go-Live النهائية

قبل الإطلاق، تأكد من:

- [ ] ✅ البناء يعمل محلياً بدون أخطاء
- [ ] ✅ الكود مرفوع على GitHub (private repo)
- [ ] ✅ Supabase: الـ migrations مطبقة
- [ ] ✅ Supabase: مستخدم أدمن منشأ
- [ ] ✅ Supabase: RLS مفعل على جميع الجداول
- [ ] ✅ Cloudflare Pages: المتغيرات البيئية مضافة
- [ ] ✅ Cloudflare Pages: البناء ناجح
- [ ] ✅ DNS: السجلات مضافة في Namecheap
- [ ] ✅ النطاقات: matjarna.com يعمل
- [ ] ✅ النطاقات: admin.matjarna.com يعمل
- [ ] ✅ HTTPS: الشهادة فعالة (تلقائي من Cloudflare)
- [ ] ✅ اختبار: إضافة منتج للسلة
- [ ] ✅ اختبار: إتمام طلب تجريبي
- [ ] ✅ اختبار: تسجيل دخول الأدمن
- [ ] ✅ التتبع: الأحداث تظهر في Facebook/TikTok/GA

---

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من قسم استكشاف الأخطاء أعلاه
2. راجع [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
3. راجع [Supabase Docs](https://supabase.com/docs)

---

## 📄 الترخيص

MIT License - استخدم المشروع كما تشاء.

---

**صنع بـ ❤️ للتجارة الإلكترونية الجزائرية**
