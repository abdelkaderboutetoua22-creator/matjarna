-- Matjarna E-commerce RPC Functions
-- Migration 004: Server-side helper functions

-- ============================================
-- Coupon usage increment (for server-side order creation)
-- ============================================
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Basic phone normalization (optional helper)
-- ============================================
CREATE OR REPLACE FUNCTION normalize_dz_phone(input_phone TEXT)
RETURNS TEXT AS $$
DECLARE
  p TEXT;
BEGIN
  p := regexp_replace(coalesce(input_phone, ''), '\\s+', '', 'g');
  -- Normalize +213/213 to leading 0 when possible
  IF p LIKE '+213%' THEN
    p := '0' || substring(p from 5);
  ELSIF p LIKE '213%' THEN
    p := '0' || substring(p from 4);
  END IF;
  RETURN p;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
