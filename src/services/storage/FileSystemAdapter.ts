import { injectable } from 'inversify';
import fs from 'fs/promises';
import path from 'path';
import { IStorageAdapter } from '@services/storage/IStorageAdapter';

@injectable()
export class FileSystemAdapter implements IStorageAdapter {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = this.getStorageDir();
  }

  /**
   * 获取存储目录
   * Mac 用户优先使用 iCloud Drive，其他用户使用本地目录
   */
  private getStorageDir(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    
    // 检查是否是 Mac 系统
    if (process.platform === 'darwin') {
      // iCloud Drive 路径
      const iCloudDir = path.join(
        homeDir,
        'Library',
        'Mobile Documents',
        'com~apple~CloudDocs',
        '.streamock-data'
      );
      
      // 同步检查 iCloud Drive 是否可用
      try {
        const iCloudBase = path.join(homeDir, 'Library', 'Mobile Documents', 'com~apple~CloudDocs');
        // 使用同步方式检查目录是否存在
        const fs_sync = require('fs');
        if (fs_sync.existsSync(iCloudBase)) {
          console.log('📦 Using iCloud Drive for data storage');
          return iCloudDir;
        }
      } catch (error) {
        console.log('⚠️  iCloud Drive not available, using local storage');
      }
    }
    
    // 回退到本地存储
    console.log('📦 Using local storage');
    return path.join(homeDir, '.streamock-data');
  }

  async init(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
  }
  
  /**
   * 获取存储目录路径（用于显示给用户）
   */
  getStoragePath(): string {
    return this.baseDir;
  }

  async write(filename: string, data: string): Promise<void> {
    const filePath = path.join(this.baseDir, filename);
    await fs.writeFile(filePath, data, 'utf-8');
  }

  async read(filename: string): Promise<string> {
    const filePath = path.join(this.baseDir, filename);
    return await fs.readFile(filePath, 'utf-8');
  }

  async delete(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async list(): Promise<string[]> {
    return await fs.readdir(this.baseDir);
  }
} 