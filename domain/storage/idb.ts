// IndexedDB storage layer with localStorage fallback
// Uses idb-keyval for simple key-value storage

import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

// Storage interface for type safety
interface StorageAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

// Check if IndexedDB is available
function isIDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

// LocalStorage fallback adapter
const localStorageAdapter: StorageAdapter = {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return undefined;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage set error:', error);
      throw error;
    }
  },

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage delete error:', error);
      throw error;
    }
  },
};

// IndexedDB adapter
const idbAdapter: StorageAdapter = {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await idbGet<T>(key);
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return undefined;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await idbSet(key, value);
    } catch (error) {
      console.error('IndexedDB set error:', error);
      throw error;
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await idbDel(key);
    } catch (error) {
      console.error('IndexedDB delete error:', error);
      throw error;
    }
  },
};

// Select the appropriate adapter
let storageAdapter: StorageAdapter;
let storageType: 'indexeddb' | 'localstorage' | 'none' = 'none';

if (typeof window !== 'undefined') {
  if (isIDBAvailable()) {
    storageAdapter = idbAdapter;
    storageType = 'indexeddb';
  } else {
    storageAdapter = localStorageAdapter;
    storageType = 'localstorage';
  }
}

// Public API
export async function get<T>(key: string): Promise<T | undefined> {
  if (!storageAdapter) return undefined;
  return storageAdapter.get<T>(key);
}

export async function set<T>(key: string, value: T): Promise<void> {
  if (!storageAdapter) {
    throw new Error('Storage not available');
  }
  return storageAdapter.set(key, value);
}

export async function del(key: string): Promise<void> {
  if (!storageAdapter) return;
  return storageAdapter.delete(key);
}

export function getStorageType(): 'indexeddb' | 'localstorage' | 'none' {
  return storageType;
}

export function isStorageAvailable(): boolean {
  return storageType !== 'none';
}
