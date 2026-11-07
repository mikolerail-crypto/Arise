import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Sliders } from 'lucide-react';
import { GameSettings } from '../game/types';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  settings,
  onUpdateSettings,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md pointer-events-auto select-none">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 p-6 sm:p-8 clip-corner-tl clip-corner-br shadow-[0_0_50px_rgba(0,0,0,0.9)]">
        {/* Title */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-rajdhani tracking-[0.3em] text-cyan-400 uppercase font-semibold">
            System Suspended
          </span>
          <h2 className="font-cinzel text-3xl font-black text-slate-100 mt-1">
            NEXUS PAUSED
          </h2>
          <div className="w-16 h-0.5 bg-cyan-500 mx-auto mt-2" />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={onResume}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-rajdhani font-bold text-sm tracking-[0.2em] flex items-center justify-center space-x-2 clip-slanted cursor-pointer transition-all active:scale-98"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME SIMULATION</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 hover:text-cyan-300 font-rajdhani font-bold text-xs tracking-[0.2em] flex items-center justify-center space-x-2 clip-slanted cursor-pointer transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART EXPEDITION</span>
          </button>
        </div>

        {/* Settings */}
        <div className="border-t border-slate-800/80 pt-4 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-rajdhani font-bold text-slate-400 uppercase">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tactical Settings</span>
          </div>

          {/* Audio Toggle */}
          <div className="flex justify-between items-center text-xs font-rajdhani">
            <span className="text-slate-300">Master Audio</span>
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900 border border-slate-700 text-slate-200 cursor-pointer hover:border-cyan-500"
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ENABLED</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>MUTED</span>
                </>
              )}
            </button>
          </div>

          {/* Mouse Sensitivity Slider */}
          <div className="flex flex-col space-y-1 text-xs font-rajdhani">
            <div className="flex justify-between text-slate-300">
              <span>Mouse Look Sensitivity</span>
              <span className="text-cyan-400 font-bold">
                {settings.mouseSensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={settings.mouseSensitivity}
              onChange={(e) =>
                onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Key Quick Guide */}
        <div className="border-t border-slate-800/80 mt-5 pt-3 text-[11px] font-rajdhani text-slate-400 text-center">
          Press <span className="text-cyan-300 font-bold">ESC</span> to resume / pause anytime
        </div>
      </div>
    </div>
  );
};
