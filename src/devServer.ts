import 'reflect-metadata';
import { getIt } from '@container/index';
import { StreamServer } from '@services/StreamServer';
import { Server } from 'bun';

// Check if a port is available
async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    try {
      const testServer = Bun.serve({
        port,
        fetch() {
          return new Response("Port check");
        }
      });
      testServer.stop();
      return port;
    } catch (err) {
      console.log(`Port ${port} is in use, trying next port...`);
      continue;
    }
  }
  throw new Error(`Unable to find an available port after ${maxAttempts} attempts`);
}

async function main() {
  try {
    const streamServer = getIt(StreamServer);
    const port = await findAvailablePort(3001);
    const vitePort = 3000;  // Default Vite port
    
    const server: Server = Bun.serve({
      port,
      websocket: streamServer.getWebSocketConfig(),
      async fetch(req): Promise<Response> {
        const url = new URL(req.url);
        const upgrade = req.headers.get("upgrade") || "";

        // 处理 WebSocket 升级请求
        if (upgrade.toLowerCase() === "websocket") {
          const upgraded = server.upgrade(req);
          if (!upgraded) {
            return new Response('WebSocket upgrade failed', { status: 400 });
          }
          return new Response(null);
        }
        
        // 如果是 API 请求，使用 StreamServer 的处理逻辑
        if (url.pathname.startsWith('/api')) {
          return streamServer.handleRequest(req);
        }
        
        // 对于非 API 请求，代理到 Vite 开发服务器
        try {
          const viteResponse = await fetch(`http://localhost:${vitePort}${url.pathname}${url.search}`);
          return viteResponse;
        } catch (error) {
          console.error('Error proxying to Vite server:', error);
          return new Response('Failed to load frontend resources', { status: 500 });
        }
      }
    });

    console.log(`Server running at http://localhost:${port}`);
    console.log(`WebSocket server is running on ws://localhost:${port}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main(); 