import * as THREE from 'three';
import { FloatingDamage } from '../types';

interface SlashEffect {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  life: number;
  maxLife: number;
}

interface ParticleBurst {
  points: THREE.Points;
  velocities: Float32Array;
  life: number;
  maxLife: number;
}

interface ShockwaveRing {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  life: number;
  maxLife: number;
  growthSpeed: number;
}

export class VFXManager {
  public group: THREE.Group;
  private slashes: SlashEffect[] = [];
  private particleBursts: ParticleBurst[] = [];
  private shockwaves: ShockwaveRing[] = [];
  public floatingDamages: FloatingDamage[] = [];

  constructor() {
    this.group = new THREE.Group();
  }

  // SWORD SLASH ARC TRAIL
  public spawnSlash(position: THREE.Vector3, rotationY: number, comboIndex: number) {
    // Generate curved arc mesh
    const innerRadius = 1.4;
    const outerRadius = 2.8;
    const thetaLength = Math.PI * 0.75;
    const arcGeo = new THREE.RingGeometry(innerRadius, outerRadius, 24, 1, 0, thetaLength);

    const colors = [0x38bdf8, 0x06b6d4, 0xa855f7];
    const slashColor = colors[comboIndex % colors.length];

    const material = new THREE.MeshBasicMaterial({
      color: slashColor,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(arcGeo, material);
    mesh.position.copy(position);
    mesh.position.y += 1.2;

    if (comboIndex === 0) {
      mesh.rotation.x = Math.PI / 2 + 0.2;
      mesh.rotation.y = rotationY - 0.4;
    } else if (comboIndex === 1) {
      mesh.rotation.x = Math.PI / 2 - 0.4;
      mesh.rotation.y = rotationY + 0.3;
      mesh.rotation.z = 0.5;
    } else {
      // 360 Full Circle Finisher
      const fullRingGeo = new THREE.RingGeometry(1.6, 3.8, 32);
      mesh.geometry.dispose();
      mesh.geometry = fullRingGeo;
      mesh.rotation.x = Math.PI / 2;
    }

    this.group.add(mesh);
    this.slashes.push({
      mesh,
      material,
      life: 0.22,
      maxLife: 0.22,
    });
  }

  // HIT SPARKS BURST
  public spawnHitSparks(position: THREE.Vector3, isCrit: boolean = false) {
    const count = isCrit ? 45 : 24;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      // Spherical scatter velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = isCrit ? Math.random() * 12 + 6 : Math.random() * 7 + 3;

      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed + 3.0; // slight upward bias
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: isCrit ? 0xfacc15 : 0x38bdf8,
      size: isCrit ? 0.45 : 0.28,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    this.group.add(points);

    this.particleBursts.push({
      points,
      velocities,
      life: 0.35,
      maxLife: 0.35,
    });
  }

  // NOVA SHOCKWAVE EXPANDING RING
  public spawnNovaRing(position: THREE.Vector3) {
    const geo = new THREE.RingGeometry(0.5, 1.4, 32);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.position.y += 0.15;
    this.group.add(mesh);

    this.shockwaves.push({
      mesh,
      material: mat,
      life: 0.55,
      maxLife: 0.55,
      growthSpeed: 28,
    });

    // Also spawn a massive upward pillar flash
    const pillarGeo = new THREE.CylinderGeometry(4.5, 0.5, 16, 16, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.copy(position);
    pillar.position.y += 8;
    this.group.add(pillar);

    this.shockwaves.push({
      mesh: pillar,
      material: pillarMat,
      life: 0.35,
      maxLife: 0.35,
      growthSpeed: 4,
    });
  }

  // VOID PIERCER BEAM
  public spawnVoidBeam(origin: THREE.Vector3, forward: THREE.Vector3) {
    const length = 12.0;
    const geo = new THREE.CylinderGeometry(0.35, 0.5, length, 12);
    geo.rotateX(Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    const beam = new THREE.Mesh(geo, mat);
    beam.position.copy(origin);
    beam.position.addScaledVector(forward, length / 2);
    beam.position.y += 1.2;
    beam.lookAt(beam.position.clone().add(forward));
    this.group.add(beam);

    this.shockwaves.push({
      mesh: beam,
      material: mat,
      life: 0.28,
      maxLife: 0.28,
      growthSpeed: 1.5,
    });
  }

  // ADD DAMAGE NUMBER
  public addDamageNumber(amount: number, isCrit: boolean, position: THREE.Vector3) {
    const id = Math.random().toString(36).substring(2, 9);
    this.floatingDamages.push({
      id,
      amount,
      isCrit,
      x: position.x + (Math.random() - 0.5) * 0.8,
      y: position.y + 1.8 + Math.random() * 0.4,
      z: position.z + (Math.random() - 0.5) * 0.8,
      screenX: -999,
      screenY: -999,
      createdAt: Date.now(),
    });
  }

  public update(delta: number, camera: THREE.Camera, width: number, height: number) {
    // 1. Update Slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= delta;
      const progress = 1 - s.life / s.maxLife;
      s.material.opacity = Math.max(0, 1 - progress);
      s.mesh.scale.multiplyScalar(1 + delta * 2);

      if (s.life <= 0) {
        this.group.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.material.dispose();
        this.slashes.splice(i, 1);
      }
    }

    // 2. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const ring = this.shockwaves[i];
      ring.life -= delta;
      const progress = 1 - ring.life / ring.maxLife;
      ring.material.opacity = Math.max(0, (1 - progress) * 0.9);
      ring.mesh.scale.addScalar(delta * ring.growthSpeed);

      if (ring.life <= 0) {
        this.group.remove(ring.mesh);
        ring.mesh.geometry.dispose();
        ring.material.dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update Particle Bursts
    for (let i = this.particleBursts.length - 1; i >= 0; i--) {
      const p = this.particleBursts[i];
      p.life -= delta;
      const attr = p.points.geometry.attributes.position;
      const posArray = attr.array as Float32Array;
      const velArray = p.velocities;
      const count = posArray.length / 3;

      for (let j = 0; j < count; j++) {
        posArray[j * 3] += velArray[j * 3] * delta;
        posArray[j * 3 + 1] += velArray[j * 3 + 1] * delta;
        posArray[j * 3 + 2] += velArray[j * 3 + 2] * delta;
        // Gravity
        velArray[j * 3 + 1] -= 18 * delta;
      }
      attr.needsUpdate = true;

      const mat = p.points.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.group.remove(p.points);
        p.points.geometry.dispose();
        mat.dispose();
        this.particleBursts.splice(i, 1);
      }
    }

    // 4. Update Floating Damage numbers screen projections
    const now = Date.now();
    const tempVec = new THREE.Vector3();
    for (let i = this.floatingDamages.length - 1; i >= 0; i--) {
      const dmg = this.floatingDamages[i];
      const age = (now - dmg.createdAt) / 1000;
      if (age > 0.85) {
        this.floatingDamages.splice(i, 1);
        continue;
      }

      tempVec.set(dmg.x, dmg.y + age * 1.5, dmg.z);
      tempVec.project(camera);

      // Check if in front of camera
      if (tempVec.z < 1) {
        dmg.screenX = ((tempVec.x + 1) * width) / 2;
        dmg.screenY = ((-tempVec.y + 1) * height) / 2;
      } else {
        dmg.screenX = -999;
        dmg.screenY = -999;
      }
    }
  }
}
