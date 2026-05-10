import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server?: Server;

  handleConnection(client: Socket) {
    const query = client.handshake.query;
    console.log(`Nuevo dispositivo conectado: ${client.id}`);
    console.log('Query del socket:', JSON.stringify(query));
    client.emit('notifications', { hello: 'world' });
  }

  handleDisconnect(client: Socket) {
    console.log(`Dispositivo desconectado: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any): string {
    console.log('Mensaje recibido:', data);
    return 'Mensaje recibido correctamente';
  }

  broadcastNotification(payload: any) {
    this.server?.emit('notifications', payload);
  }
}