import React, { useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, FastForward, Clock } from 'lucide-react';
import { useAppStore } from '../store';

export default function TimelineScrubber() {
  const memories = useAppStore(state => state.memories);
  const timelineProgress = useAppStore(state => state.timelineProgress);
  const playbackActive = useAppStore(state => state.playbackActive);
  const playbackSpeed = useAppStore(state => state.playbackSpeed);

  const setTimelineProgress = useAppStore(state => state.setTimelineProgress);
  const setPlaybackActive = useAppStore(state => state.setPlaybackActive);
  const setPlaybackSpeed = useAppStore(state => state.setPlaybackSpeed);

  // Compute active date matching current progress percentage
  const currentDateDisplay = useMemo(() => {
    if (memories.length === 0) return 'No active memories';
    
    const times = memories.map(m => new Date(m.timestamp).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    const targetUnix = min + ((max - min) * (timelineProgress / 100));
    
    return new Date(targetUnix).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [memories, timelineProgress]);

  // Handle continuous playback loop
  useEffect(() => {
    let intervalId: any = null;
    if (playbackActive) {
      intervalId = setInterval(() => {
        setTimelineProgress(Math.min(timelineProgress + (0.5 * playbackSpeed), 100));
        
        if (timelineProgress >= 100) {
          setPlaybackActive(false);
        }
      }, 50);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [playbackActive, timelineProgress, playbackSpeed]);

  const handleReset = () => {
    setTimelineProgress(0);
    setPlaybackActive(true);
  };

  return (
    <div className="w-full bg-[#0a0a0f]/80 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-6 backdrop-blur-md glass">
      {/* Playback Controls */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={() => setPlaybackActive(!playbackActive)}
          className={`p-2.5 rounded-full transition-all duration-300 cursor-pointer ${
            playbackActive 
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
              : 'bg-[#FAFAF9] text-[#050507] hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]'
          }`}
          title={playbackActive ? "Pause Replay" : "Start Historical Replay"}
        >
          {playbackActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>

        <button
          onClick={handleReset}
          className="p-2.5 rounded-full bg-white/5 border border-white/10 text-stone-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          title="Restart Timeline Replay"
        >
          <RotateCcw size={18} />
        </button>

        {/* Speed selectors */}
        <div className="flex items-center rounded-lg bg-white/5 border border-white/5 p-0.5">
          {[1, 2, 5].map(speed => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                playbackSpeed === speed 
                  ? 'bg-white/10 text-white' 
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress Slider */}
      <div className="flex-1 w-full flex items-center space-x-4">
        <span className="text-[11px] font-mono text-stone-400">START</span>
        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={timelineProgress}
            onChange={(e) => setTimelineProgress(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        <span className="text-[11px] font-mono text-stone-400">PRESENT</span>
      </div>

      {/* Datetime indicator */}
      <div className="flex items-center space-x-2 bg-white/[0.01] px-4 py-2 rounded-xl border border-white/5 min-w-[240px] justify-center md:justify-start glass">
        <Clock size={15} className="text-blue-400 animate-pulse" />
        <span className="text-xs font-mono font-medium text-[#FAFAF9] tracking-tight">{currentDateDisplay}</span>
      </div>
    </div>
  );
}
