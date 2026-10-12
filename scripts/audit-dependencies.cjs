const { spawnSync } = require('node:child_process');
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run through npm run audit:dependencies');
const result = spawnSync(process.execPath, [npm, 'audit', '--json'], {
  encoding: 'utf8',
});
if (result.error) throw result.error;
let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  throw new Error('Dependency audit did not return JSON');
}
if (report.error || !report.vulnerabilities)
  throw new Error('Dependency audit unavailable');
// Exact upstream exceptions expire; all new advisories fail. See docs/SECURITY.md.
const accepted = new Map([
  ['GHSA-vfj7-8cjw-p6xm', { name: 'braces', range: '<=3.0.3' }],
  ['GHSA-86w9-cpqp-85rv', { name: 'node-forge', range: '<=1.4.0' }],
  ['GHSA-hp3w-g68c-fv3c', { name: 'sprintf-js', range: '<=1.1.3' }],
  ['GHSA-5p2g-fcmc-qvqq', { name: 'image-size', range: '>=1.2.0 <=2.0.2' }],
  ['GHSA-w3rx-r6r6-pgpr', { name: 'image-size', range: '>=0.6.3 <=2.0.2' }],
]);
let failed = false;
const seen = new Set();
for (const vulnerability of Object.values(report.vulnerabilities)) {
  for (const advisory of vulnerability.via) {
    if (typeof advisory === 'string') continue;
    const id = advisory.url.split('/').pop();
    if (seen.has(id)) continue;
    seen.add(id);
    const exception = accepted.get(id);
    const permitted =
      exception &&
      advisory.name === exception.name &&
      advisory.range === exception.range &&
      Date.now() < Date.parse('2026-11-12T00:00:00Z');
    console.log(
      (permitted ? 'KNOWN UPSTREAM: ' : 'UNACCEPTED: ') +
        id +
        ' ' +
        advisory.name +
        ' (' +
        advisory.severity +
        ')'
    );
    if (!permitted) failed = true;
  }
}
console.log(JSON.stringify(report.metadata.vulnerabilities));
process.exit(failed ? 1 : 0);
