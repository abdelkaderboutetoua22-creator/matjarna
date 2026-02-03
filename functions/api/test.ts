// Test endpoint to verify Cloudflare Pages Functions are working

export const onRequest: PagesFunction = async (context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  return new Response(JSON.stringify({
    success: true,
    message: 'Cloudflare Pages Functions are working!',
    timestamp: new Date().toISOString(),
    method: context.request.method,
    url: context.request.url,
    hasAuth: !!context.request.headers.get('Authorization'),
  }), {
    status: 200,
    headers,
  });
};
