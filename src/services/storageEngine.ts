// Local Storage Engine for CaptureFlow (IndexedDB)
// Provides zero-latency browser-side persistence for captures, nodes, edges, and spatial layouts.

import { Memory } from '../types';

const DB_NAME = 'CaptureFlowDB';
const DB_VERSION = 1;
const MEMORIES_STORE = 'memories';
const LAYOUT_STORE = 'layouts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(MEMORIES_STORE)) {
        db.createObjectStore(MEMORIES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(LAYOUT_STORE)) {
        db.createObjectStore(LAYOUT_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMemoryLocal(memory: Memory): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(MEMORIES_STORE, 'readwrite');
    const store = tx.objectStore(MEMORIES_STORE);
    store.put(memory);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('[StorageEngine] Save memory error:', e);
  }
}

export async function deleteMemoryLocal(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(MEMORIES_STORE, 'readwrite');
    const store = tx.objectStore(MEMORIES_STORE);
    store.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('[StorageEngine] Delete memory error:', e);
  }
}

export async function updateMemoryLocal(id: string, patch: Partial<Memory>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(MEMORIES_STORE, 'readwrite');
    const store = tx.objectStore(MEMORIES_STORE);
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const existing = request.result;
        if (existing) {
          const updated = { ...existing, ...patch };
          store.put(updated);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('[StorageEngine] Update memory error:', e);
  }
}

export async function loadMemoriesLocal(): Promise<Memory[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(MEMORIES_STORE, 'readonly');
    const store = tx.objectStore(MEMORIES_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve((request.result || []) as Memory[]);
      request.onerror = () => resolve([]); // Fallback to empty array on read error
    });
  } catch (e) {
    console.error('[StorageEngine] Load memories error:', e);
    return [];
  }
}

export async function saveNodePositionsLocal(positionsMap: Record<string, { x: number; y: number; z: number }>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(LAYOUT_STORE, 'readwrite');
    const store = tx.objectStore(LAYOUT_STORE);
    store.put({ id: 'active_layout', positions: positionsMap, updatedAt: new Date().toISOString() });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('[StorageEngine] Save layout error:', e);
  }
}
