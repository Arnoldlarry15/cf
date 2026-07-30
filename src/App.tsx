import React, { useEffect, useState } from 'react';
import { Sparkles, Layers, Info, Command, Minus, Square, X, Database, Activity } from 'lucide-react';
import { useAppStore } from './store';
import { SyncEngine, SyncStatus } from './services/syncEngine';

// Component imports
import Sidebar from './components/Sidebar';
import DashboardHome from './components/DashboardHome';
import MemorySpace3D from './components/MemorySpace3D';
import TimelineScrubber from './components/TimelineScrubber';
import MemoriesGrid from './components/MemoriesGrid';
import SettingsView from './components/SettingsView';
import AIChatPanel from './components/AIChatPanel';
import MemoryDetailModal from './components/MemoryDetailModal';
import CommandPalette from './components/CommandPalette';

export default function App() {
  const activeTab = useAppStore(state => state.activeTab);
  const setActiveTab = useAppStore(state => state.setActiveTab);
  const fetchMemories = useAppStore(state => state.fetchMemories);
  const selectedMemoryId = useAppStore(state => state.selectedMemoryId);
  const selectMemory = useAppStore(state => state.selectMemory);

  // Right sidebar tabs: 'assistant' or 'inspector'
  const [rightTab, setRightTab] = useState<'assistant' | 'inspector'>('assistant');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    isOnline: true
  });

  // Subscribe to background SyncEngine WAL status updates
  useEffect(() => {
    const syncEngine = SyncEngine.getInstance();
    const unsubscribe = syncEngine.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  // Global keyboard shortcuts (Ctrl+K for Command Palette, Esc for Dashboard return)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape' && !isCommandPaletteOpen) {
        setActiveTab('dashboard');
        selectMemory(null);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [setActiveTab, selectMemory, isCommandPaletteOpen]);

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
    <div className="w-screen h-screen overflow-hidden bg-[#050507] graph-bg text-[#e0e0e0] font-sans flex flex-col select-none">
      {/* Frameless Glassmorphic Header & Title Bar */}
      <header 
        className="h-10 bg-[#08080d]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-3 shrink-0 z-40"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        {/* Left: Brand Badge & Project Metadata */}
        <div className="flex items-center space-x-2.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
            <span className="text-[10px] font-bold font-mono text-cyan-300 tracking-wider">LA BUILDS</span>
          </div>
          <span className="text-xs font-bold text-stone-200">CaptureFlow</span>
          <span className="text-[9px] font-mono text-stone-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">v1.0.0</span>
        </div>

        {/* Center: Command Search Trigger */}
        <div className="flex items-center space-x-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center space-x-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-stone-400 hover:text-stone-200 transition-all cursor-pointer shadow-sm"
          >
            <Command size={12} className="text-cyan-400" />
            <span>Search or command...</span>
            <kbd className="px-1.5 py-0.5 text-[9px] bg-stone-800 rounded border border-stone-700 text-stone-400 font-mono">Ctrl+K</kbd>
          </button>
        </div>

        {/* Right: Sync Status Micro Badge & Window Controls */}
        <div className="flex items-center space-x-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Live Sync Status Pill */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/5 text-[10px] font-mono">
            <Database size={11} className="text-emerald-400 shrink-0" />
            <span className="text-emerald-400 hidden sm:inline">IndexedDB: Active (0ms)</span>
            <span className="text-stone-600 hidden sm:inline">|</span>
            <Activity size={11} className={syncStatus.isSyncing ? 'text-amber-400 animate-spin' : syncStatus.isOnline ? 'text-cyan-400' : 'text-stone-500'} />
            <span className={syncStatus.isSyncing ? 'text-amber-400' : syncStatus.isOnline ? 'text-cyan-400' : 'text-stone-400'}>
              {syncStatus.isSyncing ? 'Syncing WAL...' : syncStatus.pendingCount > 0 ? `WAL Queue (${syncStatus.pendingCount})` : 'WAL Synced'}
            </span>
          </div>

          {/* Window Frame Control Buttons */}
          {window.captureflow && (
            <div className="flex items-center space-x-1 border-l border-white/10 pl-2">
              <button
                onClick={() => window.captureflow?.window?.minimize()}
                className="p-1 hover:bg-white/10 rounded text-stone-400 hover:text-white transition-colors cursor-pointer"
                title="Minimize"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={() => window.captureflow?.window?.maximize()}
                className="p-1 hover:bg-white/10 rounded text-stone-400 hover:text-white transition-colors cursor-pointer"
                title="Maximize"
              >
                <Square size={11} />
              </button>
              <button
                onClick={() => window.captureflow?.window?.close()}
                className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded text-stone-400 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex h-full min-h-0 relative">
        {/* Left Side Sidebar */}
        <Sidebar />

        {/* Center Content Workspace */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* View Back Button Header */}
          {activeTab !== 'dashboard' && (
            <header className="px-6 pt-3 pb-2 border-b border-white/5 flex items-center justify-between bg-[#050507]/90 backdrop-blur-md z-30 relative shrink-0">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  selectMemory(null);
                }}
                className="flex items-center space-x-2 text-xs font-semibold text-stone-400 hover:text-blue-400 transition-colors cursor-pointer"
              >
                <span>&larr; Back to Dashboard</span>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-stone-800 rounded border border-stone-700 text-stone-400 font-mono">Esc</kbd>
              </button>
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                {activeTab === '3d-space' ? '3D Memory Space' : activeTab === 'list' ? 'Memory Catalog' : 'System Settings'}
              </span>
            </header>
          )}

          <main className="flex-1 relative min-h-0 overflow-hidden">
            {/* 1. Persistent 3D Canvas Layer - Never unmounts! */}
            <div
              className={`absolute inset-0 p-6 lg:p-8 flex flex-col space-y-4 transition-opacity duration-300 ease-in-out ${
                activeTab === '3d-space' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 relative min-h-[400px] glass shadow-2xl">
                <MemorySpace3D />
              </div>
              {/* Timeline scrubbing controller */}
              <TimelineScrubber />
            </div>

            {/* 2. Sub-View Panels */}
            <div
              className={`absolute inset-0 z-20 overflow-y-auto bg-[#050507]/95 backdrop-blur-md p-6 lg:p-8 transition-opacity duration-300 ease-in-out ${
                activeTab !== '3d-space' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            >
              {activeTab === 'dashboard' && <DashboardHome />}
              {activeTab === 'list' && <MemoriesGrid />}
              {activeTab === 'settings' && <SettingsView />}
            </div>
          </main>
        </div>

        {/* Right Side Sidebar Panel: AI Assistant and Inspector Details */}
        <div className="w-90 h-full bg-[#050507]/95 border-l border-white/5 flex flex-col shadow-2xl relative backdrop-blur-xl shrink-0">
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

      {/* Global Command Palette Overlay (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
