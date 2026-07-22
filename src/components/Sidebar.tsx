import React from 'react';
import { Home, Brain, ListCollapse, Settings, Network } from 'lucide-react';
import { useAppStore } from '../store';

export default function Sidebar() {
  const activeTab = useAppStore(state => state.activeTab);
  const setActiveTab = useAppStore(state => state.setActiveTab);
  const memories = useAppStore(state => state.memories);

  const menuItems = [
    { id: 'dashboard', label: 'Console Home', icon: <Home size={16} /> },
    { id: '3d-space', label: '3D Memory Space', icon: <Network size={16} /> },
    { id: 'list', label: 'Memory Catalog', icon: <ListCollapse size={16} /> },
    { id: 'settings', label: 'System Settings', icon: <Settings size={16} /> },
  ] as const;

  return (
    <div className="w-64 h-full bg-[#050507]/90 border-r border-white/5 flex flex-col justify-between p-4 shadow-2xl backdrop-blur-xl">
      <div className="space-y-8">
        {/* Branding Title */}
        <div className="flex items-center space-x-3 px-2 py-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Brain size={20} className="animate-pulse text-blue-400" />
          </div>
          <div>
            <span className="font-display font-bold text-sm tracking-tight text-[#FAFAF9] block">
              CaptureFlow
            </span>
            <span className="text-[9px] font-mono font-bold tracking-widest text-blue-500 uppercase">
              COGNITIVE OS <span className="text-white/30 font-light">v2.4.0</span>
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5">
          <span className="text-[10px] font-mono tracking-widest text-stone-500 uppercase block px-3 mb-2.5">
            WORKSPACE NAVIGATION
          </span>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition duration-300 relative group ${
                  isActive 
                    ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                    : 'text-stone-400 hover:text-[#FAFAF9] hover:bg-white/5 border border-transparent'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-3 bottom-3 w-0.5 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                )}
                <span className={isActive ? 'text-blue-400' : 'text-stone-500 group-hover:text-stone-300 transition duration-300'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User synchronization status panel */}
      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3 glass">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/10 flex items-center justify-center font-display text-xs font-bold text-white shadow-md">
            L
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-[#FAFAF9] block truncate">Larry (Host)</span>
            <span className="text-[9px] font-mono text-stone-500 block truncate">arnoldlarry15@gmail.com</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
          <div className="flex items-center space-x-1.5 text-[9px] text-blue-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping shadow-[0_0_5px_#3b82f6]" />
            <span>SYNCHRONIZED</span>
          </div>
          <span className="text-[10px] font-mono text-stone-400 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
            {memories.length} nodes
          </span>
        </div>
      </div>
    </div>
  );
}
