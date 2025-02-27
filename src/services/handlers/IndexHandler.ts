import { injectable, inject } from 'inversify';
import { IDataService } from '@types';
import { BaseHandler } from '@services/handlers/BaseHandler';
import { DataService } from '@services/DataService';
import { join } from 'path';

@injectable()
export class IndexHandler extends BaseHandler {
  constructor(@inject(DataService) dataService: IDataService) {
    super(dataService);
  }

  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // 处理根路径请求，返回 index.html
    if (path === '/') {
      const indexPath = join(process.cwd(), 'dist', 'frontend', 'index.html');
      return new Response(Bun.file(indexPath), {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // 处理静态资源请求
    if (path.startsWith('/assets/')) {
      const filePath = join(process.cwd(), 'dist', 'frontend', path);
      try {
        const file = Bun.file(filePath);
        const exists = await file.exists();
        if (!exists) {
          return new Response('Not Found', { status: 404 });
        }
        
        return new Response(file, {
          headers: {
            'Content-Type': path.endsWith('.js') ? 'application/javascript' : 'text/plain',
          },
        });
      } catch (error) {
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
} 