import { Router, Request, Response } from 'express';
import { env } from '../config/env.js';
import { verifyGithubSignature } from '../services/signatureVerifier.js';
import { sanitizeGithubEvent } from '../services/privacySanitizer.js';
import { publishToStream } from '../services/streamPublisher.js';

export const githubRouter = Router();

githubRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const signature = req.header('x-hub-signature-256');
  const eventType = req.header('x-github-event') || 'unknown';

  // If secret is set and not default placeholder, enforce signature verification
  if (env.GITHUB_WEBHOOK_SECRET && env.GITHUB_WEBHOOK_SECRET !== 'dev_github_secret_placeholder') {
    const rawBody = (req as unknown as { rawBody?: string }).rawBody || JSON.stringify(req.body);
    const isValid = verifyGithubSignature(rawBody, signature, env.GITHUB_WEBHOOK_SECRET);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid GitHub webhook signature' });
      return;
    }
  }

  try {
    const sanitized = sanitizeGithubEvent(eventType, req.body);
    if (!sanitized) {
      // Ignored event type or bot action
      res.status(200).json({ status: 'ignored', reason: 'Event type not tracked' });
      return;
    }

    const streamMessageId = await publishToStream(sanitized);
    res.status(202).json({
      status: 'queued',
      event_id: sanitized.event_id,
      stream_id: streamMessageId,
    });
  } catch (err) {
    console.error('[GITHUB INGESTION ERROR]', err);
    res.status(500).json({ error: 'Failed to process GitHub webhook' });
  }
});
