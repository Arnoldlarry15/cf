import React, { useMemo } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Eye, Trash2, Calendar, Monitor, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { Memory } from '../types';

const CATEGORY_CHIP_COLORS: Record<string, string> = {
  Design: 'bg-rose-500/10 text-rose-400 border-rose-500/15',
  Dev: 'bg-sky-500/10 text-sky-400 border-sky-500/15',
  Productivity: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  Work: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
  Leisure: 'bg-violet-500/10 text-violet-400 border-violet-500/15',
};

export default function MemoriesGrid() {
  const memories = useAppStore(state => state.memories);
  const selectedMemoryId = useAppStore(state => state.selectedMemoryId);
  const selectMemory = useAppStore(state => state.selectMemory);
  const deleteMemory = useAppStore(state => state.deleteMemory);
  const setGraphFocus = useAppStore(state => state.setGraphFocus);
  const setActiveTab = useAppStore(state => state.setActiveTab);

  const searchQuery = useAppStore(state => state.searchQuery);
  const setSearchQuery = useAppStore(state => state.setSearchQuery);

  const selectedCategory = useAppStore(state => state.selectedCategory);
  const setSelectedCategory = useAppStore(state => state.setSelectedCategory);

  const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest' | 'confidence'>('newest');
  const [minConfidence, setMinConfidence] = React.useState<number>(0);

  // Filter memories list based on all active parameters
  const filteredMemories = useMemo(() => {
    let list = [...memories];

    // Text search (fuzzy OCR check)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        m.ocrText.toLowerCase().includes(q) ||
        m.windowTitle.toLowerCase().includes(q) ||
        m.application.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory) {
      list = list.filter(m => m.category === selectedCategory);
    }

    // Confidence filter
    if (minConfidence > 0) {
      list = list.filter(m => m.confidence >= minConfidence);
    }

    // Sort order
    if (sortOrder === 'newest') {
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortOrder === 'oldest') {
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else if (sortOrder === 'confidence') {
      list.sort((a, b) => b.confidence - a.confidence);
    }

    return list;
  }, [memories, searchQuery, selectedCategory, sortOrder, minConfidence]);

  const handleInspect = (id: string) => {
    selectMemory(id);
    setGraphFocus(id);
  };

  const handleFocusGraph = (id: string) => {
    selectMemory(id);
    setGraphFocus(id);
    setActiveTab('3d-space');
  };

  return (
    <div className="w-full h-full min-h-full text-[#FAFAF9] max-w-6xl mx-auto space-y-6 pb-10 flex flex-col z-20">
      {/* Search and Filters Header */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FAFAF9] font-display">Memory Catalog</h1>
          <p className="text-xs text-stone-400 mt-1">
            Browse, sort, and audit raw OCR transcripts captured across all workspace layers.
          </p>
        </div>

        {/* Global Catalog Search */}
        <div className="relative w-full lg:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Fuzzy search OCR contexts..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 text-[#FAFAF9] text-xs border border-white/10 rounded-full focus:outline-none focus:border-blue-500/50 transition duration-300 placeholder-stone-500"
          />
          <Search size={14} className="absolute left-3.5 top-3.5 text-stone-500" />
        </div>
      </div>

      {/* Categories Tabs + Sliders row */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-white/5 pb-4">
        {/* Category tags */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition duration-300 cursor-pointer ${
              selectedCategory === null 
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' 
                : 'text-stone-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            All Clusters
          </button>
          {['Dev', 'Design', 'Productivity', 'Work', 'Leisure'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition duration-300 cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                  : 'text-stone-400 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Advanced Filters toggles */}
        <div className="flex items-center space-x-4">
          {/* Sorting */}
          <div className="flex items-center space-x-2 bg-white/5 border border-white/5 p-1 rounded-lg">
            <ArrowUpDown size={12} className="text-stone-500 pl-1" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-[#050507] text-[#FAFAF9] text-[11px] font-semibold border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="confidence">Confidence Score</option>
            </select>
          </div>

          {/* Confidence Slider */}
          <div className="flex items-center space-x-2 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-lg">
            <SlidersHorizontal size={11} className="text-stone-500" />
            <span className="text-[10px] font-mono text-stone-400">Confidence:</span>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minConfidence * 100}
              onChange={(e) => setMinConfidence(parseInt(e.target.value) / 100)}
              className="w-16 h-0.5 bg-slate-800 accent-blue-400 appearance-none cursor-pointer"
            />
            <span className="text-[10px] font-mono text-stone-300 font-semibold w-7 text-right">
              {(minConfidence * 100).toFixed(0)}%+
            </span>
          </div>
        </div>
      </div>

      {/* Grid container */}
      {filteredMemories.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/5 rounded-2xl bg-[#0a0a0f]/40 space-y-2 glass">
          <AlertCircle className="mx-auto text-stone-600" size={32} />
          <h3 className="text-sm font-semibold text-stone-400">No memories matched search query</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try resetting your filters or keyword query to explore wider snapshot ranges.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMemories.map(m => {
            const isSelected = selectedMemoryId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => handleInspect(m.id)}
                className={`group p-5 rounded-2xl border transition duration-300 cursor-pointer flex flex-col justify-between space-y-4 glass ${
                  isSelected 
                    ? 'bg-blue-600/20 border-blue-500/40 ring-1 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                    : 'bg-[#0a0a0f]/80 border-white/5 hover:border-blue-500/30 hover:bg-[#0f0f14]/80 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                }`}
              >
                {/* Header info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded-md ${CATEGORY_CHIP_COLORS[m.category]}`}>
                      {m.category} Cluster
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 flex items-center space-x-1">
                      <Calendar size={11} />
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#FAFAF9] leading-snug truncate group-hover:text-blue-400 transition">
                    {m.application}: {m.windowTitle.split(' - ')[0]}
                  </h3>
                  
                  <p className="text-xs text-stone-300 font-medium leading-relaxed">
                    {m.summary}
                  </p>
                </div>

                {/* Footer and tags */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                  {/* tag list */}
                  <div className="flex flex-wrap gap-1.5">
                    {m.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 text-[9px] font-mono text-stone-500 bg-white/5 rounded border border-white/5">
                        #{tag}
                      </span>
                    ))}
                    {m.tags.length > 3 && (
                      <span className="text-[9px] font-mono text-stone-500 pl-1 font-semibold">
                        +{m.tags.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Actions buttons row */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-mono text-stone-500 uppercase font-bold">
                      {(m.confidence * 100).toFixed(0)}% OCR confidence
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMemory(m.id);
                        }}
                        title="Delete Memory"
                        className="p-1 rounded text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFocusGraph(m.id);
                        }}
                        className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-blue-400 hover:text-blue-300 transition duration-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded cursor-pointer"
                      >
                        <Eye size={11} />
                        <span>REPLAY SPACE</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
