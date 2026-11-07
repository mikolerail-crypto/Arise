import React, { useState } from 'react';
import { GameEngineState } from '../game/GameEngine';
import { Sword, Zap, Sparkles, Wind, Crosshair, Pause, ChevronDown, ChevronUp } from 'lucide-react';

interface HUDProps {
  state: GameEngineState;
  onPause: () => void;
  onRequestPointerLock: () => void;
}

export const HUD: React.FC<HUDProps> = ({ state, onPause, onRequestPointerLock }) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Health and Energy percentages
  const hpPct = Math.max(0, Math.min(100, (state.playerHp / state.playerMaxHp) * 100));
  const energyPct = Math.max(0, Math.min(100, (state.playerEnergy / state.playerMaxEnergy) * 100));

  // Boss health
  const bossHpPct =
    state.bossHp !== null && state.bossMaxHp !== null
      ? Math.max(0, Math.min(100, (state.bossHp / state.bossMaxHp) * 100))
      : 0;

  // Combo tier colors
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'SSS':
        return 'text-rose-500 border-rose-500 bg-rose-950/80 cyber-glow-red';
      case 'S':
        return 'text-amber-400 border-amber-400 bg-amber-950/80 cyber-glow-amber';
      case 'A':
        return 'text-purple-400 border-purple-400 bg-purple-950/80 cyber-glow-purple';
      case 'B':
        return 'text-cyan-400 border-cyan-400 bg-cyan-950/80 cyber-glow-cyan';
      case 'C':
        return 'text-sky-400 border-sky-400 bg-sky-950/80';
      default:
        return 'text-slate-400 border-slate-600 bg-slate-900/80';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between">
      {/* 1. TOP BAR: Zane's Character Stats (Left) & Boss Health (Center) & Settings/Pause (Right) */}
      <div className="w-full p-4 sm:p-6 flex justify-between items-start">
        {/* Left: Player Profile & Vitals */}
        <div className="flex items-start space-x-3 pointer-events-auto">
          {/* Avatar Portrait */}
          <div className="relative w-14 h-14 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 border-2 border-cyan-500/80 clip-corner-tl clip-corner-br flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <span className="font-cinzel font-black text-cyan-300 text-xl tracking-tighter">Z</span>
            <span className="absolute bottom-0 right-0 px-1 py-0.2 bg-cyan-500 text-[9px] font-bold text-slate-950 font-rajdhani">
              LV.1
            </span>
          </div>

          {/* Vitals Bars */}
          <div className="flex flex-col space-y-1.5 w-48 sm:w-64">
            <div className="flex justify-between items-center text-xs font-rajdhani font-bold tracking-wider">
              <span className="text-cyan-300 uppercase">Zane // Celestial Wanderer</span>
              <span className="text-slate-300 text-[11px]">
                {Math.round(state.playerHp)} / {state.playerMaxHp} HP
              </span>
            </div>

            {/* Health Bar */}
            <div className="relative w-full h-3.5 bg-slate-950 border border-slate-700/80 clip-slanted overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-sky-400 transition-all duration-150 rounded-none shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                style={{ width: `${hpPct}%` }}
              />
            </div>

            {/* Energy / Mana Bar */}
            <div className="relative w-full h-2.5 bg-slate-950 border border-slate-800 clip-slanted overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-500 transition-all duration-150 rounded-none shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                style={{ width: `${energyPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-rajdhani">
              <span>ENERGY</span>
              <span>{Math.round(state.playerEnergy)}%</span>
            </div>
          </div>
        </div>

        {/* Center: Boss Health Gauge (Active when Boss is engaged) */}
        {state.bossHp !== null && state.bossHp > 0 && (
          <div className="flex flex-col items-center w-72 sm:w-96 md:w-[480px] pointer-events-auto transition-all animate-fade-in">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 cyber-glow-red" />
              <span className="font-cinzel font-bold text-rose-300 tracking-[0.25em] text-sm uppercase">
                {state.bossName || 'Archon Malakor'}
              </span>
              <span className="text-[10px] font-rajdhani text-rose-400 font-semibold px-1.5 py-0.5 bg-rose-950/80 border border-rose-800">
                OVERLORD
              </span>
            </div>

            {/* Boss Health Bar */}
            <div className="w-full h-3.5 bg-slate-950 border border-rose-900/80 p-0.5 clip-slanted shadow-[0_0_20px_rgba(225,29,72,0.4)]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 transition-all duration-200"
                style={{ width: `${bossHpPct}%` }}
              />
            </div>

            <div className="w-full flex justify-between text-[10px] font-rajdhani text-rose-300 font-bold tracking-wider mt-0.5">
              <span>CRUCIBLE ENTITY</span>
              <span>
                {Math.round(state.bossHp)} / {state.bossMaxHp} HP
              </span>
            </div>
          </div>
        )}

        {/* Right: Target info & Pause Button */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          {state.nearestEnemy && (
            <div className="hidden sm:flex flex-col items-end text-right bg-slate-950/80 border border-slate-800 p-2 clip-slanted">
              <div className="flex items-center space-x-1.5 text-xs font-rajdhani font-bold text-rose-300">
                <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                <span>{state.nearestEnemy.name}</span>
              </div>
              <div className="w-28 h-1.5 bg-slate-900 border border-slate-700 mt-1">
                <div
                  className="h-full bg-rose-500"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (state.nearestEnemy.hp / state.nearestEnemy.maxHp) * 100)
                    )}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-rajdhani mt-0.5">
                {state.nearestEnemy.distance}m
              </span>
            </div>
          )}

          <button
            onClick={onPause}
            className="p-2.5 bg-slate-950/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-lg active:scale-95"
            title="Pause Game [ESC]"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CENTER-LEFT: Dynamic Combo Counter */}
      {state.comboCount > 0 && (
        <div className="p-6 my-auto flex flex-col items-start pointer-events-none transition-all duration-150">
          <div className="flex items-baseline space-x-3">
            <span className="font-cinzel text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-300 to-indigo-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
              {state.comboCount}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-rajdhani font-bold tracking-[0.25em] text-cyan-400 uppercase">
                Hits
              </span>
              <span
                className={`text-2xl font-black font-cinzel px-2.5 py-0.5 border-2 clip-slanted ${getTierColor(
                  state.comboTier
                )}`}
              >
                {state.comboTier}
              </span>
            </div>
          </div>

          {/* Combo decay timer bar */}
          <div className="w-32 h-1 bg-slate-900 mt-1 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-75"
              style={{ width: `${Math.max(0, Math.min(100, (state.comboTimer / 3.5) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. CENTER-RIGHT: Quest Tracker */}
      <div className="absolute right-4 top-24 pointer-events-auto hidden md:flex flex-col w-64 bg-slate-950/80 border border-slate-800 p-3 clip-corner-br">
        <span className="text-[11px] font-rajdhani font-bold tracking-[0.2em] text-cyan-400 uppercase mb-2">
          Sanctuary Objectives
        </span>

        <div className="space-y-2 text-xs font-rajdhani">
          {state.quests.map((q) => (
            <div key={q.id} className="flex flex-col border-l-2 pl-2 border-slate-700">
              <div className="flex justify-between items-center">
                <span
                  className={`font-semibold ${
                    q.completed ? 'text-emerald-400 line-through' : 'text-slate-200'
                  }`}
                >
                  {q.title}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {q.current}/{q.target}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                {q.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. FLOATING COMBAT NUMBERS OVERLAY */}
      {state.floatingDamages.map((dmg) => {
        if (dmg.screenX < 0 || dmg.screenY < 0) return null;
        return (
          <div
            key={dmg.id}
            className={`absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 font-rajdhani font-black ${
              dmg.isCrit
                ? 'text-amber-300 text-2xl tracking-wider drop-shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-damage-float'
                : 'text-cyan-200 text-lg drop-shadow-[0_0_6px_rgba(56,189,248,0.7)] animate-damage-float'
            }`}
            style={{ left: `${dmg.screenX}px`, top: `${dmg.screenY}px` }}
          >
            {dmg.isCrit && <span className="text-xs mr-1 text-amber-400">CRIT!</span>}
            {dmg.amount}
          </div>
        );
      })}

      {/* 5. BOTTOM BAR: Ability Bar (Center Dock) & Minimap Radar (Right) */}
      <div className="w-full p-4 sm:p-6 flex justify-between items-end">
        {/* Left: Pointer Lock / Click Prompt if mouse is free */}
        <div
          onClick={onRequestPointerLock}
          className="pointer-events-auto cursor-pointer bg-slate-950/70 border border-slate-800 hover:border-cyan-500/60 p-2.5 text-xs font-rajdhani text-slate-400 hover:text-cyan-300 flex items-center space-x-2 transition-all"
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click canvas to lock mouse camera</span>
        </div>

        {/* Center: Unified Collapsible Bottom Dock (Per Three.js Directives) */}
        <div
          className={`relative mx-auto flex flex-col items-center pointer-events-auto transition-transform duration-300 ${
            isDockCollapsed ? 'translate-y-[85%]' : 'translate-y-0'
          }`}
        >
          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="mb-1.5 px-3 py-1 bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-cyan-300 text-[10px] font-rajdhani uppercase tracking-widest flex items-center space-x-1 cursor-pointer clip-slanted"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3 h-3 text-cyan-400" />
                <span>Show Abilities Dock</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 text-cyan-400" />
                <span>Hide Controls Dock</span>
              </>
            )}
          </button>

          {/* Abilities Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-950/90 border border-slate-800 p-2 sm:p-3 clip-corner-tl clip-corner-br shadow-[0_0_25px_rgba(0,0,0,0.8)]">
            {/* LMB: Basic Attack Combo */}
            <div className="relative flex flex-col items-center w-12 h-14 sm:w-14 sm:h-16 bg-slate-900/90 border border-sky-500/50 p-1 justify-between group">
              <span className="text-[10px] font-bold text-sky-400 font-rajdhani">LMB</span>
              <Sword className="w-5 h-5 text-sky-300" />
              <span className="text-[9px] text-slate-400 font-rajdhani font-semibold">STRIKE</span>
            </div>

            {/* Shift / RMB: Astral Phase Dodge */}
            {state.abilities
              .filter((a) => a.id === 'dodge')
              .map((ab) => {
                const isCooldown = ab.cooldownCurrent > 0;
                const cdPct = isCooldown ? (ab.cooldownCurrent / ab.cooldownMax) * 100 : 0;
                return (
                  <div
                    key={ab.id}
                    className="relative flex flex-col items-center w-12 h-14 sm:w-14 sm:h-16 bg-slate-900/90 border border-cyan-500/50 p-1 justify-between overflow-hidden"
                  >
                    {isCooldown && (
                      <div
                        className="absolute inset-0 bg-slate-950/80 transition-all flex items-center justify-center"
                        style={{ height: `${cdPct}%` }}
                      >
                        <span className="text-cyan-400 font-bold text-xs font-rajdhani">
                          {ab.cooldownCurrent.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-cyan-400 font-rajdhani">SHIFT</span>
                    <Wind className="w-5 h-5 text-cyan-300" />
                    <span className="text-[9px] text-slate-400 font-rajdhani font-semibold">
                      DODGE
                    </span>
                  </div>
                );
              })}

            {/* Q: Celestial Nova */}
            {state.abilities
              .filter((a) => a.id === 'nova')
              .map((ab) => {
                const isCooldown = ab.cooldownCurrent > 0;
                const cdPct = isCooldown ? (ab.cooldownCurrent / ab.cooldownMax) * 100 : 0;
                return (
                  <div
                    key={ab.id}
                    className="relative flex flex-col items-center w-12 h-14 sm:w-14 sm:h-16 bg-slate-900/90 border border-amber-500/50 p-1 justify-between overflow-hidden"
                  >
                    {isCooldown && (
                      <div
                        className="absolute inset-0 bg-slate-950/85 transition-all flex items-center justify-center"
                        style={{ height: `${cdPct}%` }}
                      >
                        <span className="text-amber-400 font-bold text-xs font-rajdhani">
                          {ab.cooldownCurrent.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-amber-400 font-rajdhani">[ Q ]</span>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span className="text-[9px] text-amber-400/80 font-rajdhani font-semibold">
                      NOVA
                    </span>
                  </div>
                );
              })}

            {/* E: Void Piercer */}
            {state.abilities
              .filter((a) => a.id === 'pierce')
              .map((ab) => {
                const isCooldown = ab.cooldownCurrent > 0;
                const cdPct = isCooldown ? (ab.cooldownCurrent / ab.cooldownMax) * 100 : 0;
                return (
                  <div
                    key={ab.id}
                    className="relative flex flex-col items-center w-12 h-14 sm:w-14 sm:h-16 bg-slate-900/90 border border-purple-500/50 p-1 justify-between overflow-hidden"
                  >
                    {isCooldown && (
                      <div
                        className="absolute inset-0 bg-slate-950/85 transition-all flex items-center justify-center"
                        style={{ height: `${cdPct}%` }}
                      >
                        <span className="text-purple-400 font-bold text-xs font-rajdhani">
                          {ab.cooldownCurrent.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-purple-400 font-rajdhani">[ E ]</span>
                    <Zap className="w-5 h-5 text-purple-300" />
                    <span className="text-[9px] text-purple-400/80 font-rajdhani font-semibold">
                      PIERCE
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Tactical Radar / Minimap */}
        <div className="pointer-events-auto flex flex-col items-end">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-slate-950/90 border border-slate-700 rounded-full overflow-hidden shadow-lg p-1">
            {/* Concentric radar rings */}
            <div className="absolute inset-3 border border-slate-800 rounded-full" />
            <div className="absolute inset-6 border border-slate-850 rounded-full" />

            {/* Player center ping */}
            <div
              className="absolute left-1/2 top-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 bg-cyan-400 rounded-full cyber-glow-cyan"
              style={{
                transform: `rotate(${state.playerRot}rad)`,
              }}
            >
              <div className="w-0.5 h-2 bg-white mx-auto -mt-1" />
            </div>

            {/* Enemy pings on radar (relative to player position, scale: 50m radius) */}
            {state.enemiesPos.map((ep) => {
              const dx = ep.x - state.playerPos.x;
              const dz = ep.z - state.playerPos.z;
              const radarScale = 45; // 45m map radius

              // Normalize within circular radar
              const normX = Math.max(-1, Math.min(1, dx / radarScale));
              const normZ = Math.max(-1, Math.min(1, dz / radarScale));

              const px = 50 + normX * 42;
              const py = 50 + normZ * 42;

              return (
                <div
                  key={ep.id}
                  className={`absolute w-1.5 h-1.5 rounded-full -ml-0.75 -mt-0.75 ${
                    ep.isBoss ? 'w-2.5 h-2.5 bg-rose-500 cyber-glow-red z-10' : 'bg-red-400'
                  }`}
                  style={{ left: `${px}%`, top: `${py}%` }}
                />
              );
            })}
          </div>
          <span className="text-[10px] font-rajdhani text-slate-400 mt-1 uppercase font-semibold">
            Radar // 45M Range
          </span>
        </div>
      </div>
    </div>
  );
};
