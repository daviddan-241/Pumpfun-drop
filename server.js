const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

function send(res, status, body, headers={}){
  res.writeHead(status, headers); res.end(body);
}

function contentType(file){
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (file.endsWith('.json')) return 'application/json; charset=utf-8';
  if (file.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  if (parsed.pathname === '/config.js') {
    const cfg = {
      receiver: process.env.RECEIVER_PUBKEY || '',
      wcProjectId: process.env.WC_PROJECT_ID || '',
      moralisKey: process.env.MORALIS_KEY || ''
    };
    const js = `window.PUMPDROP_CONFIG = ${JSON.stringify(cfg)};`;
    return send(res, 200, js, { 'Content-Type': 'application/javascript; charset=utf-8' });
  }
  let reqPath = parsed.pathname;
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.normalize(path.join(PUBLIC_DIR, reqPath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return send(res, 403, 'Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return send(res, 404, 'Not found');
    }
    send(res, 200, data, { 'Content-Type': contentType(filePath) });
  });
});

server.listen(PORT, () => {
  console.log('Pumpdrop server listening on', PORT);
});
