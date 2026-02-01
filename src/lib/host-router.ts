/**
 * Host-based Routing Detection
 * 
 * Since this is a Vite SPA, we use client-side host detection.
 * In production, configure your CDN/reverse proxy to:
 * - Serve the same build to both domains
 * - The app will detect which domain and show appropriate UI
 * 
 * For development:
 * - localhost:5173 -> Storefront
 * - admin.localhost:5173 -> Admin (add to /etc/hosts)
 * 
 * Production setup (Cloudflare/Vercel):
 * - matjarna.com -> Storefront
 * - admin.matjarna.com -> Admin
 */

export type AppMode = 'storefront' | 'admin';

export function detectAppMode(): AppMode {
  const hostname = window.location.hostname;
  
  // Check if it's admin subdomain
  if (
    hostname.startsWith('admin.') ||
    hostname === 'admin-matjarna.com' ||
    // For local development, check URL param or localStorage
    (hostname === 'localhost' && (
      new URLSearchParams(window.location.search).get('mode') === 'admin' ||
      localStorage.getItem('dev_mode') === 'admin'
    ))
  ) {
    return 'admin';
  }
  
  return 'storefront';
}

export function isAdminDomain(): boolean {
  return detectAppMode() === 'admin';
}

export function isStorefrontDomain(): boolean {
  return detectAppMode() === 'storefront';
}

/**
 * Get the base path for the current mode
 * Admin: /dashboard/*
 * Storefront: /*
 */
export function getBasePath(): string {
  return isAdminDomain() ? '/dashboard' : '/';
}

/**
 * Redirect helper for wrong domain access
 */
export function redirectIfWrongDomain(requiredMode: AppMode): boolean {
  const currentMode = detectAppMode();
  
  if (currentMode !== requiredMode) {
    // In production, you would redirect to the correct domain
    // For now, we'll handle this in the router
    console.warn(`Access denied: ${requiredMode} required, but on ${currentMode} domain`);
    return true;
  }
  
  return false;
}

// Development helper: Switch modes
export function setDevMode(mode: AppMode | null): void {
  if (mode) {
    localStorage.setItem('dev_mode', mode);
  } else {
    localStorage.removeItem('dev_mode');
  }
  window.location.reload();
}

// Check if we're in development
export function isDev(): boolean {
  return import.meta.env.DEV;
}
