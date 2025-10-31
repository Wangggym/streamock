import { injectable, inject } from 'inversify';
import { BaseHandler } from '@services/handlers/BaseHandler';
import { DataService } from '@services/DataService';
import { plainToInstance } from 'class-transformer';
import { StreamDataInfo } from '@/models/StreamDataInfo';
import { StreamDataInfoRepository } from '@services/StreamDataInfoRepository';

@injectable()
export class SubmitHandler extends BaseHandler {
  constructor(
    @inject(DataService) dataService: DataService,
    @inject(StreamDataInfoRepository) private repository: StreamDataInfoRepository
  ) {
    super(dataService);
  }

  async handle(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const data: unknown = await req.json();
      console.log('📥 Received data:', JSON.stringify(data, null, 2));
      
      const streamData = plainToInstance(StreamDataInfo, data);
      console.log('✅ Parsed StreamDataInfo:', {
        data: streamData.data.substring(0, 100) + '...',
        variables: streamData.variables,
        domain: streamData.domain,
        name: streamData.name
      });
      
      this.dataService.setData(streamData);
      
      // 保存数据到本地存储
      await this.repository.save(streamData);

      return new Response(JSON.stringify({ 
        message: 'Data updated and saved successfully',
        key: streamData.encodedKey 
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('❌ Error handling submit:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return new Response(JSON.stringify({ 
        error: 'Invalid data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
} 