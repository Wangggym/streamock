import 'reflect-metadata';
import { getIt } from '@container/index';
import { StreamServer } from '@services/StreamServer';
import { Server } from 'bun';

async function main() {
  try {
    const streamServer = getIt(StreamServer);
    
    const server: Server = Bun.serve({
      port: 3001,
      websocket: streamServer.getWebSocketConfig(), // 使用 StreamServer 的 websocket 配置
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
          const viteResponse = await fetch(`http://localhost:3000${url.pathname}${url.search}`);
          return viteResponse;
        } catch (error) {
          console.error('Error proxying to Vite server:', error);
          return new Response('Failed to load frontend resources', { status: 500 });
        }
      }
    });

    console.log(`Server running at http://localhost:${server.port}`);
    console.log(`WebSocket server is running on ws://localhost:${server.port}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main(); 