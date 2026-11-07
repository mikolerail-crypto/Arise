import * as THREE from 'three';
import { EnemyData, EnemyType } from '../types';
import { EnemyModel } from './EnemyModel';
import { PlayerController } from './PlayerController';
import { VFXManager } from '../vfx/VFXManager';
import { soundSystem } from '../../audio/SoundSystem';
import { PLAYER_CONFIG } from '../constants';

interface ActiveEnemy {
  data: EnemyData;
  model: EnemyModel;
  stateTimer: number;
  hurtTimer: number;
  respawnTimer: number;
}

export class EnemyManager {
  public group: THREE.Group;
  public enemies: ActiveEnemy[] = [];
  private player: PlayerController;
  private vfx: VFXManager;
  private elapsed: number = 0;

  // Track boss encounter state for HUD
  public activeBoss: EnemyData | null = null;
  public onEnemyKilled?: (type: EnemyType) => void;

  constructor(player: PlayerController, vfx: VFXManager) {
    this.player = player;
    this.vfx = vfx;
    this.group = new THREE.Group();
    this.spawnInitialEnemies();
  }

  private spawnInitialEnemies() {
    // 1. Void Crawlers patrolling around outer ruins
    const crawlerSpawns = [
      { x: -22, z: -20 },
      { x: 18, z: -35 },
      { x: -38, z: 25 },
      { x: 30, z: 25 },
      { x: -45, z: -45 },
    ];

    crawlerSpawns.forEach((pos, idx) => {
      this.createEnemy({
        id: `crawler_${idx}`,
        name: `Void Crawler ${idx + 1}`,
        type: 'crawler',
        maxHp: 85,
        hp: 85,
        attackPower: 12,
        speed: 7.2,
        detectionRadius: 18,
        attackRange: 2.8,
        attackCooldown: 1.8,
        currentCooldown: 0,
        state: 'idle',
        x: pos.x,
        y: 0,
        z: pos.z,
        rotationY: Math.random() * Math.PI * 2,
        spawnX: pos.x,
        spawnZ: pos.z,
      });
    });

    // 2. Nexus Golems guarding sanctum path
    const golemSpawns = [
      { x: 42, z: 32 },
      { x: 22, z: 45 },
      { x: -15, z: 50 },
    ];

    golemSpawns.forEach((pos, idx) => {
      this.createEnemy({
        id: `golem_${idx}`,
        name: `Nexus Sentinel 0${idx + 1}`,
        type: 'golem',
        maxHp: 220,
        hp: 220,
        attackPower: 24,
        speed: 4.5,
        detectionRadius: 20,
        attackRange: 3.8,
        attackCooldown: 2.4,
        currentCooldown: 0,
        state: 'idle',
        x: pos.x,
        y: 0,
        z: pos.z,
        rotationY: Math.random() * Math.PI * 2,
        spawnX: pos.x,
        spawnZ: pos.z,
      });
    });

    // 3. Supreme Boss: Archon Malakor at the northeast high arena summit
    const bossSpawn = { x: 65, z: 55 };
    const boss = this.createEnemy({
      id: 'boss_malakor',
      name: 'Archon Malakor',
      type: 'boss',
      maxHp: 900,
      hp: 900,
      attackPower: 32,
      speed: 5.8,
      detectionRadius: 32,
      attackRange: 5.5,
      attackCooldown: 2.2,
      currentCooldown: 0,
      state: 'idle',
      x: bossSpawn.x,
      y: 0,
      z: bossSpawn.z,
      rotationY: Math.PI,
      spawnX: bossSpawn.x,
      spawnZ: bossSpawn.z,
      isBoss: true,
      bossPhase: 1,
    });

    this.activeBoss = boss.data;
  }

  private createEnemy(data: EnemyData): ActiveEnemy {
    const model = new EnemyModel(data.type);
    this.group.add(model.group);

    const enemy: ActiveEnemy = {
      data,
      model,
      stateTimer: 0,
      hurtTimer: 0,
      respawnTimer: 0,
    };
    this.enemies.push(enemy);
    return enemy;
  }

  public update(
    delta: number,
    getTerrainHeight: (x: number, z: number) => number
  ) {
    this.elapsed += delta;

    // Check Player's attack hits during active strike frames
    this.checkPlayerCombatHits();

    // Update each enemy AI
    this.enemies.forEach((enemy) => {
      const { data, model } = enemy;

      // Handle respawn timer
      if (data.state === 'dead') {
        enemy.respawnTimer -= delta;
        if (enemy.respawnTimer <= 0) {
          this.respawnEnemy(enemy, getTerrainHeight);
        }
        return;
      }

      enemy.stateTimer += delta;
      if (data.currentCooldown > 0) {
        data.currentCooldown = Math.max(0, data.currentCooldown - delta);
      }

      // Hurt state timer
      if (enemy.hurtTimer > 0) {
        enemy.hurtTimer -= delta;
        if (enemy.hurtTimer <= 0 && data.state === 'hurt') {
          data.state = 'chase';
        }
      }

      // Distance and angle to player
      const dx = this.player.position.x - data.x;
      const dz = this.player.position.z - data.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // AI State Machine
      if (data.state !== 'hurt') {
        if (dist <= data.attackRange) {
          // In attack range
          if (data.currentCooldown <= 0) {
            this.startEnemyAttack(enemy);
          } else {
            // Face player while cooling down
            data.rotationY = Math.atan2(dx, dz);
          }
        } else if (dist <= data.detectionRadius) {
          // Chase player
          data.state = 'chase';
          const dirX = dx / dist;
          const dirZ = dz / dist;

          data.x += dirX * data.speed * delta;
          data.z += dirZ * data.speed * delta;
          data.rotationY = Math.atan2(dirX, dirZ);

          // Boss special: if in phase 2 and distant, trigger rushing blade leap
          if (data.isBoss && data.hp < data.maxHp * 0.5 && dist > 14 && data.currentCooldown <= 0) {
            this.triggerBossSurge(enemy, dirX, dirZ);
          }
        } else {
          // Patrol or return to spawn anchor
          data.state = 'idle';
          const spawnDx = data.spawnX - data.x;
          const spawnDz = data.spawnZ - data.z;
          const spawnDist = Math.sqrt(spawnDx * spawnDx + spawnDz * spawnDz);
          if (spawnDist > 2.0) {
            data.x += (spawnDx / spawnDist) * (data.speed * 0.4) * delta;
            data.z += (spawnDz / spawnDist) * (data.speed * 0.4) * delta;
            data.rotationY = Math.atan2(spawnDx, spawnDz);
          }
        }
      }

      // Ground height clamp
      data.y = getTerrainHeight(data.x, data.z);

      // Update 3D model transforms
      model.group.position.set(data.x, data.y, data.z);
      model.group.rotation.y = data.rotationY;
      model.animate(data.state, this.elapsed, enemy.stateTimer);
    });
  }

  private startEnemyAttack(enemy: ActiveEnemy) {
    const { data } = enemy;
    data.state = 'attack';
    enemy.stateTimer = 0;
    data.currentCooldown = data.attackCooldown;

    soundSystem.playEnemyAttack();

    // Damage impact delayed to hit-frame
    const hitDelay = data.type === 'crawler' ? 0.35 : data.type === 'boss' ? 0.55 : 0.65;
    setTimeout(() => {
      if (data.state === 'dead') return;

      const dx = this.player.position.x - data.x;
      const dz = this.player.position.z - data.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // If player still in range and not dodging, apply damage
      if (dist <= data.attackRange + 1.2) {
        this.player.takeDamage(data.attackPower);

        if (data.isBoss) {
          // Boss shockwave impact
          this.vfx.spawnNovaRing(new THREE.Vector3(data.x, data.y, data.z));
        }
      }

      // Return to chase
      if (data.state === 'attack') {
        data.state = 'chase';
      }
    }, hitDelay * 1000);
  }

  private triggerBossSurge(enemy: ActiveEnemy, dirX: number, dirZ: number) {
    const { data } = enemy;
    data.state = 'attack';
    enemy.stateTimer = 0;
    data.currentCooldown = 4.0;

    soundSystem.playBossRoar();
    this.vfx.spawnVoidBeam(
      new THREE.Vector3(data.x, data.y, data.z),
      new THREE.Vector3(dirX, 0, dirZ)
    );

    // Fast leap towards player
    data.x += dirX * 12;
    data.z += dirZ * 12;
  }

  private checkPlayerCombatHits() {
    const action = this.player.currentAction;
    if (!action.startsWith('attack') && action !== 'nova' && action !== 'pierce') return;

    // Only fire hit once per attack swing
    if (this.player.attackHitFired && action !== 'pierce') return;

    // Check hit timing frame
    const progress = this.player.actionTimer / (this.player.actionDuration || 1);
    const isHitFrame =
      (action === 'attack1' && progress >= 0.25) ||
      (action === 'attack2' && progress >= 0.25) ||
      (action === 'attack3' && progress >= 0.3) ||
      (action === 'nova' && progress >= 0.4) ||
      (action === 'pierce' && progress >= 0.2);

    if (!isHitFrame) return;
    this.player.attackHitFired = true;

    // Attack configuration
    let baseDmg = PLAYER_CONFIG.ATTACK_DAMAGES.light1;
    let range = PLAYER_CONFIG.ATTACK_RANGES.light1;
    let hitArc = Math.PI * 0.65; // ~120 degrees forward

    if (action === 'attack2') {
      baseDmg = PLAYER_CONFIG.ATTACK_DAMAGES.light2;
      range = PLAYER_CONFIG.ATTACK_RANGES.light2;
    } else if (action === 'attack3') {
      baseDmg = PLAYER_CONFIG.ATTACK_DAMAGES.heavy;
      range = PLAYER_CONFIG.ATTACK_RANGES.heavy;
      hitArc = Math.PI * 2; // Full 360 spin
    } else if (action === 'nova') {
      baseDmg = PLAYER_CONFIG.ATTACK_DAMAGES.nova;
      range = PLAYER_CONFIG.ATTACK_RANGES.nova;
      hitArc = Math.PI * 2;
    } else if (action === 'pierce') {
      baseDmg = PLAYER_CONFIG.ATTACK_DAMAGES.pierce;
      range = PLAYER_CONFIG.ATTACK_RANGES.pierce;
      hitArc = Math.PI * 0.35; // Focused piercing cone
    }

    const playerPos = this.player.position;
    const playerRot = this.player.rotationY;
    const playerFwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRot);

    this.enemies.forEach((enemy) => {
      const { data } = enemy;
      if (data.state === 'dead') return;

      const toEnemy = new THREE.Vector3(data.x - playerPos.x, 0, data.z - playerPos.z);
      const dist = toEnemy.length();

      if (dist <= range) {
        toEnemy.normalize();
        const angle = playerFwd.angleTo(toEnemy);

        if (angle <= hitArc / 2 || hitArc >= Math.PI * 1.9) {
          // Calculate crit chance (25% crit or guaranteed on combo finisher)
          const isCrit = Math.random() < 0.25 || action === 'attack3' || action === 'nova';
          const multiplier = isCrit ? 1.75 : 1.0;
          const finalDamage = Math.round(baseDmg * multiplier + (Math.random() * 8 - 4));

          this.damageEnemy(enemy, finalDamage, isCrit);
        }
      }
    });
  }

  public damageEnemy(enemy: ActiveEnemy, amount: number, isCrit: boolean) {
    const { data, model } = enemy;
    if (data.state === 'dead') return;

    data.hp = Math.max(0, data.hp - amount);
    enemy.hurtTimer = 0.22;
    data.state = 'hurt';

    // Knockback
    const kx = data.x - this.player.position.x;
    const kz = data.z - this.player.position.z;
    const kDist = Math.sqrt(kx * kx + kz * kz) || 1;
    const knockForce = isCrit ? 2.5 : 1.2;
    data.x += (kx / kDist) * knockForce;
    data.z += (kz / kDist) * knockForce;

    // SFX & VFX
    soundSystem.playHitImpact(isCrit);
    this.vfx.spawnHitSparks(new THREE.Vector3(data.x, data.y + 1.2, data.z), isCrit);
    this.vfx.addDamageNumber(amount, isCrit, new THREE.Vector3(data.x, data.y, data.z));

    this.player.registerHitOnEnemy(amount, isCrit);

    // Defeat check
    if (data.hp <= 0) {
      this.defeatEnemy(enemy);
    }
  }

  private defeatEnemy(enemy: ActiveEnemy) {
    const { data, model } = enemy;
    data.state = 'dead';
    enemy.respawnTimer = data.isBoss ? 25 : 8.0; // 8s respawn for minions, 25s for boss

    // Death burst
    this.vfx.spawnHitSparks(new THREE.Vector3(data.x, data.y + 1.2, data.z), true);
    model.group.visible = false;

    if (this.onEnemyKilled) {
      this.onEnemyKilled(data.type);
    }

    if (data.isBoss) {
      soundSystem.playBossRoar();
    }
  }

  private respawnEnemy(enemy: ActiveEnemy, getTerrainHeight: (x: number, z: number) => number) {
    const { data, model } = enemy;
    data.hp = data.maxHp;
    data.x = data.spawnX;
    data.z = data.spawnZ;
    data.y = getTerrainHeight(data.x, data.z);
    data.state = 'idle';
    data.currentCooldown = 1.0;
    model.group.visible = true;

    // Spawn shimmer
    this.vfx.spawnNovaRing(new THREE.Vector3(data.x, data.y, data.z));
  }

  public getNearestEnemy(maxDistance = 25): ActiveEnemy | null {
    let nearest: ActiveEnemy | null = null;
    let minDist = maxDistance;

    this.enemies.forEach((e) => {
      if (e.data.state === 'dead') return;
      const dx = e.data.x - this.player.position.x;
      const dz = e.data.z - this.player.position.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    });

    return nearest;
  }
}
