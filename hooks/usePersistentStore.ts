// Hook for persisting Zustand store to IndexedDB with automatic hydration

'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/domain/state/store';
import { get, set, isStorageAvailable } from '@/domain/storage/idb';
import { migrateAppState } from '@/domain/storage/migrations';
import type { AppState } from '@/domain/types';

const STORAGE_KEY = 'prioritiser:app:v1';
const DEBOUNCE_MS = 300;

// Track if we've already initialized to prevent double hydration
let initialized = false;

export function usePersistentStore() {
  const hydrated = useStore(state => state.hydrated);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  // Hydrate from storage on mount
  useEffect(() => {
    if (initialized) return;
    initialized = true;

    const hydrateFromStorage = async () => {
      try {
        if (!isStorageAvailable()) {
          console.warn('Storage not available, running in memory-only mode');
          useStore.getState().setHydrated(true);
          return;
        }

        const saved = await get<any>(STORAGE_KEY);

        if (saved) {
          const migrated = migrateAppState(saved);
          useStore.getState().hydrate(migrated);
        } else {
          useStore.getState().setHydrated(true);
        }
      } catch (error) {
        console.error('Failed to hydrate from storage:', error);
        useStore.getState().setHydrated(true);
      }
    };

    hydrateFromStorage();
  }, []);

  // Subscribe to store changes and persist (debounced)
  useEffect(() => {
    if (!hydrated || !isStorageAvailable()) return;

    const unsubscribe = useStore.subscribe(async (state) => {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer to save after debounce period
      debounceTimer.current = setTimeout(async () => {
        try {
          const dataToSave: Partial<AppState> = {
            lists: state.lists,
            activeListId: state.activeListId,
          };

          await set(STORAGE_KEY, dataToSave);
        } catch (error) {
          console.error('Failed to persist to storage:', error);
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [hydrated]);

  return {
    hydrated,
    isStorageAvailable: isStorageAvailable(),
  };
}

// Helper to manually trigger a save (useful for critical operations)
export async function forceSave() {
  if (!isStorageAvailable()) return;

  try {
    const state = useStore.getState();
    const dataToSave: Partial<AppState> = {
      lists: state.lists,
      activeListId: state.activeListId,
    };

    await set(STORAGE_KEY, dataToSave);
  } catch (error) {
    console.error('Failed to force save:', error);
  }
}
