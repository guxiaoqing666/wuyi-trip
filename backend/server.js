// ============================================
// 后端服务 - 支持匿名留言板、访问统�?// 运行在你的电脑上
// ============================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, '..', 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const VISITS_FILE = path.join(DATA_DIR, 'visits.json');

// 初始化数据文�?function initDataFile(filePath, defaultData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

initDataFile(MESSAGES_FILE);
initDataFile(VISITS_FILE);

// 读取数据
function readData(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

// 写入数据
function writeData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// CORS �?function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 获取客户�?IP
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         'unknown';
}

const server = http.createServer((req, res) => {
  setCORS(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);

  // 获取留言列表
  if (pathname === '/api/messages' && req.method === 'GET') {
    const messages = readData(MESSAGES_FILE);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: messages }));
    return;
  }

  // 发送留言
  if (pathname === '/api/messages' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        if (!data.content || data.content.trim().length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '留言内容不能为空' }));
          return;
        }

        if (data.content.length > 200) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '留言内容不能超过200�? }));
          return;
        }

        const messages = readData(MESSAGES_FILE);
        const newMessage = {
          id: Date.now(),
          content: data.content.trim(),
          ip: getClientIP(req),
          userAgent: req.headers['user-agent'] || '',
          createdAt: new Date().toISOString()
        };

        messages.unshift(newMessage);
        
        // 限制数量
        if (messages.length > 1000) {
          messages.length = 1000;
        }

        writeData(MESSAGES_FILE, messages);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: newMessage }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 记录访问
  if (pathname === '/api/visit' && req.method === 'POST') {
    const visits = readData(VISITS_FILE);
    const visit = {
      id: Date.now(),
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || '',
      referer: req.headers['referer'] || '',
      url: parsedUrl.query.url || '',
      timestamp: new Date().toISOString()
    };
    visits.unshift(visit);
    if (visits.length > 5000) visits.length = 5000;
    writeData(VISITS_FILE, visits);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 获取访问统计
  if (pathname === '/api/stats' && req.method === 'GET') {
    const visits = readData(VISITS_FILE);
    const messages = readData(MESSAGES_FILE);
    
    // 简单统�?    const today = new Date().toISOString().split('T')[0];
    const todayVisits = visits.filter(v => v.timestamp.startsWith(today)).length;
    const uniqueIPs = [...new Set(visits.map(v => v.ip))].length;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        totalVisits: visits.length,
        todayVisits,
        uniqueVisitors: uniqueIPs,
        totalMessages: messages.length,
        lastUpdate: new Date().toISOString()
      }
    }));
    return;
  }

  // 健康检�?  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, status: 'running' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log('================================');
  console.log(' 后端服务已启动！');
  console.log(` 地址: http://localhost:${PORT}`);
  console.log(` API:`);
  console.log(`   GET  /api/messages    - 获取留言`);
  console.log(`   POST /api/messages    - 发送留言`);
  console.log(`   POST /api/visit       - 记录访问`);
  console.log(`   GET  /api/stats       - 访问统计`);
  console.log(`   GET  /api/health      - 健康检查`);
  console.log('================================');
});
// test deploy