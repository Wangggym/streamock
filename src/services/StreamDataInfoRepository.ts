import { injectable, inject } from 'inversify';
import { StreamDataInfo } from '@/models/StreamDataInfo';
import { FileSystemAdapter } from '@services/storage/FileSystemAdapter';

@injectable()
export class StreamDataInfoRepository {
  constructor(
    @inject(FileSystemAdapter) private storage: FileSystemAdapter
  ) {}

  async save(streamData: StreamDataInfo): Promise<void> {
    await this.storage.write(streamData.encodedKey, streamData.data);
  }

  async findByKey(key: string): Promise<StreamDataInfo | null> {
    try {
      const data = await this.storage.read(key);
      return StreamDataInfo.fromEncodedKey(key, data);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.storage.delete(key);
      return true;
    } catch {
      return false;
    }
  }

  async listAll(): Promise<StreamDataInfo[]> {
    try {
      const files = await this.storage.list();
      const streamDataList: StreamDataInfo[] = [];

      for (const file of files) {
        try {
          streamDataList.push(StreamDataInfo.fromEncodedKey(file));
        } catch (error) {
          console.error(`Error loading file ${file}:`, error);
        }
      }

      return streamDataList;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }
} 