import { MemoryRelationship, MemoryHistoryEvent, Memory, ChatMessage, CaptureFlowAPI } from '../electron/shared/types';

export type { MemoryRelationship, MemoryHistoryEvent, Memory, ChatMessage, CaptureFlowAPI };

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
    captureflow?: CaptureFlowAPI;
  }
}
