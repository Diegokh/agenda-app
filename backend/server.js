const fs = require('fs');
const path = require('path');
const http = require('http');
const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err);
    return;
  }
  console.log('✅ Conectado a MySQL');
});

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
}

const server = http.createServer((req, res) => {

  setCORS(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // SERVIR IMÁGENES
  if (req.method === 'GET' && req.url.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, req.url);

    fs.readFile(filePath, (err, data) => {
      setCORS(res);

      if (err) {
        res.writeHead(404);
        return res.end();
      }

      const ext = path.extname(filePath).toLowerCase();
      let type = 'image/jpeg';
      if (ext === '.png') type = 'image/png';
      else if (ext === '.gif') type = 'image/gif';

      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    });
  }

  // SUBIR IMAGEN
  else if (req.method === 'POST' && req.url === '/upload') {
    const contentType = req.headers['content-type'];
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);

    if (!boundaryMatch) {
      res.writeHead(400);
      return res.end('No boundary');
    }

    const boundary = '--' + boundaryMatch[1];
    let chunks = [];

    req.on('data', chunk => chunks.push(chunk));

    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const boundaryStr = '\r\n' + boundary;
      const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'));

      if (headerEnd === -1) {
        res.writeHead(400);
        return res.end('Invalid format');
      }

      const headerPart = buffer.toString('utf8', 0, headerEnd);
      const filenameMatch = headerPart.match(/filename="([^"]+)"/);

      if (!filenameMatch) {
        res.writeHead(400);
        return res.end('No file');
      }

      const fileName = Date.now() + '-' + filenameMatch[1];
      const contentStart = headerEnd + 4;
      const nextBoundaryIndex = buffer.indexOf(Buffer.from(boundaryStr), contentStart);
      const contentEnd = nextBoundaryIndex > -1 ? nextBoundaryIndex : buffer.length;
      const fileBuffer = buffer.slice(contentStart, contentEnd);
      const filePath = path.join(__dirname, 'uploads', fileName);

      fs.writeFile(filePath, fileBuffer, (err) => {
        if (err) {
          console.error(err);
          res.writeHead(500);
          return res.end('Error');
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ fileName }));
      });
    });
  }

  // GET contactos
  else if (req.method === 'GET' && req.url === '/contactos') {
    db.query('SELECT * FROM contactos', (err, results) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
  }

  // POST contacto
  else if (req.method === 'POST' && req.url === '/contactos') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { nombre, telefono, notas, foto } = JSON.parse(body);
      db.query(
        'INSERT INTO contactos (nombre, telefono, notas, foto) VALUES (?, ?, ?, ?)',
        [nombre, telefono, notas, foto],
        (err, result) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: err.message }));
          }
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: result.insertId, nombre, telefono, notas, foto }));
        }
      );
    });
  }

  // PUT contacto
  else if (req.method === 'PUT' && req.url.startsWith('/contactos/')) {
    const id = req.url.split('/')[2];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { nombre, telefono, notas, foto } = JSON.parse(body);
      db.query(
        'UPDATE contactos SET nombre=?, telefono=?, notas=?, foto=? WHERE id=?',
        [nombre, telefono, notas, foto, id],
        (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: err.message }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id, nombre, telefono, notas, foto }));
        }
      );
    });
  }

  // DELETE
  else if (req.method === 'DELETE' && req.url.startsWith('/contactos/')) {
    const id = req.url.split('/')[2];
    db.query('DELETE FROM contactos WHERE id=?', [id], (err) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ mensaje: 'Contacto eliminado' }));
    });
  }

  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
  }
});

server.listen(3000, () => {
  console.log('🚀 Servidor en http://localhost:3000');
});