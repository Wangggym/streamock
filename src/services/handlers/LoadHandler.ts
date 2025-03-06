import { injectable, inject } from 'inversify';
import { BaseHandler } from '@services/handlers/BaseHandler';
import { DataService } from '@services/DataService';
import { StreamDataInfoRepository } from '@services/StreamDataInfoRepository';

@injectable()
export class LoadHandler extends BaseHandler {
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
        // Return current data from DataService when no key is provided
        const currentData = this.dataService.streamDataInfo;
        return new Response(currentData.toString(), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const streamData = await this.repository.findByKey(key);
      
      if (!streamData) {
        return new Response('Data not found', { status: 404 });
      }

      // Set data to DataService
      this.dataService.setData(streamData);

      return new Response(streamData.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
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