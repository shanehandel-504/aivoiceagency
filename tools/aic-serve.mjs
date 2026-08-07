#!/usr/bin/env node
/* ── AIC · STATIC SERVER FOR THE GATES ────────────────────────────────────────
   node tools/aic-serve.mjs [port]      default 8848

   The RUN 9-12 gates all default to http://127.0.0.1:8848 and none of them
   starts a server, so every local run has depended on someone remembering to
   have one up. This is that server, in the repo, so a gate run is one command
   and the thing being served is unambiguous.

   Node's http server rather than a shell one-liner because it is async: a
   headless browser holds up to six keep-alive connections per origin, and a
   single-threaded server answers one at a time while the rest queue. A page
   waiting on `networkidle` then waits forever — no error, no timeout, no
   partial output. It reads like a broken probe and it is a broken server.
   ─────────────────────────────────────────────────────────────────────────── */
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { resolve, dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = resolve(ROOT, 'chauffeur');
const PORT = Number(process.argv[2] || 8848);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

createServer((req, res) => {
  let f = normalize(join(SITE, decodeURIComponent(req.url.split('?')[0])));
  if (!f.startsWith(SITE)) return res.writeHead(403).end('forbidden');
  try { if (statSync(f).isDirectory()) f = join(f, 'index.html'); } catch { return res.writeHead(404).end('not found'); }
  if (!existsSync(f)) return res.writeHead(404).end('not found');
  res.writeHead(200, {
    'content-type': MIME[extname(f).toLowerCase()] || 'application/octet-stream',
    /* No caching: a gate that reads a stale asset is a gate reporting on a file
       that is no longer on disk. Production's own headers are Vercel's problem
       and are measured on production, never here. */
    'cache-control': 'no-store',
  });
  createReadStream(f).pipe(res);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`serving chauffeur/ at http://127.0.0.1:${PORT}`);
});
