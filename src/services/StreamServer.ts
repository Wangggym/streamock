import 'reflect-metadata';
import type { Server, ServerWebSocket } from "bun";
import { inject, injectable } from 'inversify';
import { IStreamServer, ServerConfig } from '@types';
import { IndexHandler } from '@services/handlers/IndexHandler';
import { StreamHandler } from '@services/handlers/StreamHandler';
import { SubmitHandler } from '@services/handlers/SubmitHandler';
import { ListHandler } from '@services/handlers/ListHandler';
import { LoadHandler } from '@services/handlers/LoadHandler';
import { DataService } from '@services/DataService';
import { StreamDataInfoRepository } from '@services/StreamDataInfoRepository';
import { DeleteHandler } from '@services/handlers/DeleteHandler';
import { StreamMessage } from '@/models/StreamMessage';
  
@injectable()
export class StreamServer implements IStreamServer {
  private readonly indexHandler: IndexHandler;
  private readonly streamHandler: StreamHandler;
  private readonly submitHandler: SubmitHandler;
  private readonly listHandler: ListHandler;
  private readonly loadHandler: LoadHandler;
  private readonly deleteHandler: DeleteHandler;
  private connectedClients: Set<ServerWebSocket<unknown>> = new Set();
  private server?: Server;

  constructor(
    @inject(DataService) dataService: DataService,
    @inject(StreamDataInfoRepository) repository: StreamDataInfoRepository
  ) {
    this.indexHandler = new IndexHandler(dataService);
    this.streamHandler = new StreamHandler(dataService);
    this.submitHandler = new SubmitHandler(dataService, repository);
    this.listHandler = new ListHandler(repository);
    this.loadHandler = new LoadHandler(dataService, repository);
    this.deleteHandler = new DeleteHandler(dataService, repository);
  }

  // 广播消息给所有连接的客户端
  broadcastMessage(message: StreamMessage) {
    const messageStr = message.toString();
    for (const client of this.connectedClients) {
      client.send(messageStr);
    }
  }

  // 返回 WebSocket 配置
  getWebSocketConfig() {
    return {
      open: (ws: ServerWebSocket<unknown>) => {
        this.connectedClients.add(ws);
      },
      close: (ws: ServerWebSocket<unknown>) => {
        this.connectedClients.delete(ws);
      },
      message: (ws: ServerWebSocket<unknown>, message: string | Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      },
    };
  }

  // 处理 API 请求
  async handleRequest(req: Request) {
    const url = new URL(req.url);

    // 使用原有的路由逻辑
    switch (url.pathname.replace('/api', '')) {
      case '/stream':
        return this.streamHandler.handle(req);
      case '/submit': {
        const response = await this.submitHandler.handle(req);
        // 如果提交成功，通知所有客户端更新列表
        if (response.status === 200) {
          const result = await response.json();
          this.broadcastMessage(StreamMessage.createSubmitMessage(result.key));
        }
        return response;
      }
      case '/list':
        return this.listHandler.handle(req);
      case '/load':
        return this.loadHandler.handle(req);
      case '/delete': {
        const response = await this.deleteHandler.handle(req);
        // 如果删除成功，通知所有客户端更新列表
        if (response.status === 200) {
          this.broadcastMessage(StreamMessage.createDeleteMessage());
        }
        return response;
      }
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  /** 用于生产环境的服务器创建方法 */
  async createServer(config: Partial<ServerConfig> = {}): Promise<Server> {
    const defaultConfig: ServerConfig = {
      port: 3001,
      fetch: (req: Request): Response | Promise<Response> => {
        const url = new URL(req.url);
        const upgrade = req.headers.get("upgrade") || "";

        // 处理 WebSocket 升级请求
        if (upgrade.toLowerCase() === "websocket") {
          if (!this.server) {
            return new Response('Server not initialized', { status: 500 });
          }
          const upgraded = this.server.upgrade(req);
          if (!upgraded) {
            return new Response('WebSocket upgrade failed', { status: 400 });
          }
          return new Response(null);
        }

        // 处理 API 请求
        if (url.pathname.startsWith('/api')) {
          return this.handleRequest(req);
        }

        // 处理静态资源
        return this.indexHandler.handle(req);
      }
    };

    const finalConfig = { ...defaultConfig, ...config };

    // 端口尝试逻辑保持不变
    for (let port = finalConfig.port; port < finalConfig.port + 10; port++) {
      try {
        this.server = Bun.serve({
          ...finalConfig,
          websocket: this.getWebSocketConfig(),  // 添加 WebSocket 支持
          port
        });
        console.log(`WebSocket server is running on ws://localhost:${port}`);
        return this.server;
      } catch (error: any) {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${port} is in use, trying next port...`);
          continue;
        }
        throw error;
      }
    }

    throw new Error(`Unable to find an available port in range ${finalConfig.port}-${finalConfig.port + 9}`);
  }
} 