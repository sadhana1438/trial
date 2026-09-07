import crypto from 'crypto';

/**
 * Verify GitHub webhook HMAC-SHA256 signature
 */
export function verifyGithubSignature(
  payloadRaw: string,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = signatureHeader.replace('sha256=', '');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadRaw, 'utf-8');
  const computedDigest = hmac.digest('hex');

  try {
    const sigBuffer = Buffer.from(expectedSignature, 'hex');
    const digestBuffer = Buffer.from(computedDigest, 'hex');
    if (sigBuffer.length !== digestBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuffer, digestBuffer);
  } catch {
    return false;
  }
}

/**
 * Verify Slack webhook signature with replay protection (Spec 8 / Slack Docs)
 */
export function verifySlackSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !timestampHeader || !signatureHeader.startsWith('v0=')) {
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestampHeader, 10);

  // Reject replay attacks older than 5 minutes (300s)
  if (isNaN(requestTime) || Math.abs(currentTime - requestTime) > 300) {
    return false;
  }

  const sigBasestring = `v0:${timestampHeader}:${rawBody}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(sigBasestring, 'utf-8');
  const computedSignature = `v0=${hmac.digest('hex')}`;

  try {
    const sigBuffer = Buffer.from(signatureHeader, 'utf-8');
    const compBuffer = Buffer.from(computedSignature, 'utf-8');
    if (sigBuffer.length !== compBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuffer, compBuffer);
  } catch {
    return false;
  }
}
