import * as THREE from 'three';
import { EnvironmentManager } from './world/Environment';
import { WorldManager } from './world/Terrain';
import { PlayerController } from './entities/PlayerController';
import { EnemyManager } from './entities/EnemyManager';
import { VFXManager } from './vfx/VFXManager';
import { soundSystem } from '../audio/SoundSystem';
import { FloatingDamage, QuestItem } from './types';
import { INITIAL_QUESTS } from './constants';

export interface GameEngineState {
  playerHp: number;
  playerMaxHp: number;
  playerEnergy: number;
  playerMaxEnergy: number;
  comboCount: number;
  comboTier: 'D' | 'C' | 'B' | 'A' | 'S' | 'SSS';
  comboTimer: number;
  abilities: {
    id: string;
    name: string;
    key: string;
    cooldownMax: number;
    cooldownCurrent: number;
    energyCost: number;
  }[];
  isDead: boolean;
  bossHp: number | null;
  bossMaxHp: number | null;
  bossName: string | null;
  nearestEnemy: {
    name: string;
    hp: number;
    maxHp: number;
    distance: number;
  } | null;
  quests: QuestItem[];
  floatingDamages: FloatingDamage[];
  playerPos: { x: number; y: number; z: number };
  playerRot: number;
  enemiesPos: { id: string; x: number; z: number; isBoss: boolean }[];
}

export class GameEngine {
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public isSoftwareGl: boolean = false;

  public env!: EnvironmentManager;
  public world!: WorldManager;
  public vfx!: VFXManager;
  public player!: PlayerController;
  public enemies!: EnemyManager;

  public quests: QuestItem[];
  public isPaused: boolean = false;
  public isLocked: boolean = false;

  private container: HTMLElement;
  private animFrameId: number = 0;
  private lastTime: number = 0;
  private onStateUpdate?: (state: GameEngineState) => void;
  private resizeObserver?: ResizeObserver;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;

  constructor(container: HTMLElement, onStateUpdate?: (state: GameEngineState) => void) {
    this.container = container;
    this.onStateUpdate = onStateUpdate;
    this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS));

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);

    this.detectHardware();
    this.initThree();
    this.initGameSystems();
    this.bindEvents();
    this.startGameLoop();
  }

  private detectHardware() {
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, -8);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
  }

  private initGameSystems() {
    // 1. Environment & Lighting
    this.env = new EnvironmentManager(this.scene, this.renderer, this.isSoftwareGl);

    // 2. World & Terrain
    this.world = new WorldManager();
    this.scene.add(this.world.group);

    // 3. VFX
    this.vfx = new VFXManager();
    this.scene.add(this.vfx.group);

    // 4. Player (Zane)
    this.player = new PlayerController(this.vfx);
    this.scene.add(this.player.model.group);

    // Spawn Zane on central dais
    const startY = this.world.getTerrainHeight(0, 0);
    this.player.position.set(0, startY + 0.5, 0);

    // 5. Enemies
    this.enemies = new EnemyManager(this.player, this.vfx);
    this.scene.add(this.enemies.group);

    // Quest kill tracking
    this.enemies.onEnemyKilled = (type) => {
      if (type === 'crawler') {
        const q = this.quests.find((item) => item.id === 'crawlers');
        if (q && !q.completed) {
          q.current = Math.min(q.target, q.current + 1);
          if (q.current >= q.target) q.completed = true;
        }
      } else if (type === 'golem') {
        const q = this.quests.find((item) => item.id === 'golems');
        if (q && !q.completed) {
          q.current = Math.min(q.target, q.current + 1);
          if (q.current >= q.target) q.completed = true;
        }
      } else if (type === 'boss') {
        const q = this.quests.find((item) => item.id === 'boss');
        if (q && !q.completed) {
          q.current = 1;
          q.completed = true;
        }
      }
    };
  }

  private bindEvents() {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mousedown', this.boundMouseDown);

    // Handle Pointer Lock state changes
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.renderer.domElement;
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(this.container);
  }

  public requestPointerLock() {
    if (!this.isLocked && this.renderer?.domElement) {
      try {
        this.renderer.domElement.requestPointerLock();
      } catch {
        // Pointer lock requested
      }
    }
  }

  private onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.player.keys.forward = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.player.keys.backward = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.player.keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.player.keys.right = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.player.keys.shift = true;
      // Trigger dodge on shift press
      this.player.triggerDodge();
    }
    if (e.code === 'Space') {
      e.preventDefault();
      this.player.triggerJump();
    }
    if (e.code === 'KeyQ') {
      this.player.triggerAbilityQ();
    }
    if (e.code === 'KeyE') {
      this.player.triggerAbilityE();
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.player.keys.forward = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.player.keys.backward = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.player.keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.player.keys.right = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.player.keys.shift = false;
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isPaused) return;

    // Supports pointer lock or dragging
    if (this.isLocked || e.buttons === 1 || e.buttons === 2) {
      this.player.handleMouseMove(e.movementX, e.movementY);
    }
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.isPaused) return;

    // Left click: Basic Attack Combo
    if (e.button === 0) {
      this.player.triggerAttack();
    }
    // Right click: Astral Dodge
    else if (e.button === 2) {
      e.preventDefault();
      this.player.triggerDodge();
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  public restartGame() {
    const startY = this.world.getTerrainHeight(0, 0);
    this.player.respawn(0, 0, (x, z) => this.world.getTerrainHeight(x, z));
    this.player.position.set(0, startY + 0.5, 0);
    this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS));
    this.setPaused(false);
    this.requestPointerLock();
  }

  private startGameLoop() {
    this.lastTime = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.animFrameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.animFrameId = window.setTimeout(cb, 80);
        }
      };
      this.animFrameId = window.setTimeout(poll, 5);
    };

    const tick = (now: number) => {
      const delta = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      if (!this.isPaused) {
        this.updateGame(delta, now / 1000);
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(() => tick(performance.now()));
      } else {
        this.animFrameId = requestAnimationFrame(tick);
      }
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private updateGame(delta: number, elapsed: number) {
    const getTerrainHeight = (x: number, z: number) => this.world.getTerrainHeight(x, z);

    // 1. World dynamic updates (monoliths, etc.)
    this.world.update(delta, elapsed);

    // 2. Player Controller update
    this.player.update(delta, getTerrainHeight);
    this.player.updateCamera(this.camera, delta);

    // 3. Keep directional light focused around player for optimal shadows
    this.env.updateKeyLightTarget(this.player.position);

    // 4. Enemy AI and Combat
    this.enemies.update(delta, getTerrainHeight);

    // 5. VFX update & damage projections
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.vfx.update(delta, this.camera, width, height);

    // 6. Check exploration objectives
    this.world.objectives.forEach((obj) => {
      if (!obj.discovered) {
        const dx = this.player.position.x - obj.x;
        const dz = this.player.position.z - obj.z;
        if (Math.sqrt(dx * dx + dz * dz) <= obj.radius) {
          obj.discovered = true;
          const q = this.quests.find((item) => item.id === 'explore');
          if (q && !q.completed) {
            q.current = 1;
            q.completed = true;
          }
        }
      }
    });

    // 7. Dispatch state snapshot to React for HUD
    if (this.onStateUpdate) {
      const nearest = this.enemies.getNearestEnemy(28);
      const boss = this.enemies.activeBoss;

      const enemiesPos = this.enemies.enemies
        .filter((e) => e.data.state !== 'dead')
        .map((e) => ({
          id: e.data.id,
          x: e.data.x,
          z: e.data.z,
          isBoss: !!e.data.isBoss,
        }));

      this.onStateUpdate({
        playerHp: this.player.stats.hp,
        playerMaxHp: this.player.stats.maxHp,
        playerEnergy: this.player.stats.energy,
        playerMaxEnergy: this.player.stats.maxEnergy,
        comboCount: this.player.stats.comboCount,
        comboTier: this.player.stats.comboTier,
        comboTimer: this.player.stats.comboTimer,
        abilities: this.player.abilities,
        isDead: this.player.stats.isDead,
        bossHp: boss && boss.state !== 'dead' ? boss.hp : null,
        bossMaxHp: boss ? boss.maxHp : null,
        bossName: boss ? boss.name : null,
        nearestEnemy: nearest
          ? {
              name: nearest.data.name,
              hp: nearest.data.hp,
              maxHp: nearest.data.maxHp,
              distance: Math.round(
                Math.hypot(
                  nearest.data.x - this.player.position.x,
                  nearest.data.z - this.player.position.z
                )
              ),
            }
          : null,
        quests: this.quests,
        floatingDamages: this.vfx.floatingDamages,
        playerPos: {
          x: this.player.position.x,
          y: this.player.position.y,
          z: this.player.position.z,
        },
        playerRot: this.player.rotationY,
        enemiesPos,
      });
    }
  }

  public dispose() {
    if (this.isSoftwareGl) {
      clearTimeout(this.animFrameId);
    } else {
      cancelAnimationFrame(this.animFrameId);
    }

    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mousedown', this.boundMouseDown);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.renderer?.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer?.dispose();
  }
}
