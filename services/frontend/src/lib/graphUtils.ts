/**
 * Graph styling and ethical visualization utilities
 * Master Spec Sections 2.C, 7, 8
 */

export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

export function getEdgeStyle(confidence: 'explicit' | 'inferred' | string): EdgeStyle {
  if (confidence === 'inferred') {
    return {
      stroke: '#94a3b8',
      strokeWidth: 2,
      strokeDasharray: '5, 5',
    };
  }

  // Explicit dependency edge
  return {
    stroke: '#6366f1',
    strokeWidth: 2.5,
  };
}

export function getNodeCardClass(wTotal: number, isOverloaded?: boolean): string {
  const overloaded = isOverloaded ?? wTotal > 1.0;
  if (overloaded) {
    return 'border-red-500 bg-red-950/40 shadow-lg shadow-red-500/20 animate-pulse';
  }
  return 'border-slate-700 bg-slate-900/80 shadow-md shadow-slate-900/50';
}

export function formatCollaborationCategory(eventType: string): string {
  switch (eventType) {
    case 'SLACK_SUPPORT':
      return 'Cross-Team Support';
    case 'GITHUB_PR_REVIEW':
      return 'Code Review & Architecture';
    case 'GITHUB_COMMENT':
      return 'Technical Discussion';
    case 'CALENDAR_MEETING':
      return 'Team Sync & Planning';
    default:
      return 'Engineering Collaboration';
  }
}
