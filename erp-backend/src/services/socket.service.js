// src/services/socket.service.js
import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';

class SocketService {
  constructor() {
    this.io = null;
    this.connections = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:8081", "http://localhost:8082", "http://localhost:8083", "http://localhost:9000", "http://127.0.0.1:9000"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', (socket) => {
      logger.info({ socketId: socket.id }, 'Client connected to WebSocket');
      
      // Store connection
      this.connections.set(socket.id, {
        socket,
        connectedAt: new Date(),
        rooms: new Set()
      });

      // Handle joining specific rooms for real-time updates
      socket.on('join-room', (room) => {
        socket.join(room);
        const connection = this.connections.get(socket.id);
        if (connection) {
          connection.rooms.add(room);
        }
        logger.info({ socketId: socket.id, room }, 'Client joined room');
      });

      // Handle leaving rooms
      socket.on('leave-room', (room) => {
        socket.leave(room);
        const connection = this.connections.get(socket.id);
        if (connection) {
          connection.rooms.delete(room);
        }
        logger.info({ socketId: socket.id, room }, 'Client left room');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id }, 'Client disconnected from WebSocket');
        this.connections.delete(socket.id);
      });

      // Handle work order updates
      socket.on('work-order-update', (data) => {
        logger.info({ socketId: socket.id, data }, 'Work order update received');
        this.broadcastToRoom('work-orders', 'work-order-updated', data);
      });

      // Handle production tracking updates
      socket.on('production-update', (data) => {
        logger.info({ socketId: socket.id, data }, 'Production update received');
        this.broadcastToRoom('production-tracking', 'production-updated', data);
      });
    });

    logger.info('WebSocket service initialized');
  }

  // Broadcast to all clients in a specific room
  broadcastToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
      logger.info({ room, event }, 'Broadcasted to room');
    }
  }

  // Broadcast to all connected clients
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      logger.info({ event }, 'Broadcasted to all clients');
    }
  }

  // Send to specific client
  sendToClient(socketId, event, data) {
    if (this.io) {
      this.io.to(socketId).emit(event, data);
      logger.info({ socketId, event }, 'Sent to specific client');
    }
  }

  // Get connection count
  getConnectionCount() {
    return this.connections.size;
  }

  // Get room members
  getRoomMembers(room) {
    if (this.io) {
      return this.io.sockets.adapter.rooms.get(room)?.size || 0;
    }
    return 0;
  }

  // Notify work order status change
  notifyWorkOrderStatusChange(workOrderId, oldStatus, newStatus, userId) {
    this.broadcastToRoom('work-orders', 'work-order-status-changed', {
      workOrderId,
      oldStatus,
      newStatus,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Notify production progress update
  notifyProductionProgress(workOrderId, operationId, progress, status) {
    this.broadcastToRoom('production-tracking', 'production-progress-updated', {
      workOrderId,
      operationId,
      progress,
      status,
      timestamp: new Date().toISOString()
    });
  }

  // Notify material consumption
  notifyMaterialConsumption(workOrderId, materialId, quantity, location) {
    this.broadcastToRoom('inventory', 'material-consumed', {
      workOrderId,
      materialId,
      quantity,
      location,
      timestamp: new Date().toISOString()
    });
  }

  // Notify quality inspection result
  notifyQualityInspection(workOrderId, operationId, result, defects) {
    this.broadcastToRoom('quality', 'quality-inspection-completed', {
      workOrderId,
      operationId,
      result,
      defects,
      timestamp: new Date().toISOString()
    });
  }

  // Notify machine status change
  notifyMachineStatusChange(machineId, status, reason) {
    this.broadcastToRoom('machines', 'machine-status-changed', {
      machineId,
      status,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  // Notify new work order created
  notifyNewWorkOrder(workOrder) {
    this.broadcastToRoom('work-orders', 'new-work-order', {
      workOrder,
      timestamp: new Date().toISOString()
    });
  }

  // Notify production recipe updated
  notifyRecipeUpdate(recipeId, changes) {
    this.broadcastToRoom('production-recipes', 'recipe-updated', {
      recipeId,
      changes,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export default new SocketService();

