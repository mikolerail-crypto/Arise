import React from 'react';
import { RotateCcw, Trophy, Skull } from 'lucide-react';

interface GameOverModalProps {
  type: 'defeat' | 'victory';
  onRestart: () => void;
  onContinue?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  type,
  onRestart,
  onContinue,
}) => {
  const isDefeat = type === 'defeat';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md pointer-events-auto select-none p-4">
      <div
        className={`w-full max-w-lg bg-slate-950 border p-6 sm:p-8 clip-corner-tl clip-corner-br shadow-[0_0_60px_rgba(0,0,0,0.9)] text-center ${
          isDefeat ? 'border-rose-900/80 shadow-[0_0_40px_rgba(225,29,72,0.3)]' : 'border-cyan-500/80 shadow-[0_0_40px_rgba(6,182,212,0.4)]'
        }`}
      >
        {/* Icon Emblem */}
        <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center border-2 bg-slate-900">
          {isDefeat ? (
            <Skull className="w-8 h-8 text-rose-500" />
          ) : (
            <Trophy className="w-8 h-8 text-amber-400" />
          )}
        </div>

        {/* Header */}
        <span
          className={`text-xs font-rajdhani font-bold tracking-[0.3em] uppercase ${
            isDefeat ? 'text-rose-400' : 'text-cyan-400'
          }`}
        >
          {isDefeat ? 'Neural Feedback Terminated' : 'Sanctuary Conquered'}
        </span>

        <h2
          className={`font-cinzel text-3xl sm:text-4xl font-black mt-1 ${
            isDefeat ? 'text-rose-300' : 'text-slate-100'
          }`}
        >
          {isDefeat ? 'CONSCIOUSNESS SEVERED' : 'ARCHON VANQUISHED'}
        </h2>

        <p className="font-space text-slate-400 text-sm max-w-md mx-auto mt-3 leading-relaxed">
          {isDefeat
            ? 'Zane suffered critical celestial overload. The Nexus reconstructs your astral form at the sanctuary dais.'
            : 'Archon Malakor has fallen! The corrupted energy dissipates, restoring ancient equilibrium to the shattered sanctum.'}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRestart}
            className={`px-8 py-3 font-rajdhani font-bold text-sm tracking-[0.2em] flex items-center justify-center space-x-2 clip-slanted cursor-pointer transition-all active:scale-95 text-white ${
              isDefeat
                ? 'bg-rose-700 hover:bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.5)]'
                : 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isDefeat ? 'RECONSTRUCT [RESPAWN]' : 'PLAY AGAIN'}</span>
          </button>

          {!isDefeat && onContinue && (
            <button
              onClick={onContinue}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-cyan-300 font-rajdhani font-bold text-sm tracking-[0.2em] clip-slanted cursor-pointer transition-all"
            >
              CONTINUE EXPLORING
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
