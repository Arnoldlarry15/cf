// Write-Ahead Log (WAL) & Queue Engine for CaptureFlow
// Maintains an append-only event queue in localStorage/IndexedDB for instant local capture logging.

export interface WALEvent {
  walId: string;
  timestamp: string;
  type: 'CAPTURE' | 'UPDATE_NODE' | 'DELETE_NODE' | 'UPDATE_RELATIONSHIP';
  payload: any;
  synced: boolean;
}

const WAL_KEY = 'captureflow_wal_queue_v1';

export class WriteAheadLog {
  private static instance: WriteAheadLog;

  private constructor() {}

  public static getInstance(): WriteAheadLog {
    if (!WriteAheadLog.instance) {
      WriteAheadLog.instance = new WriteAheadLog();
    }
    return WriteAheadLog.instance;
  }

  public append(type: WALEvent['type'], payload: any): WALEvent {
    const event: WALEvent = {
      walId: `wal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      payload,
      synced: false
    };

    const queue = this.getQueue();
    queue.push(event);
    this.saveQueue(queue);

    return event;
  }

  public getQueue(): WALEvent[] {
    try {
      const raw = localStorage.getItem(WAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getUnsynced(): WALEvent[] {
    return this.getQueue().filter(e => !e.synced);
  }

  public markSynced(walIds: string[]): void {
    const set = new Set(walIds);
    const queue = this.getQueue().map(e => set.has(e.walId) ? { ...e, synced: true } : e);
    // Retain unsynced or last 50 items for log history
    const trimmed = queue.filter(e => !e.synced).concat(queue.filter(e => e.synced).slice(-50));
    this.saveQueue(trimmed);
  }

  private saveQueue(queue: WALEvent[]): void {
    try {
      localStorage.setItem(WAL_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('[WAL] Save queue failed:', e);
    }
  }
}
