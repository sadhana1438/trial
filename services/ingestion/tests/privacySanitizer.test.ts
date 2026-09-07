import { describe, it, expect } from 'vitest';
import { sanitizeGithubEvent, sanitizeSlackEvent } from '../src/services/privacySanitizer.js';

describe('Privacy & Zero-Content Scraping (Master Spec Section 8)', () => {
  it('strips all PR body text, commit comments, and code snippets from GitHub events', () => {
    const rawGithubPayload = {
      action: 'submitted',
      pull_request: {
        number: 42,
        title: 'Confidential Feature Implementation',
        body: 'Sensitive internal business logic and confidential details here...',
        user: { login: 'sarahc' },
        changed_files: 12,
        additions: 300,
        deletions: 50,
      },
      review: {
        user: { login: 'sarahc' },
        body: 'Here is a secret review comment containing customer data',
        state: 'approved',
      },
      repository: {
        full_name: 'acme/backend-service',
      },
    };

    const sanitized = sanitizeGithubEvent('pull_request_review', rawGithubPayload);

    expect(sanitized).toBeDefined();
    expect(sanitized.user_identifier).toBe('sarahc');
    expect(sanitized.event_type).toBe('GITHUB_PR_REVIEW');
    expect(sanitized.payload.diff_size_bucket).toBe('L');
    expect(sanitized.payload.context_identifier).toBe('repo:acme/backend-service');
    expect(sanitized.payload.external_reference).toBe('PR #42');

    // Assert strictly that NO text content leaked into payload
    const serialized = JSON.stringify(sanitized);
    expect(serialized).not.toContain('Sensitive internal business logic');
    expect(serialized).not.toContain('Confidential Feature Implementation');
    expect(serialized).not.toContain('secret review comment');
    expect(serialized).not.toContain('customer data');
  });

  it('strips Slack message text and only retains channel and thread metadata', () => {
    const rawSlackPayload = {
      type: 'event_callback',
      event: {
        type: 'message',
        user: 'U_ALEX_02',
        channel: 'C_SUPPORT_PUBLIC',
        channel_type: 'channel',
        text: 'Hello @support, our production database credentials are XYZ...',
        thread_ts: '1725700000.001',
        ts: '1725700010.002',
      },
    };

    const sanitized = sanitizeSlackEvent(rawSlackPayload, ['C_SUPPORT_PUBLIC']);

    expect(sanitized).toBeDefined();
    expect(sanitized!.user_identifier).toBe('U_ALEX_02');
    expect(sanitized!.event_type).toBe('SLACK_SUPPORT');
    expect(sanitized!.payload.context_identifier).toBe('slack:C_SUPPORT_PUBLIC');
    expect(sanitized!.payload.external_reference).toBe('thread:1725700000.001');

    // Verify text is discarded
    const serialized = JSON.stringify(sanitized);
    expect(serialized).not.toContain('production database credentials');
    expect(serialized).not.toContain('Hello @support');
  });

  it('rejects Slack messages from non-public or unmonitored channels (anti-snooping)', () => {
    const privateSlackPayload = {
      type: 'event_callback',
      event: {
        type: 'message',
        user: 'U_ALEX_02',
        channel: 'D_PRIVATE_DM_123',
        channel_type: 'im',
        text: 'Private direct message',
        ts: '1725700010.002',
      },
    };

    const sanitized = sanitizeSlackEvent(privateSlackPayload, ['C_SUPPORT_PUBLIC']);
    expect(sanitized).toBeNull();
  });
});
