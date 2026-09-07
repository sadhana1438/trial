import { describe, it, expect } from 'vitest';
import { getEdgeStyle, getNodeCardClass, formatCollaborationCategory } from '../src/lib/graphUtils.js';

describe('Frontend DAG Visual Styling & Ethics (Master Spec Sections 2.C, 7, 8)', () => {
  it('renders inferred dependency edges as dashed lines', () => {
    const inferredStyle = getEdgeStyle('inferred');
    expect(inferredStyle).toHaveProperty('strokeDasharray');
    expect(inferredStyle.strokeDasharray).toBe('5, 5');
    expect(inferredStyle.stroke).toBe('#94a3b8'); // Muted slate for inferred
  });

  it('renders explicit dependency edges as solid distinct lines', () => {
    const explicitStyle = getEdgeStyle('explicit');
    expect(explicitStyle.strokeDasharray).toBeUndefined();
    expect(explicitStyle.stroke).toBe('#6366f1'); // Solid indigo for explicit
  });

  it('applies pulsing red styling to overloaded nodes (W_total > 1.0)', () => {
    const overloadedClass = getNodeCardClass(1.25, true);
    expect(overloadedClass).toContain('border-red-500');
    expect(overloadedClass).toContain('animate-pulse');

    const normalClass = getNodeCardClass(0.75, false);
    expect(normalClass).not.toContain('border-red-500');
    expect(normalClass).not.toContain('animate-pulse');
  });

  it('enforces constructive collaboration terminology per Spec Section 8', () => {
    expect(formatCollaborationCategory('SLACK_SUPPORT')).toBe('Cross-Team Support');
    expect(formatCollaborationCategory('GITHUB_PR_REVIEW')).toBe('Code Review & Architecture');
    expect(formatCollaborationCategory('GITHUB_COMMENT')).toBe('Technical Discussion');
    expect(formatCollaborationCategory('CALENDAR_MEETING')).toBe('Team Sync & Planning');

    // Ethical safeguard: Never use deficit terms
    const allLabels = [
      formatCollaborationCategory('SLACK_SUPPORT'),
      formatCollaborationCategory('GITHUB_PR_REVIEW'),
    ];
    for (const label of allLabels) {
      expect(label.toLowerCase()).not.toContain('wasted');
      expect(label.toLowerCase()).not.toContain('distraction');
      expect(label.toLowerCase()).not.toContain('idle');
    }
  });
});
