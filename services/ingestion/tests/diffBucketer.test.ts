import { describe, it, expect } from 'vitest';
import { calculateDiffSizeBucket } from '../src/services/diffBucketer.js';

describe('Diff Size Bucketing (Master Spec 3.1)', () => {
  it('classifies XS diffs correctly (<=1 file, <20 lines)', () => {
    expect(calculateDiffSizeBucket(1, 10)).toBe('XS');
    expect(calculateDiffSizeBucket(1, 19)).toBe('XS');
    expect(calculateDiffSizeBucket(0, 0)).toBe('XS');
  });

  it('classifies S diffs correctly (<=3 files, <100 lines)', () => {
    expect(calculateDiffSizeBucket(1, 20)).toBe('S');
    expect(calculateDiffSizeBucket(2, 50)).toBe('S');
    expect(calculateDiffSizeBucket(3, 99)).toBe('S');
  });

  it('classifies M diffs correctly (<=10 files, <400 lines)', () => {
    expect(calculateDiffSizeBucket(4, 50)).toBe('M');
    expect(calculateDiffSizeBucket(3, 100)).toBe('M');
    expect(calculateDiffSizeBucket(10, 399)).toBe('M');
  });

  it('classifies L diffs correctly (<=25 files, <1000 lines)', () => {
    expect(calculateDiffSizeBucket(11, 200)).toBe('L');
    expect(calculateDiffSizeBucket(10, 400)).toBe('L');
    expect(calculateDiffSizeBucket(25, 999)).toBe('L');
  });

  it('classifies XL diffs correctly (beyond L boundaries)', () => {
    expect(calculateDiffSizeBucket(26, 50)).toBe('XL');
    expect(calculateDiffSizeBucket(5, 1000)).toBe('XL');
    expect(calculateDiffSizeBucket(50, 5000)).toBe('XL');
  });
});
