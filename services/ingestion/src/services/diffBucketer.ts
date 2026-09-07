/**
 * EquiFlow PR Review Diff Size Bucketing
 * Spec Section 3.1:
 * | Diff size (files/lines changed) | Weight (hrs) | Bucket |
 * | XS (<=1 file, <20 lines)        | 0.25         | XS     |
 * | S (<=3 files, <100 lines)       | 0.50         | S      |
 * | M (<=10 files, <400 lines)      | 0.75         | M      |
 * | L (<=25 files, <1000 lines)     | 1.25         | L      |
 * | XL (beyond L)                   | 2.00         | XL     |
 */

export type DiffSizeBucket = 'XS' | 'S' | 'M' | 'L' | 'XL';

export const DIFF_WEIGHTS: Record<DiffSizeBucket, number> = {
  XS: 0.25,
  S: 0.5,
  M: 0.75,
  L: 1.25,
  XL: 2.0,
};

export function calculateDiffSizeBucket(filesChanged: number, linesChanged: number): DiffSizeBucket {
  if (filesChanged <= 1 && linesChanged < 20) {
    return 'XS';
  }
  if (filesChanged <= 3 && linesChanged < 100) {
    return 'S';
  }
  if (filesChanged <= 10 && linesChanged < 400) {
    return 'M';
  }
  if (filesChanged <= 25 && linesChanged < 1000) {
    return 'L';
  }
  return 'XL';
}
