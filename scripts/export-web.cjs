const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const env = { ...process.env };

for (const fileName of ['.env', '.env.local']) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) continue;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1).replace(/^['"]|['"]$/g, '');
    env[key] = env[key] || value;
  }
}

env.EXPO_PUBLIC_SUPABASE_URL =
  env.EXPO_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  env.EXPO_PUBLIC_SUPABASE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_KEY ||
  '';
env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY =
  env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY || env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '';
env.SENTRY_ORG = env.SENTRY_ORG || env.SENTRY_ORGANIZATION || 'foundertype';
env.SENTRY_PROJECT = env.SENTRY_PROJECT || 'foundertype-mobile';

const expoBin = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'expo.cmd' : 'expo'
);

const result = spawnSync(expoBin, ['export:web', '--clear'], {
  env,
  stdio: 'inherit',
});

if (result.status === 0) {
  const buildDir = path.join(process.cwd(), 'web-build');
  const envFile = path.join(buildDir, 'env.js');
  const indexFile = path.join(buildDir, 'index.html');
  const runtimeEnv = {
    EXPO_PUBLIC_SUPABASE_URL: env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_SUPABASE_KEY: env.NEXT_PUBLIC_SUPABASE_KEY || '',
    EXPO_PUBLIC_HCAPTCHA_SITE_KEY: env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY,
    NEXT_PUBLIC_HCAPTCHA_SITE_KEY: env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '',
  };

  fs.writeFileSync(
    envFile,
    `window.__FOUNDER_TYPE_ENV__ = ${JSON.stringify(runtimeEnv)};\n`
  );

  const indexHtml = fs.readFileSync(indexFile, 'utf8');
  let updatedHtml = indexHtml;

  // Add env.js script if not present
  if (!indexHtml.includes('/env.js')) {
    updatedHtml = updatedHtml.replace(
      '<head>',
      '<head><script src="/env.js"></script>'
    );
  }

  // Add accessibility CSS fix
  const accessibilityCss = fs.readFileSync(
    path.join(process.cwd(), 'public', 'accessibility-fix.css'),
    'utf8'
  );

  if (!updatedHtml.includes('accessibility-fix.css')) {
    updatedHtml = updatedHtml.replace(
      '<head>',
      `<head><style>${accessibilityCss}</style>`
    );
  }

  fs.writeFileSync(indexFile, updatedHtml);
}

process.exit(result.status ?? 1);
