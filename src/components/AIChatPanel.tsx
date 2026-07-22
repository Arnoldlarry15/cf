import React, { useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Send, Sparkles, Loader2, RefreshCw, Layers } from 'lucide-react';
import { useAppStore } from '../store';

export default function AIChatPanel() {
  const chatMessages = useAppStore(state => state.chatMessages);
  const chatLoading = useAppStore(state => state.chatLoading);
  const sendChatMessage = useAppStore(state => state.sendChatMessage);
  const clearChat = useAppStore(state => state.clearChat);
  const memories = useAppStore(state => state.memories);
  const selectMemory = useAppStore(state => state.selectMemory);
  const setGraphFocus = useAppStore(state => state.setGraphFocus);
  const setActiveTab = useAppStore(state => state.setActiveTab);

  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;
    
    sendChatMessage(input);
    setInput('');
  };

  // Helper to map linked memories ids to actual object data
  const getLinkedMemoryData = (ids?: string[]) => {
    if (!ids) return [];
    return memories.filter(m => ids.includes(m.id));
  };

  const handleFocusMemory = (id: string) => {
    selectMemory(id);
    setGraphFocus(id);
    setActiveTab('3d-space'); // Switch to 3D Space if not already there to show focus
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.15)]">
            <Sparkles size={16} />
          </div>
          <span className="text-sm font-semibold text-[#FAFAF9] tracking-tight">Gemini Memory Assistant</span>
        </div>
        <button
          onClick={clearChat}
          className="p-1.5 rounded-lg hover:bg-white/5 text-stone-400 hover:text-stone-200 transition"
          title="Clear Conversation Logs"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {chatMessages.map((msg) => {
          const isModel = msg.role === 'model';
          const linkedData = getLinkedMemoryData(msg.linkedMemories);

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isModel ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                  isModel
                    ? 'bg-white/5 text-[#FAFAF9] rounded-tl-none border border-white/5'
                    : 'bg-blue-600/15 text-blue-100 rounded-tr-none border border-blue-500/25'
                }`}
              >
                <div className="markdown-body prose prose-invert max-w-none text-xs leading-relaxed">
                  <Markdown>{msg.text}</Markdown>
                </div>

                {/* Linked memories interactive cards */}
                {isModel && linkedData.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-white/5">
                    <span className="text-[10px] font-semibold text-stone-400 tracking-wider uppercase block mb-2">
                      Linked Memory Map
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {linkedData.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleFocusMemory(m.id)}
                          className="flex items-center justify-between text-left px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition group text-xs text-stone-300 cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Layers size={12} className="text-blue-400" />
                            <span className="font-semibold text-stone-200">{m.application}:</span>
                            <span className="truncate text-stone-400">{m.windowTitle}</span>
                          </div>
                          <span className="text-[9px] font-mono text-blue-400 group-hover:translate-x-0.5 transition duration-300 ml-2">
                            FOCUS GRAPH →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-stone-500 font-mono mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {chatLoading && (
          <div className="flex items-center space-x-2.5 text-stone-400 bg-white/5 px-4 py-3 rounded-2xl border border-white/5 w-max">
            <Loader2 size={14} className="animate-spin text-blue-400" />
            <span className="text-xs font-mono font-medium tracking-wide">Syncing memory connections...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-slate-950/10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={chatLoading}
            placeholder={chatLoading ? "Querying external mind..." : "Ask Gemini about your workflow sessions..."}
            className="w-full pl-4 pr-12 py-3 bg-white/5 text-[#FAFAF9] border border-white/5 rounded-xl text-xs placeholder-stone-500 focus:outline-none focus:border-blue-500/50 transition duration-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || chatLoading}
            className="absolute right-2.5 p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="flex justify-between items-center mt-2.5 px-1.5">
          <span className="text-[10px] font-mono text-stone-500">
            Prompt Gemini directly about your captured logs.
          </span>
          <span className="text-[10px] font-mono text-stone-500">
            Shift + Enter
          </span>
        </div>
      </form>
    </div>
  );
}
