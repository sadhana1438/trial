import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load root .env
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3001),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  GITHUB_WEBHOOK_SECRET: z.string().default('dev_github_secret_placeholder'),
  SLACK_SIGNING_SECRET: z.string().default('dev_slack_secret_placeholder'),
  MONITORED_SLACK_CHANNELS: z.string().default('C_SUPPORT_PUBLIC,eng-support'),
});

export const env = EnvSchema.parse({
  PORT: process.env.INGESTION_PORT || process.env.PORT,
  REDIS_URL: process.env.REDIS_URL,
  GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
  MONITORED_SLACK_CHANNELS: process.env.MONITORED_SLACK_CHANNELS,
});

export const MONITORED_CHANNELS_LIST = env.MONITORED_SLACK_CHANNELS.split(',').map((s) => s.trim());
