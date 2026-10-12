import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEmailHandler } from '../../supabase/functions/send-email/handler.ts';
import {
  readBody,
  verifyCaptcha,
} from '../../supabase/functions/_shared/http.ts';

const receiptId = '20000000-0000-4000-8000-000000000001';
function fixture(overrides = {}) {
  const calls = [];
  const env = {
    RESEND_FROM_EMAIL: 'noreply@example.com',
    RESEND_API_KEY: 'synthetic-provider-key',
    RECEIPT_EMAIL_ALLOWLIST: 'synthetic@example.com',
    HCAPTCHA_SECRET_KEY: 'synthetic-secret',
    HCAPTCHA_SITE_KEY: 'synthetic-site',
  };
  const deps = {
    env: (name) => env[name],
    user: async () => 'owner',
    receipt: async (_id, owner) =>
      owner === 'owner' ? { commitment_id: 'commitment' } : null,
    commitment: async () => ({
      commitment_text: 'Ship the synthetic demo',
      daily_action: 'Write tests',
      days_completed: 3,
      status: 'active',
    }),
    reserve: async () => {
      calls.push('reserve');
      return 'reservation';
    },
    mark: async (_id, status) => {
      calls.push(status);
    },
    fetcher: async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    },
    ...overrides,
  };
  return { handler: createEmailHandler(deps), calls, env };
}
const request = (body = {}, authorization = 'Bearer synthetic-session') =>
  new Request('http://localhost/send-email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization },
    body: JSON.stringify({
      to: 'synthetic@example.com',
      receiptId,
      captchaToken: 'synthetic-captcha',
      ...body,
    }),
  });

test('email rejects missing authentication before provider contact', async () => {
  const f = fixture();
  assert.equal((await f.handler(request({}, ''))).status, 401);
  assert.equal(f.calls.length, 0);
});
test('email rejects invalid sessions', async () => {
  const f = fixture({ user: async () => null });
  assert.equal((await f.handler(request())).status, 401);
  assert.equal(f.calls.length, 0);
});
test('email rejects recipients outside operator allowlist', async () => {
  const f = fixture();
  assert.equal(
    (await f.handler(request({ to: 'stranger@example.com' }))).status,
    403
  );
  assert.equal(f.calls.length, 0);
});
test('email is disabled without explicit configuration', async () => {
  const f = fixture();
  f.env.RECEIPT_EMAIL_ALLOWLIST = '';
  assert.equal((await f.handler(request())).status, 503);
});
test('email rejects invalid recipient types and receipt IDs', async () => {
  for (const body of [
    { to: 123 },
    { receiptId: 'invalid' },
    { captchaToken: 42 },
  ]) {
    const f = fixture();
    assert.equal((await f.handler(request(body))).status, 400);
    assert.equal(f.calls.length, 0);
  }
});
test('email rejects inaccessible receipts', async () => {
  const f = fixture({ receipt: async () => null });
  assert.equal((await f.handler(request())).status, 404);
  assert.equal(f.calls.length, 0);
});
test('email rejects failed CAPTCHA without reserving or sending', async () => {
  const f = fixture({ fetcher: async () => new Response('{"success":false}') });
  assert.equal((await f.handler(request())).status, 400);
  assert.equal(f.calls.length, 0);
});
test('email respects database reservation failure', async () => {
  const f = fixture({ reserve: async () => null });
  assert.equal((await f.handler(request())).status, 429);
  assert.equal(f.calls.filter((x) => typeof x === 'object').length, 1);
});
test('email content is server-built and reservation precedes provider contact', async () => {
  const f = fixture();
  assert.equal(
    (
      await f.handler(
        request({
          subject: 'Attacker',
          html: '<script>bad</script>',
          text: 'Arbitrary',
        })
      )
    ).status,
    200
  );
  const provider = f.calls.find((x) => x.url?.includes('resend'));
  const body = JSON.parse(provider.init.body);
  assert.equal(body.subject, 'FounderType accountability receipt');
  assert.equal(body.html, undefined);
  assert.ok(body.text.includes('Ship the synthetic demo'));
  assert.ok(!body.text.includes('Arbitrary'));
  assert.ok(f.calls.indexOf('reserve') < f.calls.indexOf(provider));
  assert.equal(f.calls.at(-1), 'accepted');
  assert.equal(provider.init.headers['Idempotency-Key'], 'reservation');
});
test('email does not leak provider errors or credentials', async () => {
  const f = fixture({
    fetcher: async (url) =>
      url.includes('hcaptcha')
        ? new Response('{"success":true}')
        : new Response('private-provider-detail', { status: 403 }),
  });
  const result = await f.handler(request());
  assert.equal(result.status, 502);
  assert.ok(!(await result.text()).includes('private-provider-detail'));
  assert.equal(f.calls.at(-1), 'failed');
});
test('malformed and oversized JSON is rejected', async () => {
  const f = fixture();
  for (const text of ['{', JSON.stringify({ padding: 'x'.repeat(17000) })]) {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: {
        authorization: 'Bearer synthetic',
        'content-type': 'application/json',
      },
      body: text,
    });
    assert.equal((await f.handler(req)).status, 400);
  }
  await assert.rejects(
    readBody(new Request('http://localhost', { method: 'POST', body: '{}' }))
  );
});
test('CAPTCHA tokens are URL encoded and bound to expected site key', async () => {
  let body;
  assert.equal(
    await verifyCaptcha(
      'token&secret=override',
      'secret',
      'site',
      async (_url, init) => {
        body = new URLSearchParams(init.body);
        return new Response('{"success":true}');
      }
    ),
    true
  );
  assert.equal(body.get('response'), 'token&secret=override');
  assert.equal(body.get('secret'), 'secret');
  assert.equal(body.get('sitekey'), 'site');
});
