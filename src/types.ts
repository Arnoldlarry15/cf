export interface MemoryRelationship {
  targetId: string;
  type: 'semantic' | 'temporal' | 'contextual' | 'usage';
  weight: number; // 0.0 to 1.0 representing strength
}

export interface MemoryHistoryEvent {
  timestamp: string;
  action: string;
  details: string;
}

export interface Memory {
  id: string;
  imageUrl: string;
  ocrText: string;
  timestamp: string; // ISO 8601
  application: string; // e.g. "Slack", "VS Code", "Figma", "Notion", "Chrome"
  windowTitle: string;
  url?: string;
  summary: string;
  tags: string[];
  confidence: number; // 0.0 to 1.0 OCR accuracy
  category: 'Work' | 'Design' | 'Dev' | 'Productivity' | 'Leisure';
  relationships: MemoryRelationship[];
  history: MemoryHistoryEvent[];
}

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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  linkedMemories?: string[]; // IDs of memories relevant to this response
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
        capture: (payload: Omit<Memory, 'id' | 'timestamp' | 'confidence' | 'relationships' | 'history'>) => void;
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
