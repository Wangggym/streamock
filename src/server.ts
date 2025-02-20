import 'reflect-metadata';
import type { Server } from "bun";
import { inject, injectable } from 'inversify';
import { TYPES, IDataService, ServerConfig } from './types';
import { container } from './container';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface SubmitData {
  data: string;
  combineLine: string;
  separator: string;
}

@injectable()
export class StreamServer {
  private readonly dataService: IDataService;

  constructor(
    @inject(TYPES.DataService) dataService: IDataService
  ) {
    this.dataService = dataService;
  }

  async createServer(config: Partial<ServerConfig> = {}): Promise<Server> {
    const defaultConfig: ServerConfig = {
      port: 3001,
      fetch: async (req) => {
        const url = new URL(req.url);

        if (url.pathname === '/') {
          return new Response(Bun.file('./index.html'));
        }

        switch (url.pathname) {
          case '/stream': {
            const dataService = this.dataService; // 创建一个闭包引用
            const stream = new ReadableStream({
              async start(controller) {
                const lines = dataService.getData().split('\n');
                let doneFound = false;

                let startLine: number | undefined, endLine: number | undefined;
                const combineLine = dataService.getCombineLine();
                if (combineLine) {
                  [startLine, endLine] = combineLine.split('-').map(Number);
                }

                for (let i = 0; i < lines.length && !doneFound; i++) {
                  const line = lines[i];
                  if (line.trim() !== '') {
                    if (startLine && endLine && i + 1 >= startLine && i + 1 <= endLine) {
                      const combinedLines = lines.slice(i, endLine).join(dataService.getSeparator() || '\n');
                      controller.enqueue(combinedLines + '\n');
                      i = endLine - 1;
                    } else {
                      controller.enqueue(line + '\n');
                    }
                  }
                  if (line.includes('[DONE]')) {
                    doneFound = true;
                  }
                  await delay(100);
                }
                controller.close();
              }
            });

            return new Response(stream, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              }
            });
          }

          case '/submit': {
            if (req.method !== 'POST') {
              return new Response('Method not allowed', { status: 405 });
            }

            try {
              const data: SubmitData = await req.json();
              this.dataService.setData(data.data, data.combineLine, data.separator);
              return new Response('Data updated successfully');
            } catch (error) {
              return new Response('Invalid data', { status: 400 });
            }
          }

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

export const start = async (config?: Partial<ServerConfig>) => {
  try {
    const server = container.get<StreamServer>(TYPES.Server);
    const instance = await server.createServer(config);
    if (instance) {
      console.log(`Server running at http://localhost:${instance.port}`);
    }
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

export default { start }; 