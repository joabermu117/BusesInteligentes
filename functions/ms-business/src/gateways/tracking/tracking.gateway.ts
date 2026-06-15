import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface BusLocationUpdate {
  busId: number;
  plate: string;
  latitude: number;
  longitude: number;
  lastUpdate: Date;
  speed?: number;
  routeId?: number;
  routeName?: string;
  currentStopId?: number;
  currentStopName?: string;
  passengers?: number;
  status: string; // 'normal' | 'delayed' | 'incident'
}

interface RouteSubscription {
  clientId: string;
  routeId: number;
}

@WebSocketGateway({
  namespace: '/tracking',
  cors: { origin: '*' },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server?: Server;

  // Track which clients are subscribed to which routes
  private routeSubscriptions: Map<string, Set<number>> = new Map();

  handleConnection(client: Socket) {
    console.log(`[Tracking] Nuevo cliente conectado: ${client.id}`);
    this.routeSubscriptions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    console.log(`[Tracking] Cliente desconectado: ${client.id}`);
    this.routeSubscriptions.delete(client.id);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { citizenId: string },
  ) {
    if (data?.citizenId) {
      client.join(data.citizenId);
      console.log(
        `[Tracking] Cliente ${client.id} unido a sala personal: ${data.citizenId}`,
      );
    }
    return { success: true };
  }

  @SubscribeMessage('subscribeRoute')
  handleSubscribeRoute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { routeId: number },
  ) {
    const subs = this.routeSubscriptions.get(client.id);
    if (subs && data.routeId) {
      subs.add(data.routeId);
      client.join(`route:${data.routeId}`);
      console.log(
        `[Tracking] Cliente ${client.id} suscrito a ruta #${data.routeId}`,
      );
    }
    return { success: true, routeId: data.routeId };
  }

  @SubscribeMessage('unsubscribeRoute')
  handleUnsubscribeRoute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { routeId: number },
  ) {
    const subs = this.routeSubscriptions.get(client.id);
    if (subs && data.routeId) {
      subs.delete(data.routeId);
      client.leave(`route:${data.routeId}`);
      console.log(
        `[Tracking] Cliente ${client.id} desuscrito de ruta #${data.routeId}`,
      );
    }
    return { success: true, routeId: data.routeId };
  }

  @SubscribeMessage('subscribeAll')
  handleSubscribeAll(@ConnectedSocket() client: Socket) {
    client.join('all-buses');
    console.log(`[Tracking] Cliente ${client.id} suscrito a todos los buses`);
    return { success: true };
  }

  @SubscribeMessage('unsubscribeAll')
  handleUnsubscribeAll(@ConnectedSocket() client: Socket) {
    client.leave('all-buses');
    return { success: true };
  }

  /**
   * Broadcast a single bus location update to subscribed clients
   */
  broadcastBusLocation(update: BusLocationUpdate) {
    // Send to clients subscribed to this specific route
    if (update.routeId) {
      this.server?.to(`route:${update.routeId}`).emit('busLocationUpdate', update);
    }
    // Also send to clients subscribed to all buses (supervisors/dashboard)
    this.server?.to('all-buses').emit('busLocationUpdate', update);
  }

  /**
   * Broadcast the full list of active buses (for dashboard refresh)
   */
  broadcastActiveBuses(buses: BusLocationUpdate[]) {
    this.server?.to('all-buses').emit('activeBusesUpdate', buses);
  }

  /**
   * Broadcast an alert (bus delayed, incident, etc.)
   */
  broadcastAlert(alert: {
    type: string;
    busId: number;
    plate: string;
    message: string;
    severity: string;
    routeId?: number;
  }) {
    this.server?.emit('busAlert', alert);
    if (alert.routeId) {
      this.server?.to(`route:${alert.routeId}`).emit('busAlert', alert);
    }
  }

  /**
   * Broadcast a weather alert to all connected clients
   */
  broadcastWeatherAlert(payload: {
    type: string;
    citizenId: string;
    title: string;
    message: string;
    forecast?: any;
    city?: string;
    timestamp: string;
  }) {
    this.server?.emit('busAlert', payload);
  }

  /**
   * Notify a specific client about a bus proximity alert
   */
  sendProximityNotification(
    clientId: string,
    notification: {
      busId: number;
      plate: string;
      routeName: string;
      estimatedMinutes: number;
      stopName: string;
      citizenId?: string;
      routeId?: number;
      stopId?: number;
    },
  ) {
    this.server?.to(clientId).emit('busProximity', notification);
  }
}
