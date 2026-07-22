export interface MemoryRelationship {
  targetId: string;
  type: 'semantic' | 'temporal' | 'contextual' | 'usage';
  weight: number;
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
  timestamp: string;
  application: string;
  windowTitle: string;
  url?: string;
  summary: string;
  tags: string[];
  confidence: number;
  category: 'Work' | 'Design' | 'Dev' | 'Productivity' | 'Leisure';
  relationships: MemoryRelationship[];
  history: MemoryHistoryEvent[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  linkedMemories?: string[];
}

export interface CaptureFlowAPI {
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
}
