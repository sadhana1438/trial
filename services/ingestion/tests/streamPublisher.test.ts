import { describe, it, expect } from 'vitest';
import { IngestionEventSchema, formatStreamMessage } from '../src/services/streamPublisher.js';

describe('Redis Streams Cross-Language Event Schema (Spec Section 4.1)', () => {
  it('validates compliant GITHUB_PR_REVIEW event schema', () => {
    const validEvent = {
      event_id: '123e4567-e89b-12d3-a456-426614174000',
      event_type: 'GITHUB_PR_REVIEW',
      source: 'github',
      user_identifier: 'sarahc',
      payload: {
        diff_size_bucket: 'L',
        files_changed: 15,
        lines_changed: 520,
        external_reference: 'PR #42',
        context_identifier: 'repo:org/backend',
      },
      timestamp: '2026-09-07T12:00:00Z',
    };

    const parsed = IngestionEventSchema.safeParse(validEvent);
    expect(parsed.success).toBe(true);
  });

  it('formats payload correctly into Redis Stream key-value pair', () => {
    const validEvent = {
      event_id: '123e4567-e89b-12d3-a456-426614174000',
      event_type: 'SLACK_SUPPORT',
      source: 'slack',
      user_identifier: 'U_ALEX_02',
      payload: {
        external_reference: 'thread:12345',
        context_identifier: 'slack:eng-support',
      },
      timestamp: '2026-09-07T12:00:00Z',
    };

    const streamMessage = formatStreamMessage(validEvent);
    expect(streamMessage).toHaveProperty('data');
    expect(typeof streamMessage.data).toBe('string');

    const deserialized = JSON.parse(streamMessage.data);
    expect(deserialized.event_type).toBe('SLACK_SUPPORT');
    expect(deserialized.user_identifier).toBe('U_ALEX_02');
  });

  it('rejects schema missing user_identifier or event_type', () => {
    const invalidEvent = {
      event_id: '123',
      source: 'github',
      payload: {},
      timestamp: '2026-09-07T12:00:00Z',
    };

    const parsed = IngestionEventSchema.safeParse(invalidEvent);
    expect(parsed.success).toBe(false);
  });
});
