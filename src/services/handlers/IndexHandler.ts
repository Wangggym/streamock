import { injectable, inject } from 'inversify';
import { IDataService } from '@types';
import { BaseHandler } from '@services/handlers/BaseHandler';
import { DataService } from '@services/DataService';

@injectable()
export class IndexHandler extends BaseHandler {
  constructor(@inject(DataService) dataService: IDataService) {
    super(dataService);
  }

  async handle(req: Request): Promise<Response> {
    const indexPath = new URL('../../../index.html', import.meta.url);
    return new Response(Bun.file(indexPath));
  }
} 