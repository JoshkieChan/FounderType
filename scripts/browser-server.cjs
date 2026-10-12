const { spawnSync, spawn } = require('node:child_process');
// Test-only public configuration. Every external request is intercepted by tests.
const env = {
  ...process.env,
  EXPO_PUBLIC_SUPABASE_URL: 'https://foundertype.test',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-public-key',
  EXPO_PUBLIC_HCAPTCHA_SITE_KEY: 'synthetic-site-key',
  EXPO_PUBLIC_SENTRY_DSN: '',
  EXPO_NO_DOTENV: '1',
  PORT: '4178',
  WEB_OUTPUT_DIR: '.expo/browser-build',
};
const build = spawnSync(process.execPath, ['scripts/export-web.cjs'], {
  env,
  stdio: 'inherit',
});
if (build.status !== 0) process.exit(build.status || 1);
const server = spawn(process.execPath, ['scripts/serve-web.cjs'], {
  env,
  stdio: 'inherit',
});
process.on('SIGTERM', () => server.kill());
process.on('SIGINT', () => server.kill());
server.on('exit', (code) => process.exit(code || 0));
