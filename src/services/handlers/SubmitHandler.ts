import { injectable, inject } from 'inversify';
import { IDataService } from '@types';
import { BaseHandler } from '@services/handlers/BaseHandler';
import { DataService } from '@services/DataService';
import { plainToInstance } from 'class-transformer';
import { StreamDataInfo } from '@/models/StreamDataInfo';

@injectable()
export class SubmitHandler extends BaseHandler {
  constructor(@inject(DataService) dataService: IDataService) {
    super(dataService);
  }

  async handle(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const data: unknown = await req.json();
      const streamData = plainToInstance(StreamDataInfo, data);
      this.dataService.setData(streamData.data, streamData.combineLine, streamData.separator);

      return new Response('Data updated successfully');
    } catch (error) {
      return new Response('Invalid data', { status: 400 });
    }
  }
} 