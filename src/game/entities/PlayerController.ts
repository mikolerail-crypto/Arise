import * as THREE from 'three';
import { CharacterModel } from './CharacterModel';
import { PLAYER_CONFIG, INITIAL_ABILITIES, WORLD_BOUNDS } from '../constants';
import { AbilityState, PlayerStats } from '../types';
import { soundSystem } from '../../audio/SoundSystem';
import { VFXManager } from '../vfx/VFXManager';

export class PlayerController {
  public model: CharacterModel;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public rotationY: number = 0;
  public isGrounded: boolean = true;

  // Stats & Combat State
  public stats: PlayerStats;
  public abilities: AbilityState[];

  // Action states
  public currentAction: 'idle' | 'run' | 'jump' | 'dodge' | 'attack1' | 'attack2' | 'attack3' | 'nova' | 'pierce' = 'idle';
  public actionTimer: number = 0;
  public actionDuration: number = 0;
  public comboStep: number = 0; // 0, 1, 2
  public comboWindowTimer: number = 0;
  public bufferedAttack: boolean = false;
  public attackHitFired: boolean = false;

  // Dodge state
  public dodgeCooldown: number = 0;
  public dodgeDirection: THREE.Vector3 = new THREE.Vector3();

  // Camera settings
  public cameraYaw: number = 0;
  public cameraPitch: number = 0.28;
  public cameraDistance: number = 7.5;
  public cameraTarget: THREE.Vector3 = new THREE.Vector3();

  // Keys state
  public keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    shift: false,
    jump: false,
  };

  private vfx: VFXManager;
  private animTime: number = 0;

  constructor(vfx: VFXManager) {
    this.vfx = vfx;
    this.model = new CharacterModel();
    this.position = new THREE.Vector3(0, 3, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    this.stats = {
      maxHp: PLAYER_CONFIG.MAX_HP,
      hp: PLAYER_CONFIG.MAX_HP,
      maxEnergy: PLAYER_CONFIG.MAX_ENERGY,
      energy: PLAYER_CONFIG.MAX_ENERGY,
      level: 1,
      exp: 0,
      expToNext: 100,
      comboCount: 0,
      comboTier: 'D',
      comboTimer: 0,
      isInvulnerable: false,
      isDead: false,
    };

    this.abilities = JSON.parse(JSON.stringify(INITIAL_ABILITIES));
  }

  public handleMouseMove(deltaX: number, deltaY: number, sensitivity = 0.0022) {
    this.cameraYaw -= deltaX * sensitivity;
    this.cameraPitch = Math.max(-0.25, Math.min(1.2, this.cameraPitch + deltaY * sensitivity));
  }

  public triggerAttack() {
    if (this.stats.isDead) return;

    // If currently dodging, cannot attack
    if (this.currentAction === 'dodge' || this.currentAction === 'nova' || this.currentAction === 'pierce') return;

    // If currently attacking, buffer next combo attack
    if (this.currentAction.startsWith('attack')) {
      if (this.actionTimer > 0.1) {
        this.bufferedAttack = true;
      }
      return;
    }

    // Determine combo step
    let nextStep = 0;
    if (this.comboWindowTimer > 0) {
      nextStep = (this.comboStep + 1) % 3;
    }

    this.startComboAttack(nextStep);
  }

  private startComboAttack(step: number) {
    this.comboStep = step;
    this.currentAction = (`attack${step + 1}`) as 'attack1' | 'attack2' | 'attack3';
    this.actionTimer = 0;
    this.actionDuration = step === 2 ? 0.6 : 0.4;
    this.bufferedAttack = false;
    this.attackHitFired = false;

    // Slight forward step
    const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
    this.velocity.x += fwd.x * (step === 2 ? 5.5 : 3.5);
    this.velocity.z += fwd.z * (step === 2 ? 5.5 : 3.5);

    // Audio & VFX
    soundSystem.playSwordSwing(step);
    this.vfx.spawnSlash(this.position, this.rotationY, step);
  }

  public triggerDodge(): boolean {
    if (this.stats.isDead || this.dodgeCooldown > 0) return false;
    const ability = this.abilities.find((a) => a.id === 'dodge');
    if (!ability || this.stats.energy < ability.energyCost) return false;

    this.stats.energy -= ability.energyCost;
    ability.cooldownCurrent = ability.cooldownMax;
    this.dodgeCooldown = PLAYER_CONFIG.DODGE_COOLDOWN;

    this.currentAction = 'dodge';
    this.actionTimer = 0;
    this.actionDuration = PLAYER_CONFIG.DODGE_DURATION;
    this.stats.isInvulnerable = true;

    // Dodge in current move direction or backwards
    const inputDir = this.getInputDirection();
    if (inputDir.lengthSq() > 0.01) {
      this.dodgeDirection.copy(inputDir).normalize();
      this.rotationY = Math.atan2(this.dodgeDirection.x, this.dodgeDirection.z);
    } else {
      this.dodgeDirection.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
    }

    this.velocity.x = this.dodgeDirection.x * PLAYER_CONFIG.DODGE_SPEED;
    this.velocity.z = this.dodgeDirection.z * PLAYER_CONFIG.DODGE_SPEED;

    soundSystem.playDodge();
    return true;
  }

  public triggerAbilityQ(): boolean {
    if (this.stats.isDead) return false;
    const ability = this.abilities.find((a) => a.id === 'nova');
    if (!ability || ability.cooldownCurrent > 0 || this.stats.energy < ability.energyCost) return false;

    this.stats.energy -= ability.energyCost;
    ability.cooldownCurrent = ability.cooldownMax;

    this.currentAction = 'nova';
    this.actionTimer = 0;
    this.actionDuration = 0.75;
    this.attackHitFired = false;
    this.stats.isInvulnerable = true;

    // Hop slightly up then slam
    this.velocity.y = 7.0;

    soundSystem.playCelestialNova();
    return true;
  }

  public triggerAbilityE(): boolean {
    if (this.stats.isDead) return false;
    const ability = this.abilities.find((a) => a.id === 'pierce');
    if (!ability || ability.cooldownCurrent > 0 || this.stats.energy < ability.energyCost) return false;

    this.stats.energy -= ability.energyCost;
    ability.cooldownCurrent = ability.cooldownMax;

    this.currentAction = 'pierce';
    this.actionTimer = 0;
    this.actionDuration = 0.5;
    this.attackHitFired = false;

    // Sonic thrust forward
    const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
    this.velocity.x = fwd.x * 22;
    this.velocity.z = fwd.z * 22;

    soundSystem.playVoidPiercer();
    this.vfx.spawnVoidBeam(this.position, fwd);
    return true;
  }

  public triggerJump() {
    if (this.stats.isDead || !this.isGrounded) return;
    if (this.currentAction === 'dodge' || this.currentAction === 'nova') return;

    this.velocity.y = PLAYER_CONFIG.JUMP_FORCE;
    this.isGrounded = false;
    soundSystem.playJump();
  }

  private getInputDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3();
    if (this.keys.forward) dir.z += 1;
    if (this.keys.backward) dir.z -= 1;
    if (this.keys.left) dir.x += 1;
    if (this.keys.right) dir.x -= 1;

    if (dir.lengthSq() > 0) {
      dir.normalize();
      // Rotate by camera yaw
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    }
    return dir;
  }

  public takeDamage(amount: number) {
    if (this.stats.isInvulnerable || this.stats.isDead) return;

    this.stats.hp = Math.max(0, this.stats.hp - amount);
    soundSystem.playPlayerHurt();
    this.vfx.spawnHitSparks(this.position, true);

    // Reset combo on hit
    this.stats.comboCount = 0;
    this.updateComboTier();

    if (this.stats.hp <= 0) {
      this.stats.isDead = true;
      this.currentAction = 'idle';
    }
  }

  public registerHitOnEnemy(damage: number, isCrit: boolean) {
    this.stats.comboCount++;
    this.stats.comboTimer = 3.5; // 3.5 sec decay window
    this.updateComboTier();

    // Gain small energy on hit
    this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + (isCrit ? 8 : 4));
  }

  private updateComboTier() {
    const c = this.stats.comboCount;
    if (c >= 35) this.stats.comboTier = 'SSS';
    else if (c >= 25) this.stats.comboTier = 'S';
    else if (c >= 18) this.stats.comboTier = 'A';
    else if (c >= 10) this.stats.comboTier = 'B';
    else if (c >= 4) this.stats.comboTier = 'C';
    else this.stats.comboTier = 'D';
  }

  public update(delta: number, getTerrainHeight: (x: number, z: number) => number) {
    if (this.stats.isDead) return;

    this.animTime += delta;

    // 1. Energy regeneration
    this.stats.energy = Math.min(
      this.stats.maxEnergy,
      this.stats.energy + PLAYER_CONFIG.ENERGY_REGEN_PER_SEC * delta
    );

    // 2. Cooldown tickers
    this.abilities.forEach((a) => {
      if (a.cooldownCurrent > 0) {
        a.cooldownCurrent = Math.max(0, a.cooldownCurrent - delta);
      }
    });
    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown = Math.max(0, this.dodgeCooldown - delta);
    }

    // 3. Combo timer decay
    if (this.stats.comboTimer > 0) {
      this.stats.comboTimer -= delta;
      if (this.stats.comboTimer <= 0) {
        this.stats.comboCount = 0;
        this.updateComboTier();
      }
    }
    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer -= delta;
    }

    // 4. Action State Progression
    if (this.currentAction !== 'idle' && this.currentAction !== 'run' && this.currentAction !== 'jump') {
      this.actionTimer += delta;
      const progress = this.actionTimer / this.actionDuration;

      // Celestial Nova ground impact frame
      if (this.currentAction === 'nova' && progress >= 0.4 && !this.attackHitFired) {
        this.attackHitFired = true;
        this.vfx.spawnNovaRing(this.position);
      }

      if (this.actionTimer >= this.actionDuration) {
        // Action finished
        if (this.currentAction === 'dodge') {
          this.stats.isInvulnerable = false;
        }

        if (this.currentAction.startsWith('attack')) {
          this.comboWindowTimer = 0.55; // Next combo hit window
          if (this.bufferedAttack) {
            const nextStep = (this.comboStep + 1) % 3;
            this.startComboAttack(nextStep);
            return;
          }
        }

        if (this.currentAction === 'nova') {
          this.stats.isInvulnerable = false;
        }

        this.currentAction = 'idle';
      }
    }

    // 5. Movement and Physics
    const inputDir = this.getInputDirection();
    const isMoving = inputDir.lengthSq() > 0.01;

    if (this.currentAction === 'idle' || this.currentAction === 'run' || this.currentAction === 'jump') {
      if (isMoving) {
        const speed = this.keys.shift ? PLAYER_CONFIG.SPRINT_SPEED : PLAYER_CONFIG.WALK_SPEED;
        this.velocity.x = inputDir.x * speed;
        this.velocity.z = inputDir.z * speed;

        // Turn character smoothly towards movement direction
        const targetRot = Math.atan2(inputDir.x, inputDir.z);
        const rotDiff = THREE.MathUtils.euclideanModulo(targetRot - this.rotationY + Math.PI, Math.PI * 2) - Math.PI;
        this.rotationY += rotDiff * Math.min(1, delta * 14);

        if (this.isGrounded) {
          this.currentAction = 'run';
        }
      } else {
        // Friction / stop
        this.velocity.x *= Math.max(0, 1 - delta * 12);
        this.velocity.z *= Math.max(0, 1 - delta * 12);

        if (this.isGrounded && !this.currentAction.startsWith('attack')) {
          this.currentAction = 'idle';
        }
      }
    } else if (this.currentAction === 'dodge') {
      // Retain dodge velocity with slight damping
      this.velocity.x *= Math.max(0, 1 - delta * 3);
      this.velocity.z *= Math.max(0, 1 - delta * 3);
    } else {
      // Attacks and abilities hold forward friction
      this.velocity.x *= Math.max(0, 1 - delta * 8);
      this.velocity.z *= Math.max(0, 1 - delta * 8);
    }

    // Gravity
    this.velocity.y -= PLAYER_CONFIG.GRAVITY * delta;

    // Apply movement
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    // World bounds clamping
    this.position.x = Math.max(WORLD_BOUNDS.MIN_X, Math.min(WORLD_BOUNDS.MAX_X, this.position.x));
    this.position.z = Math.max(WORLD_BOUNDS.MIN_Z, Math.min(WORLD_BOUNDS.MAX_Z, this.position.z));

    // Ground height collision test
    const groundY = getTerrainHeight(this.position.x, this.position.z);
    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
      if (this.currentAction === 'idle' || this.currentAction === 'run') {
        this.currentAction = 'jump';
      }
    }

    // 6. Update 3D Model
    this.model.group.position.copy(this.position);
    this.model.group.rotation.y = this.rotationY;

    const actionProgress = this.actionDuration > 0 ? this.actionTimer / this.actionDuration : 0;
    this.model.animatePose(this.currentAction, actionProgress, this.animTime);
  }

  public updateCamera(camera: THREE.PerspectiveCamera, delta: number) {
    // Calculate third person camera offset based on yaw and pitch
    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);

    const offsetX = Math.sin(this.cameraYaw) * cosPitch * this.cameraDistance;
    const offsetZ = Math.cos(this.cameraYaw) * cosPitch * this.cameraDistance;
    const offsetY = sinPitch * this.cameraDistance;

    const targetPos = new THREE.Vector3(
      this.position.x - offsetX,
      this.position.y + offsetY + 2.0,
      this.position.z - offsetZ
    );

    // Smooth camera lag
    camera.position.lerp(targetPos, Math.min(1, delta * 12));

    // Focus target at chest height
    this.cameraTarget.set(this.position.x, this.position.y + 1.6, this.position.z);
    camera.lookAt(this.cameraTarget);
  }

  public respawn(x = 0, z = 0, getTerrainHeight: (x: number, z: number) => number) {
    this.stats.hp = this.stats.maxHp;
    this.stats.energy = this.stats.maxEnergy;
    this.stats.isDead = false;
    this.stats.isInvulnerable = false;
    this.position.set(x, getTerrainHeight(x, z) + 0.5, z);
    this.velocity.set(0, 0, 0);
    this.currentAction = 'idle';
  }
}
