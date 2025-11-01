// Comparison result caching to avoid re-asking the same question

import type { TaskId, CompareResult } from '../types';
import type { ComparisonCache } from './types';

// Create a normalized cache key (always smaller ID first for consistency)
function createCacheKey(a: TaskId, b: TaskId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// Flip the result if we swapped the order
function normalizeResult(a: TaskId, b: TaskId, result: CompareResult): CompareResult {
  if (a < b) return result;
  // If we swapped, flip the result: -1 becomes 1, 1 becomes -1, 0 stays 0
  return (result === 0 ? 0 : -result) as CompareResult;
}

export function createComparisonCache(initialData?: Record<string, CompareResult>): ComparisonCache {
  const cache = new Map<string, CompareResult>();

  // Initialize from record if provided
  if (initialData) {
    Object.entries(initialData).forEach(([key, value]) => {
      cache.set(key, value);
    });
  }

  return {
    get(a: TaskId, b: TaskId): CompareResult | undefined {
      const key = createCacheKey(a, b);
      const cached = cache.get(key);

      if (cached === undefined) return undefined;

      return normalizeResult(a, b, cached);
    },

    set(a: TaskId, b: TaskId, result: CompareResult): void {
      const key = createCacheKey(a, b);
      const normalized = normalizeResult(a, b, result);
      cache.set(key, normalized);
    },

    has(a: TaskId, b: TaskId): boolean {
      const key = createCacheKey(a, b);
      return cache.has(key);
    },

    clear(): void {
      cache.clear();
    },

    toRecord(): Record<string, CompareResult> {
      const record: Record<string, CompareResult> = {};
      cache.forEach((value, key) => {
        record[key] = value;
      });
      return record;
    },

    fromRecord(record: Record<string, CompareResult>): void {
      cache.clear();
      Object.entries(record).forEach(([key, value]) => {
        cache.set(key, value);
      });
    },
  };
}

// Apply transitive closure to infer additional comparisons
// If A > B and B > C, then A > C
export function applyTransitiveClosure(cache: ComparisonCache, taskIds: TaskId[]): void {
  // Build a directed graph of comparisons
  const graph = new Map<TaskId, Set<TaskId>>();

  taskIds.forEach(id => graph.set(id, new Set()));

  // Add direct comparisons to graph
  taskIds.forEach(a => {
    taskIds.forEach(b => {
      if (a === b) return;
      const result = cache.get(a, b);
      if (result === 1) {
        // a > b
        graph.get(a)?.add(b);
      } else if (result === -1) {
        // a < b, so b > a
        graph.get(b)?.add(a);
      }
    });
  });

  // Floyd-Warshall-style transitive closure
  taskIds.forEach(k => {
    taskIds.forEach(i => {
      taskIds.forEach(j => {
        if (i === j || i === k || j === k) return;

        const iGreaterK = graph.get(i)?.has(k);
        const kGreaterJ = graph.get(k)?.has(j);

        if (iGreaterK && kGreaterJ) {
          graph.get(i)?.add(j);
          // Cache this inferred comparison
          if (!cache.has(i, j)) {
            cache.set(i, j, 1);
          }
        }
      });
    });
  });
}
