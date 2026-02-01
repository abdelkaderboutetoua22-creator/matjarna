export interface Env {
  CF_ACCOUNT_ID?: string;
  CF_IMAGES_API_TOKEN?: string;
  CF_IMAGE_DELIVERY_URL?: string;

  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
}

type Json = Record<string, unknown>;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const inMemoryRate = new Map<string, { count: number; resetAt: number }>();

function json(data: Json, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function rateLimitOrThrow(request: Request): void {
  const ip = getClientIp(request);
  const now = Date.now();
  const existing = inMemoryRate.get(ip);

  if (!existing || existing.resetAt <= now) {
    inMemoryRate.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  existing.count += 1;
  if (existing.count > RATE_LIMIT_MAX) {
    throw new Error("RATE_LIMITED");
  }
}

async function supabaseAuthGetUser(env: Env, accessToken: string) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;

  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; email?: string }>;
}

async function supabaseRest(
  env: Env,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(
      {
        error: "SERVER_ENV_MISSING",
        message:
          "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment.",
      },
      500
    );
  }

  const url = `${env.SUPABASE_URL}/rest/v1${path}`;

  const headers: HeadersInit = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "content-type": "application/json",
    ...init.headers,
  };

  return fetch(url, { ...init, headers });
}

async function requireAdmin(env: Env, accessToken: string) {
  const user = await supabaseAuthGetUser(env, accessToken);
  if (!user) return { ok: false as const, status: 401, error: "UNAUTHORIZED" };

  const res = await supabaseRest(
    env,
    `/admin_profiles?select=id,role,user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
    { method: "GET" }
  );

  if (!res.ok) {
    return { ok: false as const, status: 500, error: "SUPABASE_QUERY_FAILED" };
  }

  const rows = (await res.json()) as Array<{ id: string; role: string; user_id: string }>;
  if (!rows?.length) {
    return { ok: false as const, status: 403, error: "FORBIDDEN" };
  }

  return { ok: true as const, userId: user.id };
}

async function uploadToCloudflareImages(env: Env, file: Blob) {
  if (!env.CF_ACCOUNT_ID || !env.CF_IMAGES_API_TOKEN) {
    return {
      ok: false as const,
      status: 500,
      error: "CF_ENV_MISSING",
      message:
        "Missing CF_ACCOUNT_ID or CF_IMAGES_API_TOKEN in server environment.",
    };
  }

  const cfForm = new FormData();
  cfForm.append("file", file);

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CF_IMAGES_API_TOKEN}`,
      },
      body: cfForm,
    }
  );

  const jsonBody = (await res.json()) as any;
  if (!res.ok || !jsonBody?.success) {
    return {
      ok: false as const,
      status: 502,
      error: "CF_UPLOAD_FAILED",
      message: jsonBody?.errors?.[0]?.message || "Cloudflare upload failed",
      details: jsonBody,
    };
  }

  const imageId = jsonBody.result?.id as string;
  const variants = (jsonBody.result?.variants || []) as string[];

  // Prefer first returned variant URL, fallback to delivery URL if provided
  const imageUrl =
    variants?.[0] ||
    (env.CF_IMAGE_DELIVERY_URL && imageId
      ? `${env.CF_IMAGE_DELIVERY_URL}/${imageId}/public`
      : "");

  return {
    ok: true as const,
    imageId,
    imageUrl,
    variants,
    raw: jsonBody.result,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    rateLimitOrThrow(request);
  } catch (e) {
    return json(
      {
        error: "RATE_LIMITED",
        message: "Too many requests. Please retry later.",
      },
      429,
      { "retry-after": "60" }
    );
  }

  const authHeader = request.headers.get("authorization") || "";
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const accessToken = tokenMatch?.[1];
  if (!accessToken) {
    return json({ error: "UNAUTHORIZED", message: "Missing Bearer token" }, 401);
  }

  // Verify admin
  const adminCheck = await requireAdmin(env, accessToken);
  if (!adminCheck.ok) {
    return json({ error: adminCheck.error }, adminCheck.status);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "BAD_REQUEST", message: "Expected multipart/form-data" }, 400);
  }

  const file = form.get("file");
  const productId = String(form.get("productId") || "").trim();
  const makePrimary = String(form.get("isPrimary") || "false") === "true";

  if (!(file instanceof Blob)) {
    return json({ error: "BAD_REQUEST", message: "Missing file" }, 400);
  }
  if (!productId) {
    return json({ error: "BAD_REQUEST", message: "Missing productId" }, 400);
  }

  // Upload to Cloudflare
  const cf = await uploadToCloudflareImages(env, file);
  if (!cf.ok) {
    return json({ error: cf.error, message: cf.message, details: cf.details }, cf.status);
  }

  // If requested, clear old primaries first
  if (makePrimary) {
    await supabaseRest(env, `/product_images?product_id=eq.${encodeURIComponent(productId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ is_primary: false }),
    });
  }

  // Compute next position
  let nextPos = 0;
  const posRes = await supabaseRest(
    env,
    `/product_images?select=position&product_id=eq.${encodeURIComponent(productId)}&order=position.desc&limit=1`,
    { method: "GET" }
  );

  if (posRes.ok) {
    const rows = (await posRes.json()) as Array<{ position: number }>;
    const maxPos = rows?.[0]?.position;
    if (typeof maxPos === "number") nextPos = maxPos + 1;
  }

  // Insert DB row
  const insertRes = await supabaseRest(env, `/product_images`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
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
    return json(
      {
        error: "SUPABASE_INSERT_FAILED",
        message: errText,
        cf_image_id: cf.imageId,
        image_url: cf.imageUrl,
      },
      500
    );
  }

  const inserted = await insertRes.json();
  return json({ ok: true, image: inserted?.[0] ?? inserted, cf: { id: cf.imageId } });
};
