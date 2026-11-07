export type AttackType = 'light1' | 'light2' | 'heavy' | 'nova' | 'pierce';

export interface FloatingDamage {
  id: string;
  amount: number;
  isCrit: boolean;
  x: number;
  y: number;
  z: number;
  screenX: number;
  screenY: number;
  createdAt: number;
}

export interface AbilityState {
  id: 'nova' | 'pierce' | 'dodge';
  name: string;
  key: string;
  cooldownMax: number;
  cooldownCurrent: number;
  energyCost: number;
  icon: string;
  description: string;
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  maxEnergy: number;
  energy: number;
  level: number;
  exp: number;
  expToNext: number;
  comboCount: number;
  comboTier: 'D' | 'C' | 'B' | 'A' | 'S' | 'SSS';
  comboTimer: number;
  isInvulnerable: boolean;
  isDead: boolean;
}

export type EnemyType = 'crawler' | 'golem' | 'boss';

export interface EnemyData {
  id: string;
  name: string;
  type: EnemyType;
  maxHp: number;
  hp: number;
  attackPower: number;
  speed: number;
  detectionRadius: number;
  attackRange: number;
  attackCooldown: number;
  currentCooldown: number;
  state: 'idle' | 'chase' | 'attack' | 'hurt' | 'dead';
  x: number;
  y: number;
  z: number;
  rotationY: number;
  spawnX: number;
  spawnZ: number;
  isBoss?: boolean;
  bossPhase?: number;
}

export interface QuestItem {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
}

export interface GameSettings {
  mouseSensitivity: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number;
  graphicsQuality: 'high' | 'medium' | 'low';
}
