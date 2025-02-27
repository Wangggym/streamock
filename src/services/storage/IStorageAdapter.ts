export interface IStorageAdapter {
  init(): Promise<void>;
  write(path: string, data: string): Promise<void>;
  read(path: string): Promise<string>;
  delete(path: string): Promise<boolean>;
  list(): Promise<string[]>;
} 