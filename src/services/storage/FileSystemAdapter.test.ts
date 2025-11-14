import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { FileSystemAdapter } from './FileSystemAdapter';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('FileSystemAdapter', () => {
  let adapter: FileSystemAdapter;
  let testDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // 保存原始环境变量
    originalEnv = { ...process.env };
    
    // 创建临时测试目录（使用系统临时目录）
    testDir = path.join(os.tmpdir(), 'streamock-test-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });
    
    // 设置 HOME 环境变量指向测试目录，避免污染真实用户数据
    process.env.HOME = testDir;
  });

  afterEach(async () => {
    // 恢复原始环境变量
    process.env = originalEnv;
    
    // 清理测试目录
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略错误
    }
  });

  describe('getStorageDir', () => {
    test('should use iCloud Drive on macOS when available', () => {
      // 保存原始值
      const originalPlatform = process.platform;
      const originalHome = process.env.HOME;

      try {
        // Mock macOS 环境
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
          writable: true,
          configurable: true,
        });

        process.env.HOME = '/Users/testuser';

        adapter = new FileSystemAdapter();
        const storagePath = adapter.getStoragePath();

        // 如果系统有 iCloud Drive，应该使用 iCloud 路径
        if (storagePath.includes('Mobile Documents')) {
          expect(storagePath).toContain('com~apple~CloudDocs');
          expect(storagePath).toContain('.streamock-data');
        } else {
          // 如果没有 iCloud，应该回退到本地存储
          expect(storagePath).toContain('.streamock-data');
        }
      } finally {
        // 恢复原始值
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
          configurable: true,
        });
        if (originalHome) {
          process.env.HOME = originalHome;
        }
      }
    });

    test('should use local storage on non-macOS systems', () => {
      const originalPlatform = process.platform;
      const originalHome = process.env.HOME;

      try {
        // Mock Linux 环境
        Object.defineProperty(process, 'platform', {
          value: 'linux',
          writable: true,
          configurable: true,
        });

        process.env.HOME = '/home/testuser';

        adapter = new FileSystemAdapter();
        const storagePath = adapter.getStoragePath();

        expect(storagePath).toBe('/home/testuser/.streamock-data');
        expect(storagePath).not.toContain('iCloud');
      } finally {
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
          configurable: true,
        });
        if (originalHome) {
          process.env.HOME = originalHome;
        }
      }
    });

    test('should use USERPROFILE on Windows when HOME is not available', () => {
      const originalPlatform = process.platform;
      const originalHome = process.env.HOME;
      const originalUserProfile = process.env.USERPROFILE;

      try {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
          writable: true,
          configurable: true,
        });

        delete process.env.HOME;
        process.env.USERPROFILE = 'C:\\Users\\testuser';

        adapter = new FileSystemAdapter();
        const storagePath = adapter.getStoragePath();

        expect(storagePath).toContain('.streamock-data');
      } finally {
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
          configurable: true,
        });
        if (originalHome) {
          process.env.HOME = originalHome;
        }
        if (originalUserProfile) {
          process.env.USERPROFILE = originalUserProfile;
        }
      }
    });
  });

  describe('file operations', () => {
    beforeEach(() => {
      adapter = new FileSystemAdapter();
    });

    test('should initialize storage directory', async () => {
      await adapter.init();
      const storagePath = adapter.getStoragePath();
      
      // 检查目录是否存在
      const stats = await fs.stat(storagePath);
      expect(stats.isDirectory()).toBe(true);
    });

    test('should write and read file', async () => {
      await adapter.init();
      
      const testData = 'test data content';
      const filename = 'test-file.txt';

      await adapter.write(filename, testData);
      const readData = await adapter.read(filename);

      expect(readData).toBe(testData);
    });

    test('should write and read JSON data', async () => {
      await adapter.init();
      
      const testData = {
        name: 'test',
        value: 123,
        nested: { key: 'value' }
      };
      const filename = 'test-json.json';

      await adapter.write(filename, JSON.stringify(testData));
      const readData = await adapter.read(filename);
      const parsedData = JSON.parse(readData);

      expect(parsedData).toEqual(testData);
    });

    test('should list files in storage', async () => {
      await adapter.init();
      
      // 创建几个测试文件
      await adapter.write('file1.txt', 'content1');
      await adapter.write('file2.txt', 'content2');
      await adapter.write('file3.txt', 'content3');

      const files = await adapter.list();

      expect(files.length).toBeGreaterThanOrEqual(3);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
      expect(files).toContain('file3.txt');
    });

    test('should delete file successfully', async () => {
      await adapter.init();
      
      const filename = 'test-delete.txt';
      await adapter.write(filename, 'test content');

      // 确认文件存在
      const contentBefore = await adapter.read(filename);
      expect(contentBefore).toBe('test content');

      // 删除文件
      const result = await adapter.delete(filename);
      expect(result).toBe(true);

      // 尝试读取已删除的文件应该抛出错误
      try {
        await adapter.read(filename);
        expect(true).toBe(false); // 不应该到这里
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should return false when deleting non-existent file', async () => {
      await adapter.init();
      
      const result = await adapter.delete('non-existent-file.txt');
      expect(result).toBe(false);
    });

    test('should handle concurrent writes', async () => {
      await adapter.init();
      
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(adapter.write(`file-${i}.txt`, `content-${i}`));
      }

      await Promise.all(promises);

      // 验证所有文件都写入成功
      for (let i = 0; i < 10; i++) {
        const content = await adapter.read(`file-${i}.txt`);
        expect(content).toBe(`content-${i}`);
      }
    });
  });

  describe('getStoragePath', () => {
    test('should return storage path', () => {
      adapter = new FileSystemAdapter();
      const path = adapter.getStoragePath();
      
      expect(path).toBeDefined();
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
      expect(path).toContain('.streamock-data');
    });

    test('should return consistent path', () => {
      adapter = new FileSystemAdapter();
      const path1 = adapter.getStoragePath();
      const path2 = adapter.getStoragePath();
      
      expect(path1).toBe(path2);
    });
  });
});

