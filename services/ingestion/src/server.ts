import express, { Request, Response } from 'express';
import http from 'http';
import { env } from './config/env.js';
import { githubRouter } from './routes/github.js';
import { slackRouter } from './routes/slack.js';
import { WebSocketAlertRelay } from './websocket/relay.js';

export function createApp() {
  const app = express();

  // Middleware capturing raw body for signature verification
  app.use(
    express.json({
      verify: (req: Request & { rawBody?: string }, _res, buf) => {
        req.rawBody = buf.toString();
      },
    })
  );

  // Healthcheck
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'equiflow-ingestion' });
  });

  // Webhook Routes
  app.use('/api/webhooks/github', githubRouter);
  app.use('/api/webhooks/slack', slackRouter);

  return app;
}

export function startServer() {
  const app = createApp();
  const server = http.createServer(app);

  const relay = new WebSocketAlertRelay(server);

  server.listen(env.PORT, () => {
    console.log(`[INGESTION SERVICE] Running on port ${env.PORT}`);
    console.log(`[WEBSOCKET RELAY] WebSocket path: ws://localhost:${env.PORT}/ws/alerts`);
  });

  return { server, relay };
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer();
}
