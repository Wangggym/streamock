import 'reflect-metadata';
import type { Server, ServerWebSocket } from "bun";
import { inject, injectable } from 'inversify';
import { IDataService, ServerConfig, IStreamServer } from '@types';
import { IndexHandler } from '@services/handlers/IndexHandler';
import { StreamHandler } from '@services/handlers/StreamHandler';
import { SubmitHandler } from '@services/handlers/SubmitHandler';
import { ListHandler } from '@services/handlers/ListHandler';
import { LoadHandler } from '@services/handlers/LoadHandler';
import { DataService } from '@services/DataService';
import { StreamDataInfoRepository } from '@services/StreamDataInfoRepository';
import { DeleteHandler } from '@services/handlers/DeleteHandler';

@injectable()
export class StreamServer implements IStreamServer {
  private readonly indexHandler: IndexHandler;
  private readonly streamHandler: StreamHandler;
  private readonly submitHandler: SubmitHandler;
  private readonly listHandler: ListHandler;
  private readonly loadHandler: LoadHandler;
  private readonly deleteHandler: DeleteHandler;

  constructor(
    @inject(DataService) dataService: IDataService,
    @inject(StreamDataInfoRepository) repository: StreamDataInfoRepository
  ) {
    this.indexHandler = new IndexHandler(dataService);
    this.streamHandler = new StreamHandler(dataService);
    this.submitHandler = new SubmitHandler(dataService, repository);
    this.listHandler = new ListHandler(repository);
    this.loadHandler = new LoadHandler(dataService, repository);
    this.deleteHandler = new DeleteHandler(dataService, repository);
  }

  // 返回 WebSocket 配置
  getWebSocketConfig() {
    return {
      message(ws: ServerWebSocket<unknown>, message: string | Buffer) {
        ws.send(message);
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
      case '/submit':
        return this.submitHandler.handle(req);
      case '/list':
        return this.listHandler.handle(req);
      case '/load':
        return this.loadHandler.handle(req);
      case '/delete':
        return this.deleteHandler.handle(req);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  /** 用于生产环境的服务器创建方法 */
  async createServer(config: Partial<ServerConfig> = {}): Promise<Server> {
    const defaultConfig: ServerConfig = {
      port: 3001,
      fetch: async (req) => {
        const url = new URL(req.url);

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
        const server = Bun.serve({
          ...finalConfig,
          websocket: this.getWebSocketConfig(),  // 添加 WebSocket 支持
          port
        });
        return server;
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