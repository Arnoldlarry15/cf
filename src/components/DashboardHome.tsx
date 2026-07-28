import React, { useMemo } from 'react';
import { Search, Brain, Clock, ShieldCheck, Database, Layers, ArrowUpRight, Zap } from 'lucide-react';
import { useAppStore } from '../store';
import { Memory } from '../types';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Design: <Layers size={15} />,
  Dev: <Zap size={15} />,
  Productivity: <Database size={15} />,
  Work: <Brain size={15} />,
  Leisure: <Clock size={15} />,
};

const CATEGORY_BG_CLASSES: Record<string, string> = {
  Design: 'hover:border-rose-500/30 group-hover:bg-rose-500/10 hover:shadow-rose-950/10',
  Dev: 'hover:border-sky-500/30 group-hover:bg-sky-500/10 hover:shadow-sky-950/10',
  Productivity: 'hover:border-emerald-500/30 group-hover:bg-emerald-500/10 hover:shadow-emerald-950/10',
  Work: 'hover:border-amber-500/30 group-hover:bg-amber-500/10 hover:shadow-amber-950/10',
  Leisure: 'hover:border-violet-500/30 group-hover:bg-violet-500/10 hover:shadow-violet-950/10',
};

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  Design: 'text-rose-400',
  Dev: 'text-sky-400',
  Productivity: 'text-emerald-400',
  Work: 'text-amber-400',
  Leisure: 'text-violet-400',
};

export default function DashboardHome() {
  const memories = useAppStore(state => state.memories);
  const selectMemory = useAppStore(state => state.selectMemory);
  const setGraphFocus = useAppStore(state => state.setGraphFocus);
  const setActiveTab = useAppStore(state => state.setActiveTab);
  
  const searchQuery = useAppStore(state => state.searchQuery);
  const setSearchQuery = useAppStore(state => state.setSearchQuery);
  
  const selectedCategory = useAppStore(state => state.selectedCategory);
  const setSelectedCategory = useAppStore(state => state.setSelectedCategory);

  // Compute stats
  const stats = useMemo(() => {
    const list = memories || [];
    if (list.length === 0) return { total: 0, confidence: 0, appsCount: 0, uniqueTags: 0 };
    
    const confidenceSum = list.reduce((acc, m) => acc + (m?.confidence || 0), 0);
    const uniqueApps = new Set(list.map(m => m?.application || 'Unknown'));
    const allTags = list.flatMap(m => m?.tags || []);
    const uniqueTags = new Set(allTags);

    return {
      total: list.length,
      confidence: (confidenceSum / list.length) * 100,
      appsCount: uniqueApps.size,
      uniqueTags: uniqueTags.size,
    };
  }, [memories]);

  // Group by Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Design: 0, Dev: 0, Productivity: 0, Work: 0, Leisure: 0 };
    (memories || []).forEach(m => {
      if (m && m.category && counts[m.category] !== undefined) counts[m.category]++;
    });
    return counts;
  }, [memories]);

  // Extract recent memory cards (first 4 by timestamp descending)
  const recentMemories = useMemo(() => {
    return [...(memories || [])]
      .filter(m => m && m.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 4);
  }, [memories]);

  // Gather unique tags (first 10 for display)
  const tagList = useMemo(() => {
    const counts: Record<string, number> = {};
    (memories || []).flatMap(m => m?.tags || []).forEach(t => {
      if (t) counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  }, [memories]);

  const handleInspectMemory = (id: string) => {
    selectMemory(id);
    setGraphFocus(id);
    setActiveTab('3d-space'); // transition into the 3D map for immersion
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(selectedCategory === cat ? null : cat);
    setActiveTab('list'); // transition to structured search list
  };

  const handleTriggerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('list');
  };

  return (
    <div className="w-full h-full min-h-full text-[#FAFAF9] space-y-8 max-w-6xl mx-auto pb-10 flex flex-col z-20">
      {/* Search Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display text-[#FAFAF9]">
            Good evening, <span className="text-blue-400">Larry</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            CaptureFlow is active. Preserving workflow momentum and recording external knowledge.
          </p>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleTriggerSearch} className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search OCR context, tags, or apps..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 text-[#FAFAF9] text-xs border border-white/10 rounded-full focus:outline-none focus:border-blue-500/50 transition duration-300 placeholder-stone-500 shadow-lg"
          />
          <Search size={14} className="absolute left-3.5 top-3.5 text-stone-500" />
        </form>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/5 bg-[#0a0a0f]/80 hover:bg-[#0f0f14]/80 transition-all duration-300 glass hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <div className="flex justify-between items-center text-stone-400 mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-stone-500">Total Knowledge Nodes</span>
            <Layers size={14} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-[#FAFAF9] font-mono">{stats.total}</div>
          <p className="text-[10px] text-stone-500 font-mono mt-1">Unique snapshots captured</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 bg-[#0a0a0f]/80 hover:bg-[#0f0f14]/80 transition-all duration-300 glass hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]">
          <div className="flex justify-between items-center text-stone-400 mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-stone-500">Cognitive Clusters</span>
            <Brain size={14} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-[#FAFAF9] font-mono">5</div>
          <p className="text-[10px] text-stone-500 font-mono mt-1">Primary work categories</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 bg-[#0a0a0f]/80 hover:bg-[#0f0f14]/80 transition-all duration-300 glass hover:shadow-[0_0_20px_rgba(52,211,153,0.1)]">
          <div className="flex justify-between items-center text-stone-400 mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-stone-500">Median OCR Quality</span>
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[#FAFAF9] font-mono">{stats.confidence.toFixed(1)}%</div>
          <p className="text-[10px] text-stone-500 font-mono mt-1">Reconstructed text confidence</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 bg-[#0a0a0f]/80 hover:bg-[#0f0f14]/80 transition-all duration-300 glass hover:shadow-[0_0_20px_rgba(251,113,133,0.1)]">
          <div className="flex justify-between items-center text-stone-400 mb-2">
            <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-stone-500">Active Applications</span>
            <Database size={14} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-[#FAFAF9] font-mono">{stats.appsCount}</div>
          <p className="text-[10px] text-stone-500 font-mono mt-1">Focus targets logged</p>
        </div>
      </div>

      {/* Cluster Categories Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase">Interactive Cognitive Clusters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => handleSelectCategory(cat)}
              className={`group p-4 rounded-xl border border-white/5 bg-[#0a0a0f]/80 text-left transition-all duration-300 shadow-md glass ${CATEGORY_BG_CLASSES[cat]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-1.5 rounded-lg bg-white/5 border border-white/5 ${CATEGORY_TEXT_COLORS[cat]} group-hover:scale-105 transition duration-300`}>
                  {CATEGORY_ICONS[cat]}
                </div>
                <span className="text-[9px] font-mono font-bold text-stone-500 tracking-widest uppercase">CLUSTER</span>
              </div>
              <span className="text-xs font-bold text-stone-200 block truncate">{cat}</span>
              <span className="text-[10px] font-mono text-[#FAFAF9]/80 mt-1 block">
                {count} visible snapshot{count !== 1 ? 's' : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Recent Snapshots & Tag Cloud */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity timeline feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase">Recent Memory Snapshots</h3>
            <button 
              onClick={() => setActiveTab('list')}
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition uppercase font-mono tracking-wide"
            >
              Explore Full Catalog &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {recentMemories.map(m => (
              <div
                key={m.id}
                onClick={() => handleInspectMemory(m.id)}
                className="group p-4 rounded-xl border border-white/5 bg-[#0a0a0f]/80 hover:bg-white/[0.02] hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition duration-300 cursor-pointer flex items-center justify-between glass"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-stone-500 mb-1">
                    <span className="font-semibold text-stone-300">{m.application}</span>
                    <span>&bull;</span>
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-stone-200 truncate group-hover:text-blue-400 transition duration-300">
                    {m.windowTitle}
                  </h4>
                  <p className="text-[10px] text-stone-400 truncate mt-0.5">
                    {m.summary}
                  </p>
                </div>
                
                {/* Arrow indicator */}
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-blue-500/20 group-hover:bg-blue-500/5 transition text-stone-500 group-hover:text-blue-400">
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar details block: Tag cloud & quicktips */}
        <div className="space-y-6">
          {/* Tag cloud */}
          <div className="p-5 rounded-2xl border border-white/5 bg-[#0a0a0f]/80 space-y-4 glass">
            <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase border-b border-white/5 pb-2.5">
              Active Focus Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {tagList.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    setActiveTab('list');
                  }}
                  className="px-2.5 py-1 text-[10px] font-mono text-stone-300 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 rounded-md transition duration-300 cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick tips panel */}
          <div className="p-5 rounded-2xl border border-white/5 bg-[#0a0a0f]/40 space-y-3.5 glass">
            <h4 className="text-xs font-bold text-blue-400 font-mono tracking-wider uppercase">Did You Know?</h4>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Global Hotkeys are registered automatically. Press <span className="font-mono text-stone-200 bg-white/5 px-1 py-0.5 rounded">Ctrl + Shift + C</span> on your desktop to freeze and capture your active window immediately. 
            </p>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Press <span className="font-mono text-stone-200 bg-white/5 px-1 py-0.5 rounded">Ctrl + Shift + F</span> from any folder or editor target to float and focus this active Dashboard interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
