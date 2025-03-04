import { StreamDataInfo } from '@/models/StreamDataInfo';
import { plainToInstance } from 'class-transformer';

export class DataStreamService {
    private static instance: DataStreamService;
    private ws: WebSocket | null = null;
    private updateListeners: Set<() => void> = new Set();
    private reconnectTimer: number | null = null;
    private pingInterval: number | null = null;

    private constructor() {
        this.setupWebSocket();
    }

    static getInstance(): DataStreamService {
        if (!DataStreamService.instance) {
            DataStreamService.instance = new DataStreamService();
        }
        return DataStreamService.instance;
    }

    private setupWebSocket() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
                this.setupPing();
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                if (this.pingInterval) {
                    clearInterval(this.pingInterval);
                    this.pingInterval = null;
                }
                
                if (!this.reconnectTimer) {
                    this.reconnectTimer = setTimeout(() => {
                        this.setupWebSocket();
                    }, 5000) as unknown as number;
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'update') {
                        this.notifyUpdateListeners();
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Error setting up WebSocket:', error);
        }
    }

    private setupPing() {
        // 每 30 秒发送一次 ping
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000) as unknown as number;
    }

    // 添加更新监听器
    addUpdateListener(listener: () => void) {
        this.updateListeners.add(listener);
    }

    // 移除更新监听器
    removeUpdateListener(listener: () => void) {
        this.updateListeners.delete(listener);
    }

    // 通知所有监听器
    private notifyUpdateListeners() {
        this.updateListeners.forEach(listener => listener());
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

    async loadSavedData(key: string): Promise<StreamDataInfo> {
        const response = await fetch(`/api/load?key=${key}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const streamData = plainToInstance(StreamDataInfo, result as unknown);
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