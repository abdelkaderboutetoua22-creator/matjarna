# 📊 Matjarna Tracking Events Specification

## Overview

Matjarna tracks user behavior across three platforms:
1. **Facebook Pixel + Conversions API**
2. **TikTok Pixel + Events API**
3. **Google Analytics 4**

---

## Event Reference

### 1. PageView
**Trigger**: Every page load

| Platform | Event Name | Parameters |
|----------|------------|------------|
| Facebook | `PageView` | - |
| TikTok | `PageView` | - |
| GA4 | `page_view` | `page_title`, `page_location` |

```typescript
// Implementation
trackPageView({
  page_title: document.title,
  page_location: window.location.href
});
```

---

### 2. ViewContent (View Product)
**Trigger**: Product page view

| Platform | Event Name | Parameters |
|----------|------------|------------|
| Facebook | `ViewContent` | `content_ids`, `content_type`, `content_name`, `value`, `currency` |
| TikTok | `ViewContent` | `content_id`, `content_type`, `content_name`, `price`, `currency` |
| GA4 | `view_item` | `items[]`, `value`, `currency` |

```typescript
// Implementation
trackViewContent({
  content_id: product.id,
  content_name: product.name,
  content_type: 'product',
  value: product.salePrice || product.price,
  currency: 'DZD',
  content_category: product.categoryName
});
```

**Example payload:**
```json
{
  "event": "ViewContent",
  "content_ids": ["prod_abc123"],
  "content_type": "product",
  "content_name": "قميص رياضي أزرق",
  "value": 2500,
  "currency": "DZD"
}
```

---

### 3. AddToCart
**Trigger**: User adds product to cart

| Platform | Event Name | Parameters |
|----------|------------|------------|
| Facebook | `AddToCart` | `content_ids`, `content_type`, `content_name`, `value`, `currency`, `num_items` |
| TikTok | `AddToCart` | `content_id`, `content_type`, `price`, `quantity`, `currency` |
| GA4 | `add_to_cart` | `items[]`, `value`, `currency` |

```typescript
// Implementation
trackAddToCart({
  content_id: product.id,
  content_name: product.name,
  content_type: 'product',
  value: (product.salePrice || product.price) * quantity,
  currency: 'DZD',
  quantity: quantity,
  variant: selectedVariant?.name
});
```

**Example payload:**
```json
{
  "event": "AddToCart",
  "content_ids": ["prod_abc123"],
  "content_type": "product",
  "content_name": "قميص رياضي أزرق",
  "value": 5000,
  "currency": "DZD",
  "num_items": 2
}
```

---

### 4. InitiateCheckout
**Trigger**: User starts checkout process (opens checkout page or enters first field)

| Platform | Event Name | Parameters |
|----------|------------|------------|
| Facebook | `InitiateCheckout` | `content_ids`, `num_items`, `value`, `currency` |
| TikTok | `InitiateCheckout` | `content_ids`, `value`, `currency` |
| GA4 | `begin_checkout` | `items[]`, `value`, `currency` |

```typescript
// Implementation
trackInitiateCheckout({
  content_ids: cart.items.map(i => i.productId),
  num_items: cart.items.reduce((sum, i) => sum + i.quantity, 0),
  value: cart.subtotal,
  currency: 'DZD'
});
```

---

### 5. AddPaymentInfo
**Trigger**: User completes checkout form (before submit)

| Platform | Event Name | Parameters |
|----------|------------|------------|
| Facebook | `AddPaymentInfo` | `content_ids`, `value`, `currency` |
| TikTok | `AddPaymentInfo` | `value`, `currency` |
| GA4 | `add_payment_info` | `items[]`, `value`, `currency`, `payment_type` |

```typescript
// Implementation (for COD)
trackAddPaymentInfo({
  content_ids: cart.items.map(i => i.productId),
  value: cart.total,
  currency: 'DZD',
  payment_type: 'cod' // Cash on Delivery
});
```

---

### 6. Purchase
**Trigger**: Order successfully created

| Platform | Event Name | Parameters |
|----------|------------|------------|
| Facebook | `Purchase` | `content_ids`, `content_type`, `value`, `currency`, `num_items`, `order_id` |
| TikTok | `PlaceAnOrder` | `content_ids`, `value`, `currency`, `quantity` |
| GA4 | `purchase` | `transaction_id`, `value`, `currency`, `items[]`, `shipping` |

```typescript
// Implementation
trackPurchase({
  order_id: order.orderNumber,
  content_ids: order.items.map(i => i.productId),
  content_type: 'product',
  value: order.total,
  currency: 'DZD',
  num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
  shipping: order.shippingCost
});
```

**Example payload:**
```json
{
  "event": "Purchase",
  "order_id": "MAT-2024-001234",
  "content_ids": ["prod_abc123", "prod_xyz789"],
  "content_type": "product",
  "value": 7500,
  "currency": "DZD",
  "num_items": 3
}
```

---

## Implementation Code

### Tracking Service

```typescript
// src/lib/tracking.ts

type TrackingEvent = 
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase';

interface TrackingParams {
  content_id?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  quantity?: number;
  num_items?: number;
  order_id?: string;
  payment_type?: string;
  shipping?: number;
  [key: string]: any;
}

class TrackingService {
  private fbPixelId = import.meta.env.VITE_FB_PIXEL_ID;
  private tiktokPixelId = import.meta.env.VITE_TIKTOK_PIXEL_ID;
  private gaId = import.meta.env.VITE_GA_ID;

  init() {
    this.initFacebookPixel();
    this.initTikTokPixel();
    this.initGoogleAnalytics();
  }

  private initFacebookPixel() {
    if (!this.fbPixelId) return;
    
    // Facebook Pixel base code
    (function(f: any, b, e, v, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', this.fbPixelId);
  }

  private initTikTokPixel() {
    if (!this.tiktokPixelId) return;
    
    // TikTok Pixel base code
    (function(w: any, d, t) {
      w.TiktokAnalyticsObject = t;
      var ttq = w[t] = w[t] || [];
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
      ttq.setAndDefer = function(t: any, e: any) {
        t[e] = function() {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function(t: any) {
        var e = ttq._i[t] || [];
        for (var n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
        return e;
      };
      ttq.load = function(e: any, n: any) {
        var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = i;
        ttq._t = ttq._t || {};
        ttq._t[e] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[e] = n || {};
        var o = document.createElement('script');
        o.type = 'text/javascript';
        o.async = true;
        o.src = i + '?sdkid=' + e + '&lib=' + t;
        var a = document.getElementsByTagName('script')[0];
        a.parentNode!.insertBefore(o, a);
      };
      ttq.load(this.tiktokPixelId);
      ttq.page();
    })(window, document, 'ttq');
  }

  private initGoogleAnalytics() {
    if (!this.gaId) return;
    
    // Google Analytics 4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(arguments);
    }
    (window as any).gtag = gtag;
    gtag('js', new Date());
    gtag('config', this.gaId);
  }

  track(event: TrackingEvent, params: TrackingParams = {}) {
    console.log(`[Tracking] ${event}`, params);
    
    this.trackFacebook(event, params);
    this.trackTikTok(event, params);
    this.trackGA(event, params);
  }

  private trackFacebook(event: TrackingEvent, params: TrackingParams) {
    if (!this.fbPixelId || !window.fbq) return;
    
    const fbParams: any = {
      currency: params.currency || 'DZD'
    };

    if (params.content_ids) fbParams.content_ids = params.content_ids;
    if (params.content_id) fbParams.content_ids = [params.content_id];
    if (params.content_name) fbParams.content_name = params.content_name;
    if (params.content_type) fbParams.content_type = params.content_type;
    if (params.value) fbParams.value = params.value;
    if (params.num_items) fbParams.num_items = params.num_items;

    window.fbq('track', event, fbParams);
  }

  private trackTikTok(event: TrackingEvent, params: TrackingParams) {
    if (!this.tiktokPixelId || !window.ttq) return;
    
    const ttEvent = event === 'Purchase' ? 'PlaceAnOrder' : event;
    
    const ttParams: any = {
      currency: params.currency || 'DZD'
    };

    if (params.content_ids) ttParams.contents = params.content_ids.map(id => ({ content_id: id }));
    if (params.content_id) ttParams.contents = [{ content_id: params.content_id }];
    if (params.value) ttParams.value = params.value;
    if (params.quantity) ttParams.quantity = params.quantity;

    window.ttq.track(ttEvent, ttParams);
  }

  private trackGA(event: TrackingEvent, params: TrackingParams) {
    if (!this.gaId || !window.gtag) return;
    
    const gaEventMap: Record<TrackingEvent, string> = {
      'PageView': 'page_view',
      'ViewContent': 'view_item',
      'AddToCart': 'add_to_cart',
      'InitiateCheckout': 'begin_checkout',
      'AddPaymentInfo': 'add_payment_info',
      'Purchase': 'purchase'
    };

    const gaEvent = gaEventMap[event];
    const gaParams: any = {
      currency: params.currency || 'DZD'
    };

    if (params.value) gaParams.value = params.value;
    if (params.order_id) gaParams.transaction_id = params.order_id;
    if (params.shipping) gaParams.shipping = params.shipping;
    
    if (params.content_ids || params.content_id) {
      gaParams.items = (params.content_ids || [params.content_id]).map((id, i) => ({
        item_id: id,
        item_name: params.content_name || `Product ${i + 1}`,
        quantity: params.quantity || 1
      }));
    }

    window.gtag('event', gaEvent, gaParams);
  }
}

export const tracking = new TrackingService();

// Type declarations
declare global {
  interface Window {
    fbq: any;
    ttq: any;
    gtag: any;
  }
}
```

---

## Environment Variables

```env
# Facebook
VITE_FB_PIXEL_ID=123456789012345

# TikTok
VITE_TIKTOK_PIXEL_ID=ABCDEFGHIJK123

# Google Analytics
VITE_GA_ID=G-XXXXXXXXXX
```

---

## Verification

### Facebook Pixel

1. Install [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/) extension
2. Visit your site
3. Check that events fire correctly
4. Verify in [Events Manager](https://business.facebook.com/events_manager)

### TikTok Pixel

1. Install [TikTok Pixel Helper](https://chrome.google.com/webstore/detail/tiktok-pixel-helper/)
2. Visit your site
3. Check events in TikTok Ads Manager > Events

### Google Analytics

1. Use [GA4 DebugView](https://analytics.google.com) (Realtime > Debug)
2. Or install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/)
3. Check events in GA4 Reports

---

## Server-Side Tracking (Advanced)

For more accurate tracking, especially for Purchase events, consider implementing server-side tracking:

### Facebook Conversions API

```typescript
// Server-side (Edge Function or API route)
async function sendFacebookConversion(eventData: any) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data: {
            ph: hashPhone(eventData.phone), // SHA256 hash
            country: 'dz'
          },
          custom_data: {
            currency: 'DZD',
            value: eventData.total,
            order_id: eventData.orderId
          }
        }]
      })
    }
  );
  return response.json();
}
```

### TikTok Events API

```typescript
// Server-side
async function sendTikTokEvent(eventData: any) {
  const response = await fetch(
    'https://business-api.tiktok.com/open_api/v1.3/pixel/track/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': TIKTOK_ACCESS_TOKEN
      },
      body: JSON.stringify({
        pixel_code: TIKTOK_PIXEL_ID,
        event: 'PlaceAnOrder',
        event_id: eventData.orderId,
        timestamp: new Date().toISOString(),
        context: {
          user: {
            phone_number: hashPhone(eventData.phone)
          }
        },
        properties: {
          currency: 'DZD',
          value: eventData.total,
          contents: eventData.items.map((i: any) => ({
            content_id: i.productId,
            quantity: i.quantity,
            price: i.unitPrice
          }))
        }
      })
    }
  );
  return response.json();
}
```

---

## Data Privacy Note

When implementing tracking:
- Only track necessary data
- Hash PII (phone numbers, emails) before sending
- Include a privacy policy on your site
- Consider adding a cookie consent banner for GDPR compliance
