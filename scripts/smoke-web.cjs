const http = require('node:http');
const https = require('node:https');

const baseUrl =
  process.env.SMOKE_BASE_URL || 'https://project-zoaht.vercel.app';
const requiredRoutes = [
  '/',
  '/home',
  '/questions',
  '/feed',
  '/commitment',
  '/privacy',
  '/terms',
  '/manifest.json',
  '/env.js',
];

function request(url) {
  const client = url.startsWith('https:') ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(url, { method: 'GET' }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          body,
          statusCode: res.statusCode || 0,
          url,
        });
      });
    });

    req.setTimeout(15000, () => {
      req.destroy(new Error(`Timed out: ${url}`));
    });
    req.on('error', reject);
    req.end();
  });
}

function assertRoute(route, response) {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`${route} returned ${response.statusCode}`);
  }

  if (route === '/manifest.json' && !response.body.includes('FounderType')) {
    throw new Error('/manifest.json does not include FounderType metadata');
  }

  if (
    route === '/env.js' &&
    !response.body.includes('NEXT_PUBLIC_HCAPTCHA_SITE_KEY')
  ) {
    throw new Error('/env.js is missing hCaptcha public runtime config');
  }

  if (
    !route.endsWith('.json') &&
    route !== '/env.js' &&
    !response.body.includes('<div id="root">')
  ) {
    throw new Error(`${route} did not return the web app shell`);
  }
}

(async () => {
  const results = [];

  for (const route of requiredRoutes) {
    const response = await request(new URL(route, baseUrl).toString());
    assertRoute(route, response);
    results.push(`${route} ${response.statusCode}`);
  }

  console.log(`Smoke check passed for ${baseUrl}`);
  for (const result of results) {
    console.log(`- ${result}`);
  }
})().catch((error) => {
  console.error(`Smoke check failed: ${error.message}`);
  process.exit(1);
});
