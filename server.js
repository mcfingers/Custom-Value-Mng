const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const PORT = process.env.PORT || 4173;
const GHL_BASE = 'https://services.leadconnectorhq.com';

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'content-type': type });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/api/ghl/')) {
    try {
      const body = await readBody(req);
      const { token, locationId, method = 'GET', endpoint, payload } = body;
      if (!token || !locationId || !endpoint) return send(res, 400, { message: 'Token, location ID, and endpoint are required.' });
      const response = await fetch(`${GHL_BASE}${endpoint.replace(':locationId', encodeURIComponent(locationId))}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', Accept: 'application/json', 'Content-Type': 'application/json' },
        body: method === 'GET' ? undefined : JSON.stringify(payload || {})
      });
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('json') ? await response.json() : { message: await response.text() };
      send(res, response.status, result);
    } catch (error) { send(res, 502, { message: error.message || 'Unable to reach HighLevel.' }); }
    return;
  }
  const requested = req.url === '/' ? '/index.html' : req.url;
  const file = path.join(root, requested);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, 'Not found', 'text/plain');
  const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
  send(res, 200, fs.readFileSync(file), mime);
});
server.listen(PORT, () => console.log(`Custom Value Studio running at http://localhost:${PORT}`));
