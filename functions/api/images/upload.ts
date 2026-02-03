/**
 * Cloudflare Pages Function: /api/images/upload
 * Server-side image upload to Cloudflare Images + store in Supabase
 */

export interface Env {
  CF_ACCOUNT_ID?: string;
  CF_IMAGES_API_TOKEN?: string;
  CF_IMAGE_DELIVERY_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
}

type Json = Record<string, unknown>;

// ─────────────────────────────────────────────────────────────
// CORS Headers - Important for cross-origin requests
// ─────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// ─────────────────────────────────────────────────────────────
// Handle OPTIONS (CORS Preflight)
// ─────────────────────────────────────────────────────────────
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { 
    status: 204, 
    headers: corsHeaders 
  });
};

// ─────────────────────────────────────────────────────────────
// Rate Limiting (In-memory, per-worker)
// ─────────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const inMemoryRate = new Map<string, { count: number; resetAt: number }>();

function json(data: Json, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function checkRateLimit(request: Request): boolean {
  const ip = getClientIp(request);
  const now = Date.now();
  const existing = inMemoryRate.get(ip);

  if (!existing || existing.resetAt <= now) {
    inMemoryRate.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  existing.count += 1;
  return existing.count <= RATE_LIMIT_MAX;
}

// ─────────────────────────────────────────────────────────────
// Supabase Auth: Verify JWT and get user
// ─────────────────────────────────────────────────────────────
async function supabaseAuthGetUser(
  env: Env, 
  accessToken: string
): Promise<{ id: string; email?: string } | null> {
  // Check environment
  if (!env.SUPABASE_URL) {
    console.error('[AUTH] Missing SUPABASE_URL');
    return null;
  }

  // Use anon key if available, otherwise service role (not recommended for auth)
  const apiKey = env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey) {
    console.error('[AUTH] Missing SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  try {
    console.log('[AUTH] Verifying token with Supabase...');
    
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('[AUTH] Supabase response status:', res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error('[AUTH] Supabase auth failed:', errText);
      return null;
    }

    const user = await res.json() as { id: string; email?: string };
    console.log('[AUTH] User verified:', user.id);
    return user;
  } catch (err) {
    console.error('[AUTH] Exception:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Supabase REST: Execute queries with Service Role
// ─────────────────────────────────────────────────────────────
async function supabaseRest(
  env: Env,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[DB] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return json(
      {
        error: 'SERVER_ENV_MISSING',
        message: 'Missing Supabase configuration in server environment.',
      },
      500
    );
  }

  const url = `${env.SUPABASE_URL}/rest/v1${path}`;

  const headers: HeadersInit = {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...init.headers,
  };

  return fetch(url, { ...init, headers });
}

// ─────────────────────────────────────────────────────────────
// Check if user is admin
// ─────────────────────────────────────────────────────────────
async function requireAdmin(
  env: Env, 
  accessToken: string
): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string; message: string }
> {
  // Step 1: Verify JWT with Supabase Auth
  const user = await supabaseAuthGetUser(env, accessToken);
  if (!user) {
    return { 
      ok: false, 
      status: 401, 
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired token. Please login again.'
    };
  }

  // Step 2: Check admin_profiles table
  const res = await supabaseRest(
    env,
    `/admin_profiles?select=id,role,user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
    { method: 'GET' }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('[ADMIN] Supabase query failed:', errText);
    return { 
      ok: false, 
      status: 500, 
      error: 'SUPABASE_QUERY_FAILED',
      message: 'Failed to check admin status.'
    };
  }

  const rows = (await res.json()) as Array<{ id: string; role: string; user_id: string }>;
  if (!rows?.length) {
    return { 
      ok: false, 
      status: 403, 
      error: 'FORBIDDEN',
      message: 'User is not an admin. Add user to admin_profiles table.'
    };
  }

  console.log('[ADMIN] User is admin:', user.id, 'role:', rows[0].role);
  return { ok: true, userId: user.id };
}

// ─────────────────────────────────────────────────────────────
// Upload to Cloudflare Images
// ─────────────────────────────────────────────────────────────
async function uploadToCloudflareImages(
  env: Env, 
  file: Blob
): Promise<
  | { ok: true; imageId: string; imageUrl: string; variants: string[] }
  | { ok: false; status: number; error: string; message: string; details?: unknown }
> {
  if (!env.CF_ACCOUNT_ID || !env.CF_IMAGES_API_TOKEN) {
    console.error('[CF] Missing CF_ACCOUNT_ID or CF_IMAGES_API_TOKEN');
    return {
      ok: false,
      status: 500,
      error: 'CF_ENV_MISSING',
      message: 'Missing Cloudflare Images configuration. Add CF_ACCOUNT_ID and CF_IMAGES_API_TOKEN to environment.',
    };
  }

  const cfForm = new FormData();
  cfForm.append('file', file);

  try {
    console.log('[CF] Uploading to Cloudflare Images...');
    
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CF_IMAGES_API_TOKEN}`,
        },
        body: cfForm,
      }
    );

    const jsonBody = (await res.json()) as {
      success: boolean;
      result?: { id: string; variants: string[] };
      errors?: Array<{ message: string }>;
    };

    console.log('[CF] Response:', res.status, jsonBody.success);

    if (!res.ok || !jsonBody?.success) {
      return {
        ok: false,
        status: 502,
        error: 'CF_UPLOAD_FAILED',
        message: jsonBody?.errors?.[0]?.message || 'Cloudflare upload failed',
        details: jsonBody,
      };
    }

    const imageId = jsonBody.result?.id || '';
    const variants = jsonBody.result?.variants || [];

    // Prefer first returned variant URL, fallback to delivery URL
    const imageUrl =
      variants?.[0] ||
      (env.CF_IMAGE_DELIVERY_URL && imageId
        ? `${env.CF_IMAGE_DELIVERY_URL}/${imageId}/public`
        : '');

    console.log('[CF] Upload success:', imageId);
    return { ok: true, imageId, imageUrl, variants };
  } catch (err) {
    console.error('[CF] Exception:', err);
    return {
      ok: false,
      status: 500,
      error: 'CF_EXCEPTION',
      message: String(err),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Main Handler: POST /api/images/upload
// ─────────────────────────────────────────────────────────────
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  console.log('[UPLOAD] Request received');
  console.log('[UPLOAD] Headers:', Object.fromEntries(request.headers.entries()));

  // ─── Check Environment Variables ───
  const envCheck = {
    SUPABASE_URL: !!env.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!env.SUPABASE_SERVICE_ROLE_KEY,
    CF_ACCOUNT_ID: !!env.CF_ACCOUNT_ID,
    CF_IMAGES_API_TOKEN: !!env.CF_IMAGES_API_TOKEN,
  };
  console.log('[UPLOAD] Env check:', envCheck);

  // Check for missing env vars
  const missingEnv = Object.entries(envCheck)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  
  if (missingEnv.length > 0) {
    return json({
      error: 'SERVER_CONFIG_ERROR',
      message: `Missing environment variables: ${missingEnv.join(', ')}`,
      hint: 'Add these in Cloudflare Pages > Settings > Environment Variables',
    }, 500);
  }

  // ─── Rate Limit ───
  if (!checkRateLimit(request)) {
    return json(
      {
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please retry in 60 seconds.',
      },
      429
    );
  }

  // ─── Extract Authorization Header ───
  const authHeader = request.headers.get('authorization') || '';
  console.log('[UPLOAD] Auth header present:', !!authHeader);
  
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const accessToken = tokenMatch?.[1];
  
  if (!accessToken) {
    return json({ 
      error: 'UNAUTHORIZED', 
      message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      hint: 'Make sure the request includes Authorization: Bearer <supabase_access_token>',
      received_auth_header: authHeader ? 'present but invalid format' : 'missing',
    }, 401);
  }

  // ─── Verify Admin ───
  const adminCheck = await requireAdmin(env, accessToken);
  if (!adminCheck.ok) {
    return json({ 
      error: adminCheck.error, 
      message: adminCheck.message 
    }, adminCheck.status);
  }

  // ─── Parse FormData ───
  let form: FormData;
  try {
    form = await request.formData();
  } catch (err) {
    return json({ 
      error: 'BAD_REQUEST', 
      message: 'Expected multipart/form-data body',
      hint: 'Use FormData to send the request',
    }, 400);
  }

  const file = form.get('file');
  const productId = String(form.get('productId') || '').trim();
  const makePrimary = String(form.get('isPrimary') || 'false') === 'true';

  if (!(file instanceof Blob)) {
    return json({ 
      error: 'BAD_REQUEST', 
      message: 'Missing file in form data',
      hint: 'Append file to FormData: formData.append("file", fileBlob)',
    }, 400);
  }
  
  if (!productId) {
    return json({ 
      error: 'BAD_REQUEST', 
      message: 'Missing productId in form data',
      hint: 'Append productId to FormData: formData.append("productId", "uuid")',
    }, 400);
  }

  // ─── Upload to Cloudflare Images ───
  const cf = await uploadToCloudflareImages(env, file);
  if (!cf.ok) {
    return json({ 
      error: cf.error, 
      message: cf.message, 
      details: cf.details 
    }, cf.status);
  }

  // ─── If Primary, Clear Old Primaries ───
  if (makePrimary) {
    await supabaseRest(
      env, 
      `/product_images?product_id=eq.${encodeURIComponent(productId)}`, 
      {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({ is_primary: false }),
      }
    );
  }

  // ─── Compute Next Position ───
  let nextPos = 0;
  const posRes = await supabaseRest(
    env,
    `/product_images?select=position&product_id=eq.${encodeURIComponent(productId)}&order=position.desc&limit=1`,
    { method: 'GET' }
  );

  if (posRes.ok) {
    const rows = (await posRes.json()) as Array<{ position: number }>;
    const maxPos = rows?.[0]?.position;
    if (typeof maxPos === 'number') nextPos = maxPos + 1;
  }

  // ─── Insert into product_images ───
  const insertRes = await supabaseRest(env, `/product_images`, {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      product_id: productId,
      image_url: cf.imageUrl,
      cf_image_id: cf.imageId,
      position: nextPos,
      is_primary: makePrimary,
    }),
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text();
    console.error('[UPLOAD] Insert failed:', errText);
    return json(
      {
        error: 'SUPABASE_INSERT_FAILED',
        message: 'Failed to save image to database',
        details: errText,
        cf_image_id: cf.imageId,
        image_url: cf.imageUrl,
      },
      500
    );
  }

  const inserted = await insertRes.json();
  console.log('[UPLOAD] Success!');
  
  return json({ 
    ok: true, 
    image: Array.isArray(inserted) ? inserted[0] : inserted, 
    cf: { id: cf.imageId, url: cf.imageUrl } 
  });
};
