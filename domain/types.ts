// Core domain types for the pairwise prioritizer

export type TaskId = string;
export type ListId = string;

export interface Task {
  id: TaskId;
  title: string;            // short label
  note?: string;            // optional longer text
  tags?: string[];
  done: boolean;
  createdAt: number;        // epoch ms
  updatedAt: number;        // epoch ms
}

export interface TaskList {
  id: ListId;
  name: string;
  taskOrder: TaskId[];      // final ranked order (top = highest priority)
  tasks: Record<TaskId, Task>;
  sorting: SortingState | null; // active pairwise session state
  createdAt: number;
  updatedAt: number;
  version: 1;               // schema version for migrations
}

// Stores the "human-comparator sort" in progress
export interface SortingState {
  algo: 'merge' | 'insertion';         // strategy
  comparisonsAsked: number;
  comparisonsTotal: number;            // estimated total for progress
  cache: Record<string, -1 | 0 | 1>;   // key `${a}|${b}` -> result
  // Internal cursor for the algorithm (e.g., merge sort stacks)
  internal: MergeSortState | null;
}

// Internal state for merge sort algorithm
export interface MergeSortState {
  runs: TaskId[][];         // current runs being merged
  stack: MergeFrame[];      // merge stack
  result: TaskId[];         // accumulated sorted result
}

export interface MergeFrame {
  left: TaskId[];
  right: TaskId[];
  leftIdx: number;
  rightIdx: number;
  merged: TaskId[];
}

// Global app state
export interface AppState {
  lists: Record<ListId, TaskList>;
  activeListId: ListId | null;
  hydrated: boolean;        // whether state has been loaded from storage
}

// Comparison result type
export type CompareResult = -1 | 0 | 1; // -1: a < b, 0: tie, 1: a > b
