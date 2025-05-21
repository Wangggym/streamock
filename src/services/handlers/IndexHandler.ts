import { injectable, inject } from 'inversify';
import { BaseHandler } from '@services/handlers/BaseHandler';
import { DataService } from '@services/DataService';
import { join, dirname } from 'path';

@injectable()
export class IndexHandler extends BaseHandler {
  private readonly rootDir: string;

  constructor(@inject(DataService) dataService: DataService) {
    super(dataService);
    this.rootDir = join(dirname(import.meta.dir));
  }

  private getMimeType(path: string): string {
    if (path.endsWith('.js')) return 'application/javascript';
    if (path.endsWith('.css')) return 'text/css';
    if (path.endsWith('.html')) return 'text/html';
    return 'text/plain';
  }

  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // 处理根路径请求，返回 index.html
    if (path === '/') {
      const indexPath = join(this.rootDir, 'dist', 'frontend', 'index.html');
      return new Response(Bun.file(indexPath), {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // 处理 result.html 请求
    if (path === '/result.html') {
      const resultPath = join(this.rootDir, 'dist', 'frontend', 'result.html');
      return new Response(Bun.file(resultPath), {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // 处理静态资源请求
    if (path.startsWith('/assets/')) {
      const filePath = join(this.rootDir, 'dist', 'frontend', path);
      try {
        const file = Bun.file(filePath);
        const exists = await file.exists();
        if (!exists) {
          return new Response('Not Found', { status: 404 });
        }
        
        return new Response(file, {
          headers: {
            'Content-Type': this.getMimeType(path),
          },
        });
      } catch (error) {
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
} 