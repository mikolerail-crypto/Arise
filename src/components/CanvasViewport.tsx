import React, { useEffect, useRef } from 'react';
import { GameEngine, GameEngineState } from '../game/GameEngine';

interface CanvasViewportProps {
  onStateUpdate: (state: GameEngineState) => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  onStateUpdate,
  engineRef,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize GameEngine once
    const engine = new GameEngine(mountRef.current, onStateUpdate);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#05060b] cursor-crosshair"
      onClick={() => {
        if (engineRef.current && !engineRef.current.isPaused) {
          engineRef.current.requestPointerLock();
        }
      }}
    />
  );
};
