import { injectable } from 'inversify';
import { StreamDataInfo } from '@/models/StreamDataInfo';

@injectable()
export class DataService {
  private streamData: StreamDataInfo;

  constructor() {
    this.streamData = new StreamDataInfo(
      `Welcome to the Data Streaming Demo!
This is the initial data in the cache.
You can replace this with your own input.
Stream this data or submit new content.`
    );
  }

  get data(): string {
    return this.streamData.data;
  }

  setData(streamData: StreamDataInfo): void {
    this.streamData = streamData;
  }

  get streamDataInfo(): StreamDataInfo {
    return this.streamData;
  }

  get combineLine(): string {
    return this.streamData.combineLine;
  }

  get separator(): string {
    return this.streamData.separator;
  }
} 