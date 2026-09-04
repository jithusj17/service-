import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../../config/config.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  // options are passed through RedisIoAdapter
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers['authorization']?.split(' ')[1];

      if (!token) {
        throw new Error('No token provided');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.jwtSecret,
      });

      const tenantId = payload.tenantId;
      const userId = payload.sub;

      if (!tenantId) {
        throw new Error('No tenant ID in token');
      }

      // Join tenant specific room
      client.join(`tenant_${tenantId}`);
      
      // Optional: Join user specific room
      if (userId) {
        client.join(`user_${userId}`);
      }

      this.logger.debug(`Client connected: ${client.id} (tenant: ${tenantId}, user: ${userId})`);
    } catch (error) {
      this.logger.warn(`Connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }
}
