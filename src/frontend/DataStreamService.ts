import { StreamDataInfo } from '@/models/StreamDataInfo';
import { plainToInstance } from 'class-transformer';
import { StreamAction } from '@/models/StreamMessage';
import { WebSocketService } from '@/frontend/WebSocketService';

export class DataStreamService {
    private static instance: DataStreamService;
    private readonly wsService: WebSocketService;

    private constructor() {
        this.wsService = WebSocketService.getInstance();
    }

    public static getInstance(): DataStreamService {
        if (!DataStreamService.instance) {
            DataStreamService.instance = new DataStreamService();
        }
        return DataStreamService.instance;
    }

    public addUpdateListener(callback: (action: StreamAction, key?: string) => void) {
        this.wsService.addUpdateListener(callback);
    }

    public removeUpdateListener(callback: (action: StreamAction, key?: string) => void) {
        this.wsService.removeUpdateListener(callback);
    }

    async submitData(streamData: StreamDataInfo): Promise<string> {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(streamData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.text();
    }

    async loadSavedDataList(): Promise<StreamDataInfo[]> {
        const response = await fetch('/api/list');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const savedDataJson = await response.json();
        return savedDataJson.map((item: unknown) => {
            const streamData = plainToInstance(StreamDataInfo, item);
            return streamData;
        });
    }

    async loadSavedData(key?: string): Promise<StreamDataInfo> {
        const url = key ? `/api/load?key=${key}` : '/api/load';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const streamData = plainToInstance(StreamDataInfo, result as unknown);
        return streamData;
    }

    async startStream(onDataReceived: (data: string) => void, variables?: Record<string, string>): Promise<void> {
        let response: Response;
        
        if (variables && Object.keys(variables).length > 0) {
            // Use POST with variables in body
            response = await fetch('/api/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(variables)
            });
        } else {
            // Use GET
            response = await fetch('/api/stream');
        }
        
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processText = (text: string) => {
            const lines = (buffer + text).split('\n');
            buffer = lines.pop() || '';

            lines.forEach(line => {
                if (line.trim() !== '') {
                    onDataReceived(line);
                    if (line.trim() === '[DONE]') {
                        reader.cancel();
                    }
                }
            });
        };

        const pump = async (): Promise<void> => {
            const { done, value } = await reader.read();
            if (done) {
                if (buffer) processText(buffer);
                return;
            }
            processText(decoder.decode(value, { stream: true }));
            return pump();
        };

        try {
            await pump();
        } catch (error) {
            console.error('Stream error:', error);
            throw error;
        }
    }

    async deleteSavedData(key: string): Promise<void> {
        const response = await fetch(`/api/delete?key=${key}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error('Failed to delete data');
        }
    }
} 