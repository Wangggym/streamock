import { injectable } from 'inversify';
import fs from 'fs/promises';
import path from 'path';
import { IStorageAdapter } from './IStorageAdapter';

@injectable()
export class FileSystemAdapter implements IStorageAdapter {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.stream-data');
  }

  async init(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
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