import crypto from 'crypto';
import { calculateDiffSizeBucket, DiffSizeBucket } from './diffBucketer.js';

export interface SanitizedEvent {
  event_id: string;
  event_type: 'GITHUB_PR_REVIEW' | 'SLACK_SUPPORT' | 'GITHUB_COMMENT' | 'CALENDAR_MEETING';
  source: 'github' | 'slack' | 'calendar';
  user_identifier: string;
  payload: {
    diff_size_bucket?: DiffSizeBucket;
    files_changed?: number;
    lines_changed?: number;
    external_reference: string;
    context_identifier: string;
  };
  timestamp: string;
}

/**
 * Sanitize GitHub webhook events: discard all PR text, descriptions, comments, and commit messages.
 * Only extract metadata (Spec Section 8).
 */
export function sanitizeGithubEvent(
  eventTypeHeader: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
): SanitizedEvent | null {
  const repoName = body.repository?.full_name || 'unknown/repo';
  const contextId = `repo:${repoName}`;
  const now = new Date().toISOString();
  const eventId = crypto.randomUUID();

  // 1. Pull Request Review Submitted
  if (eventTypeHeader === 'pull_request_review') {
    const pr = body.pull_request || {};
    const review = body.review || {};
    const reviewer = review.user?.login || body.sender?.login;
    if (!reviewer) return null;

    const files = pr.changed_files || 0;
    const lines = (pr.additions || 0) + (pr.deletions || 0);
    const bucket = calculateDiffSizeBucket(files, lines);

    return {
      event_id: eventId,
      event_type: 'GITHUB_PR_REVIEW',
      source: 'github',
      user_identifier: reviewer,
      payload: {
        diff_size_bucket: bucket,
        files_changed: files,
        lines_changed: lines,
        external_reference: `PR #${pr.number || 'unknown'}`,
        context_identifier: contextId,
      },
      timestamp: review.submitted_at || now,
    };
  }

  // 2. Pull Request Review Requested
  if (eventTypeHeader === 'pull_request' && body.action === 'review_requested') {
    const pr = body.pull_request || {};
    const reviewer = body.requested_reviewer?.login;
    if (!reviewer) return null;

    const files = pr.changed_files || 0;
    const lines = (pr.additions || 0) + (pr.deletions || 0);
    const bucket = calculateDiffSizeBucket(files, lines);

    return {
      event_id: eventId,
      event_type: 'GITHUB_PR_REVIEW',
      source: 'github',
      user_identifier: reviewer,
      payload: {
        diff_size_bucket: bucket,
        files_changed: files,
        lines_changed: lines,
        external_reference: `PR #${pr.number || 'unknown'}`,
        context_identifier: contextId,
      },
      timestamp: now,
    };
  }

  // 3. Issue / PR Comment Created
  if (eventTypeHeader === 'issue_comment' && body.action === 'created') {
    const commenter = body.comment?.user?.login;
    if (!commenter) return null;

    return {
      event_id: eventId,
      event_type: 'GITHUB_COMMENT',
      source: 'github',
      user_identifier: commenter,
      payload: {
        external_reference: `issue:${body.issue?.number || 'unknown'}#comment-${body.comment?.id || ''}`,
        context_identifier: contextId,
      },
      timestamp: body.comment?.created_at || now,
    };
  }

  return null;
}

/**
 * Sanitize Slack webhook events: strictly discard message text.
 * Exclude DMs, private channels, and unmonitored channels (Spec Section 8).
 */
export function sanitizeSlackEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any,
  monitoredChannels: string[]
): SanitizedEvent | null {
  const event = body.event;
  if (!event || !event.channel) {
    return null;
  }

  // Exclude DMs and Group DMs (channel_type: 'im' or 'mpim')
  if (event.channel_type === 'im' || event.channel_type === 'mpim') {
    return null;
  }

  // Exclude unmonitored channels (Only predefined public channels tracked)
  if (monitoredChannels.length > 0 && !monitoredChannels.includes(event.channel)) {
    return null;
  }

  const userId = event.user;
  if (!userId) {
    return null;
  }

  const threadRef = event.thread_ts || event.ts || 'general';
  const now = new Date().toISOString();

  return {
    event_id: crypto.randomUUID(),
    event_type: 'SLACK_SUPPORT',
    source: 'slack',
    user_identifier: userId,
    payload: {
      external_reference: `thread:${threadRef}`,
      context_identifier: `slack:${event.channel}`,
    },
    timestamp: now,
  };
}
