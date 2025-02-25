import { injectable, inject } from 'inversify';
import { StreamDataInfo } from '@/models/StreamDataInfo';
import qs from 'qs';
import { FileSystemAdapter } from './storage/FileSystemAdapter';

@injectable()
export class StreamDataInfoRepository {
  constructor(
    @inject(FileSystemAdapter) private storage: FileSystemAdapter
  ) {}

  private getKey(key: string): string {
    // Base64 编码逻辑保持不变...
    return Buffer.from(key).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async save(streamData: StreamDataInfo): Promise<void> {
    const key = this.getKey(streamData.key);
    await this.storage.write(key, streamData.data);
  }

  async findByKey(key: string): Promise<StreamDataInfo | null> {
    try {
      const safeKey = this.getKey(key);
      const data = await this.storage.read(safeKey);
      const params = qs.parse(key);
      
      return new StreamDataInfo(
        data,
        params.combineLine as string,
        params.separator as string,
        params.domain as string,
        params.name as string
      );
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const safeKey = this.getKey(key);
      await this.storage.delete(safeKey);
      return true;
    } catch {
      return false;
    }
  }

  async findAll(): Promise<StreamDataInfo[]> {
    try {
      const files = await this.storage.list();
      const streamDataList: StreamDataInfo[] = [];

      for (const file of files) {
        try {
          // 文件名就是key
          const key = file;
          const streamData = await this.findByKey(key);
          if (streamData) {
            streamDataList.push(streamData);
          }
        } catch (error) {
          console.error(`Error loading file ${file}:`, error);
        }
      }

      return streamDataList;
    } catch (error) {
      return [];
    }
  }
} 