const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const API_BASE = 'http://optiplex-pc:8888';
const SCHEDULE_API = API_BASE + '/api/schedules/broadcasting?isHalfWidth=true';

const server = http.createServer((req, res) => {
    // CORSヘッダーを追加
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // メインページ
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getHtmlContent());
        return;
    }

    // 番組表APIプロキシ
    if (req.url === '/api/schedules') {
        console.log('番組表APIに接続中...');

        http.get(SCHEDULE_API, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            proxyRes.pipe(res);
        }).on('error', (err) => {
            console.error('番組表APIエラー:', err.message);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        });
        return;
    }

    // ストリームプロキシ（チャンネルID対応）
    const streamMatch = req.url.match(/^\/stream\/(\d+)$/);
    if (streamMatch || req.url === '/stream') {
        const channelId = streamMatch ? streamMatch[1] : '3274201072';
        const streamUrl = `${API_BASE}/api/streams/live/${channelId}/m2ts?mode=0`;
        console.log('ストリームプロキシに接続中:', channelId);

        const proxyReq = http.request(streamUrl, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, {
                ...proxyRes.headers,
                'Access-Control-Allow-Origin': '*'
            });
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            console.error('プロキシエラー:', err.message);
            if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'text/plain' });
                res.end('ストリームサーバーに接続できません: ' + err.message);
            }
        });

        // クライアント切断時にバックエンド接続も中断
        req.on('close', () => {
            console.log('クライアント切断、ストリーム中断:', channelId);
            proxyReq.destroy();
        });

        proxyReq.end();
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

function getHtmlContent() {
    return fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
}

server.listen(PORT, () => {
    console.log('======================================');
    console.log('  ストリーミングサーバー起動中');
    console.log('======================================');
    console.log('');
    console.log('  ブラウザで以下にアクセス:');
    console.log('  http://localhost:' + PORT);
    console.log('');
    console.log('  Ctrl+C で終了');
    console.log('======================================');
});
