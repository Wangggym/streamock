import { injectable, inject } from 'inversify';
import { IDataService } from '@types';
import { BaseHandler } from '@services/handlers/BaseHandler';
import { DataService } from '@services/DataService';

interface SubmitData {
  data: string;
  combineLine: string;
  separator: string;
}

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
      const data: SubmitData = await req.json();
      this.dataService.setData(data.data, data.combineLine, data.separator);
      return new Response('Data updated successfully');
    } catch (error) {
      return new Response('Invalid data', { status: 400 });
    }
  }
} 