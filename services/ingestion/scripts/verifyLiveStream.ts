import { getRedisClient, publishToStream, STREAM_KEY } from '../src/services/streamPublisher.js';

async function verifyLiveStream() {
  console.log('[LIVE TEST] Connecting to Upstash Redis Stream:', STREAM_KEY);
  const client = getRedisClient();

  const testEvent = {
    event_id: crypto.randomUUID(),
    event_type: 'GITHUB_PR_REVIEW' as const,
    source: 'github' as const,
    user_identifier: 'sarahc',
    payload: {
      diff_size_bucket: 'L' as const,
      files_changed: 14,
      lines_changed: 480,
      external_reference: 'PR #100',
      context_identifier: 'repo:equiflow/core',
    },
    timestamp: new Date().toISOString(),
  };

  const messageId = await publishToStream(testEvent);
  console.log(`[LIVE TEST] Published event ${testEvent.event_id} with stream ID: ${messageId}`);

  const entries = await client.xrange(STREAM_KEY, messageId, messageId);
  console.log(`[LIVE TEST] Successfully read back from Redis Stream:`);
  console.log(JSON.stringify(entries, null, 2));

  await client.quit();
  console.log('[LIVE TEST] Verified successfully!');
}

verifyLiveStream().catch((err) => {
  console.error('[LIVE TEST ERROR]', err);
  process.exit(1);
});
