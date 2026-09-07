import { Router, Request, Response } from 'express';
import { env, MONITORED_CHANNELS_LIST } from '../config/env.js';
import { verifySlackSignature } from '../services/signatureVerifier.js';
import { sanitizeSlackEvent } from '../services/privacySanitizer.js';
import { publishToStream } from '../services/streamPublisher.js';

export const slackRouter = Router();

slackRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  // 1. Slack URL Verification Challenge
  if (req.body?.type === 'url_verification') {
    res.status(200).json({ challenge: req.body.challenge });
    return;
  }

  const signature = req.header('x-slack-signature');
  const timestamp = req.header('x-slack-request-timestamp');

  // Enforce signature check if secret configured
  if (env.SLACK_SIGNING_SECRET && env.SLACK_SIGNING_SECRET !== 'dev_slack_secret_placeholder') {
    const rawBody = (req as unknown as { rawBody?: string }).rawBody || JSON.stringify(req.body);
    const isValid = verifySlackSignature(rawBody, signature, timestamp, env.SLACK_SIGNING_SECRET);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid Slack webhook signature or timestamp expired' });
      return;
    }
  }

  try {
    const sanitized = sanitizeSlackEvent(req.body, MONITORED_CHANNELS_LIST);
    if (!sanitized) {
      res.status(200).json({ status: 'ignored', reason: 'Unmonitored channel or excluded DM' });
      return;
    }

    const streamMessageId = await publishToStream(sanitized);
    res.status(202).json({
      status: 'queued',
      event_id: sanitized.event_id,
      stream_id: streamMessageId,
    });
  } catch (err) {
    console.error('[SLACK INGESTION ERROR]', err);
    res.status(500).json({ error: 'Failed to process Slack webhook' });
  }
});
