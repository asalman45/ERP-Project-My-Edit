// src/services/websocket.service.ts
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      
      // Join relevant rooms for real-time updates
      this.socket?.emit('join-room', 'work-orders');
      this.socket?.emit('join-room', 'production-tracking');
      this.socket?.emit('join-room', 'machines');
      this.socket?.emit('join-room', 'inventory');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Set up event listeners for real-time updates
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Work Order Events
    this.socket.on('work-order-status-changed', (data) => {
      this.emit('work-order-status-changed', data);
    });

    this.socket.on('new-work-order', (data) => {
      this.emit('new-work-order', data);
    });

    // Production Events
    this.socket.on('production-progress-updated', (data) => {
      this.emit('production-progress-updated', data);
    });

    this.socket.on('production-updated', (data) => {
      this.emit('production-updated', data);
    });

    // Machine Events
    this.socket.on('machine-status-changed', (data) => {
      this.emit('machine-status-changed', data);
    });

    // Inventory Events
    this.socket.on('material-consumed', (data) => {
      this.emit('material-consumed', data);
    });

    // Quality Events
    this.socket.on('quality-inspection-completed', (data) => {
      this.emit('quality-inspection-completed', data);
    });

    // Recipe Events
    this.socket.on('recipe-updated', (data) => {
      this.emit('recipe-updated', data);
    });
  }

  // Subscribe to specific events
  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Emit events to subscribers
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Join specific rooms
  joinRoom(room: string) {
    this.socket?.emit('join-room', room);
  }

  // Leave specific rooms
  leaveRoom(room: string) {
    this.socket?.emit('leave-room', room);
  }

  // Send custom events
  emitEvent(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export default new WebSocketService();

