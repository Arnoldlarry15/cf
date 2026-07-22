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
