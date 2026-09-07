import { Redis } from 'ioredis';
import { z } from 'zod';
import { env } from '../config/env.js';

export const IngestionEventSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.enum(['GITHUB_PR_REVIEW', 'SLACK_SUPPORT', 'GITHUB_COMMENT', 'CALENDAR_MEETING']),
  source: z.enum(['github', 'slack', 'calendar']),
  user_identifier: z.string().min(1),
  payload: z.object({
    diff_size_bucket: z.enum(['XS', 'S', 'M', 'L', 'XL']).optional(),
    files_changed: z.number().optional(),
    lines_changed: z.number().optional(),
    external_reference: z.string(),
    context_identifier: z.string(),
  }),
  timestamp: z.string(),
});

export type IngestionEvent = z.infer<typeof IngestionEventSchema>;

export const STREAM_KEY = 'equiflow:events:stream';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    redisClient.on('error', (err) => {
      console.error('[REDIS ERROR]', err.message);
    });
  }
  return redisClient;
}

export function formatStreamMessage(event: IngestionEvent): { data: string } {
  return {
    data: JSON.stringify(event),
  };
}

export async function publishToStream(event: IngestionEvent): Promise<string> {
  const validated = IngestionEventSchema.parse(event);
  const client = getRedisClient();
  const message = formatStreamMessage(validated);

  // XADD equiflow:events:stream * data <json>
  const messageId = await client.xadd(STREAM_KEY, '*', 'data', message.data);
  return messageId;
}
