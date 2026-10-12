export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
export function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get('content-type')?.includes('application/json'))
    throw new Error('Invalid request');
  const reader = req.body?.getReader();
  if (!reader) throw new Error('Invalid request');
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.length;
    if (length > 16384) {
      await reader.cancel();
      throw new Error('Request too large');
    }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const body = JSON.parse(new TextDecoder().decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new Error('Invalid request');
  return body;
}
export async function verifyCaptcha(
  token: unknown,
  secret: string,
  siteKey: string,
  fetcher = fetch
) {
  if (
    typeof token !== 'string' ||
    !token ||
    token.length > 8192 ||
    !secret ||
    !siteKey
  )
    return false;
  const response = await fetcher('https://api.hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, sitekey: siteKey, response: token }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
}
