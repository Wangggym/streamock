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
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        
        try {
            const dataString = data.toString();
            if (this.isDataTooLarge(dataString, MAX_SIZE)) {
                this.saveWarningMessage(data, "数据过大没能保存到 localStorage（超过5MB）");
                return;
            }
            
            localStorage.setItem(this.STORAGE_KEY, dataString);
        } catch (e) {
            if (this.isQuotaExceededError(e)) {
                this.handleQuotaExceededError(data);
                return;
            }
            throw e;
        }
    }

    private isDataTooLarge(dataString: string, maxSize: number): boolean {
        const size = new Blob([dataString]).size;
        return size > maxSize;
    }

    private isQuotaExceededError(error: unknown): boolean {
        return error instanceof Error && error.name === 'QuotaExceededError';
    }

    private saveWarningMessage(data: StreamDataInfo, message: string): void {
        const warningData = new StreamDataInfo(
            message,
            data.combineLine,
            data.separator,
            data.domain,
            data.name
        );
        localStorage.setItem(this.STORAGE_KEY, warningData.toString());
    }

    private handleQuotaExceededError(data: StreamDataInfo): void {
        localStorage.removeItem(this.STORAGE_KEY);
        this.saveWarningMessage(data, "数据过大没能保存到 localStorage");
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