const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const output = process.env.WEB_OUTPUT_DIR || 'web-build';
// Metro inlines EXPO_PUBLIC_* values; no server credentials are serialized.
const result = spawnSync(
  process.execPath,
  [
    require.resolve('expo/bin/cli'),
    'export',
    '--platform',
    'web',
    '--output-dir',
    output,
    '--clear',
  ],
  { stdio: 'inherit', env: process.env }
);
if (result.error) console.error(result.error.message);
if (result.status !== 0) process.exit(result.status ?? 1);
fs.copyFileSync('manifest.json', path.join(output, 'manifest.json'));
