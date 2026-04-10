const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PORT = process.env.PORT || 3000;
const DIR = __dirname;

const SHEET_ID = '1ib_9SofDcgusB_iEycB1JelXwMLyGeaShTdr4N7cqwk';

// Load service account from env variable (set in Railway)
function getSheetsClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set');
  const key = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Proxy: POST /api/claude → Anthropic API
  if (req.method === 'POST' && req.url === '/api/claude') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const apiKey = req.headers['x-api-key'];
      const opts = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body)
        }
      };
      const proxyReq = https.request(opts, proxyRes => {
        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        proxyRes.pipe(res);
      });
      proxyReq.on('error', e => { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });
      proxyReq.write(body);
      proxyReq.end();
    });
    return;
  }

  // POST /api/sheets → append row to Google Sheet
  if (req.method === 'POST' && req.url === '/api/sheets') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { typ, marke, modell, seriennummer, asset, owner, timestamp } = JSON.parse(body);
        const sheets = getSheetsClient();
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: 'Sheet1!A:G',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              timestamp || new Date().toISOString(),
              typ || '',
              marke || '',
              modell || '',
              seriennummer || '',
              asset || '',
              owner || ''
            ]]
          }
        });
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Static files
  const filePath = path.join(DIR, req.url === '/' ? 'deviceos-prototype-v2.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
