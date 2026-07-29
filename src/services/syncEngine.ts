// Resilient Background Sync Engine for CaptureFlow
// Continuously flushes queued Write-Ahead Log events to server database asynchronously.

import { WriteAheadLog } from './writeAheadLog';
import { API_BASE } from '../config';

export class SyncEngine {
  private static instance: SyncEngine;
  private isSyncing = false;
  private timer: any = null;

  private constructor() {}

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  public startBackgroundSync(intervalMs: number = 5000): void {
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

    if (unsynced.length === 0) return;

    this.isSyncing = true;
    try {
      const res = await fetch(`${API_BASE}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: unsynced })
      });

      if (res.ok) {
        const syncedIds = unsynced.map(e => e.walId);
        wal.markSynced(syncedIds);
      }
    } catch (e) {
      console.warn('[SyncEngine] Background sync attempt deferred (server unreachable or offline):', e);
    } finally {
      this.isSyncing = false;
    }
  }
}
