const http = require('http');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let dataCache = `Welcome to the Data Streaming Demo!
This is the initial data in the cache.
You can replace this with your own input.
Stream this data or submit new content.
[DONE]`;

const createServer = () => http.createServer(async (req, res) => {
  console.log(`Received ${req.method} request for ${req.url}`);

  switch (req.url) {
    case '/stream':
      console.log('Streaming data...');
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      const lines = dataCache.split('\n');
      let doneFound = false;

      for (const line of lines) {
        if (line.trim() !== '') {
          console.log(`Sending line: ${line}`);
          res.write(`${line}\n\n`);
          await delay(100);

          if (line.trim() === '[DONE]') {
            doneFound = true;
            break;
          }
        }
      }

      if (!doneFound) {
        console.log('Sending [DONE] event');
        res.write(`[DONE]\n\n`);
      }

      console.log('All data sent, ending stream');
      res.end();
      console.log('Streaming complete');
      break;

    case '/':
      console.log('Serving index.html');
      const filePath = path.join(__dirname, '..', 'index.html');
      fs.readFile(filePath, (err, content) => {
        if (err) {
          console.error('Error reading index.html:', err);
          res.writeHead(500);
          res.end('Error loading index.html');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        }
      });
      break;

    case '/submit':
      if (req.method === 'POST') {
        console.log('Receiving data submission');
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          console.log('Received data:', body);
          dataCache = body;
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Data received and saved in memory');
          console.log('Data saved in memory');
        });
      } else {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
      }
      break;

    default:
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      break;
  }
});

function start(port = 3001) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`Streaming server running at http://localhost:${port}`);
  });
}

module.exports = { start };