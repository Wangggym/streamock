import { injectable, inject } from 'inversify';
import { StreamDataInfo } from '@/models/StreamDataInfo';
import { FileSystemAdapter } from '@services/storage/FileSystemAdapter';

@injectable()
export class StreamDataInfoRepository {
  constructor(
    @inject(FileSystemAdapter) private storage: FileSystemAdapter
  ) {}

  async save(streamData: StreamDataInfo): Promise<void> {
    // 保存完整的 StreamDataInfo 对象（JSON 格式）
    const json = JSON.stringify({
      data: streamData.data,
      combineLine: streamData.combineLine,
      separator: streamData.separator,
      domain: streamData.domain,
      name: streamData.name,
      timestamp: streamData.timestamp,
      variables: streamData.variables || []
    });
    await this.storage.write(streamData.encodedKey, json);
  }

  async findByKey(key: string): Promise<StreamDataInfo | null> {
    try {
      const content = await this.storage.read(key);
      
      // 尝试解析为 JSON（新格式）
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && 'data' in parsed) {
          // 新格式：包含完整信息
          return new StreamDataInfo(
            parsed.data || '',
            parsed.combineLine || '',
            parsed.separator || '',
            parsed.domain || '',
            parsed.name || '',
            parsed.timestamp,
            key,
            parsed.variables || []
          );
        }
      } catch {
        // JSON 解析失败，认为是旧格式（纯文本）
      }
      
      // 旧格式：只有 data 字段
      return StreamDataInfo.fromEncodedKey(key, content);
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
          const loaded = await this.findByKey(file);
          if (loaded) {
            streamDataList.push(loaded);
          }
        } catch (error) {
          console.error(`Error loading file ${file}:`, error);
        }
      }

      // 按时间戳倒序排序（最新的在前面）
      streamDataList.sort((a, b) => {
        try {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA; // 倒序
        } catch {
          return 0;
        }
      });

      return streamDataList;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }
} 