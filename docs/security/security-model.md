# 🔒 Matjarna Security Model

## Overview

Matjarna follows a **defense-in-depth** approach with multiple security layers:

1. **Authentication**: Admin-only login via Supabase Auth
2. **Authorization**: Row-Level Security (RLS) policies
3. **Input Validation**: Zod schemas on all inputs
4. **Rate Limiting**: Protection against brute-force
5. **Secure Configuration**: Environment-based secrets

---

## 1. Authentication Architecture

### Admin-Only Access

```
┌─────────────────────────────────────────────────────────┐
│                    Matjarna Auth Flow                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Storefront (matjarna.com)                            │
│   ├── ✅ Public access (no login required)              │
│   ├── ✅ Read published products/categories/banners     │
│   ├── ✅ Submit orders (server-validated)               │
│   └── ❌ No customer accounts                           │
│                                                         │
│   Admin Panel (admin.matjarna.com)                     │
│   ├── 🔐 Login required (Supabase Auth)                │
│   ├── 🔐 Email/password only                           │
│   ├── 🔐 Admin users created manually in Supabase      │
│   └── ❌ Public signup DISABLED                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Disable Public Signups

In Supabase Dashboard:
1. Go to **Authentication > Providers > Email**
2. Disable **"Enable email confirmations"** if using manual creation
3. Go to **Authentication > URL Configuration**
4. Only allow specific redirect URLs

Or via SQL:
```sql
-- Supabase doesn't have a direct SQL toggle,
-- but you can restrict via RLS and application logic
```

### Creating Admin Users

**Option 1: Supabase Dashboard**
1. Authentication > Users > Invite user
2. Enter admin email
3. They receive an invite link

**Option 2: SQL (for initial setup)**
```sql
-- Use with caution, for initial setup only
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'admin@matjarna.com',
  crypt('your_secure_password', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
);
```

---

## 2. Row-Level Security (RLS)

### Helper Function

```sql
-- Check if current user is an authenticated admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated' AND
    auth.jwt() ->> 'email' IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| **products** | Public (if published) | Admin | Admin | Admin |
| **product_images** | Public | Admin | Admin | Admin |
| **product_variants** | Public | Admin | Admin | Admin |
| **categories** | Public (if active) | Admin | Admin | Admin |
| **banners** | Public (if active) | Admin | Admin | Admin |
| **settings** | Public | Admin | Admin | Admin |
| **reviews** | Public (if approved) | Public* | Admin | Admin |
| **shipping_rates** | Public | Admin | Admin | Admin |
| **orders** | Admin | Server** | Admin | Admin |
| **order_items** | Admin | Server** | Admin | Admin |
| **carts** | Session owner | Session owner | Session owner | Admin |
| **cart_items** | Session owner | Session owner | Session owner | Admin |
| **abandoned_carts** | Admin | Server** | Admin | Admin |
| **coupons** | Admin | Admin | Admin | Admin |
| **upsell_rules** | Public (if active) | Admin | Admin | Admin |

\* Reviews can be submitted by anyone but require moderation
\** Server-side operations use service_role key

### Example RLS Policy

```sql
-- Products: Public can read published, Admin can do everything
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read for published products
CREATE POLICY "Public can view published products"
  ON products FOR SELECT
  USING (is_published = true);

-- Admin full access
CREATE POLICY "Admin can manage products"
  ON products FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
```

---

## 3. API Key Security

### Key Types and Usage

| Key | Location | Usage |
|-----|----------|-------|
| `VITE_SUPABASE_ANON_KEY` | Client (browser) | Public reads only |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin writes, order creation |
| `CLOUDFLARE_IMAGES_API_TOKEN` | Server only | Image uploads |

### ⚠️ Critical Rules

```
❌ NEVER expose service_role key to browser
❌ NEVER include service_role in VITE_ prefixed vars
❌ NEVER commit .env files to git
❌ NEVER log sensitive keys

✅ Use anon key for public reads in browser
✅ Use service_role only in server-side code
✅ Store secrets in environment variables
✅ Use .env.example for documentation
```

### Server-Side Operations

These operations MUST use service_role key on server:
1. **Order creation** - Validate prices, apply coupons, calculate shipping
2. **Coupon validation** - Check usage limits, date validity
3. **Image upload** - Upload to Cloudflare Images
4. **Abandoned cart capture** - Record customer info

---

## 4. Input Validation (Zod)

### Checkout Schema
```typescript
const checkoutSchema = z.object({
  customerName: z.string()
    .min(3, 'الاسم قصير جداً')
    .max(100, 'الاسم طويل جداً'),
  
  customerPhone: z.string()
    .regex(/^(0)(5|6|7)[0-9]{8}$/, 'رقم هاتف جزائري غير صالح'),
  
  wilayaCode: z.number()
    .int()
    .min(1)
    .max(58, 'ولاية غير صالحة'),
  
  address: z.string()
    .min(10, 'العنوان قصير جداً')
    .max(500, 'العنوان طويل جداً'),
  
  deliveryType: z.enum(['office', 'home']),
  
  notes: z.string().max(1000).optional(),
  
  couponCode: z.string().max(50).optional(),
  
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().min(1).max(100)
  })).min(1, 'السلة فارغة')
});
```

### Admin Product Schema
```typescript
const productSchema = z.object({
  name: z.string().min(3).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000),
  price: z.number().positive().max(10000000),
  salePrice: z.number().positive().optional(),
  sku: z.string().max(50).optional(),
  stock: z.number().int().min(0),
  categoryId: z.string().uuid(),
  isPublished: z.boolean(),
  isFeatured: z.boolean()
});
```

---

## 5. Rate Limiting

### Implementation Strategy

Since this is a client-side SPA, rate limiting must be implemented at:

1. **Supabase Level** - Built-in rate limits
2. **Cloudflare Level** - WAF rules (recommended)
3. **Application Level** - Client-side throttling

### Cloudflare WAF Rules (Recommended)

```
Rule 1: Login Rate Limit
- URI contains "/auth"
- Rate limit: 5 requests per minute per IP
- Action: Challenge

Rule 2: Checkout Rate Limit
- URI contains "/checkout" or "/orders"
- Rate limit: 10 requests per minute per IP
- Action: Challenge

Rule 3: Bot Protection
- Known bots score > 30
- Action: Challenge
```

### Client-Side Throttling

```typescript
// Simple throttle for sensitive actions
const throttle = (fn: Function, delay: number) => {
  let lastCall = 0;
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
  };
};

// Apply to checkout submit
const submitCheckout = throttle(async (data) => {
  // ... submit logic
}, 3000); // 3 second minimum between submits
```

---

## 6. Threat Model

### Threats and Mitigations

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **SQL Injection** | High | Supabase uses parameterized queries |
| **XSS** | High | React escapes by default, CSP headers |
| **CSRF** | Medium | SameSite cookies, origin validation |
| **Brute Force Login** | Medium | Rate limiting, account lockout |
| **Price Manipulation** | High | Server-side price calculation |
| **Coupon Abuse** | Medium | Server-side validation, usage tracking |
| **Inventory Overselling** | Medium | Stock check at order creation |
| **Data Exposure** | High | RLS policies, minimal data in responses |
| **Session Hijacking** | High | Secure cookies, short token expiry |

### Security Headers

Already configured in `public/_headers`:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 7. Security Checklist

### Before Deployment
- [ ] All `.env` files in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] RLS enabled on all tables
- [ ] RLS policies reviewed and tested
- [ ] Admin signup disabled in Supabase
- [ ] Service role key only on server

### After Deployment
- [ ] Verify RLS is working (try accessing admin data without login)
- [ ] Test checkout with manipulated prices (should fail)
- [ ] Test coupon with invalid code (should fail gracefully)
- [ ] Review Supabase logs for errors
- [ ] Set up Cloudflare WAF rules
- [ ] Enable Cloudflare Bot Protection

### Regular Maintenance
- [ ] Review Supabase audit logs monthly
- [ ] Update dependencies for security patches
- [ ] Rotate API keys if compromised
- [ ] Review admin user list quarterly
