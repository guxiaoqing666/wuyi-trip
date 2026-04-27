const http = require('http');
const fs = require('fs');
const path = require('path');

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let url = req.url === '/' ? 'index.html' : req.url;
  // 去掉查询参数
  url = url.split('?')[0];
  let f = path.join(process.cwd(), decodeURIComponent(url));
  
  // 安全检查
  if (!f.startsWith(process.cwd())) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  fs.readFile(f, (err, data) => {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Not found: ' + url);
      return;
    }
    let ext = path.extname(f).toLowerCase();
    res.writeHead(200, {'Content-Type': mime[ext] || 'text/plain'});
    res.end(data);
  });
});

server.listen(8080, () => {
  console.log('================================');
  console.log(' 五一行程服务器已启动！');
  console.log(' 访问地址: http://localhost:8080');
  console.log(' 按 Ctrl+C 停止');
  console.log('================================');
});
