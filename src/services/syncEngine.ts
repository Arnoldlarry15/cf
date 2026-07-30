// Resilient Background Sync Engine for CaptureFlow
// Continuously flushes queued Write-Ahead Log events to server database asynchronously.

import { WriteAheadLog } from './writeAheadLog';
import { API_BASE } from '../config';

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  isOnline: boolean;
}

export class SyncEngine {
  private static instance: SyncEngine;
  private isSyncing = false;
  private timer: any = null;
  private lastSyncTime: number | null = null;
  private isOnline = true;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  private constructor() {}

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  public getStatus(): SyncStatus {
    const wal = WriteAheadLog.getInstance();
    return {
      isSyncing: this.isSyncing,
      pendingCount: wal.getUnsynced().length,
      lastSyncTime: this.lastSyncTime,
      isOnline: this.isOnline
    };
  }

  private notify(): void {
    const status = this.getStatus();
    this.listeners.forEach(l => l(status));
  }

  public startBackgroundSync(intervalMs: number = 4000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.flushQueue();
    }, intervalMs);
  }

  public stopBackgroundSync(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async flushQueue(): Promise<void> {
    if (this.isSyncing) return;
    const wal = WriteAheadLog.getInstance();
    const unsynced = wal.getUnsynced();

    if (unsynced.length === 0) {
      this.notify();
      return;
    }

    this.isSyncing = true;
    this.notify();
    try {
      const res = await fetch(`${API_BASE}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: unsynced })
      });

      if (res.ok) {
        const syncedIds = unsynced.map(e => e.walId);
        wal.markSynced(syncedIds);
        this.lastSyncTime = Date.now();
        this.isOnline = true;
      } else {
        this.isOnline = false;
      }
    } catch (e) {
      this.isOnline = false;
      console.warn('[SyncEngine] Background sync attempt deferred (server unreachable or offline):', e);
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }
}
