-- Matjarna: Fix Admin Profile Access
-- Migration 005: Ensure logged-in users can read their own admin profile
-- This uses SECURITY DEFINER to bypass RLS safely

-- ============================================
-- FUNCTION: Get current user's admin profile (bypasses RLS)
-- Returns NULL if user is not an admin
-- ============================================
CREATE OR REPLACE FUNCTION get_my_admin_profile()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.user_id,
    ap.email,
    ap.name,
    ap.role,
    ap.created_at,
    ap.updated_at
  FROM admin_profiles ap
  WHERE ap.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check if current user is admin (improved version)
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  ) INTO is_admin_user;
  
  RETURN COALESCE(is_admin_user, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Grant execute permissions
-- ============================================
GRANT EXECUTE ON FUNCTION get_my_admin_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============================================
-- OPTIONAL: Drop and recreate admin_profiles SELECT policy
-- to ensure it uses auth.uid() correctly
-- ============================================
DROP POLICY IF EXISTS "Admins can view their own profile" ON admin_profiles;

CREATE POLICY "Authenticated users can view their own admin profile"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
