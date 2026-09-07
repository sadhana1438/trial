import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server.js';
import * as streamPublisher from '../src/services/streamPublisher.js';

describe('Ingestion Service HTTP Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /health returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'equiflow-ingestion' });
  });

  it('POST /api/webhooks/slack responds to url_verification challenge', async () => {
    const res = await request(app)
      .post('/api/webhooks/slack')
      .send({ type: 'url_verification', challenge: 'challenge_token_abc' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ challenge: 'challenge_token_abc' });
  });

  it('POST /api/webhooks/github queues a valid PR review event', async () => {
    vi.spyOn(streamPublisher, 'publishToStream').mockResolvedValue('1725700000000-0');

    const githubPayload = {
      action: 'submitted',
      pull_request: {
        number: 101,
        changed_files: 5,
        additions: 120,
        deletions: 30,
      },
      review: {
        user: { login: 'sarahc' },
        submitted_at: '2026-09-07T12:00:00Z',
      },
      repository: {
        full_name: 'equiflow/core',
      },
    };

    const res = await request(app)
      .post('/api/webhooks/github')
      .set('x-github-event', 'pull_request_review')
      .send(githubPayload);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('queued');
    expect(res.body.stream_id).toBe('1725700000000-0');
  });

  it('POST /api/webhooks/slack queues an engineering support message', async () => {
    vi.spyOn(streamPublisher, 'publishToStream').mockResolvedValue('1725700000000-1');

    const slackPayload = {
      event: {
        type: 'message',
        user: 'U_ALEX_02',
        channel: 'eng-support',
        text: 'Need help with database connection pool',
        thread_ts: '1725700000.123',
      },
    };

    const res = await request(app)
      .post('/api/webhooks/slack')
      .send(slackPayload);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('queued');
    expect(res.body.stream_id).toBe('1725700000000-1');
  });
});
