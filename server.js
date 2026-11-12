// Deadbrawl server: serves the game and pairs online players.
// Host-authoritative: the first player in the queue runs the fight and streams state to the second.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const CHARS = ['vish', 'rift', 'jacob'];
const page = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));

const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200); res.end('ok'); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(page);
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
