import { AbilityState } from './types';

export const PLAYER_CONFIG = {
  MAX_HP: 100,
  MAX_ENERGY: 100,
  ENERGY_REGEN_PER_SEC: 12,
  WALK_SPEED: 8.5,
  SPRINT_SPEED: 13.5,
  DODGE_SPEED: 26.0,
  DODGE_DURATION: 0.35,
  DODGE_COOLDOWN: 0.8,
  JUMP_FORCE: 14.0,
  GRAVITY: 32.0,
  ATTACK_RANGES: {
    light1: 3.2,
    light2: 3.5,
    heavy: 4.8,
    nova: 8.5,
    pierce: 9.0,
  },
  ATTACK_DAMAGES: {
    light1: 28,
    light2: 36,
    heavy: 65,
    nova: 120,
    pierce: 95,
  },
};

export const INITIAL_ABILITIES: AbilityState[] = [
  {
    id: 'nova',
    name: 'Celestial Nova',
    key: 'Q',
    cooldownMax: 6.0,
    cooldownCurrent: 0,
    energyCost: 35,
    icon: 'Sparkles',
    description: 'Slam the ground releasing a radiant celestial shockwave damaging all nearby enemies.',
  },
  {
    id: 'pierce',
    name: 'Void Piercer',
    key: 'E',
    cooldownMax: 4.0,
    cooldownCurrent: 0,
    energyCost: 25,
    icon: 'Zap',
    description: 'Thrust forward with a concentrated beam of hyper-dense astral energy piercing through targets.',
  },
  {
    id: 'dodge',
    name: 'Astral Phase',
    key: 'Shift / RMB',
    cooldownMax: 0.8,
    cooldownCurrent: 0,
    energyCost: 15,
    icon: 'Wind',
    description: 'Phase through space with invulnerability frames, evading incoming strikes.',
  },
];

export const WORLD_BOUNDS = {
  MIN_X: -160,
  MAX_X: 160,
  MIN_Z: -160,
  MAX_Z: 160,
};

export const INITIAL_QUESTS = [
  {
    id: 'explore',
    title: 'Awakening at the Nexus',
    description: 'Inspect the ancient celestial obelisks in the sanctuary ruins.',
    current: 0,
    target: 1,
    completed: false,
  },
  {
    id: 'crawlers',
    title: 'Void Purge',
    description: 'Defeat Void Crawlers infesting the outer perimeter.',
    current: 0,
    target: 4,
    completed: false,
  },
  {
    id: 'golems',
    title: 'Sentinel Awakening',
    description: 'Defeat ancient Nexus Golems guarding the central sanctum.',
    current: 0,
    target: 2,
    completed: false,
  },
  {
    id: 'boss',
    title: 'Vanquish Archon Malakor',
    description: 'Face the corrupted celestial construct in the high arena.',
    current: 0,
    target: 1,
    completed: false,
  },
];
