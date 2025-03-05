import { IHandler } from '@types';
import { DataService } from '@services/DataService';

export abstract class BaseHandler implements IHandler {
  constructor(protected readonly dataService: DataService) { }

  abstract handle(req: Request): Promise<Response>;
} 