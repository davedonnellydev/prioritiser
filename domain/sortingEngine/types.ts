// Types specific to the sorting engine

import type { TaskId, CompareResult } from '../types';

export interface ComparisonPair {
  a: TaskId;
  b: TaskId;
}

export interface SortingProgress {
  current: number;        // current comparison index
  total: number;          // estimated total comparisons
  percentage: number;     // 0-100
}

export interface ComparisonCache {
  get(a: TaskId, b: TaskId): CompareResult | undefined;
  set(a: TaskId, b: TaskId, result: CompareResult): void;
  has(a: TaskId, b: TaskId): boolean;
  clear(): void;
  toRecord(): Record<string, CompareResult>;
  fromRecord(record: Record<string, CompareResult>): void;
}
