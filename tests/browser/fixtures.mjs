const owner = '00000000-0000-4000-8000-000000000001';
export async function installFixtures(
  page,
  { failCreate = false, failCheckIn = false } = {}
) {
  const user = {
    id: owner,
    aud: 'authenticated',
    role: 'authenticated',
    is_anonymous: true,
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  let commitment = null;
  const receipts = [];
  const requests = [];
  const session = {
    user,
    token_type: 'bearer',
    access_token: ['header', 'payload', 'signature'].join('.'),
    refresh_token: 'synthetic-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
  };
  await page.addInitScript(
    (session) =>
      localStorage.setItem(
        'sb-foundertype-auth-token',
        JSON.stringify(session)
      ),
    session
  );
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    if (url.hostname.includes('hcaptcha.com')) {
      // SDK boundary fixture, never a real challenge or provider request.
      if (url.pathname.endsWith('api.js'))
        return route.fulfill({
          contentType: 'application/javascript',
          body: `window.hcaptcha={render:(_element,options)=>{setTimeout(()=>options.callback('synthetic-captcha'),10);return 'fixture-widget'},getResponse:()=> 'synthetic-captcha',getRespKey:()=>'',reset:()=>{},remove:()=>{},execute:()=>{}}; setTimeout(()=>{if(window.hcaptchaOnLoad)window.hcaptchaOnLoad();if(window.hcaptchaOnLoadCallback)window.hcaptchaOnLoadCallback();const cb=${JSON.stringify(url.searchParams.get('onload'))};if(cb&&window[cb])window[cb]();},0);`,
        });
      return route.abort();
    }
    if (url.hostname !== 'foundertype.test') return route.abort();
    const request = route.request();
    const method = request.method();
    const body = request.postDataJSON();
    requests.push({ path: url.pathname, method, body });
    const send = (data, status = 200, count = 0) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: {
          'access-control-allow-origin': '*',
          'content-range': `0-${Math.max(count - 1, 0)}/${count}`,
        },
        body: JSON.stringify(data),
      });
    if (url.pathname === '/auth/v1/user') return send(user);
    if (url.pathname === '/auth/v1/token') return send(session);
    if (url.pathname === '/rest/v1/commitments') {
      if (method === 'DELETE') {
        commitment = null;
        return send(null);
      }
      if (method === 'POST') {
        if (failCreate)
          return send({ message: 'Synthetic offline failure' }, 503);
        commitment = {
          ...body,
          id: '10000000-0000-4000-8000-000000000001',
          user_id: owner,
          status: 'active',
          is_public: true,
          created_at: new Date().toISOString(),
          deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
          check_ins: [],
          days_completed: 0,
          completed_at: null,
          abandoned_at: null,
          edited_at: null,
          abandoned_on_day: null,
        };
        return send(commitment, 201);
      }
      let rows = commitment ? [commitment] : [];
      if (url.searchParams.get('status')?.startsWith('in.')) rows = [];
      if (url.searchParams.get('id')?.startsWith('neq.')) rows = [];
      const single = request.headers().accept?.includes('vnd.pgrst.object');
      return send(single ? rows[0] || null : rows, 200, rows.length);
    }
    if (url.pathname === '/rest/v1/rpc/record_check_in') {
      if (failCheckIn)
        return send({ message: 'Synthetic offline failure' }, 503);
      commitment.check_ins = [new Date().toISOString().slice(0, 10)];
      commitment.days_completed = 1;
      return send(
        request.headers().accept?.includes('vnd.pgrst.object')
          ? commitment
          : [commitment]
      );
    }
    if (url.pathname === '/rest/v1/accountability_receipts') {
      if (method === 'POST') {
        const receipt = { ...body, id: '20000000-0000-4000-8000-000000000001' };
        receipts.unshift(receipt);
        return send(receipt, 201);
      }
      return send(receipts, 200, receipts.length);
    }
    if (url.pathname === '/rest/v1/profiles') return send([], 200, 0);
    return send({ message: 'Unexpected fixture request' }, 400);
  });
  return {
    requests,
    ageCommitment(days) {
      commitment.created_at = new Date(
        Date.now() - days * 86400000
      ).toISOString();
    },
  };
}
