// Deadbrawl server: serves the game and pairs online players.
// Host-authoritative: the first player in the queue runs the fight and streams state to the second.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const CHARS = ['vish', 'rift', 'jacob'];
const zlib = require('zlib');

// static files: index.html, js/ and assets/ are loaded into memory (gzipped) at startup
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
const files = new Map();
function load(rel) {
  const full = path.join(__dirname, rel);
  if (fs.statSync(full).isDirectory()) { for (const f of fs.readdirSync(full)) load(path.posix.join(rel, f)); return; }
  const type = TYPES[path.extname(rel)];
  if (!type) return;
  const body = fs.readFileSync(full);
  const zipped = /^(text|application)/.test(type) ? zlib.gzipSync(body, { level: 9 }) : null;
  files.set('/' + rel, { body, zipped, type });
}
for (const rel of ['index.html', 'js', 'assets']) if (fs.existsSync(path.join(__dirname, rel))) load(rel);
if (!files.has('/index.html')) { console.error('index.html not found next to server.js'); process.exit(1); }
const BOOT = Date.now().toString(36); // changes each deploy so browsers fetch fresh files

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/health') { res.writeHead(200); res.end('ok'); return; }
  if (url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const f = files.get(url === '/' ? '/index.html' : url);
  if (!f) { res.writeHead(404); res.end('not found'); return; }
  const etag = '"' + BOOT + '"';
  const headers = { 'Content-Type': f.type, 'Cache-Control': 'no-cache', ETag: etag };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); res.end(); return; }
  if (f.zipped && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip' }); res.end(f.zipped);
  } else { res.writeHead(200, headers); res.end(f.body); }
});

const wss = new WebSocketServer({ server, perMessageDeflate: false });
let waiting = null;

const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };

function unpair(ws) {
  if (waiting === ws) waiting = null;
  const p = ws.peer;
  ws.peer = null; ws.lock = null; ws.role = null;
  if (p) { p.peer = null; p.lock = null; p.role = null; send(p, { t: 'oppLeft' }); }
}

wss.on('connection', ws => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', data => {
    const s = data.toString();
    // in-game traffic ("~" prefix) is relayed untouched to the opponent
    if (s[0] === '~') { if (ws.peer && ws.peer.readyState === 1) ws.peer.send(s); return; }
    let m; try { m = JSON.parse(s); } catch (e) { return; }

    if (m.t === 'queue') {
      if (ws.peer) return;
      if (waiting && waiting !== ws && waiting.readyState === 1) {
        const host = waiting; waiting = null;
        host.peer = ws; ws.peer = host;
        host.role = 'host'; ws.role = 'guest';
        host.lock = ws.lock = null;
        send(host, { t: 'match', role: 'host' });
        send(ws, { t: 'match', role: 'guest' });
      } else { waiting = ws; send(ws, { t: 'queued' }); }
    } else if (m.t === 'lock') {
      const p = ws.peer;
      if (!p || ws.lock || !CHARS.includes(m.c)) return;
      if (p.lock === m.c) { send(ws, { t: 'denied', c: m.c }); return; } // no mirror picks
      ws.lock = m.c;
      send(ws, { t: 'locked', c: m.c });
      send(p, { t: 'opp', c: m.c });
      if (p.lock) {
        const host = ws.role === 'host' ? ws : p, guest = host === ws ? p : ws;
        const msg = { t: 'start', host: host.lock, guest: guest.lock };
        send(host, msg); send(guest, msg);
      }
    } else if (m.t === 'leave') {
      unpair(ws);
    }
  });

  ws.on('close', () => unpair(ws));
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
}, 30000);

server.listen(PORT, () => console.log('Deadbrawl running on port ' + PORT));
