import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server?: Server;

  handleConnection(client: Socket) {
    console.log(`[WS] Conectado: ${client.id}`);
    client.emit('connected', { socketId: client.id });
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Desconectado: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { personId: string },
  ) {
    if (data?.personId) {
      client.join(`person:${data.personId}`);
      console.log(`[WS] ${client.id} unido a room person:${data.personId}`);
      return { joined: `person:${data.personId}` };
    }
    return { error: 'personId requerido' };
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { personId: string },
  ) {
    if (data?.personId) {
      client.leave(`person:${data.personId}`);
      return { left: `person:${data.personId}` };
    }
  }

  broadcastNotification(payload: any) {
    this.server?.emit('notification', payload);
  }

  sendToUser(personId: string, event: string, payload: any) {
    this.server?.to(`person:${personId}`).emit(event, payload);
  }

  sendToMany(personIds: string[], event: string, payload: any) {
    for (const id of personIds) {
      this.server?.to(`person:${id}`).emit(event, payload);
    }
  }
}
