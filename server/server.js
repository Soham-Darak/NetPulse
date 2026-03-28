const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

app.use(cors({ origin: 'http://localhost:5173' }));

// Serve built React app (production)
app.use(express.static(path.join(__dirname, 'public')));

// ── Ping ─────────────────────────────────────────────────────────────────────
// Keep as minimal as possible so the round-trip time reflects network latency,
// not server processing overhead.
app.get('/ping', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Connection', 'keep-alive');
  res.json({ pong: true });
});

// ── Download test (proxied through Cloudflare CDN) ────────────────────────────
// Proxies download from Cloudflare's speed test CDN so the measured speed
// reflects the user's real internet throughput (not localhost loopback).
// Falls back to local in-memory generation if Cloudflare is unreachable.
const https = require('https');
const CF_DOWN_URL  = 'https://speed.cloudflare.com/__down';
const CF_UPLOAD_URL = 'https://speed.cloudflare.com/__up';
const DEFAULT_DL_SIZE = 25 * 1024 * 1024; // 25 MB
const CHUNK_SIZE = 64 * 1024;             // 64 KB per chunk

// Pre-allocate one reusable chunk for local fallback
const CHUNK_BUF = Buffer.alloc(CHUNK_SIZE, 0);
for (let i = 0; i < CHUNK_SIZE; i++) CHUNK_BUF[i] = (i * 7 + 13) & 0xff;

function serveLocalFallback(res, totalSize) {
  res.setHeader('Content-Length', totalSize);
  let sent = 0;
  function sendChunk() {
    let ok = true;
    while (sent < totalSize && ok) {
      const remaining = totalSize - sent;
      const toSend = remaining >= CHUNK_SIZE ? CHUNK_BUF : CHUNK_BUF.subarray(0, remaining);
      ok = res.write(toSend);
      sent += toSend.length;
    }
    if (sent >= totalSize) res.end();
    else res.once('drain', sendChunk);
  }
  sendChunk();
}

app.get('/test-file', (req, res) => {
  const totalSize = Math.min(
    Math.max(parseInt(req.query.size, 10) || DEFAULT_DL_SIZE, 1024),
    100 * 1024 * 1024  // cap at 100 MB
  );

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Connection', 'keep-alive');

  // Proxy from Cloudflare CDN for real internet speed measurement
  const cfUrl = `${CF_DOWN_URL}?bytes=${totalSize}`;

  const cfReq = https.get(cfUrl, (cfRes) => {
    if (cfRes.statusCode === 200) {
      // Forward Content-Length from Cloudflare if available
      const cl = cfRes.headers['content-length'];
      if (cl) res.setHeader('Content-Length', cl);
      cfRes.pipe(res);
    } else {
      console.warn('[Download] Cloudflare returned', cfRes.statusCode, '— falling back to local');
      cfRes.resume();
      serveLocalFallback(res, totalSize);
    }
  });

  cfReq.on('error', (err) => {
    console.warn('[Download] Cloudflare unreachable:', err.message, '— falling back to local');
    serveLocalFallback(res, totalSize);
  });

  // Timeout: if Cloudflare doesn't respond in 5s, fall back to local
  cfReq.setTimeout(5000, () => {
    console.warn('[Download] Cloudflare timeout — falling back to local');
    cfReq.destroy();
    serveLocalFallback(res, totalSize);
  });
});

// ── Upload test (proxied to Cloudflare for real internet speed) ───────────────
app.post('/upload-test', (req, res) => {
  const chunks = [];
  let received = 0;

  req.on('data', (chunk) => {
    chunks.push(chunk);
    received += chunk.length;
  });

  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const startTime = Date.now();

    const cfReq = https.request(CF_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': body.length,
      },
    }, (cfRes) => {
      cfRes.resume(); // drain
      cfRes.on('end', () => {
        const duration = (Date.now() - startTime) / 1000;
        res.json({ received, duration, status: 'ok' });
      });
    });

    cfReq.on('error', (err) => {
      console.error('[Upload proxy error]', err.message);
      // Fallback: just return byte count without CF timing
      res.json({ received, duration: null, status: 'ok' });
    });

    cfReq.write(body);
    cfReq.end();
  });

  req.on('error', () => res.status(500).json({ error: 'Upload failed' }));
});

// ── WebSocket ─────────────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      // Broadcast test results to all other connected clients
      if (msg.type === 'result') {
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        });
      }
    } catch {}
  });

  ws.on('close', () => console.log('[WS] Client disconnected'));
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send('Build the React app first: npm run build');
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 NetPulse API running at http://localhost:${PORT}`);
  console.log(`   React dev server: http://localhost:5173\n`);
});
