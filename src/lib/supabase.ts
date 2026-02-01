import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';

// Public client for storefront reads only
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Note: Service role client should NEVER be used in the browser
// All sensitive operations should go through API routes
