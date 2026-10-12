import { corsHeaders, json, readBody, verifyCaptcha } from '../_shared/http.ts';
// Diagnostic endpoint only. A successful response does not authorize writes.
// Supabase Auth verifies sign-up tokens; send-email verifies its own fresh token.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const secret = Deno.env.get('HCAPTCHA_SECRET_KEY');
  const siteKey = Deno.env.get('HCAPTCHA_SITE_KEY');
  if (!secret || !siteKey)
    return json({ error: 'Security check unavailable' }, 503);
  let body;
  try {
    body = await readBody(req);
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  try {
    const success = await verifyCaptcha(body.token, secret, siteKey);
    return success
      ? json({ success: true })
      : json({ error: 'Invalid security check' }, 400);
  } catch {
    return json({ error: 'Security check unavailable' }, 502);
  }
});
