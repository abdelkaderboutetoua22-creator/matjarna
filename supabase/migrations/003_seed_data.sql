-- Matjarna E-commerce Seed Data
-- Migration 003: Initial Data

-- ============================================
-- SHIPPING RATES FOR 58 WILAYAS
-- ============================================
INSERT INTO shipping_rates (wilaya_code, wilaya_name, office_price, home_price) VALUES
('01', 'أدرار', 800, 1200),
('02', 'الشلف', 400, 600),
('03', 'الأغواط', 500, 800),
('04', 'أم البواقي', 450, 700),
('05', 'باتنة', 450, 700),
('06', 'بجاية', 400, 600),
('07', 'بسكرة', 500, 800),
('08', 'بشار', 700, 1000),
('09', 'البليدة', 300, 450),
('10', 'البويرة', 350, 550),
('11', 'تمنراست', 900, 1300),
('12', 'تبسة', 500, 800),
('13', 'تلمسان', 450, 700),
('14', 'تيارت', 450, 700),
('15', 'تيزي وزو', 400, 600),
('16', 'الجزائر', 250, 400),
('17', 'الجلفة', 500, 800),
('18', 'جيجل', 400, 600),
('19', 'سطيف', 400, 600),
('20', 'سعيدة', 500, 750),
('21', 'سكيكدة', 450, 700),
('22', 'سيدي بلعباس', 450, 700),
('23', 'عنابة', 400, 600),
('24', 'قالمة', 450, 700),
('25', 'قسنطينة', 400, 600),
('26', 'المدية', 350, 550),
('27', 'مستغانم', 400, 600),
('28', 'المسيلة', 450, 700),
('29', 'معسكر', 450, 700),
('30', 'ورقلة', 600, 900),
('31', 'وهران', 350, 550),
('32', 'البيض', 600, 900),
('33', 'إليزي', 900, 1300),
('34', 'برج بوعريريج', 400, 600),
('35', 'بومرداس', 300, 450),
('36', 'الطارف', 450, 700),
('37', 'تندوف', 900, 1300),
('38', 'تيسمسيلت', 450, 700),
('39', 'الوادي', 550, 850),
('40', 'خنشلة', 500, 800),
('41', 'سوق أهراس', 500, 800),
('42', 'تيبازة', 300, 450),
('43', 'ميلة', 400, 600),
('44', 'عين الدفلى', 400, 600),
('45', 'النعامة', 600, 900),
('46', 'عين تموشنت', 450, 700),
('47', 'غرداية', 550, 850),
('48', 'غليزان', 400, 600),
('49', 'المغير', 600, 900),
('50', 'المنيعة', 700, 1000),
('51', 'أولاد جلال', 550, 850),
('52', 'برج باجي مختار', 900, 1300),
('53', 'بني عباس', 800, 1200),
('54', 'تيميمون', 800, 1200),
('55', 'تقرت', 550, 850),
('56', 'جانت', 900, 1300),
('57', 'عين صالح', 800, 1200),
('58', 'عين قزام', 900, 1300);

-- ============================================
-- STORE SETTINGS
-- ============================================
INSERT INTO store_settings (
  store_name,
  support_phone,
  support_email,
  social_links,
  features
) VALUES (
  'متجرنا',
  '+213 XX XX XX XX',
  'support@matjarna.com',
  '{
    "facebook": "https://facebook.com/matjarna",
    "instagram": "https://instagram.com/matjarna",
    "tiktok": "https://tiktok.com/@matjarna"
  }',
  '[
    {"title": "توصيل سريع", "description": "توصيل لجميع الولايات", "icon": "truck"},
    {"title": "الدفع عند الاستلام", "description": "ادفع عند استلام طلبك", "icon": "cash"},
    {"title": "إرجاع مجاني", "description": "إرجاع مجاني خلال 7 أيام", "icon": "return"},
    {"title": "دعم مستمر", "description": "دعم فني على مدار الساعة", "icon": "support"}
  ]'
);

-- ============================================
-- DEMO CATEGORIES
-- ============================================
INSERT INTO categories (id, name, slug, description, position, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'إلكترونيات', 'electronics', 'أحدث الأجهزة الإلكترونية', 1, true),
('22222222-2222-2222-2222-222222222222', 'ملابس', 'clothing', 'ملابس رجالية ونسائية', 2, true),
('33333333-3333-3333-3333-333333333333', 'أحذية', 'shoes', 'أحذية رياضية وكلاسيكية', 3, true),
('44444444-4444-4444-4444-444444444444', 'إكسسوارات', 'accessories', 'إكسسوارات وساعات', 4, true);

-- Subcategories
INSERT INTO categories (name, slug, description, parent_id, position, is_active) VALUES
('هواتف ذكية', 'smartphones', 'أحدث الهواتف الذكية', '11111111-1111-1111-1111-111111111111', 1, true),
('ساعات ذكية', 'smartwatches', 'ساعات ذكية وأساور', '11111111-1111-1111-1111-111111111111', 2, true),
('سماعات', 'headphones', 'سماعات لاسلكية وسلكية', '11111111-1111-1111-1111-111111111111', 3, true),
('ملابس رجالية', 'mens-clothing', 'ملابس رجالية عصرية', '22222222-2222-2222-2222-222222222222', 1, true),
('ملابس نسائية', 'womens-clothing', 'ملابس نسائية أنيقة', '22222222-2222-2222-2222-222222222222', 2, true);

-- ============================================
-- DEMO PRODUCTS
-- ============================================
INSERT INTO products (id, name, slug, description, price, sale_price, sku, stock, is_published, category_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'سماعات لاسلكية احترافية', 'wireless-headphones-pro', 'سماعات بلوتوث عالية الجودة مع عزل ضوضاء نشط وبطارية تدوم 30 ساعة', 8500, 6500, 'WH-001', 50, true, '11111111-1111-1111-1111-111111111111'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ساعة ذكية سبورت', 'smart-watch-sport', 'ساعة ذكية مقاومة للماء مع متتبع لياقة ومراقبة نبضات القلب', 12000, NULL, 'SW-001', 30, true, '11111111-1111-1111-1111-111111111111'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'حذاء رياضي أصلي', 'sport-shoes-original', 'حذاء رياضي مريح للجري والتمارين اليومية', 7500, 5900, 'SH-001', 100, true, '33333333-3333-3333-3333-333333333333'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'قميص قطني كلاسيكي', 'cotton-shirt-classic', 'قميص قطن 100% عالي الجودة مناسب لجميع المناسبات', 3500, NULL, 'CS-001', 80, true, '22222222-2222-2222-2222-222222222222'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'حقيبة ظهر عصرية', 'modern-backpack', 'حقيبة ظهر متعددة الاستخدامات مع جيب للابتوب', 4500, 3800, 'BP-001', 45, true, '44444444-4444-4444-4444-444444444444'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'نظارة شمسية أنيقة', 'elegant-sunglasses', 'نظارة شمسية بتصميم عصري وحماية UV400', 2500, NULL, 'SG-001', 60, true, '44444444-4444-4444-4444-444444444444');

-- ============================================
-- DEMO PRODUCT IMAGES
-- ============================================
INSERT INTO product_images (product_id, image_url, position, is_primary) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://placehold.co/600x600/3b82f6/ffffff?text=سماعات', 0, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://placehold.co/600x600/60a5fa/ffffff?text=سماعات+2', 1, false),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://placehold.co/600x600/10b981/ffffff?text=ساعة+ذكية', 0, true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://placehold.co/600x600/f59e0b/ffffff?text=حذاء', 0, true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'https://placehold.co/600x600/8b5cf6/ffffff?text=قميص', 0, true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'https://placehold.co/600x600/ec4899/ffffff?text=حقيبة', 0, true),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'https://placehold.co/600x600/06b6d4/ffffff?text=نظارة', 0, true);

-- ============================================
-- DEMO PRODUCT OPTIONS (for shoes)
-- ============================================
INSERT INTO product_options (product_id, name, values, position) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'المقاس', '["40", "41", "42", "43", "44", "45"]', 0),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'اللون', '["أسود", "أبيض", "رمادي"]', 1),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'المقاس', '["S", "M", "L", "XL", "XXL"]', 0),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'اللون', '["أبيض", "أزرق", "أسود"]', 1);

-- ============================================
-- DEMO BANNERS
-- ============================================
INSERT INTO banners (title, subtitle, image_url, link, position, is_active) VALUES
('خصومات العيد', 'خصم يصل إلى 50% على جميع المنتجات', 'https://placehold.co/1200x400/3b82f6/ffffff?text=خصومات+العيد', '/products', 0, true),
('وصل حديثاً', 'تشكيلة جديدة من الملابس الصيفية', 'https://placehold.co/1200x400/10b981/ffffff?text=وصل+حديثاً', '/category/clothing', 1, true),
('توصيل مجاني', 'توصيل مجاني للطلبات أكثر من 5000 دج', 'https://placehold.co/1200x400/f59e0b/ffffff?text=توصيل+مجاني', '/products', 2, true);

-- ============================================
-- DEMO COUPON
-- ============================================
INSERT INTO coupons (code, type, value, min_order, max_uses, start_date, end_date, is_active) VALUES
('WELCOME10', 'percent', 10, 3000, 100, NOW(), NOW() + INTERVAL '30 days', true),
('SAVE500', 'fixed', 500, 5000, 50, NOW(), NOW() + INTERVAL '30 days', true);

-- ============================================
-- DEMO REVIEWS
-- ============================================
INSERT INTO reviews (product_id, customer_name, rating, text, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'أحمد محمد', 5, 'سماعات ممتازة جداً، الصوت واضح والبطارية تدوم طويلاً. أنصح بها بشدة!', 'approved'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'سارة علي', 4, 'منتج جيد، التوصيل كان سريع. السماعات مريحة للاستخدام اليومي.', 'approved'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'كريم بن علي', 5, 'حذاء مريح جداً للجري، الجودة عالية والسعر مناسب.', 'approved'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'فاطمة الزهراء', 5, 'ساعة رائعة! كل المميزات تعمل بشكل ممتاز.', 'approved');
