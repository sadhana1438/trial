import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

export const ALERTS_CHANNEL = 'equiflow:alerts';

export class WebSocketAlertRelay {
  private wss: WebSocketServer;
  private redisSubscriber: Redis;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws/alerts' });
    this.redisSubscriber = new Redis(env.REDIS_URL);

    this.initWebSocket();
    this.initRedisSubscription();
  }

  private initWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WEBSOCKET] Client connected to real-time alert feed');
      ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to EquiFlow Real-Time Alert Relay' }));

      ws.on('close', () => {
        console.log('[WEBSOCKET] Client disconnected');
      });
    });
  }

  private initRedisSubscription() {
    this.redisSubscriber.subscribe(ALERTS_CHANNEL, (err) => {
      if (err) {
        console.error('[REDIS SUB ERROR] Failed to subscribe to channel:', err.message);
      } else {
        console.log(`[REDIS SUB] Subscribed to pub/sub channel: ${ALERTS_CHANNEL}`);
      }
    });

    this.redisSubscriber.on('message', (channel, message) => {
      if (channel === ALERTS_CHANNEL) {
        this.broadcast(message);
      }
    });
  }

  public broadcast(message: string) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  public async close() {
    await this.redisSubscriber.quit();
    this.wss.close();
  }
}
