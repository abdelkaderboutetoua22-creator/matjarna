/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CF_ACCOUNT_ID: string;
  readonly VITE_CF_IMAGE_DELIVERY_URL: string;
  readonly VITE_FB_PIXEL_ID: string;
  readonly VITE_TIKTOK_PIXEL_ID: string;
  readonly VITE_GA_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
