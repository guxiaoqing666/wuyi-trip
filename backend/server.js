// ============================================
// 后端服务 - 支持匿名留言板、访问统计
// 运行在你的电脑上
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
const LIKES_FILE = path.join(DATA_DIR, 'likes.json');

// 初始化数据文件
function initDataFile(filePath, defaultData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

initDataFile(MESSAGES_FILE);
initDataFile(VISITS_FILE);
initDataFile(LIKES_FILE, {});

// 读取数据
function readData(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function readJson(filePath, defaultValue = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return defaultValue;
  }
}

// 写入数据
function writeData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// CORS
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 获取客户端 IP
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         'unknown';
}

// 获取请求体
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  setCORS(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const clientIP = getClientIP(req);

  console.log(`${new Date().toISOString()} ${req.method} ${pathname} from ${clientIP}`);

  // ===== 留言相关 API =====

  // 获取留言列表
  if (pathname === '/api/messages' && req.method === 'GET') {
    const messages = readData(MESSAGES_FILE);
    const likes = readJson(LIKES_FILE, {});
    
    // 合并点赞数
    const messagesWithLikes = messages.map(msg => ({
      ...msg,
      likes: likes[msg.id] || 0,
      likedByMe: false // 前端根据 IP 判断
    }));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: messagesWithLikes }));
    return;
  }

  // 发送留言
  if (pathname === '/api/messages' && req.method === 'POST') {
    try {
      const data = await getBody(req);
      
      if (!data.content || data.content.trim().length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '留言内容不能为空' }));
        return;
      }

      if (data.content.length > 200) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '留言内容不能超过200字' }));
        return;
      }

      const messages = readData(MESSAGES_FILE);
      const newMessage = {
        id: Date.now(),
        content: data.content.trim(),
        nickname: data.nickname || '匿名游客',
        ip: clientIP,
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
    return;
  }

  // 删除留言
  if (pathname.startsWith('/api/messages/') && req.method === 'DELETE') {
    const messageId = parseInt(pathname.split('/').pop());
    const messages = readData(MESSAGES_FILE);
    const message = messages.find(m => m.id === messageId);
    
    // 只允许删除自己的留言（同一IP）或管理员
    if (!message) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '留言不存在' }));
      return;
    }
    
    const isOwner = message.ip === clientIP;
    const isAdmin = parsedUrl.query.admin === 'wuyi2024';
    
    if (!isOwner && !isAdmin) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '无权删除' }));
      return;
    }
    
    const filtered = messages.filter(m => m.id !== messageId);
    writeData(MESSAGES_FILE, filtered);
    
    // 清理点赞
    const likes = readJson(LIKES_FILE, {});
    delete likes[messageId];
    writeData(LIKES_FILE, likes);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 点赞留言
  if (pathname.startsWith('/api/messages/') && pathname.endsWith('/like') && req.method === 'POST') {
    const messageId = parseInt(pathname.split('/')[3]);
    const likes = readJson(LIKES_FILE, {});
    
    // 每个 IP 对每个留言只能点一次
    const ipKey = `${clientIP}_${messageId}`;
    const likedIPs = readJson(path.join(DATA_DIR, 'liked_ips.json'), {});
    
    if (likedIPs[ipKey]) {
      // 取消点赞
      likes[messageId] = Math.max(0, (likes[messageId] || 0) - 1);
      delete likedIPs[ipKey];
    } else {
      // 点赞
      likes[messageId] = (likes[messageId] || 0) + 1;
      likedIPs[ipKey] = true;
    }
    
    writeData(LIKES_FILE, likes);
    writeData(path.join(DATA_DIR, 'liked_ips.json'), likedIPs);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      data: { 
        likes: likes[messageId] || 0,
        liked: !!likedIPs[ipKey]
      }
    }));
    return;
  }

  // ===== 访问统计 API =====

  // 记录访问
  if (pathname === '/api/visit' && req.method === 'POST') {
    const visits = readData(VISITS_FILE);
    const visit = {
      id: Date.now(),
      ip: clientIP,
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
    
    // 统计
    const today = new Date().toISOString().split('T')[0];
    const todayVisits = visits.filter(v => v.timestamp.startsWith(today)).length;
    const uniqueIPs = [...new Set(visits.map(v => v.ip))].length;
    
    // 在线人数（最近5分钟内有访问的独立IP）
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentIPs = new Set(
      visits
        .filter(v => new Date(v.timestamp).getTime() > fiveMinutesAgo)
        .map(v => v.ip)
    );
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        totalVisits: visits.length,
        todayVisits,
        uniqueVisitors: uniqueIPs,
        onlineNow: recentIPs.size,
        totalMessages: messages.length,
        lastUpdate: new Date().toISOString()
      }
    }));
    return;
  }

  // 获取访问历史（最近20条）
  if (pathname === '/api/visits' && req.method === 'GET') {
    const visits = readData(VISITS_FILE).slice(0, 20);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: visits }));
    return;
  }

  // 健康检查
  if (pathname === '/api/health' && req.method === 'GET') {
    const messages = readData(MESSAGES_FILE);
    const visits = readData(VISITS_FILE);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      status: 'running',
      data: {
        uptime: process.uptime(),
        messages: messages.length,
        visits: visits.length
      }
    }));
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
  console.log(`   GET    /api/messages       - 获取留言`);
  console.log(`   POST   /api/messages       - 发送留言`);
  console.log(`   DELETE /api/messages/:id   - 删除留言`);
  console.log(`   POST   /api/messages/:id/like - 点赞`);
  console.log(`   POST   /api/visit          - 记录访问`);
  console.log(`   GET    /api/stats          - 访问统计`);
  console.log(`   GET    /api/visits         - 访问历史`);
  console.log(`   GET    /api/health         - 健康检查`);
  console.log('================================');
});
