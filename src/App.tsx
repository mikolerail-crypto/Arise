/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { CanvasViewport } from './components/CanvasViewport';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { PauseMenu } from './components/PauseMenu';
import { GameOverModal } from './components/GameOverModal';
import { GameEngine, GameEngineState } from './game/GameEngine';
import { soundSystem } from './audio/SoundSystem';
import { GameSettings } from './game/types';
import { PLAYER_CONFIG, INITIAL_ABILITIES, INITIAL_QUESTS } from './game/constants';

export default function App() {
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'defeat' | 'victory'>('title');
  const [hudState, setHudState] = useState<GameEngineState>({
    playerHp: PLAYER_CONFIG.MAX_HP,
    playerMaxHp: PLAYER_CONFIG.MAX_HP,
    playerEnergy: PLAYER_CONFIG.MAX_ENERGY,
    playerMaxEnergy: PLAYER_CONFIG.MAX_ENERGY,
    comboCount: 0,
    comboTier: 'D',
    comboTimer: 0,
    abilities: JSON.parse(JSON.stringify(INITIAL_ABILITIES)),
    isDead: false,
    bossHp: null,
    bossMaxHp: null,
    bossName: null,
    nearestEnemy: null,
    quests: JSON.parse(JSON.stringify(INITIAL_QUESTS)),
    floatingDamages: [],
    playerPos: { x: 0, y: 0, z: 0 },
    playerRot: 0,
    enemiesPos: [],
  });

  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 1.0,
    soundEnabled: true,
    musicEnabled: true,
    masterVolume: 0.8,
    graphicsQuality: 'high',
  });

  const engineRef = useRef<GameEngine | null>(null);

  // High performance throttle for HUD state updates from GameEngine
  const handleStateUpdate = useCallback((state: GameEngineState) => {
    setHudState(state);

    // Trigger defeat screen
    if (state.isDead && gameState !== 'defeat') {
      setGameState('defeat');
    }

    // Check boss victory
    const bossQuest = state.quests.find((q) => q.id === 'boss');
    if (bossQuest && bossQuest.completed && gameState === 'playing') {
      setGameState('victory');
    }
  }, [gameState]);

  // Handle Escape key to pause / resume
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameState === 'playing') {
          setGameState('paused');
          engineRef.current?.setPaused(true);
        } else if (gameState === 'paused') {
          setGameState('playing');
          engineRef.current?.setPaused(false);
          engineRef.current?.requestPointerLock();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Start game from title screen
  const handleStartGame = () => {
    setGameState('playing');
    soundSystem.startBGM();
    if (engineRef.current) {
      engineRef.current.setPaused(false);
      engineRef.current.requestPointerLock();
    }
  };

  const handlePause = () => {
    setGameState('paused');
    engineRef.current?.setPaused(true);
  };

  const handleResume = () => {
    setGameState('playing');
    engineRef.current?.setPaused(false);
    engineRef.current?.requestPointerLock();
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
    setGameState('playing');
  };

  const handleToggleSound = () => {
    const isMuted = soundSystem.toggleMute();
    setSettings((prev) => ({ ...prev, soundEnabled: !isMuted }));
  };

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.soundEnabled !== undefined) {
        if (!newSettings.soundEnabled && !soundSystem.getMuted()) {
          soundSystem.toggleMute();
        } else if (newSettings.soundEnabled && soundSystem.getMuted()) {
          soundSystem.toggleMute();
        }
      }
      return updated;
    });
  };

  const handleRequestPointerLock = () => {
    if (engineRef.current && (gameState === 'playing' || gameState === 'title')) {
      engineRef.current.requestPointerLock();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05060b]">
      {/* 1. Underlying 3D WebGL Canvas */}
      <CanvasViewport
        onStateUpdate={handleStateUpdate}
        engineRef={engineRef}
      />

      {/* 2. In-Game HUD (active during play, pause, or modals) */}
      {gameState !== 'title' && (
        <HUD
          state={hudState}
          onPause={handlePause}
          onRequestPointerLock={handleRequestPointerLock}
        />
      )}

      {/* 3. Title Screen */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          isMuted={!settings.soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 4. Pause Menu */}
      {gameState === 'paused' && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* 5. Defeat Modal */}
      {gameState === 'defeat' && (
        <GameOverModal
          type="defeat"
          onRestart={handleRestart}
        />
      )}

      {/* 6. Victory Modal */}
      {gameState === 'victory' && (
        <GameOverModal
          type="victory"
          onRestart={handleRestart}
          onContinue={() => setGameState('playing')}
        />
      )}
    </div>
  );
}
