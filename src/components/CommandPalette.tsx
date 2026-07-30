import React, { useState, useEffect, useMemo } from 'react';
import { Search, Box, LayoutDashboard, Grid, Settings, Sparkles, RefreshCw, X } from 'lucide-react';
import { useAppStore } from '../store';
import { SyncEngine } from '../services/syncEngine';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'View' | 'Memory' | 'Action';
  icon: React.ReactNode;
  onSelect: () => void;
}

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const memories = useAppStore(state => state.memories);
  const setActiveTab = useAppStore(state => state.setActiveTab);
  const selectMemory = useAppStore(state => state.selectMemory);
  const setGraphFocus = useAppStore(state => state.setGraphFocus);

  // Reset search when palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const items = useMemo(() => {
    const list: CommandItem[] = [
      {
        id: 'view-3d',
        title: '3D Spatial Memory Space',
        subtitle: 'Navigate interactive 3D knowledge octree graph',
        category: 'View',
        icon: <Box size={14} className="text-cyan-400" />,
        onSelect: () => {
          setActiveTab('3d-space');
          onClose();
        }
      },
      {
        id: 'view-dashboard',
        title: 'Dashboard Overview',
        subtitle: 'View global analytics, capture velocity, and cognitive stats',
        category: 'View',
        icon: <LayoutDashboard size={14} className="text-blue-400" />,
        onSelect: () => {
          setActiveTab('dashboard');
          onClose();
        }
      },
      {
        id: 'view-catalog',
        title: 'Memory Catalog',
        subtitle: 'Filter and search all captured text chunks & images',
        category: 'View',
        icon: <Grid size={14} className="text-emerald-400" />,
        onSelect: () => {
          setActiveTab('list');
          onClose();
        }
      },
      {
        id: 'view-settings',
        title: 'System Settings',
        subtitle: 'Configure LLM providers, database sync, and shortcuts',
        category: 'View',
        icon: <Settings size={14} className="text-purple-400" />,
        onSelect: () => {
          setActiveTab('settings');
          onClose();
        }
      },
      {
        id: 'action-flush-wal',
        title: 'Flush Write-Ahead Log Queue',
        subtitle: 'Sync all pending offline events to local Express server',
        category: 'Action',
        icon: <RefreshCw size={14} className="text-amber-400" />,
        onSelect: () => {
          SyncEngine.getInstance().flushQueue();
          onClose();
        }
      }
    ];

    if (query.trim()) {
      const q = query.toLowerCase();
      const filteredMemories = (memories || [])
        .filter(m => 
          m && (
            (m.windowTitle || '').toLowerCase().includes(q) ||
            (m.summary || '').toLowerCase().includes(q) ||
            (m.application || '').toLowerCase().includes(q) ||
            (m.ocrText || '').toLowerCase().includes(q)
          )
        )
        .slice(0, 8)
        .map((m, idx) => ({
          id: `mem-${m.id || idx}`,
          title: String(m.windowTitle || (m as any).title || 'Untitled Capture'),
          subtitle: String(m.summary || m.ocrText || m.application || '').slice(0, 80),
          category: 'Memory' as const,
          icon: <Sparkles size={14} className="text-sky-400" />,
          onSelect: () => {
            selectMemory(m.id);
            setGraphFocus(m.id);
            setActiveTab('3d-space');
            onClose();
          }
        }));

      return [...list.filter(item => item.title.toLowerCase().includes(q)), ...filteredMemories];
    }

    return list;
  }, [query, memories, setActiveTab, selectMemory, setGraphFocus, onClose]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  // Handle keyboard navigation inside command palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].onSelect();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-24 px-4 transition-all duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#090d16]/95 border border-cyan-500/30 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8),0_0_30px_rgba(59,130,246,0.2)] overflow-hidden flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <Search size={18} className="text-cyan-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search nodes (Ctrl+K)..."
            autoFocus
            className="w-full bg-transparent text-sm text-stone-100 placeholder-stone-500 focus:outline-none font-sans"
          />
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500 font-mono">
              No matching commands or knowledge nodes found.
            </div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-600/20 border border-blue-500/40 text-stone-100 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                      : 'text-stone-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-stone-900/80 border border-white/10 shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="text-xs font-semibold truncate">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[10px] text-stone-400 truncate leading-tight font-sans">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-stone-400 border border-white/10 shrink-0 ml-2">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/10 flex items-center justify-between text-[10px] text-stone-500 font-mono">
          <div className="flex items-center space-x-3">
            <span><kbd className="px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-400">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-400">↵</kbd> Select</span>
            <span><kbd className="px-1 py-0.5 bg-stone-800 rounded border border-stone-700 text-stone-400">Esc</kbd> Close</span>
          </div>
          <span className="text-cyan-500/80">CaptureFlow Command Mesh</span>
        </div>
      </div>
    </div>
  );
}
