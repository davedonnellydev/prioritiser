// Merge-sort based comparison engine for human-in-the-loop sorting
// O(n log n) comparisons on average

import type { TaskId, CompareResult, SortingState, MergeSortState, MergeFrame } from '../types';
import type { ComparisonPair, SortingProgress } from './types';
import { createComparisonCache } from './cache';

// Calculate estimated total comparisons for merge sort
function estimateComparisons(n: number): number {
  if (n <= 1) return 0;
  // For merge sort: approximately n * log2(n) comparisons
  return Math.ceil(n * Math.log2(n));
}

// Create a new sorting session
export function createSession(taskIds: TaskId[], existingCache?: Record<string, CompareResult>): SortingState {
  const cache = createComparisonCache(existingCache);

  // Initialize merge sort: start with individual elements as runs
  const runs: TaskId[][] = taskIds.map(id => [id]);

  return {
    algo: 'merge',
    comparisonsAsked: 0,
    comparisonsTotal: estimateComparisons(taskIds.length),
    cache: cache.toRecord(),
    internal: {
      runs,
      stack: [],
      result: [],
    },
  };
}

// Get the next pair to compare, or null if sorting is complete
export function requestNextPair(state: SortingState): ComparisonPair | null {
  if (!state.internal) return null;

  const internal = state.internal as MergeSortState;
  const cache = createComparisonCache(state.cache);

  // If we have an active merge frame, continue with it
  if (internal.stack.length > 0) {
    const frame = internal.stack[internal.stack.length - 1];

    // Check if current frame is complete
    if (frame.leftIdx >= frame.left.length || frame.rightIdx >= frame.right.length) {
      // Frame complete, pop it and add merged result
      internal.stack.pop();

      // Add remaining elements
      while (frame.leftIdx < frame.left.length) {
        frame.merged.push(frame.left[frame.leftIdx++]);
      }
      while (frame.rightIdx < frame.right.length) {
        frame.merged.push(frame.right[frame.rightIdx++]);
      }

      // Add merged result as a new run
      internal.runs.push(frame.merged);

      // Continue to next comparison
      return requestNextPair(state);
    }

    // Get next pair from current frame
    const a = frame.left[frame.leftIdx];
    const b = frame.right[frame.rightIdx];

    // Check cache
    if (cache.has(a, b)) {
      const result = cache.get(a, b)!;
      advanceFrame(frame, result);
      return requestNextPair(state);
    }

    return { a, b };
  }

  // No active frame, need to start a new merge
  if (internal.runs.length === 0) {
    return null; // No data to sort
  }

  if (internal.runs.length === 1) {
    // Sorting complete!
    internal.result = internal.runs[0];
    return null;
  }

  // Start merging the first two runs
  const left = internal.runs.shift()!;
  const right = internal.runs.shift()!;

  const newFrame: MergeFrame = {
    left,
    right,
    leftIdx: 0,
    rightIdx: 0,
    merged: [],
  };

  internal.stack.push(newFrame);

  return requestNextPair(state);
}

// Advance a merge frame based on comparison result
function advanceFrame(frame: MergeFrame, result: CompareResult): void {
  if (result === 1 || result === 0) {
    // Left element is greater or equal, take it first (descending order)
    frame.merged.push(frame.left[frame.leftIdx++]);
  } else {
    // Right element is greater
    frame.merged.push(frame.right[frame.rightIdx++]);
  }
}

// Commit a comparison result and advance the sorting algorithm
export function commitComparison(
  state: SortingState,
  a: TaskId,
  b: TaskId,
  result: CompareResult
): SortingState {
  const cache = createComparisonCache(state.cache);
  const internal = state.internal as MergeSortState;

  // Cache the result
  cache.set(a, b, result);

  // Advance the current frame
  if (internal.stack.length > 0) {
    const frame = internal.stack[internal.stack.length - 1];
    advanceFrame(frame, result);
  }

  return {
    ...state,
    comparisonsAsked: state.comparisonsAsked + 1,
    cache: cache.toRecord(),
    internal,
  };
}

// Check if sorting is complete
export function isComplete(state: SortingState): boolean {
  if (!state.internal) return true;

  const internal = state.internal as MergeSortState;
  return internal.runs.length === 1 && internal.stack.length === 0;
}

// Get the final sorted order (only valid when isComplete returns true)
export function finalize(state: SortingState): TaskId[] {
  if (!state.internal) return [];

  const internal = state.internal as MergeSortState;

  if (internal.runs.length === 1) {
    return internal.runs[0];
  }

  return internal.result;
}

// Get current progress
export function getProgress(state: SortingState): SortingProgress {
  const current = state.comparisonsAsked;
  const total = state.comparisonsTotal;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return {
    current,
    total,
    percentage: Math.min(100, percentage),
  };
}

// Reset sorting state but keep the cache
export function resetWithCache(state: SortingState, taskIds: TaskId[]): SortingState {
  return createSession(taskIds, state.cache);
}

// Validate that a sorting state is well-formed
export function validateState(state: SortingState): boolean {
  if (!state || typeof state !== 'object') return false;
  if (!state.internal) return false;

  const internal = state.internal as MergeSortState;
  return (
    Array.isArray(internal.runs) &&
    Array.isArray(internal.stack) &&
    Array.isArray(internal.result)
  );
}
