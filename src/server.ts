import type { Server, ServeOptions } from "bun";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface SubmitData {
  data: string;
  combineLine: string;
  separator: string;
}

let dataCache = `Welcome to the Data Streaming Demo!
This is the initial data in the cache.
You can replace this with your own input.
Stream this data or submit new content.
[DONE]`;

let combineLine = ''; // Store combineLine
let separator = ''; // Default separator is empty string

function unescapeSeparator(str: string): string {
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

interface ServerConfig extends ServeOptions {
  port: number;
  fetch: (req: Request) => Response | Promise<Response>;
}

const createServer = async (config: Partial<ServerConfig> = {}): Promise<Server> => {
  const defaultConfig: ServerConfig = {
    port: 3001,
    fetch: async (req) => {
      const url = new URL(req.url);

      // Serve static files
      if (url.pathname === '/') {
        return new Response(Bun.file('./index.html'));
      }

      switch (url.pathname) {
        case '/stream': {
          const stream = new ReadableStream({
            async start(controller) {
              const lines = dataCache.split('\n');
              let doneFound = false;

              // Parse combineLine
              let startLine: number | undefined, endLine: number | undefined;
              if (combineLine) {
                [startLine, endLine] = combineLine.split('-').map(Number);
              }

              for (let i = 0; i < lines.length && !doneFound; i++) {
                const line = lines[i];
                if (line.trim() !== '') {
                  if (startLine && endLine && i + 1 >= startLine && i + 1 <= endLine) {
                    const combinedLines = lines.slice(i, endLine).join(separator || '\n');
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
            dataCache = data.data;
            combineLine = data.combineLine;
            separator = unescapeSeparator(data.separator);
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

  const finalConfig = {
    ...defaultConfig,
    ...config
  };

  // Try ports sequentially until we find an available one
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
};

export const start = async (config?: Partial<ServerConfig>) => {
  try {
    const server = await createServer(config);
    if (server) {
      console.log(`Server running at http://localhost:${server.port}`);
    }
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

export default { start }; 