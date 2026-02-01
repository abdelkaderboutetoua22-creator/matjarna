# 📊 Matjarna Database Schema

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐
│   categories    │────<│    products     │
└─────────────────┘     └─────────────────┘
         │                      │
         │              ┌───────┴───────┐
         │              │               │
         ▼              ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│ categories      │ │product_images│ │product_variants │
│ (self-ref)      │ └─────────────┘ └─────────────────┘
└─────────────────┘                         │
                                            │
┌─────────────────┐     ┌─────────────────┐ │
│  cart_items     │────>│     carts       │ │
└─────────────────┘     └─────────────────┘ │
         │                                   │
         ▼                                   │
┌─────────────────┐                          │
│abandoned_carts  │                          │
└─────────────────┘                          │
                                            │
┌─────────────────┐     ┌─────────────────┐ │
│  order_items    │────>│     orders      │<┘
└─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ shipping_rates  │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│    reviews      │────>│    products     │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│    coupons      │     │  upsell_rules   │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│    banners      │     │    settings     │
└─────────────────┘     └─────────────────┘
```

---

## Tables Detail

### categories
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Category name (Arabic) |
| `slug` | text | URL-friendly name |
| `parent_id` | uuid | Reference to parent category (nullable) |
| `image_url` | text | Cloudflare Image URL |
| `sort_order` | int | Display order |
| `is_active` | boolean | Show/hide category |
| `created_at` | timestamptz | Creation time |

### products
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Product name (Arabic) |
| `slug` | text | URL-friendly name |
| `description` | text | Product description |
| `price` | decimal | Original price (DZD) |
| `sale_price` | decimal | Sale price (nullable) |
| `sku` | text | Stock keeping unit |
| `stock` | int | Available quantity |
| `category_id` | uuid | FK to categories |
| `is_published` | boolean | Published/Draft |
| `is_featured` | boolean | Show in featured section |
| `has_variants` | boolean | Has size/color options |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

### product_images
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `product_id` | uuid | FK to products |
| `image_url` | text | Cloudflare Image URL |
| `cf_image_id` | text | Cloudflare Image ID |
| `sort_order` | int | Display order |
| `is_primary` | boolean | Main product image |

### product_variants
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `product_id` | uuid | FK to products |
| `name` | text | Variant name (e.g., "أحمر - L") |
| `option_type` | text | "size" / "color" / "custom" |
| `option_value` | text | The value (e.g., "XL", "أحمر") |
| `price_adjustment` | decimal | +/- from base price |
| `stock` | int | Variant-specific stock |
| `sku` | text | Variant SKU |
| `is_available` | boolean | In stock |

### orders
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `order_number` | text | Human-readable order ID |
| `customer_name` | text | Customer full name |
| `customer_phone` | text | Phone number |
| `wilaya` | text | Wilaya name |
| `wilaya_code` | int | Wilaya code (1-58) |
| `address` | text | Full address |
| `delivery_type` | text | "office" / "home" |
| `subtotal` | decimal | Items total |
| `shipping_cost` | decimal | Delivery fee |
| `discount` | decimal | Coupon discount |
| `total` | decimal | Final amount (COD) |
| `coupon_code` | text | Applied coupon (nullable) |
| `status` | text | pending/confirmed/shipped/delivered/cancelled |
| `notes` | text | Customer notes |
| `admin_notes` | text | Internal notes |
| `created_at` | timestamptz | Order time |
| `updated_at` | timestamptz | Last status change |

### order_items
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `order_id` | uuid | FK to orders |
| `product_id` | uuid | FK to products |
| `variant_id` | uuid | FK to product_variants (nullable) |
| `product_name` | text | Snapshot of product name |
| `variant_name` | text | Snapshot of variant name |
| `image_url` | text | Snapshot of product image |
| `quantity` | int | Quantity ordered |
| `unit_price` | decimal | Price at order time |
| `total` | decimal | quantity × unit_price |

### shipping_rates
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `wilaya_code` | int | Wilaya code (1-58) |
| `wilaya_name` | text | Wilaya name (Arabic) |
| `office_price` | decimal | Delivery to office (DZD) |
| `home_price` | decimal | Delivery to home (DZD) |
| `is_active` | boolean | Delivery available |
| `estimated_days` | int | Estimated delivery days |

### carts
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `session_id` | text | Browser session ID |
| `created_at` | timestamptz | Cart creation |
| `updated_at` | timestamptz | Last update |

### cart_items
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `cart_id` | uuid | FK to carts |
| `product_id` | uuid | FK to products |
| `variant_id` | uuid | FK to product_variants (nullable) |
| `quantity` | int | Quantity in cart |

### abandoned_carts
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `cart_id` | uuid | FK to carts |
| `customer_name` | text | Entered name |
| `customer_phone` | text | Entered phone |
| `wilaya` | text | Selected wilaya |
| `address` | text | Entered address |
| `items_snapshot` | jsonb | Cart items at abandonment |
| `subtotal` | decimal | Cart total |
| `created_at` | timestamptz | Abandonment time |
| `is_recovered` | boolean | Converted to order |

### coupons
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `code` | text | Coupon code (unique) |
| `type` | text | "percent" / "fixed" |
| `value` | decimal | Discount value |
| `min_order` | decimal | Minimum order amount |
| `max_uses` | int | Usage limit |
| `used_count` | int | Times used |
| `starts_at` | timestamptz | Valid from |
| `expires_at` | timestamptz | Valid until |
| `product_ids` | uuid[] | Specific products (nullable) |
| `category_ids` | uuid[] | Specific categories (nullable) |
| `is_active` | boolean | Active/Inactive |

### reviews
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `product_id` | uuid | FK to products |
| `order_id` | uuid | FK to orders (optional) |
| `customer_name` | text | Reviewer name |
| `rating` | int | 1-5 stars |
| `comment` | text | Review text |
| `images` | text[] | Up to 3 image URLs |
| `status` | text | pending/approved/rejected/hidden |
| `created_at` | timestamptz | Review time |

### banners
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | Banner title |
| `image_url` | text | Cloudflare Image URL |
| `link` | text | Click destination |
| `sort_order` | int | Display order |
| `is_active` | boolean | Show/hide |
| `starts_at` | timestamptz | Show from |
| `ends_at` | timestamptz | Show until |

### settings
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `key` | text | Setting key (unique) |
| `value` | jsonb | Setting value |

**Example settings keys:**
- `store_name` → "متجرنا"
- `store_logo` → "https://..."
- `support_phone` → "+213..."
- `support_email` → "support@..."
- `social_links` → `{"facebook": "...", "instagram": "..."}`
- `footer_text` → "جميع الحقوق محفوظة..."

### upsell_rules
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Rule name |
| `type` | text | "upsell" / "downsell" / "cross_sell" |
| `trigger_type` | text | "product" / "category" / "cart_total" |
| `trigger_ids` | uuid[] | Trigger product/category IDs |
| `offer_product_ids` | uuid[] | Products to suggest |
| `discount_percent` | decimal | Special discount (optional) |
| `show_on` | text | "product_page" / "checkout" / "both" |
| `is_active` | boolean | Active/Inactive |

---

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_published ON products(is_published);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_phone ON orders(customer_phone);
CREATE INDEX idx_shipping_wilaya ON shipping_rates(wilaya_code);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_status ON reviews(status);
```

---

## Data Types Used

- **uuid**: For all primary keys (auto-generated)
- **text**: For strings (Arabic-friendly)
- **decimal(10,2)**: For prices in DZD
- **int**: For quantities, codes
- **boolean**: For flags
- **timestamptz**: For timestamps (with timezone)
- **jsonb**: For flexible data (settings, snapshots)
- **text[]** / **uuid[]**: For arrays
