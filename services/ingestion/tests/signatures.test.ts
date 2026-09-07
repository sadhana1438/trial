import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyGithubSignature, verifySlackSignature } from '../src/services/signatureVerifier.js';

describe('Webhook Signature Verification', () => {
  const GITHUB_SECRET = 'test_github_secret_123';
  const SLACK_SECRET = 'test_slack_secret_456';

  describe('GitHub HMAC-SHA256', () => {
    it('accepts valid GitHub signature', () => {
      const payload = JSON.stringify({ action: 'created', number: 10 });
      const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
      hmac.update(payload);
      const signature = `sha256=${hmac.digest('hex')}`;

      expect(verifyGithubSignature(payload, signature, GITHUB_SECRET)).toBe(true);
    });

    it('rejects tampered body or invalid signature', () => {
      const payload = JSON.stringify({ action: 'created', number: 10 });
      const tampered = JSON.stringify({ action: 'created', number: 99 });
      const hmac = crypto.createHmac('sha256', GITHUB_SECRET);
      hmac.update(payload);
      const signature = `sha256=${hmac.digest('hex')}`;

      expect(verifyGithubSignature(tampered, signature, GITHUB_SECRET)).toBe(false);
      expect(verifyGithubSignature(payload, 'sha256=bad_hex', GITHUB_SECRET)).toBe(false);
    });
  });

  describe('Slack HMAC-SHA256 with Replay Prevention', () => {
    it('accepts valid Slack signature within acceptable time window', () => {
      const body = 'command=%2Fsupport&text=help';
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const sigBasestring = `v0:${timestamp}:${body}`;
      const hmac = crypto.createHmac('sha256', SLACK_SECRET);
      hmac.update(sigBasestring);
      const signature = `v0=${hmac.digest('hex')}`;

      expect(verifySlackSignature(body, signature, timestamp, SLACK_SECRET)).toBe(true);
    });

    it('rejects expired timestamp (older than 5 minutes) to protect against replay attacks', () => {
      const body = 'command=%2Fsupport&text=help';
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 360).toString(); // 6 mins ago
      const sigBasestring = `v0:${oldTimestamp}:${body}`;
      const hmac = crypto.createHmac('sha256', SLACK_SECRET);
      hmac.update(sigBasestring);
      const signature = `v0=${hmac.digest('hex')}`;

      expect(verifySlackSignature(body, signature, oldTimestamp, SLACK_SECRET)).toBe(false);
    });
  });
});
