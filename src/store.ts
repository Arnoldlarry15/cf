import { create } from 'zustand';
import { Memory, ChatMessage } from './types';
import { deleteMemoryLocal, updateMemoryLocal } from './services/storageEngine';
import { WriteAheadLog } from './services/writeAheadLog';

interface AppState {
  memories: Memory[];
  selectedMemoryId: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  timelineProgress: number; // 0 to 100 for historical replay
  playbackActive: boolean;
  playbackSpeed: number; // 1, 2, 5
  activeTab: 'dashboard' | '3d-space' | 'list' | 'settings';
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  activeGraphFocusId: string | null; // For centering graph node camera

  // Actions
  fetchMemories: () => Promise<void>;
  selectMemory: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleTag: (tag: string) => void;
  setTimelineProgress: (progress: number) => void;
  setPlaybackActive: (active: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setActiveTab: (tab: 'dashboard' | '3d-space' | 'list' | 'settings') => void;
  sendChatMessage: (text: string) => Promise<void>;
  captureNewMemory: (payload: {
    application: string;
    windowTitle: string;
    ocrText: string;
    summary: string;
    category: 'Work' | 'Design' | 'Dev' | 'Productivity' | 'Leisure';
    tags: string[];
  }) => Promise<void>;
  setGraphFocus: (id: string | null) => void;
  deleteMemory: (id: string) => Promise<void>;
  updateMemory: (id: string, patch: Partial<Memory>) => Promise<void>;
  clearChat: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  memories: [],
  selectedMemoryId: null,
  searchQuery: '',
  selectedCategory: null,
  selectedTags: [],
  timelineProgress: 100, // Show everything by default
  playbackActive: false,
  playbackSpeed: 1,
  activeTab: 'dashboard',
  chatMessages: [
    {
      id: 'welcome',
      role: 'model',
      text: "Welcome to CaptureFlow, Larry. I am your externalized cognitive system. I monitor your workflow context to preserve your momentum and recall anything instantly. Ask me about what you've been working on, find files/scripts, or explore the 3D Memory Space.",
      timestamp: new Date().toISOString(),
    }
  ],
  chatLoading: false,
  activeGraphFocusId: null,

  fetchMemories: async () => {
    try {
      if (window.captureflow) {
        const data = await window.captureflow.snippets.get();
        set({ memories: data });
      } else {
        const res = await fetch('/api/memories');
        if (res.ok) {
          const data = await res.json();
          set({ memories: data });
        }
      }
    } catch (err) {
      console.error("Error fetching memories:", err);
    }
  },

  selectMemory: (id) => set({ selectedMemoryId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  toggleTag: (tag) => set((state) => {
    const isSelected = state.selectedTags.includes(tag);
    return {
      selectedTags: isSelected 
        ? state.selectedTags.filter(t => t !== tag)
        : [...state.selectedTags, tag]
    };
  }),

  setTimelineProgress: (progress) => set({ timelineProgress: progress }),
  setPlaybackActive: (active) => set({ playbackActive: active }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  sendChatMessage: async (text) => {
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}-user`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg],
      chatLoading: true,
    }));

    try {
      const history = get().chatMessages.map(m => ({
        role: m.role,
        text: m.text
      }));

      if (window.captureflow) {
        const data = await window.captureflow.ai.chat(history);
        const modelMsg: ChatMessage = {
          id: `chat-${Date.now()}-model`,
          role: 'model',
          text: data.text,
          timestamp: new Date().toISOString(),
          linkedMemories: data.linkedMemories || [],
        };

        set((state) => ({
          chatMessages: [...state.chatMessages, modelMsg],
          chatLoading: false,
        }));

        if (data.linkedMemories && data.linkedMemories.length > 0) {
          set({ 
            selectedMemoryId: data.linkedMemories[0],
            activeGraphFocusId: data.linkedMemories[0]
          });
        }
      } else {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        });

        if (res.ok) {
          const data = await res.json();
          const modelMsg: ChatMessage = {
            id: `chat-${Date.now()}-model`,
            role: 'model',
            text: data.text,
            timestamp: new Date().toISOString(),
            linkedMemories: data.linkedMemories || [],
          };

          set((state) => ({
            chatMessages: [...state.chatMessages, modelMsg],
            chatLoading: false,
          }));

          if (data.linkedMemories && data.linkedMemories.length > 0) {
            set({ 
              selectedMemoryId: data.linkedMemories[0],
              activeGraphFocusId: data.linkedMemories[0]
            });
          }
        } else {
          throw new Error("Chat request failed");
        }
      }
    } catch (err) {
      console.error("Error communicating with Gemini Assistant:", err);
      const errorMsg: ChatMessage = {
        id: `chat-${Date.now()}-error`,
        role: 'model',
        text: "I experienced a cognitive interruption while contacting the brain module. Please ensure your settings/API keys are configured, or try again shortly.",
        timestamp: new Date().toISOString(),
      };
      set((state) => ({
        chatMessages: [...state.chatMessages, errorMsg],
        chatLoading: false,
      }));
    }
  },

  captureNewMemory: async (payload) => {
    try {
      if (window.captureflow) {
        await window.captureflow.snippets.capture(payload);
        await get().fetchMemories();
      } else {
        const res = await fetch('/api/memories/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await get().fetchMemories();
        }
      }
    } catch (err) {
      console.error("Error capturing memory:", err);
    }
  },

  setGraphFocus: (id) => set({ activeGraphFocusId: id }),
  deleteMemory: async (id) => {
    try {
      const updated = get().memories.filter(m => m.id !== id);
      set({
        memories: updated,
        selectedMemoryId: get().selectedMemoryId === id ? null : get().selectedMemoryId
      });
      await deleteMemoryLocal(id);
      WriteAheadLog.getInstance().append('DELETE_NODE', { deletedId: id });
    } catch (e) {
      console.error('[Store] Delete memory failed:', e);
    }
  },
  updateMemory: async (id, patch) => {
    try {
      const updated = get().memories.map(m => m.id === id ? { ...m, ...patch } : m);
      set({ memories: updated });
      await updateMemoryLocal(id, patch);
      WriteAheadLog.getInstance().append('UPDATE_NODE', { updatedId: id, patch });
    } catch (e) {
      console.error('[Store] Update memory failed:', e);
    }
  },
  clearChat: () => set({
    chatMessages: [
      {
        id: 'welcome',
        role: 'model',
        text: "Cognitive memory cache cleared. How can I help you navigate your digital workspace, Larry?",
        timestamp: new Date().toISOString(),
      }
    ]
  })
}));
