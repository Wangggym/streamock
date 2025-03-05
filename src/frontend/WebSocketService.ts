import { StreamAction } from '@/models/StreamMessage';

export class WebSocketService {
    private static instance: WebSocketService;
    private ws: WebSocket | null = null;
    private updateListeners: Set<(action: StreamAction, key?: string) => void> = new Set();
    private reconnectTimer: number | null = null;
    private pingInterval: number | null = null;

    private constructor() {
        this.setupWebSocket();
    }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    private setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'streamDataUpdate') {
                    this.updateListeners.forEach(listener => {
                        listener(message.action, message.data?.key);
                    });
                } else if (message.type === 'pong') {
                    console.log('Received pong from server');
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
                this.pingInterval = null;
            }
            this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.ws?.close();
        };

        this.ws.onopen = () => {
            console.log('WebSocket connection established');
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            this.setupPing();
        };
    }

    private scheduleReconnect() {
        if (!this.reconnectTimer) {
            this.reconnectTimer = setTimeout(() => {
                console.log('Attempting to reconnect...');
                this.setupWebSocket();
            }, 5000) as unknown as number;
        }
    }

    private setupPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000) as unknown as number;
    }

    public addUpdateListener(callback: (action: StreamAction, key?: string) => void) {
        this.updateListeners.add(callback);
    }

    public removeUpdateListener(callback: (action: StreamAction, key?: string) => void) {
        this.updateListeners.delete(callback);
    }

    public isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    public close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
} 