-- Matjarna E-commerce RLS Policies
-- Migration 002: Row Level Security

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADMIN PROFILES POLICIES
-- Only admins can read their own profile
-- ============================================
CREATE POLICY "Admins can view their own profile"
  ON admin_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- NOTE: Avoid recursion / policy self-reference in admin_profiles.
-- If you need super-admin to list all admins, do it via a server-side function / Edge Function.


-- ============================================
-- CATEGORIES POLICIES
-- Public: Read active categories
-- Admin: Full access
-- ============================================
CREATE POLICY "Public can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- PRODUCTS POLICIES
-- Public: Read published products
-- Admin: Full access
-- ============================================
CREATE POLICY "Public can view published products"
  ON products FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- PRODUCT IMAGES POLICIES
-- Public: Read images of published products
-- Admin: Full access
-- ============================================
CREATE POLICY "Public can view product images"
  ON product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE id = product_images.product_id 
      AND is_published = true
    )
  );

CREATE POLICY "Admins can manage product images"
  ON product_images FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- PRODUCT OPTIONS POLICIES
-- ============================================
CREATE POLICY "Public can view product options"
  ON product_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE id = product_options.product_id 
      AND is_published = true
    )
  );

CREATE POLICY "Admins can manage product options"
  ON product_options FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- PRODUCT VARIANTS POLICIES
-- ============================================
CREATE POLICY "Public can view available variants"
  ON product_variants FOR SELECT
  USING (
    is_available = true AND
    EXISTS (
      SELECT 1 FROM products 
      WHERE id = product_variants.product_id 
      AND is_published = true
    )
  );

CREATE POLICY "Admins can manage variants"
  ON product_variants FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- SHIPPING RATES POLICIES
-- Public: Read active shipping rates
-- Admin: Full access
-- ============================================
CREATE POLICY "Public can view active shipping rates"
  ON shipping_rates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage shipping rates"
  ON shipping_rates FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- COUPONS POLICIES
-- Public: No access (validated server-side)
-- Admin: Full access
-- ============================================
CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- ORDERS POLICIES
-- Public: No access (created server-side)
-- Admin: Full access
-- ============================================
CREATE POLICY "Admins can manage orders"
  ON orders FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================
CREATE POLICY "Admins can manage order items"
  ON order_items FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- ABANDONED CARTS POLICIES
-- Public: Insert only (via server)
-- Admin: Full access
-- ============================================
CREATE POLICY "Admins can manage abandoned carts"
  ON abandoned_carts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- REVIEWS POLICIES
-- Public: Read approved reviews only
-- Public: Can submit new reviews as pending only (moderation)
-- Admin: Full access
-- ============================================
CREATE POLICY "Public can view approved reviews"
  ON reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Public can submit pending reviews"
  ON reviews FOR INSERT
  WITH CHECK (status = 'pending');

CREATE POLICY "Admins can manage reviews"
  ON reviews FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- BANNERS POLICIES
-- Public: Read active banners
-- Admin: Full access
-- ============================================
CREATE POLICY "Public can view active banners"
  ON banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage banners"
  ON banners FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- UPSELL RULES POLICIES
-- Public: Read active rules
-- Admin: Full access
-- ============================================
CREATE POLICY "Public can view active upsell rules"
  ON upsell_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage upsell rules"
  ON upsell_rules FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- STORE SETTINGS POLICIES
-- Public: Read only
-- Admin: Full access
-- ============================================
CREATE POLICY "Public can view store settings"
  ON store_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage store settings"
  ON store_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- PAGE VISITS POLICIES
-- Public: Insert only (tracking)
-- Admin: Read only
-- ============================================
CREATE POLICY "Anyone can insert page visits"
  ON page_visits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view page visits"
  ON page_visits FOR SELECT
  USING (is_admin());
