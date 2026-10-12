import { corsHeaders, json, readBody, verifyCaptcha } from '../_shared/http.ts';
export interface Dependencies {
  env: (name: string) => string | undefined;
  user: (authorization: string) => Promise<string | null>;
  receipt: (
    id: string,
    userId: string
  ) => Promise<{ commitment_id: string } | null>;
  commitment: (
    id: string,
    userId: string
  ) => Promise<{
    commitment_text: string;
    daily_action: string | null;
    days_completed: number;
    status: string;
  } | null>;
  reserve: (
    userId: string,
    receiptId: string,
    recipient: string
  ) => Promise<string | null>;
  mark: (id: string, status: 'accepted' | 'failed') => Promise<void>;
  fetcher: typeof fetch;
}
export function createEmailHandler(deps: Dependencies) {
  return async (req: Request) => {
    if (req.method === 'OPTIONS')
      return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST')
      return json({ error: 'Method not allowed' }, 405);
    const from = deps.env('RESEND_FROM_EMAIL');
    const apiKey = deps.env('RESEND_API_KEY');
    const allowed = (deps.env('RECEIPT_EMAIL_ALLOWLIST') || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (
      !apiKey ||
      !from ||
      !allowed.length ||
      !deps.env('HCAPTCHA_SECRET_KEY') ||
      !deps.env('HCAPTCHA_SITE_KEY')
    )
      return json({ error: 'Email service not configured' }, 503);
    try {
      const authorization = req.headers.get('authorization') || '';
      if (!authorization.startsWith('Bearer '))
        return json({ error: 'Authentication required' }, 401);
      const userId = await deps.user(authorization);
      if (!userId) return json({ error: 'Authentication required' }, 401);
      let body;
      try {
        body = await readBody(req);
      } catch {
        return json({ error: 'Invalid request' }, 400);
      }
      const { to, receiptId, captchaToken } = body;
      if (
        typeof to !== 'string' ||
        to.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)
      )
        return json({ error: 'Invalid recipient email' }, 400);
      if (!allowed.includes(to.toLowerCase()))
        return json(
          { error: 'Recipient is not enabled for receipt delivery' },
          403
        );
      if (
        typeof receiptId !== 'string' ||
        !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(receiptId)
      )
        return json({ error: 'Invalid receipt' }, 400);
      const receipt = await deps.receipt(receiptId, userId);
      if (!receipt) return json({ error: 'Receipt not found' }, 404);
      const commitment = await deps.commitment(receipt.commitment_id, userId);
      if (!commitment) return json({ error: 'Receipt not found' }, 404);
      if (
        !(await verifyCaptcha(
          captchaToken,
          deps.env('HCAPTCHA_SECRET_KEY') || '',
          deps.env('HCAPTCHA_SITE_KEY') || '',
          deps.fetcher
        ))
      )
        return json({ error: 'Complete a new security check' }, 400);
      const reservation = await deps.reserve(
        userId,
        receiptId,
        to.toLowerCase()
      );
      if (!reservation)
        return json(
          { error: 'Receipt already requested or daily email limit reached' },
          429
        );
      const text = [
        'FounderType accountability receipt',
        `Commitment: ${commitment.commitment_text}`,
        `Daily action: ${commitment.daily_action || ''}`,
        `Status: ${commitment.status}`,
        `Recorded check-ins: ${commitment.days_completed}`,
        'This is a snapshot of self-reported progress, not independent verification.',
      ].join('\n\n');
      let accepted = false;
      try {
        const response = await deps.fetcher('https://api.resend.com/emails', {
          method: 'POST',
          signal: AbortSignal.timeout(15000),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': reservation,
          },
          body: JSON.stringify({
            from: `${deps.env('RESEND_FROM_NAME') || 'FounderType'} <${from}>`,
            to: [to],
            subject: 'FounderType accountability receipt',
            text,
          }),
        });
        accepted = response.ok;
        await response.body?.cancel();
      } catch {
        /* Failed attempts still consume their reservation. */
      }
      await deps.mark(reservation, accepted ? 'accepted' : 'failed');
      return accepted
        ? json({ success: true })
        : json({ error: 'Email provider could not accept the receipt' }, 502);
    } catch {
      return json({ error: 'Unable to send receipt' }, 500);
    }
  };
}
