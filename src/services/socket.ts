import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../config/api';

class SocketService {
    private socket: Socket | null = null;

    connect(restaurantId: string) {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(WS_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            this.socket?.emit('joinRestaurant', restaurantId);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    onOrderCreated(callback: (order: any) => void) {
        this.socket?.on('order-created', callback);
    }

    onOrderUpdated(callback: (order: any) => void) {
        this.socket?.on('order-updated', callback);
    }

    onTableStatusChanged(callback: (table: any) => void) {
        this.socket?.on('table-status-changed', callback);
    }

    onKitchenAlert(callback: (alert: any) => void) {
        this.socket?.on('kitchen-alert', callback);
    }

    removeAllListeners() {
        this.socket?.removeAllListeners();
    }
}

export default new SocketService();
