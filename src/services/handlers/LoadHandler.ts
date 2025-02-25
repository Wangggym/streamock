import { injectable, inject } from 'inversify';
import { IDataService } from '@types';
import { BaseHandler } from '@services/handlers/BaseHandler';
import { DataService } from '@services/DataService';
import { StreamDataInfoRepository } from '@services/StreamDataInfoRepository';

@injectable()
export class LoadHandler extends BaseHandler {
  constructor(
    @inject(DataService) dataService: IDataService,
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

      const streamData = await this.repository.findByKey(key);
      
      if (!streamData) {
        return new Response('Data not found', { status: 404 });
      }

      // 设置数据到DataService
      this.dataService.setData(streamData.data, streamData.combineLine, streamData.separator);

      return new Response(JSON.stringify({ 
        message: 'Data loaded successfully',
        data: streamData 
      }), {
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