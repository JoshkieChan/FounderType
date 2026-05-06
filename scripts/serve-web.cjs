const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(process.cwd(), 'web-build');
const port = Number(process.env.PORT || 4177);
const host = process.env.HOST || '127.0.0.1';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolveFile(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const requested = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(root, requested);

  if (!filePath.startsWith(root)) {
    return null;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  return path.join(root, 'index.html');
}

const server = http.createServer((req, res) => {
  if (!fs.existsSync(root)) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('web-build does not exist. Run npm run build first.\n');
    return;
  }

  const filePath = resolveFile(req.url || '/');
  if (!filePath || !fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found\n');
    return;
  }

  const extension = path.extname(filePath);
  const isAsset = filePath.includes(`${path.sep}static${path.sep}`);
  res.writeHead(200, {
    'Cache-Control': isAsset
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate',
    'Content-Type': contentTypes[extension] || 'application/octet-stream',
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, host, () => {
  console.log(`FounderType web build serving at http://${host}:${port}`);
});
