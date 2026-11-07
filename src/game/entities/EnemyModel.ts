import * as THREE from 'three';
import { EnemyType } from '../types';

/**
 * Procedural 3D Enemy Models for Astryx: Nexus Zero.
 * Features Void Crawlers, Nexus Golems, and Boss Archon Malakor.
 */
export class EnemyModel {
  public group: THREE.Group;
  public type: EnemyType;
  public meshRoot: THREE.Group;
  public animatedLimbs: THREE.Object3D[] = [];
  public orbitingBlades: THREE.Group[] = [];
  public coreMesh!: THREE.Mesh;
  public materials: THREE.Material[] = [];

  constructor(type: EnemyType) {
    this.type = type;
    this.group = new THREE.Group();
    this.meshRoot = new THREE.Group();
    this.group.add(this.meshRoot);

    if (type === 'crawler') {
      this.buildVoidCrawler();
    } else if (type === 'golem') {
      this.buildNexusGolem();
    } else if (type === 'boss') {
      this.buildArchonMalakor();
    }
  }

  // 1. VOID CRAWLER (Fast, predatory mantis/shadow beast)
  private buildVoidCrawler() {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.8,
      metalness: 0.2,
    });
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.9,
    });
    this.materials.push(bodyMat, bladeMat);

    // Thorax / Abdomen
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 6), bodyMat);
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 0.7, -0.2);
    body.castShadow = true;
    this.meshRoot.add(body);

    // Glowing Void Core
    this.coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), bladeMat);
    this.coreMesh.position.set(0, 0.75, 0.2);
    this.meshRoot.add(this.coreMesh);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.45), bodyMat);
    head.position.set(0, 0.8, 0.55);
    head.castShadow = true;
    this.meshRoot.add(head);

    // Glowing Eye slits
    const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.1), bladeMat);
    eyes.position.set(0, 0.85, 0.78);
    this.meshRoot.add(eyes);

    // Scythe-like Mantis Forelegs
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const legRoot = new THREE.Group();
      legRoot.position.set(side * 0.35, 0.75, 0.35);

      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.7, 5), bodyMat);
      upper.position.set(side * 0.2, 0.2, 0);
      upper.rotation.z = side * -0.6;
      legRoot.add(upper);

      const scythe = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.1, 4), bladeMat);
      scythe.position.set(side * 0.45, -0.3, 0.2);
      scythe.rotation.x = 0.5;
      scythe.rotation.z = side * 0.3;
      legRoot.add(scythe);

      this.meshRoot.add(legRoot);
      this.animatedLimbs.push(legRoot);
    }

    // Rear Walking Legs
    for (let i = 0; i < 4; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.8, 4), bodyMat);
      leg.position.set(side * 0.5, 0.4, -row * 0.4);
      leg.rotation.z = side * -0.5;
      leg.rotation.x = row === 0 ? 0.2 : -0.3;
      this.meshRoot.add(leg);
    }
  }

  // 2. NEXUS GOLEM (Heavy ancient stone sentinel)
  private buildNexusGolem() {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.9,
      metalness: 0.15,
    });
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.materials.push(stoneMat, runeMat);

    // Torso block
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 1.0), stoneMat);
    torso.position.set(0, 1.8, 0);
    torso.castShadow = true;
    this.meshRoot.add(torso);

    // Glowing Chest Rune
    this.coreMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1), runeMat);
    this.coreMesh.position.set(0, 1.9, 0.52);
    this.meshRoot.add(this.coreMesh);

    // Head block with visor
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.65), stoneMat);
    head.position.set(0, 2.75, 0);
    head.castShadow = true;
    this.meshRoot.add(head);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.1), runeMat);
    eye.position.set(0, 2.75, 0.33);
    this.meshRoot.add(eye);

    // Floating Stone Shoulders & Fists
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const armGroup = new THREE.Group();
      armGroup.position.set(side * 1.15, 2.2, 0);

      const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), stoneMat);
      armGroup.add(p);

      const fist = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8, 0.65), stoneMat);
      fist.position.set(0, -0.9, 0.2);
      fist.castShadow = true;
      armGroup.add(fist);

      const fistRune = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.1), runeMat);
      fistRune.position.set(0, -0.9, 0.53);
      armGroup.add(fistRune);

      this.meshRoot.add(armGroup);
      this.animatedLimbs.push(armGroup);
    }

    // Heavy Stone Legs
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.6), stoneMat);
      leg.position.set(side * 0.45, 0.55, 0);
      leg.castShadow = true;
      this.meshRoot.add(leg);
    }
  }

  // 3. ARCHON MALAKOR (Supreme Boss Construct)
  private buildArchonMalakor() {
    const bossMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.35,
      metalness: 0.85,
    });
    const goldTrim = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.95,
    });
    const voidGlow = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      emissive: 0xc084fc,
      emissiveIntensity: 2.5,
      roughness: 0.1,
    });
    this.materials.push(bossMat, goldTrim, voidGlow);

    // Scale up to towering boss proportion
    this.meshRoot.scale.set(1.9, 1.9, 1.9);

    // Armored Archon Chassis
    const chest = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 6), bossMat);
    chest.rotation.x = Math.PI;
    chest.position.set(0, 2.6, 0);
    chest.castShadow = true;
    this.meshRoot.add(chest);

    // Golden Imperial Pauldrons
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 0.9), goldTrim);
      p.position.set(side * 1.05, 3.2, 0);
      p.rotation.z = side * -0.25;
      p.castShadow = true;
      this.meshRoot.add(p);
    }

    // Crowned Helm
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.65), bossMat);
    head.position.set(0, 3.8, 0);
    head.castShadow = true;
    this.meshRoot.add(head);

    // Void Crown Spikes
    for (let i = 0; i < 5; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 4), goldTrim);
      const angle = ((i - 2) * Math.PI) / 8;
      spike.position.set(Math.sin(angle) * 0.35, 4.2 + Math.cos(angle) * 0.1, -0.05);
      spike.rotation.z = -angle * 0.8;
      this.meshRoot.add(spike);
    }

    // Corrupted Heart of the Nexus
    this.coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), voidGlow);
    this.coreMesh.position.set(0, 2.6, 0.4);
    this.meshRoot.add(this.coreMesh);

    // Glowing Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.1), voidGlow);
    visor.position.set(0, 3.8, 0.33);
    this.meshRoot.add(visor);

    // 4 Orbiting Celestial Void Blades (Hovering behind him in a fan ring)
    for (let i = 0; i < 4; i++) {
      const bladePivot = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 0.08), voidGlow);
      blade.position.set(0, 1.2, 0);
      blade.castShadow = true;
      bladePivot.add(blade);

      const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 0.12), goldTrim);
      hilt.position.set(0, 0.1, 0);
      bladePivot.add(hilt);

      this.meshRoot.add(bladePivot);
      this.orbitingBlades.push(bladePivot);
    }

    // Heavy segmented lower robes / legs
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 2.0, 8), bossMat);
    lower.position.set(0, 1.0, 0);
    lower.castShadow = true;
    this.meshRoot.add(lower);
  }

  /**
   * Procedural animation updates for enemy actions
   */
  public animate(
    state: 'idle' | 'chase' | 'attack' | 'hurt' | 'dead',
    elapsed: number,
    stateTimer: number
  ) {
    // Pulse core glow
    if (this.coreMesh) {
      const pulse = 1 + Math.sin(elapsed * 5) * 0.15;
      this.coreMesh.scale.set(pulse, pulse, pulse);
    }

    if (this.type === 'crawler') {
      if (state === 'chase' || state === 'idle') {
        const speed = state === 'chase' ? 14 : 4;
        this.meshRoot.position.y = Math.abs(Math.sin(elapsed * speed)) * 0.12;
        this.animatedLimbs.forEach((limb, idx) => {
          limb.rotation.x = Math.sin(elapsed * speed + idx * Math.PI) * 0.45;
        });
      } else if (state === 'attack') {
        // Scythe lunge
        const swing = Math.sin(stateTimer * 8);
        this.animatedLimbs.forEach((limb) => {
          limb.rotation.x = -0.8 + swing * 0.9;
        });
      }
    } else if (this.type === 'golem') {
      if (state === 'chase' || state === 'idle') {
        const cycle = Math.sin(elapsed * 4);
        this.animatedLimbs.forEach((arm, idx) => {
          arm.rotation.x = cycle * (idx === 0 ? 0.4 : -0.4);
        });
      } else if (state === 'attack') {
        // Overhead ground hammer slam
        const p = Math.sin(Math.min(1, stateTimer * 3) * Math.PI);
        this.animatedLimbs.forEach((arm) => {
          arm.rotation.x = -p * 1.5;
        });
      }
    } else if (this.type === 'boss') {
      // Rotate and animate the 4 floating orbital blades
      this.orbitingBlades.forEach((blade, i) => {
        const angle = elapsed * 1.5 + (i * Math.PI * 2) / 4;
        const radius = 2.2 + Math.sin(elapsed * 2 + i) * 0.3;
        blade.position.set(Math.cos(angle) * radius, 2.5 + Math.sin(elapsed * 3 + i) * 0.5, Math.sin(angle) * radius);
        blade.rotation.y = angle + Math.PI / 2;
        blade.rotation.z = Math.sin(elapsed * 4 + i) * 0.2;
      });

      if (state === 'attack') {
        // Ground shatter slam or blade surge
        this.meshRoot.position.y = 0.5 + Math.sin(stateTimer * 6) * 0.4;
      } else {
        this.meshRoot.position.y = Math.sin(elapsed * 2) * 0.15;
      }
    }

    if (state === 'hurt') {
      this.meshRoot.position.x = (Math.random() - 0.5) * 0.15;
    } else {
      this.meshRoot.position.x = 0;
    }
  }

  public dispose() {
    this.materials.forEach((m) => m.dispose());
  }
}
