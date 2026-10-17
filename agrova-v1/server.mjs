import http from 'node:http';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'public');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
    res.end('Method not allowed');
    return;
  }

  let url;
  try { url = new URL(req.url, 'http://localhost'); }
  catch { res.writeHead(400); res.end('Bad URL'); return; }

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok: true, version: '1.0.0', storage: 'browser-localStorage' }));
    return;
  }

  let name;
  try { name = decodeURIComponent(url.pathname); }
  catch { res.writeHead(400); res.end('Bad path'); return; }
  if (name.includes('\0') || name.includes('\\') || name.split('/').some(part => part.startsWith('.') && part !== '') ) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  const target = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  try {
    const stat = await fs.stat(target);
    if (!stat.isFile()) throw Object.assign(new Error('Not a file'), { code: 'ENOENT' });
    res.writeHead(200, {
      'Content-Type': types[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') res.end();
    else createReadStream(target).pipe(res);
  } catch (err) {
    res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
  }
});

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error('Invalid PORT. Use a port between 0 and 65535.');
  process.exit(1);
}
server.listen(port, '127.0.0.1', () => {
  console.log(`Agrova V1 at http://localhost:${server.address().port}`);
  console.log('Frontend-only demo. Data lives in this browser (localStorage).');
});
