import React from 'react';
import { Settings, ShieldCheck, Key, RefreshCw, ToggleLeft, ToggleRight, Check, HardDrive, Database, Monitor } from 'lucide-react';
import { useAppStore } from '../store';

export default function SettingsView() {
  const memories = useAppStore(state => state.memories);
  const [oauthEnabled, setOauthEnabled] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleToggleOauth = () => {
    if (!oauthEnabled) {
      setRefreshing(true);
      setTimeout(() => {
        setOauthEnabled(true);
        setRefreshing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }, 1000);
    } else {
      setOauthEnabled(false);
    }
  };

  return (
    <div className="w-full h-full min-h-full text-[#FAFAF9] max-w-4xl mx-auto space-y-8 pb-10 flex flex-col z-20">
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#FAFAF9] flex items-center space-x-2.5 font-display">
          <Settings className="text-blue-400" />
          <span>System Settings & Config</span>
        </h1>
        <p className="text-xs text-stone-400 mt-1">
          Configure background hooks, cloud accounts integrations, and active cognitive index parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column Settings details */}
        <div className="md:col-span-2 space-y-6">
          {/* Hotkey registrations */}
          <div className="p-6 rounded-2xl border border-white/5 bg-[#0a0a0f]/80 space-y-4 glass shadow-xl">
            <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase border-b border-white/5 pb-3 flex items-center space-x-2">
              <Monitor size={14} className="text-blue-400" />
              <span>Registered OS Global Hotkeys</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#050507]/60 border border-white/5 glass">
                <div>
                  <span className="text-xs font-bold text-stone-200 block">Trigger Capture Hook</span>
                  <span className="text-[10px] text-stone-500 mt-0.5 block">Freeze and OCR scan active window</span>
                </div>
                <kbd className="px-3 py-1 text-xs font-mono font-bold bg-white/5 border border-white/10 rounded-lg text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
                  Ctrl + Shift + C
                </kbd>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#050507]/60 border border-white/5 glass">
                <div>
                  <span className="text-xs font-bold text-stone-200 block">Open CaptureFlow Dashboard</span>
                  <span className="text-[10px] text-stone-500 mt-0.5 block">Toggle immersive visual space</span>
                </div>
                <kbd className="px-3 py-1 text-xs font-mono font-bold bg-white/5 border border-white/10 rounded-lg text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
                  Ctrl + Shift + F
                </kbd>
              </div>
            </div>
          </div>

          {/* Cloud Google Workspace Integration */}
          <div className="p-6 rounded-2xl border border-white/5 bg-[#0a0a0f]/80 space-y-4 glass shadow-xl">
            <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase border-b border-white/5 pb-3 flex items-center space-x-2">
              <HardDrive size={14} className="text-[#38BDF8]" />
              <span>Google Workspace Integration (OAuth)</span>
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Syncing Google Drive, Docs, and Sheets allows CaptureFlow to semantically map shared cloud events directly into your desktop visual memory map.
            </p>

            <div className="p-4 rounded-xl bg-[#050507]/60 border border-white/5 flex items-center justify-between glass">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-stone-400">
                  <Database size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-200 block">Google Drive Synchronization</span>
                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                    {oauthEnabled ? 'Tokens refreshed. Mapped metadata read successfully.' : 'Sync offline. Requires OAuth Client Authentication.'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleToggleOauth}
                disabled={refreshing}
                className="transition duration-300 transform active:scale-95 text-stone-400 hover:text-white cursor-pointer"
              >
                {refreshing ? (
                  <RefreshCw size={24} className="animate-spin text-blue-400" />
                ) : oauthEnabled ? (
                  <ToggleRight size={32} className="text-blue-400" />
                ) : (
                  <ToggleLeft size={32} className="text-stone-500" />
                )}
              </button>
            </div>

            {oauthEnabled && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center space-x-2.5 animate-fade-in">
                <Check size={14} className="animate-bounce" />
                <span>Google Workspace cloud mapping active. Reading Drive files metadata.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right column diagnostics */}
        <div className="space-y-6">
          {/* Cognitive engine diagnostics */}
          <div className="p-5 rounded-2xl border border-white/5 bg-[#0a0a0f]/80 space-y-4 glass shadow-xl">
            <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase border-b border-white/5 pb-2.5">
              Cognitive Core Diagnostics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-stone-500 font-medium">Core Engine Status</span>
                <span className="font-mono text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">ONLINE</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-stone-500 font-medium">Memory Node count</span>
                <span className="font-mono text-stone-300 font-bold">{(memories || []).length} nodes</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-stone-500 font-medium">Active edge bounds</span>
                <span className="font-mono text-stone-300 font-bold">
                  {(memories || []).reduce((acc, m) => acc + (m?.relationships ? m.relationships.length : 0), 0)} edges
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-stone-500 font-medium">DB Cache format</span>
                <span className="font-mono text-stone-400">MemoryJSON (local-fs)</span>
              </div>
            </div>
          </div>

          {/* Gemini AI Status */}
          <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4 glass">
            <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase border-b border-white/5 pb-2.5 flex items-center space-x-2">
              <Key size={13} className="text-blue-400" />
              <span>Gemini Brain Sync</span>
            </h3>
            <div className="space-y-3.5 text-xs text-stone-400">
              <p className="text-[11px] leading-relaxed">
                CaptureFlow Assistant is powered server-side by <span className="font-mono text-stone-200">gemini-3.6-flash</span>.
              </p>
              <div className="p-3 rounded-lg bg-[#050507]/60 border border-white/5 space-y-2 glass">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span>API CLIENT:</span>
                  <span className="text-stone-300">@google/genai</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span>AGENT HEADER:</span>
                  <span className="text-[#38BDF8]">aistudio-build</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span>SYNC KEY:</span>
                  <span className="text-emerald-400 font-bold">SECURED ON SERVER</span>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 leading-normal">
                To manage keys, head to settings in the AI Studio platform panel. API keys are injected automatically into process.env at boot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
