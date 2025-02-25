import 'reflect-metadata';
import type { Server } from "bun";
import { inject, injectable } from 'inversify';
import { IDataService, ServerConfig, IStreamServer } from '@types';
import { IndexHandler } from '@services/handlers/IndexHandler';
import { StreamHandler } from '@services/handlers/StreamHandler';
import { SubmitHandler } from '@services/handlers/SubmitHandler';
import { ListHandler } from '@services/handlers/ListHandler';
import { LoadHandler } from '@services/handlers/LoadHandler';
import { DataService } from '@services/DataService';
import { StreamDataInfoRepository } from './StreamDataInfoRepository';

@injectable()
export class StreamServer implements IStreamServer {
  private readonly indexHandler: IndexHandler;
  private readonly streamHandler: StreamHandler;
  private readonly submitHandler: SubmitHandler;
  private readonly listHandler: ListHandler;
  private readonly loadHandler: LoadHandler;

  constructor(
    @inject(DataService) dataService: IDataService,
    @inject(StreamDataInfoRepository) repository: StreamDataInfoRepository
  ) {
    this.indexHandler = new IndexHandler(dataService);
    this.streamHandler = new StreamHandler(dataService);
    this.submitHandler = new SubmitHandler(dataService, repository);
    this.listHandler = new ListHandler(repository);
    this.loadHandler = new LoadHandler(dataService, repository);
  }

  async createServer(config: Partial<ServerConfig> = {}): Promise<Server> {
    const defaultConfig: ServerConfig = {
      port: 3001,
      fetch: async (req) => {
        const url = new URL(req.url);

        switch (url.pathname) {
          case '/':
            return this.indexHandler.handle(req);
          case '/stream':
            return this.streamHandler.handle(req);
          case '/submit':
            return this.submitHandler.handle(req);
          case '/list':
            return this.listHandler.handle(req);
          case '/load':
            return this.loadHandler.handle(req);
          default:
            return new Response('Not found', { status: 404 });
        }
      }
    };

    const finalConfig = { ...defaultConfig, ...config };

    for (let port = finalConfig.port; port < finalConfig.port + 10; port++) {
      try {
        const server = Bun.serve({
          ...finalConfig,
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