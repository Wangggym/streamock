import { injectable } from 'inversify';
import { IDataService } from '@types';

@injectable()
export class DataService implements IDataService {
  private data: string = `Welcome to the Data Streaming Demo!
This is the initial data in the cache.
You can replace this with your own input.
Stream this data or submit new content.
[DONE]`;
  private combineLine: string = '';
  private separator: string = '';

  getData(): string {
    return this.data;
  }

  setData(data: string, combineLine: string, separator: string): void {
    this.data = data;
    this.combineLine = combineLine;
    this.separator = separator;
  }

  getCombineLine(): string {
    return this.combineLine;
  }

  getSeparator(): string {
    return this.separator;
  }
} 