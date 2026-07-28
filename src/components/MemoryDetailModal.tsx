import React, { useMemo } from 'react';
import { X, Copy, Tag, Calendar, Monitor, Eye, Link, Layers, AlertCircle, History, Check, Trash2 } from 'lucide-react';
import { useAppStore } from '../store';
import { Memory } from '../types';

// App colors matching Category
const CATEGORY_TAGS_COLORS: Record<string, string> = {
  Design: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Dev: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Productivity: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Work: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Leisure: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

// Custom interactive CSS-rendered Mock Screenshot based on application
function MockScreenshot({ memory }: { memory: Memory }) {
  const app = memory.application.toLowerCase();

  if (app.includes('vs code') || app.includes('editor')) {
    return (
      <div className="w-full aspect-video rounded-xl bg-[#090C15] border border-white/5 font-mono p-4 flex flex-col justify-between overflow-hidden shadow-inner text-[10px]">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 text-stone-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            <span className="text-[9px] pl-2 text-sky-400">MemorySpace3D.tsx</span>
          </div>
          <span>UTF-8</span>
        </div>
        <div className="flex-1 py-3 text-stone-300 space-y-1 overflow-y-auto select-none">
          <p className="text-stone-500 pl-2">1  <span className="text-rose-400">import</span> React, &#123; useRef &#125; <span className="text-rose-400">from</span> <span className="text-emerald-400">'react'</span>;</p>
          <p className="text-stone-500 pl-2">2  <span className="text-rose-400">import</span> &#123; Canvas &#125; <span className="text-rose-400">from</span> <span className="text-emerald-400">'@react-three/fiber'</span>;</p>
          <p className="text-stone-500 pl-2">3  </p>
          <p className="text-stone-500 pl-2">4  <span className="text-blue-400">export function</span> <span className="text-amber-400">KnowledgeGraph</span>() &#123;</p>
          <p className="text-stone-500 pl-2">5    <span className="text-violet-400">const</span> meshRef = <span className="text-amber-400">useRef</span>&lt;<span className="text-sky-400">THREE.Group</span>&gt;(<span className="text-rose-400">null</span>);</p>
          <p className="text-stone-500 pl-2">6    <span className="text-stone-500">// Calculating force attraction...</span></p>
          <p className="text-stone-500 pl-2">7    <span className="text-violet-400">const</span> forceStrength = <span className="text-orange-400">0.12</span>;</p>
          <p className="text-stone-500 pl-2">8    <span className="text-rose-400">return</span> &lt;<span className="text-rose-400">mesh</span> ref=&#123;meshRef&#125;&gt;&lt;/<span className="text-rose-400">mesh</span>&gt;;</p>
          <p className="text-stone-500 pl-2">9  &#125;</p>
        </div>
        <div className="border-t border-white/5 pt-2 text-[9px] text-stone-500 flex justify-between">
          <span>Ln 5, Col 12</span>
          <span>TypeScript JSX</span>
        </div>
      </div>
    );
  }

  if (app.includes('figma') || app.includes('design')) {
    return (
      <div className="w-full aspect-video rounded-xl bg-[#1E1E1E] border border-white/5 p-4 flex flex-col justify-between overflow-hidden shadow-inner text-[10px]">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 text-stone-400">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#FAFAF9] bg-orange-500 px-1 py-0.5 rounded text-[8px]">F</span>
            <span className="text-[9px]">CaptureFlow - Styleguide</span>
          </div>
          <span>64%</span>
        </div>
        <div className="flex-1 flex items-center justify-center relative bg-[#121212]/30 rounded-lg my-3 border border-dashed border-white/5">
          <div className="grid grid-cols-3 gap-3 p-4 w-full max-w-[220px]">
            <div className="h-10 rounded-lg bg-[#0B0F19] border border-[#38BDF8] flex flex-col justify-between p-1.5 font-mono text-[6px]">
              <div className="w-2 h-2 rounded-full bg-[#38BDF8]"/>
              <span className="text-stone-500">Obsidian #0B0F19</span>
            </div>
            <div className="h-10 rounded-lg bg-[#FAFAF9] border border-[#38BDF8] flex flex-col justify-between p-1.5 font-mono text-[6px]">
              <div className="w-2 h-2 rounded-full bg-stone-500"/>
              <span className="text-stone-700">Cream #FAFAF9</span>
            </div>
            <div className="h-10 rounded-lg bg-[#F59E0B]/25 border border-[#F59E0B]/50 flex flex-col justify-between p-1.5 font-mono text-[6px]">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B]"/>
              <span className="text-[#F59E0B]">Amber Accent</span>
            </div>
          </div>
          <span className="absolute bottom-1 right-2 text-[8px] text-stone-500 font-mono">2400 x 1440 px</span>
        </div>
        <div className="flex justify-between text-[8px] text-stone-500">
          <span>Grid active</span>
          <span>Constraint: Spacing Math</span>
        </div>
      </div>
    );
  }

  if (app.includes('slack')) {
    return (
      <div className="w-full aspect-video rounded-xl bg-[#1A1D21] border border-white/5 p-4 flex flex-col justify-between overflow-hidden shadow-inner text-[10px]">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-2 text-stone-400">
          <span className="w-3 h-3 rounded bg-purple-500 flex items-center justify-center text-[7px] text-white font-bold">#</span>
          <span className="font-semibold text-stone-200">#product-strategy</span>
        </div>
        <div className="flex-1 py-3 space-y-3.5 overflow-y-auto">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 rounded bg-rose-500 flex items-center justify-center text-[8px] text-white font-bold">S</div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-bold text-stone-200 text-[9px]">Sarah</span>
                <span className="text-[7px] text-stone-500">14:38</span>
              </div>
              <p className="text-stone-300 mt-0.5 text-[9px]">The time-evolution timeline playback has to feel super interactive.</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">D</div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-bold text-stone-200 text-[9px]">David</span>
                <span className="text-[7px] text-stone-500">14:40</span>
              </div>
              <p className="text-stone-300 mt-0.5 text-[9px]">Exactly. Nodes pop, clusters merge, and old knowledge dims down.</p>
            </div>
          </div>
        </div>
        <div className="border border-white/10 rounded px-2 py-1 text-stone-500 text-[8px]">
          Message #product-strategy
        </div>
      </div>
    );
  }

  // Fallback Chrome web browser or search visual mock
  return (
    <div className="w-full aspect-video rounded-xl bg-[#0F172A] border border-white/5 p-4 flex flex-col justify-between overflow-hidden shadow-inner text-[10px]">
      <div className="flex items-center space-x-1.5 border-b border-white/5 pb-2 text-stone-400 bg-[#0B0F19]/60 px-2 py-1 rounded">
        <span className="w-2 h-2 rounded-full bg-stone-600"/>
        <span className="text-[8px] text-stone-500 flex-1 truncate">https://www.google.com/search?q=coulombs+repulsion+force+threejs</span>
        <span className="text-[7px] bg-white/5 px-1 py-0.2 rounded">SSL</span>
      </div>
      <div className="flex-1 flex flex-col justify-center space-y-2 py-4 px-6">
        <div className="h-3 w-2/3 bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded px-1.5 py-0.5 flex items-center">
          <span className="text-[8px] text-[#38BDF8] font-bold">Query: Coulombs Law ThreeJS</span>
        </div>
        <p className="text-stone-400 text-[9px] leading-relaxed">
          "Coulomb's attraction and repulsion forces form the basis of electrostatic simulations in 3D canvas layouts..."
        </p>
        <div className="flex space-x-2 text-[8px] text-sky-400/80">
          <span>StackOverflow</span>
          <span>ThreeJS docs</span>
        </div>
      </div>
      <div className="text-[7px] text-stone-600 font-mono">
        Chrome v122 - Tab Focus Memory
      </div>
    </div>
  );
}

export default function MemoryDetailModal() {
  const selectedMemoryId = useAppStore(state => state.selectedMemoryId);
  const memories = useAppStore(state => state.memories);
  const selectMemory = useAppStore(state => state.selectMemory);
  const deleteMemory = useAppStore(state => state.deleteMemory);
  const setGraphFocus = useAppStore(state => state.setGraphFocus);

  const [copied, setCopied] = React.useState(false);

  // Retrieve current active memory
  const memory = useMemo(() => {
    return memories.find(m => m.id === selectedMemoryId) || null;
  }, [memories, selectedMemoryId]);

  // Find related memory objects
  const relatedMemories = useMemo(() => {
    if (!memory) return [];
    return (memory.relationships || []).map(rel => {
      if (!rel) return null;
      const match = (memories || []).find(m => m && m.id === rel.targetId);
      return match ? { ...match, relType: rel.type, relWeight: rel.weight } : null;
    }).filter(Boolean) as Array<Memory & { relType: string; relWeight: number }>;
  }, [memory, memories]);

  if (!memory) return null;

  const handleCopyOCRText = () => {
    navigator.clipboard.writeText(memory.ocrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFocusRelatedMemory = (id: string) => {
    selectMemory(id);
    setGraphFocus(id);
  };

  return (
    <div className="w-full h-full flex flex-col bg-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Monitor size={15} />
          </div>
          <span className="text-sm font-semibold text-[#FAFAF9] tracking-tight truncate max-w-[200px]">
            {memory.application} Log
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => deleteMemory(memory.id)}
            title="Delete Capture"
            className="p-1 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => selectMemory(null)}
            title="Close Inspector (Esc)"
            className="p-1 rounded-lg hover:bg-white/5 text-stone-400 hover:text-stone-200 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Mock visual screenshot container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">Interactive Mock Capture</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
              <Check size={10} />
              <span>OCR Verified</span>
            </span>
          </div>
          <MockScreenshot memory={memory} />
        </div>

        {/* AI Summary */}
        <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 space-y-2 glass">
          <div className="flex items-center space-x-2 text-stone-400 text-xs font-semibold">
            <Eye size={14} className="text-blue-400" />
            <span>AI Summarization</span>
          </div>
          <p className="text-xs text-[#FAFAF9] leading-relaxed">
            {memory.summary}
          </p>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] glass">
            <div className="text-[10px] text-stone-500 font-mono uppercase mb-1">Captured Date</div>
            <div className="flex items-center space-x-1.5 text-xs text-stone-300">
              <Calendar size={13} className="text-stone-400" />
              <span>{new Date(memory.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] glass">
            <div className="text-[10px] text-stone-500 font-mono uppercase mb-1">OCR Accuracy</div>
            <div className="flex items-center space-x-1.5 text-xs">
              <AlertCircle size={13} className="text-stone-400" />
              <span className="font-semibold text-stone-300">{(memory.confidence * 100).toFixed(0)}% Confidence</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] col-span-2 glass">
            <div className="text-[10px] text-stone-500 font-mono uppercase mb-1">System Window Context</div>
            <div className="text-xs text-stone-300 font-medium truncate">
              {memory.windowTitle}
            </div>
          </div>
        </div>

        {/* Tags cloud */}
        <div className="space-y-2.5">
          <div className="flex items-center space-x-1.5 text-stone-400 text-xs font-semibold">
            <Tag size={13} />
            <span>Categorization & Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`px-2.5 py-1 text-[10px] font-semibold border rounded-lg ${CATEGORY_TAGS_COLORS[memory.category]}`}>
              {memory.category} Cluster
            </span>
            {(memory.tags || []).map(tag => (
              <span key={tag} className="px-2 py-0.5 text-[10px] font-mono text-stone-400 bg-white/5 border border-white/5 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* OCR Raw Text block */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-stone-400 text-xs font-semibold">
              <Layers size={13} />
              <span>Raw Text OCR Logs</span>
            </div>
            <button
              onClick={handleCopyOCRText}
              className="flex items-center space-x-1.5 text-[10px] px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-stone-300 transition duration-300 cursor-pointer"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="w-full max-h-[140px] overflow-y-auto rounded-xl border border-white/5 bg-slate-950 font-mono text-[10px] p-3.5 text-stone-300 leading-relaxed whitespace-pre-wrap select-text">
            {memory.ocrText}
          </pre>
        </div>

        {/* Audit History Timeline */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1.5 text-stone-400 text-xs font-semibold">
            <History size={13} />
            <span>Processing History</span>
          </div>
          <div className="space-y-3 pl-1">
            {(memory.history || []).map((evt, index) => (
              <div key={index} className="flex items-start space-x-3.5 relative">
                {/* Visual step line */}
                {index < (memory.history || []).length - 1 && (
                  <span className="absolute left-[5px] top-[14px] bottom-[-16px] w-0.5 bg-white/5" />
                )}
                <span className="w-2.5 h-2.5 rounded-full border border-sky-400 bg-sky-950/40 z-10 mt-1" />
                <div className="flex-1 text-[11px]">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-stone-200">{evt.action.toUpperCase()}</span>
                    <span className="text-[9px] font-mono text-stone-500">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-stone-400 mt-0.5 leading-relaxed font-sans">{evt.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semantically Related Thoughts */}
        {relatedMemories.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-stone-400 text-xs font-semibold">
              <Link size={13} />
              <span>Semantically Linked Memories</span>
            </div>
            <div className="flex flex-col gap-2">
              {(relatedMemories || []).map(m => (
                <button
                  key={m.id}
                  onClick={() => handleFocusRelatedMemory(m.id)}
                  className="w-full text-left p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/5 hover:border-white/10 transition group flex items-center justify-between glass cursor-pointer"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center space-x-2 text-[10px] text-stone-500 font-mono mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_TAGS_COLORS[m.category] }} />
                      <span>{m.application} &bull; {m.category}</span>
                    </div>
                    <p className="text-xs font-semibold text-stone-200 truncate group-hover:text-blue-400 transition">
                      {m.windowTitle}
                    </p>
                    <p className="text-[10px] text-stone-400 truncate mt-0.5">
                      {m.summary}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    {(m.relWeight * 100).toFixed(0)}% match
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
