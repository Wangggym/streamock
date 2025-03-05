import { injectable, inject } from 'inversify';
import { BaseHandler } from '@services/handlers/BaseHandler';
import { DataService } from '@services/DataService';
import { StreamDataInfoRepository } from '@services/StreamDataInfoRepository';

@injectable()
export class DeleteHandler extends BaseHandler {
  constructor(
    @inject(DataService) dataService: DataService,
    @inject(StreamDataInfoRepository) private repository: StreamDataInfoRepository
  ) {
    super(dataService);
  }

  async handle(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url);
      const key = url.searchParams.get('key');

      if (!key) {
        return new Response('Missing key parameter', { status: 400 });
      }

      const success = await this.repository.delete(key);
      
      if (!success) {
        return new Response('Data not found', { status: 404 });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('Error deleting data:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
} 