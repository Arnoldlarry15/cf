import { MemoryRelationship, MemoryHistoryEvent, Memory, ChatMessage } from '../electron/shared/types';

export type { MemoryRelationship, MemoryHistoryEvent, Memory, ChatMessage };

export interface SearchQuery {
  text: string;
  category?: string;
  tags: string[];
  applications: string[];
  minConfidence: number;
}

export interface GraphNode {
  id: string;
  label: string;
  application: string;
  category: string;
  timestamp: string;
  x?: number;
  y?: number;
  z?: number;
  size: number;
  opacity: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
}

declare global {
  interface Window {
    captureflow?: {
      onStartSnipping: (callback: (dataUrl: string) => void) => () => void;
      processSnippet: (data: { dataUrl: string; rect: any }) => void;
      closeSnipper: () => void;
      snippets: {
        get: () => Promise<Memory[]>;
        getKnowledge: () => Promise<string>;
        delete: (id: string) => void;
        capture: (payload: Omit<Memory, 'id' | 'timestamp' | 'confidence' | 'relationships' | 'history' | 'imageUrl'>) => void;
        onUpdated: (callback: () => void) => () => void;
      };
      settings: {
        get: () => Promise<any>;
        save: (settings: any) => void;
        onUpdated: (callback: () => void) => () => void;
      };
      ai: {
        chat: (messages: Pick<ChatMessage, 'role' | 'text'>[]) => Promise<{
          success: boolean;
          provider: string;
          text: string;
          linkedMemories: string[];
          code?: string;
          message?: string;
        }>;
      };
    };
  }
}
