import { IDataService, IHandler } from '@types';

export abstract class BaseHandler implements IHandler {
  constructor(protected readonly dataService: IDataService) { }

  abstract handle(req: Request): Promise<Response>;
} 