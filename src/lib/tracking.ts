/**
 * Matjarna Tracking System
 * Supports: Facebook Pixel, TikTok Pixel, Google Analytics 4
 * 
 * Events:
 * - page_view: User views a page
 * - view_item: User views a product
 * - add_to_cart: User adds item to cart
 * - remove_from_cart: User removes item from cart
 * - begin_checkout: User starts checkout
 * - add_shipping_info: User adds shipping details
 * - add_payment_info: User adds payment info (COD)
 * - purchase: Order completed
 * - search: User searches products
 */

// Types
interface ProductData {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  category?: string;
  quantity?: number;
  variant?: string;
}

interface OrderData {
  orderId: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount?: number;
  coupon?: string;
  currency: string;
  items: ProductData[];
  customer: {
    name: string;
    phone: string;
    wilaya: string;
  };
}

interface TrackingConfig {
  fbPixelId?: string;
  tiktokPixelId?: string;
  gaId?: string;
  enabled: boolean;
}

// Get config from environment
const getConfig = (): TrackingConfig => ({
  fbPixelId: import.meta.env.VITE_FB_PIXEL_ID,
  tiktokPixelId: import.meta.env.VITE_TIKTOK_PIXEL_ID,
  gaId: import.meta.env.VITE_GA_ID,
  enabled: typeof window !== 'undefined',
});

// ============================================
// Facebook Pixel
// ============================================
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
    ttq: {
      track: (...args: unknown[]) => void;
      page: () => void;
      identify: (data: Record<string, unknown>) => void;
    };
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const initFacebookPixel = (pixelId: string) => {
  if (typeof window === 'undefined' || typeof window.fbq === 'function') return;

  const f = window;
  const b = document;
  const e = 'script';
  
  /* eslint-disable @typescript-eslint/no-explicit-any */
  (f as any).fbq = function() {
    (f as any).fbq.callMethod 
      ? (f as any).fbq.callMethod.apply((f as any).fbq, arguments) 
      : (f as any).fbq.queue.push(arguments);
  };
  
  if (!(f as any)._fbq) (f as any)._fbq = (f as any).fbq;
  (f as any).fbq.push = (f as any).fbq;
  (f as any).fbq.loaded = true;
  (f as any).fbq.version = '2.0';
  (f as any).fbq.queue = [];
  /* eslint-enable @typescript-eslint/no-explicit-any */
  
  const n = b.createElement(e) as HTMLScriptElement;
  n.async = true;
  n.src = 'https://connect.facebook.net/en_US/fbevents.js';
  
  const s = b.getElementsByTagName(e)[0];
  s.parentNode?.insertBefore(n, s);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).fbq('init', pixelId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).fbq('track', 'PageView');
};

const fbTrack = (event: string, data?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', event, data);
  }
};

// ============================================
// TikTok Pixel
// ============================================
const initTikTokPixel = (pixelId: string) => {
  if (typeof window === 'undefined' || typeof (window as any).ttq !== 'undefined') return;

  const script = document.createElement('script');
  script.innerHTML = `
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
      ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
      ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
      for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
      ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
      ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
      ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");
      o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
      var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('${pixelId}');
      ttq.page();
    }(window, document, 'ttq');
  `;
  document.head.appendChild(script);
};

const ttqTrack = (event: string, data?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && (window as any).ttq) {
    (window as any).ttq.track(event, data);
  }
};

// ============================================
// Google Analytics 4
// ============================================
const initGoogleAnalytics = (measurementId: string) => {
  if (typeof window === 'undefined' || typeof (window as any).gtag === 'function') return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = function() {
    // eslint-disable-next-line prefer-rest-params
    (window as any).dataLayer.push(arguments);
  };
  (window as any).gtag('js', new Date());
  (window as any).gtag('config', measurementId);
};

const gaTrack = (event: string, data?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, data);
  }
};

// ============================================
// Unified Tracking API
// ============================================

let initialized = false;

export const initTracking = () => {
  if (initialized) return;
  
  const config = getConfig();
  if (!config.enabled) return;

  if (config.fbPixelId) {
    initFacebookPixel(config.fbPixelId);
    console.log('[Tracking] Facebook Pixel initialized');
  }

  if (config.tiktokPixelId) {
    initTikTokPixel(config.tiktokPixelId);
    console.log('[Tracking] TikTok Pixel initialized');
  }

  if (config.gaId) {
    initGoogleAnalytics(config.gaId);
    console.log('[Tracking] Google Analytics initialized');
  }

  initialized = true;
};

export const trackPageView = (pagePath?: string) => {
  const config = getConfig();
  const path = pagePath || window.location.pathname;

  if (config.fbPixelId) {
    fbTrack('PageView');
  }

  if (config.tiktokPixelId && (window as any).ttq) {
    (window as any).ttq.page();
  }

  if (config.gaId) {
    gaTrack('page_view', { page_path: path });
  }
};

export const trackViewItem = (product: ProductData) => {
  const config = getConfig();
  const price = product.salePrice || product.price;

  // Facebook
  if (config.fbPixelId) {
    fbTrack('ViewContent', {
      content_type: 'product',
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      value: price,
      currency: 'DZD',
    });
  }

  // TikTok
  if (config.tiktokPixelId) {
    ttqTrack('ViewContent', {
      content_type: 'product',
      content_id: product.id,
      content_name: product.name,
      content_category: product.category,
      price: price,
      currency: 'DZD',
    });
  }

  // Google Analytics
  if (config.gaId) {
    gaTrack('view_item', {
      currency: 'DZD',
      value: price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: price,
        quantity: 1,
      }],
    });
  }
};

export const trackAddToCart = (product: ProductData) => {
  const config = getConfig();
  const price = product.salePrice || product.price;
  const quantity = product.quantity || 1;

  // Facebook
  if (config.fbPixelId) {
    fbTrack('AddToCart', {
      content_type: 'product',
      content_ids: [product.id],
      content_name: product.name,
      value: price * quantity,
      currency: 'DZD',
      contents: [{ id: product.id, quantity }],
    });
  }

  // TikTok
  if (config.tiktokPixelId) {
    ttqTrack('AddToCart', {
      content_type: 'product',
      content_id: product.id,
      content_name: product.name,
      price: price,
      quantity: quantity,
      value: price * quantity,
      currency: 'DZD',
    });
  }

  // Google Analytics
  if (config.gaId) {
    gaTrack('add_to_cart', {
      currency: 'DZD',
      value: price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: price,
        quantity: quantity,
        item_variant: product.variant,
      }],
    });
  }
};

export const trackRemoveFromCart = (product: ProductData) => {
  const config = getConfig();
  const price = product.salePrice || product.price;

  // Google Analytics only (FB/TikTok don't have this event)
  if (config.gaId) {
    gaTrack('remove_from_cart', {
      currency: 'DZD',
      value: price * (product.quantity || 1),
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: price,
        quantity: product.quantity || 1,
      }],
    });
  }
};

export const trackBeginCheckout = (items: ProductData[], total: number) => {
  const config = getConfig();

  // Facebook
  if (config.fbPixelId) {
    fbTrack('InitiateCheckout', {
      content_type: 'product',
      content_ids: items.map(i => i.id),
      num_items: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
      value: total,
      currency: 'DZD',
    });
  }

  // TikTok
  if (config.tiktokPixelId) {
    ttqTrack('InitiateCheckout', {
      content_type: 'product',
      contents: items.map(i => ({
        content_id: i.id,
        content_name: i.name,
        quantity: i.quantity || 1,
        price: i.salePrice || i.price,
      })),
      value: total,
      currency: 'DZD',
    });
  }

  // Google Analytics
  if (config.gaId) {
    gaTrack('begin_checkout', {
      currency: 'DZD',
      value: total,
      items: items.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.salePrice || i.price,
        quantity: i.quantity || 1,
      })),
    });
  }
};

export const trackAddShippingInfo = (items: ProductData[], shippingCost: number, wilaya: string) => {
  const config = getConfig();

  // Google Analytics
  if (config.gaId) {
    gaTrack('add_shipping_info', {
      currency: 'DZD',
      value: shippingCost,
      shipping_tier: wilaya,
      items: items.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.salePrice || i.price,
        quantity: i.quantity || 1,
      })),
    });
  }
};

export const trackAddPaymentInfo = (items: ProductData[], total: number) => {
  const config = getConfig();

  // Facebook - AddPaymentInfo
  if (config.fbPixelId) {
    fbTrack('AddPaymentInfo', {
      content_type: 'product',
      content_ids: items.map(i => i.id),
      value: total,
      currency: 'DZD',
    });
  }

  // TikTok - AddPaymentInfo
  if (config.tiktokPixelId) {
    ttqTrack('AddPaymentInfo', {
      content_type: 'product',
      value: total,
      currency: 'DZD',
    });
  }

  // Google Analytics
  if (config.gaId) {
    gaTrack('add_payment_info', {
      currency: 'DZD',
      value: total,
      payment_type: 'COD',
      items: items.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.salePrice || i.price,
        quantity: i.quantity || 1,
      })),
    });
  }
};

export const trackPurchase = (order: OrderData) => {
  const config = getConfig();

  // Facebook
  if (config.fbPixelId) {
    fbTrack('Purchase', {
      content_type: 'product',
      content_ids: order.items.map(i => i.id),
      contents: order.items.map(i => ({
        id: i.id,
        quantity: i.quantity || 1,
      })),
      num_items: order.items.reduce((sum, i) => sum + (i.quantity || 1), 0),
      value: order.total,
      currency: order.currency,
    });
  }

  // TikTok
  if (config.tiktokPixelId) {
    ttqTrack('CompletePayment', {
      content_type: 'product',
      contents: order.items.map(i => ({
        content_id: i.id,
        content_name: i.name,
        quantity: i.quantity || 1,
        price: i.salePrice || i.price,
      })),
      value: order.total,
      currency: order.currency,
    });
  }

  // Google Analytics
  if (config.gaId) {
    gaTrack('purchase', {
      transaction_id: order.orderNumber,
      value: order.total,
      currency: order.currency,
      tax: 0,
      shipping: order.shipping,
      coupon: order.coupon,
      items: order.items.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.salePrice || i.price,
        quantity: i.quantity || 1,
        item_category: i.category,
      })),
    });
  }
};

export const trackSearch = (query: string, resultsCount?: number) => {
  const config = getConfig();

  // Facebook
  if (config.fbPixelId) {
    fbTrack('Search', {
      search_string: query,
      content_category: 'products',
    });
  }

  // TikTok
  if (config.tiktokPixelId) {
    ttqTrack('Search', {
      query: query,
    });
  }

  // Google Analytics
  if (config.gaId) {
    gaTrack('search', {
      search_term: query,
      ...(resultsCount !== undefined && { results_count: resultsCount }),
    });
  }
};

// Export types for use in components
export type { ProductData, OrderData };
