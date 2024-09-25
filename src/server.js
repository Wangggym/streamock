const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let dataCache = `Welcome to the Data Streaming Demo!
This is the initial data in the cache.
You can replace this with your own input.
Stream this data or submit new content.
[DONE]`;

let combineLine = ''; // 存储 combineLine
let separator = ''; // 默认分隔符为空字符串

function unescapeSeparator(str) {
    return str.replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\'/g, "'")
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\')
              .replace(/\\v/g, '\v')
              .replace(/\\f/g, '\f')
              .replace(/\\u000B/g, '\v')
              .replace(/\\u000C/g, '\f')
              .replace(/\\u2028/g, '\u2028')
              .replace(/\\u2029/g, '\u2029')
              .replace(/\\u200B/g, '\u200B')
              .replace(/\\uFEFF/g, '\uFEFF')
              .replace(/\\u200D/g, '\u200D')
              .replace(/\\u00AD/g, '\u00AD');
}

const createServer = () => http.createServer(async (req, res) => {
  console.log(`Received ${req.method} request for ${req.url}`);

  const parsedUrl = url.parse(req.url, true);

  switch (parsedUrl.pathname) {
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

      // Parse combineLine
      let startLine, endLine;
      if (combineLine) {
        [startLine, endLine] = combineLine.split('-').map(Number);
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() !== '') {
          if (startLine && endLine && i + 1 >= startLine && i + 1 <= endLine) {
            // If this line is part of the combine range, collect it
            let combinedLines = lines.slice(i, endLine).join(separator);
            console.log(`Sending combined lines: ${startLine}-${endLine}`);
            res.write(`${combinedLines}\n`);
            await delay(100);
            i = endLine - 1; // Skip to the end of the combined range
          } else {
            console.log(`Sending line: ${line}`);
            res.write(`${line}\n`);
            await delay(100);
          }

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
          const { data, combineLine: newCombineLine, separator: newSeparator } = JSON.parse(body);
          const _separator = unescapeSeparator(newSeparator || '');
          console.log('Received data:', data);
          console.log('Received combineLine:', newCombineLine);
          console.log('Received separator:', newSeparator);
          dataCache = data;
          combineLine = newCombineLine || '';
          separator = _separator; // 解析转义字符
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Data, combineLine, and separator received and saved in memory');
          console.log("separator:", separator);
          console.log('Data, combineLine, and separator saved in memory');
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