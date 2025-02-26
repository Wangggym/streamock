import { StreamDataInfo } from '@/models/StreamDataInfo';

export class DataStreamService {
    private static instance: DataStreamService;
    
    private constructor() {}

    static getInstance(): DataStreamService {
        if (!DataStreamService.instance) {
            DataStreamService.instance = new DataStreamService();
        }
        return DataStreamService.instance;
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
        return savedDataJson.map((item: any) => {
            const streamData = new StreamDataInfo(
                item.data,
                item.combineLine,
                item.separator,
                item.domain,
                item.name
            );
            streamData.uuid = item.uuid;
            return streamData;
        });
    }

    async loadSavedData(key: string): Promise<StreamDataInfo> {
        const response = await fetch(`/api/load?key=${encodeURIComponent(key)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const streamData = new StreamDataInfo(
            result.data.data,
            result.data.combineLine,
            result.data.separator,
            result.data.domain,
            result.data.name
        );
        streamData.uuid = result.data.uuid;
        return streamData;
    }

    async startStream(onDataReceived: (data: string) => void): Promise<void> {
        const response = await fetch('/api/stream');
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
} 