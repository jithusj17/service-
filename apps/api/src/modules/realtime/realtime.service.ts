import { Injectable } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  @WebSocketServer()
  server: Server;

  /**
   * Emit an event to all connected clients for a specific tenant.
   * @param tenantId The tenant ID
   * @param event The event name
   * @param payload The event payload
   */
  emitToTenant(tenantId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`tenant_${tenantId}`).emit(event, payload);
    }
  }

  /**
   * Emit an event to a specific user within a tenant.
   * @param userId The user ID
   * @param event The event name
   * @param payload The event payload
   */
  emitToUser(userId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`user_${userId}`).emit(event, payload);
    }
  }
}
