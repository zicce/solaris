const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5500;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  

  const parsedUrl = url.parse(req.url);
  const urlPath = parsedUrl.pathname;
  

  const extname = String(path.extname(urlPath)).toLowerCase();
  const hasStaticExtension = extname && extname !== '.html';
  

  if (hasStaticExtension) {
    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
    return;
  }
  
  // obsluga 
  if (urlPath.endsWith('.html')) {
    filePath = '.' + urlPath;
  } else if (!path.extname(urlPath)) {
    // Jeśli brak rozszerzenia, spróbuj dodać .html
    filePath += '.html';
  }
  
  // / index.htm l
  if (filePath.endsWith('/')) {
    filePath += 'index.html';
  }
  
  const htmlExtname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[htmlExtname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {

        const cleanPath = urlPath.replace(/\.html$/, '');
        if (cleanPath !== urlPath) {
          res.writeHead(301, { 'Location': cleanPath });
          res.end();
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {

      if (urlPath.endsWith('.html') && urlPath !== '/index.html') {
        const cleanUrl = urlPath.replace(/\.html$/, '');
        res.writeHead(301, { 'Location': cleanUrl });
        res.end();
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Clean URLs enabled - .html extension will be removed');
});

