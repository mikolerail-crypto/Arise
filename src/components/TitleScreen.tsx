import React from 'react';
import { Sword, Zap, Sparkles, Wind, Play, Volume2, Shield } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  isMuted,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-12 bg-gradient-to-b from-[#05060b]/90 via-[#0a0f1d]/80 to-[#05060b]/95 backdrop-blur-sm pointer-events-auto">
      {/* Top Header / Brand */}
      <div className="w-full flex justify-between items-center max-w-6xl">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-cyan-400 rotate-45 cyber-glow-cyan" />
          <span className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-rajdhani font-semibold">
            Protagonist // Zane, The Celestial Wanderer
          </span>
        </div>

        <button
          onClick={onToggleSound}
          className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 text-xs font-rajdhani transition-all cursor-pointer"
        >
          <Volume2 className="w-4 h-4" />
          <span>{isMuted ? 'AUDIO: MUTED' : 'AUDIO: ACTIVE'}</span>
        </button>
      </div>

      {/* Main Title Hero */}
      <div className="flex flex-col items-center text-center my-auto max-w-3xl">
        <div className="inline-block px-4 py-1 mb-4 bg-cyan-950/60 border border-cyan-500/40 clip-slanted text-cyan-300 text-xs tracking-[0.35em] font-semibold uppercase">
          Ver. 0.9.4 Prototype Build // Three.js Core
        </div>

        <h1 className="font-cinzel text-5xl sm:text-7xl md:text-8xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 via-sky-300 to-indigo-400 drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]">
          ASTRYX
        </h1>

        <div className="font-rajdhani text-2xl sm:text-3xl font-bold tracking-[0.5em] text-cyan-400 mt-[-6px] sm:mt-[-10px] uppercase">
          NEXUS ZERO
        </div>

        <p className="font-space text-slate-400 text-sm sm:text-base max-w-xl mt-4 leading-relaxed">
          Traverse the shattered celestial realm of Aethelgard. Master real-time sword combos, unleash radiant cosmic abilities, and conquer Archon Malakor.
        </p>

        {/* Start Game CTA */}
        <button
          onClick={onStart}
          className="mt-8 group relative px-10 py-4 bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-rajdhani font-bold text-lg tracking-[0.25em] clip-corner-tl clip-corner-br shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_45px_rgba(6,182,212,0.8)] transition-all cursor-pointer flex items-center space-x-3 active:scale-95"
        >
          <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
          <span>INITIALIZE NEXUS DESCENT</span>
        </button>
      </div>

      {/* Controls Overview Dock */}
      <div className="w-full max-w-5xl bg-slate-950/80 border border-slate-800/80 p-4 sm:p-5 rounded-none clip-corner-tl clip-corner-br">
        <div className="text-[11px] font-rajdhani tracking-[0.2em] text-slate-400 uppercase mb-3 flex items-center space-x-2">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Operational Combat & Navigation Controls</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs font-rajdhani">
          <div className="bg-slate-900/70 border border-slate-800 p-2.5 flex flex-col justify-between">
            <span className="text-slate-500 text-[10px] font-semibold">MOVE</span>
            <span className="text-cyan-300 font-bold text-sm mt-0.5">WASD</span>
            <span className="text-slate-400 text-[10px]">Omnidirectional</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-2.5 flex flex-col justify-between">
            <span className="text-slate-500 text-[10px] font-semibold">CAMERA</span>
            <span className="text-cyan-300 font-bold text-sm mt-0.5">MOUSE</span>
            <span className="text-slate-400 text-[10px]">Click to lock/look</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-2.5 flex flex-col justify-between">
            <span className="text-slate-500 text-[10px] font-semibold flex items-center gap-1">
              <Sword className="w-3 h-3 text-sky-400" /> STRIKE
            </span>
            <span className="text-sky-300 font-bold text-sm mt-0.5">LMB</span>
            <span className="text-slate-400 text-[10px]">3-Hit Sword Combo</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-2.5 flex flex-col justify-between">
            <span className="text-slate-500 text-[10px] font-semibold flex items-center gap-1">
              <Wind className="w-3 h-3 text-cyan-400" /> EVADE
            </span>
            <span className="text-cyan-300 font-bold text-sm mt-0.5">RMB / SHIFT</span>
            <span className="text-slate-400 text-[10px]">Astral Phase Dash</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-2.5 flex flex-col justify-between">
            <span className="text-slate-500 text-[10px] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> NOVA
            </span>
            <span className="text-amber-300 font-bold text-sm mt-0.5">[ Q ]</span>
            <span className="text-slate-400 text-[10px]">Celestial Shockwave</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-2.5 flex flex-col justify-between">
            <span className="text-slate-500 text-[10px] font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-400" /> PIERCE
            </span>
            <span className="text-purple-300 font-bold text-sm mt-0.5">[ E ]</span>
            <span className="text-slate-400 text-[10px]">Void Piercer Thrust</span>
          </div>
        </div>
      </div>
    </div>
  );
};
