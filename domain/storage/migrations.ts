// Schema version management and migrations

import type { TaskList, AppState } from '../types';

const CURRENT_VERSION = 1;

// Migration functions for each version upgrade
type MigrationFn = (data: any) => any;

const migrations: Record<number, MigrationFn> = {
  // Example migration from v0 to v1 (when we add migrations in future)
  // 1: (data) => {
  //   // Transform data structure
  //   return data;
  // },
};

export function migrateTaskList(list: any): TaskList {
  let current = list;
  const startVersion = current.version || 0;

  // Apply migrations sequentially
  for (let v = startVersion; v < CURRENT_VERSION; v++) {
    const migrateFn = migrations[v + 1];
    if (migrateFn) {
      current = migrateFn(current);
    }
  }

  // Ensure version is set
  current.version = CURRENT_VERSION;

  return current as TaskList;
}

export function migrateAppState(state: any): AppState {
  if (!state || typeof state !== 'object') {
    return getDefaultAppState();
  }

  // Migrate each list
  const migratedLists: Record<string, TaskList> = {};

  if (state.lists && typeof state.lists === 'object') {
    for (const [id, list] of Object.entries(state.lists)) {
      try {
        migratedLists[id] = migrateTaskList(list);
      } catch (error) {
        console.error(`Failed to migrate list ${id}:`, error);
        // Skip corrupted lists
      }
    }
  }

  return {
    lists: migratedLists,
    activeListId: state.activeListId || null,
    hydrated: true,
  };
}

export function getDefaultAppState(): AppState {
  return {
    lists: {},
    activeListId: null,
    hydrated: true,
  };
}

export function getCurrentVersion(): number {
  return CURRENT_VERSION;
}

export function validateTaskList(list: any): boolean {
  if (!list || typeof list !== 'object') return false;

  const required = ['id', 'name', 'taskOrder', 'tasks', 'createdAt', 'updatedAt'];
  return required.every(field => field in list);
}
