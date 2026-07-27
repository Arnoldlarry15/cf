import React, { useEffect, useState } from 'react';
import { Sparkles, Layers, Info, AlertTriangle } from 'lucide-react';
import { useAppStore } from './store';

// Component imports
import Sidebar from './components/Sidebar';
import DashboardHome from './components/DashboardHome';
import MemorySpace3D from './components/MemorySpace3D';
import TimelineScrubber from './components/TimelineScrubber';
import MemoriesGrid from './components/MemoriesGrid';
import SettingsView from './components/SettingsView';
import AIChatPanel from './components/AIChatPanel';
import MemoryDetailModal from './components/MemoryDetailModal';

export default function App() {
  const activeTab = useAppStore(state => state.activeTab);
  const setActiveTab = useAppStore(state => state.setActiveTab);
  const fetchMemories = useAppStore(state => state.fetchMemories);
  const selectedMemoryId = useAppStore(state => state.selectedMemoryId);
  const selectMemory = useAppStore(state => state.selectMemory);

  // Split-panel right sidebar tabs: 'assistant' or 'inspector'
  const [rightTab, setRightTab] = useState<'assistant' | 'inspector'>('assistant');

  // Global Escape key listener to exit modals or step back to dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedMemoryId) {
          selectMemory(null);
        } else if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMemoryId, activeTab, selectMemory, setActiveTab]);

  // Trigger initial database fetch and subscribe to Electron updates
  useEffect(() => {
    fetchMemories();
    if (window.captureflow) {
      const unsubscribe = window.captureflow.snippets.onUpdated(() => {
        fetchMemories();
      });
      return unsubscribe;
    }
  }, [fetchMemories]);

  // Automatically switch right-sidebar tab to 'inspector' when a memory node gets selected
  useEffect(() => {
    if (selectedMemoryId) {
      setRightTab('inspector');
    }
  }, [selectedMemoryId]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#050507] graph-bg text-[#e0e0e0] font-sans flex select-none">
      {/* 12-Column Layout */}
      <div className="flex-1 flex h-full">
        {/* Left Side Sidebar (Width: 256px / 64) */}
        <Sidebar />

        {/* Center Main Workspace (Flexible) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {activeTab !== 'dashboard' && (
            <div className="px-6 pt-4 pb-2 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center space-x-2 text-xs font-semibold text-stone-400 hover:text-blue-400 transition-colors"
              >
                <span>&larr; Back to Dashboard</span>
                <span className="text-[10px] text-stone-600 font-mono">(Esc)</span>
              </button>
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                {activeTab === '3d-space' ? '3D Memory Space' : activeTab === 'list' ? 'Memory Catalog' : 'System Settings'}
              </span>
            </div>
          )}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {activeTab === 'dashboard' && <DashboardHome />}
            
            {activeTab === '3d-space' && (
              <div className="w-full h-full flex flex-col space-y-4">
                <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 relative min-h-[400px] glass shadow-2xl">
                  <MemorySpace3D />
                </div>
                {/* Timeline scrubbing controller */}
                <TimelineScrubber />
              </div>
            )}

            {activeTab === 'list' && <MemoriesGrid />}

            {activeTab === 'settings' && <SettingsView />}
          </main>
        </div>

        {/* Right Side Sidebar Panel: AI Assistant and Inspector Details (Width: 360px / 90) */}
        <div className="w-90 h-full bg-[#050507]/95 border-l border-white/5 flex flex-col shadow-2xl relative backdrop-blur-xl">
          {/* Dual Tab Controller Header */}
          <div className="flex border-b border-white/5 p-2 bg-white/[0.01]">
            <button
              onClick={() => setRightTab('assistant')}
              className={`flex-1 py-2 text-center text-[10px] font-bold font-mono tracking-wider uppercase rounded-lg transition duration-300 flex items-center justify-center space-x-1.5 ${
                rightTab === 'assistant'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <Sparkles size={11} />
              <span>Cognitive Assistant</span>
            </button>
            <button
              onClick={() => setRightTab('inspector')}
              className={`flex-1 py-2 text-center text-[10px] font-bold font-mono tracking-wider uppercase rounded-lg transition duration-300 flex items-center justify-center space-x-1.5 ${
                rightTab === 'inspector'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <Layers size={11} />
              <span>Thought Inspector</span>
            </button>
          </div>

          {/* Sub-panels display */}
          <div className="flex-1 min-h-0 relative">
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                rightTab === 'assistant' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <AIChatPanel />
            </div>

            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                rightTab === 'inspector' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {selectedMemoryId ? (
                <MemoryDetailModal />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-stone-500 bg-[#050507]/40 border border-white/5 rounded-2xl m-0 glass">
                  <Info size={28} className="text-stone-600 mb-3" />
                  <span className="text-xs font-bold text-stone-400">Thought Inspector Idle</span>
                  <p className="text-[10px] text-stone-500 max-w-[220px] mt-1.5 leading-normal font-sans">
                    Click any node inside the **3D Memory Space** or explore cards in the **Memory Catalog** to examine OCR code, logs, and relationships.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
