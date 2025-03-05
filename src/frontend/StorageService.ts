import { StreamDataInfo } from '@/models/StreamDataInfo';
import { plainToInstance } from "class-transformer";

export class StorageService {
    private static instance: StorageService;
    private readonly STORAGE_KEY = 'streamDataInfo';

    private constructor() {}

    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    public saveStreamData(data: StreamDataInfo): void {
        localStorage.setItem(this.STORAGE_KEY, data.toString());
    }

    public loadStreamData(): StreamDataInfo | null {
        const storageData = localStorage.getItem(this.STORAGE_KEY);
        if (!storageData) {
            return null;
        }

        const parsedData: unknown = JSON.parse(storageData);
        return plainToInstance(StreamDataInfo, parsedData);
    }

    public clearStreamData(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }
} 