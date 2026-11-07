import * as THREE from 'three';
import { createTerrainTexture, createRuneStoneTexture } from './ProceduralTextures';

export interface ObjectiveNode {
  id: string;
  name: string;
  x: number;
  z: number;
  y: number;
  radius: number;
  discovered: boolean;
  mesh?: THREE.Object3D;
}

export class WorldManager {
  public group: THREE.Group;
  public terrainMesh!: THREE.Mesh;
  public staticColliders: THREE.Box3[] = [];
  public objectives: ObjectiveNode[] = [];
  public floatingMonoliths: THREE.Group[] = [];
  public crystalTrees: THREE.Group[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.buildTerrain();
    this.buildRuinsAndSanctum();
    this.buildFoliageAndCrystals();
    this.setupObjectives();
  }

  /**
   * Continuous mathematical height calculation across the map.
   * Matches vertex displacement and provides instant grounded collision without raycasting.
   */
  public getTerrainHeight(x: number, z: number): number {
    // Distance from world center
    const dist = Math.sqrt(x * x + z * z);

    // Natural mountain boundary ring at the edge
    let boundaryLift = 0;
    if (dist > 120) {
      boundaryLift = Math.pow((dist - 120) / 30, 2) * 16;
    }

    // Boss arena plateau in the north-east (x: 40 to 90, z: -80 to -30)
    const bossDx = x - 65;
    const bossDz = z - 55;
    const bossDist = Math.sqrt(bossDx * bossDx + bossDz * bossDz);
    let bossPlateau = 0;
    if (bossDist < 35) {
      bossPlateau = 12 * Math.cos((bossDist / 35) * (Math.PI / 2));
    }

    // Central sanctuary dais at (0, 0)
    let centerDais = 0;
    if (dist < 22) {
      centerDais = 2.5 * (1 - dist / 22);
    }

    // Rolling organic hills
    const hills =
      Math.sin(x * 0.04) * Math.cos(z * 0.04) * 3.5 +
      Math.sin(x * 0.09 + 1.2) * Math.cos(z * 0.07) * 1.8 +
      Math.cos(x * 0.02 - z * 0.03) * 2.2;

    return hills + bossPlateau + centerDais + boundaryLift;
  }

  private buildTerrain() {
    const size = 320;
    const segments = 128;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getTerrainHeight(x, z);
      pos.setY(i, y);
    }
    geometry.computeVertexNormals();

    const terrainTexture = createTerrainTexture();
    const terrainMaterial = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: false,
    });

    this.terrainMesh = new THREE.Mesh(geometry, terrainMaterial);
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);
  }

  private buildRuinsAndSanctum() {
    const runeTex = createRuneStoneTexture('#38bdf8');
    const stoneMat = new THREE.MeshStandardMaterial({
      map: runeTex,
      roughness: 0.7,
      metalness: 0.2,
    });

    const glowRuneMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });

    // 1. Central Sanctuary Dais (Spawn Area)
    const daisGroup = new THREE.Group();
    const daisBase = new THREE.Mesh(new THREE.CylinderGeometry(14, 16, 2, 16), stoneMat);
    daisBase.position.y = 1;
    daisBase.receiveShadow = true;
    daisBase.castShadow = true;
    daisGroup.add(daisBase);

    // Dais Inner Ring
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(10, 0.4, 8, 32), glowRuneMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 2.05;
    daisGroup.add(innerRing);

    // 4 Outer Columns around Dais
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const col = this.createAncientColumn(stoneMat, glowRuneMat);
      col.position.set(Math.cos(angle) * 11, 0, Math.sin(angle) * 11);
      daisGroup.add(col);
    }

    daisGroup.position.set(0, this.getTerrainHeight(0, 0), 0);
    this.group.add(daisGroup);

    // 2. Boss Arena (Archon's Crucible) in the Northeast (x: 65, z: 55)
    const arenaX = 65;
    const arenaZ = 55;
    const arenaY = this.getTerrainHeight(arenaX, arenaZ);

    const arenaGroup = new THREE.Group();
    const arenaFloor = new THREE.Mesh(new THREE.CylinderGeometry(28, 30, 2.5, 24), stoneMat);
    arenaFloor.position.y = 1.25;
    arenaFloor.receiveShadow = true;
    arenaFloor.castShadow = true;
    arenaGroup.add(arenaFloor);

    // Outer boundary pillars
    const bossPillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.5,
      metalness: 0.3,
    });
    const bossGlowMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      emissive: 0xa855f7,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const p = this.createAncientColumn(bossPillarMat, bossGlowMat, 7.5);
      p.position.set(Math.cos(angle) * 25, 0, Math.sin(angle) * 25);
      arenaGroup.add(p);
    }

    arenaGroup.position.set(arenaX, arenaY - 1, arenaZ);
    this.group.add(arenaGroup);

    // 3. Ancient Monoliths & Floating Shards
    const monolithCoords = [
      { x: -35, z: -25 },
      { x: 30, z: -40 },
      { x: -50, z: 45 },
      { x: 15, z: 60 },
      { x: -75, z: -60 },
    ];

    monolithCoords.forEach((coord, idx) => {
      const y = this.getTerrainHeight(coord.x, coord.z);
      const monolith = this.createFloatingMonolith(stoneMat, glowRuneMat);
      monolith.position.set(coord.x, y + 4, coord.z);
      monolith.rotation.y = idx * 1.2;
      this.floatingMonoliths.push(monolith);
      this.group.add(monolith);
    });

    // 4. Stone Arches / Gateways
    const archPositions = [
      { x: 25, z: 20, rot: 0.8 },
      { x: -25, z: -15, rot: -0.4 },
      { x: 45, z: 38, rot: 0.5 },
    ];
    archPositions.forEach((pos) => {
      const y = this.getTerrainHeight(pos.x, pos.z);
      const arch = this.createStoneArch(stoneMat, glowRuneMat);
      arch.position.set(pos.x, y, pos.z);
      arch.rotation.y = pos.rot;
      this.group.add(arch);
    });
  }

  private createAncientColumn(
    stoneMat: THREE.Material,
    glowMat: THREE.Material,
    height = 6.0
  ): THREE.Group {
    const colGroup = new THREE.Group();

    // Base pedestal
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 2.4), stoneMat);
    base.position.y = 0.4;
    base.castShadow = true;
    base.receiveShadow = true;
    colGroup.add(base);

    // Column shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, height, 8), stoneMat);
    shaft.position.y = height / 2 + 0.8;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    colGroup.add(shaft);

    // Glowing rune bands
    const band1 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 6, 16), glowMat);
    band1.rotation.x = Math.PI / 2;
    band1.position.y = height * 0.35 + 0.8;
    colGroup.add(band1);

    const band2 = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.12, 6, 16), glowMat);
    band2.rotation.x = Math.PI / 2;
    band2.position.y = height * 0.75 + 0.8;
    colGroup.add(band2);

    // Capital top
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 2.2), stoneMat);
    top.position.y = height + 1.2;
    top.castShadow = true;
    colGroup.add(top);

    return colGroup;
  }

  private createStoneArch(stoneMat: THREE.Material, glowMat: THREE.Material): THREE.Group {
    const arch = new THREE.Group();
    const p1 = this.createAncientColumn(stoneMat, glowMat, 5.5);
    p1.position.set(-4, 0, 0);
    arch.add(p1);

    const p2 = this.createAncientColumn(stoneMat, glowMat, 5.5);
    p2.position.set(4, 0, 0);
    arch.add(p2);

    // Lintel beam across
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.2, 2.2), stoneMat);
    lintel.position.set(0, 6.7, 0);
    lintel.castShadow = true;
    arch.add(lintel);

    // Floating central keystone
    const keystone = new THREE.Mesh(new THREE.OctahedronGeometry(1.0, 0), glowMat);
    keystone.position.set(0, 5.2, 0);
    arch.add(keystone);

    return arch;
  }

  private createFloatingMonolith(stoneMat: THREE.Material, glowMat: THREE.Material): THREE.Group {
    const mGroup = new THREE.Group();

    // Central diamond monolith
    const coreGeo = new THREE.ConeGeometry(2.2, 6.5, 4);
    coreGeo.rotateX(Math.PI);
    const topCone = new THREE.ConeGeometry(2.2, 5.5, 4);

    const mesh1 = new THREE.Mesh(coreGeo, stoneMat);
    mesh1.position.y = -1.2;
    mesh1.castShadow = true;
    mGroup.add(mesh1);

    const mesh2 = new THREE.Mesh(topCone, stoneMat);
    mesh2.position.y = 3.5;
    mesh2.castShadow = true;
    mGroup.add(mesh2);

    // Glowing core crystal between halves
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), glowMat);
    crystal.position.y = 1.2;
    mGroup.add(crystal);

    // Orbiting rune shards
    for (let i = 0; i < 3; i++) {
      const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(0.7), glowMat);
      const angle = (i * Math.PI * 2) / 3;
      shard.position.set(Math.cos(angle) * 3.8, 1.2 + (i - 1) * 0.8, Math.sin(angle) * 3.8);
      mGroup.add(shard);
    }

    return mGroup;
  }

  private buildFoliageAndCrystals() {
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x1e1528,
      roughness: 0.9,
    });

    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.15,
      metalness: 0.85,
    });

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      roughness: 0.8,
    });

    // Generate ~35 stylized crystal trees & rock formations
    const rng = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    let seed = 42;
    for (let i = 0; i < 35; i++) {
      const x = (rng(seed++) - 0.5) * 220;
      const z = (rng(seed++) - 0.5) * 220;

      // Keep dais and boss arena center clear
      const distDais = Math.sqrt(x * x + z * z);
      const distBoss = Math.sqrt((x - 65) * (x - 65) + (z - 55) * (z - 55));
      if (distDais < 24 || distBoss < 32) continue;

      const y = this.getTerrainHeight(x, z);
      const tree = this.createStylizedCrystalTree(trunkMat, crystalMat, leafMat);
      tree.position.set(x, y, z);
      const scale = 0.8 + rng(seed++) * 0.5;
      tree.scale.set(scale, scale, scale);
      tree.rotation.y = rng(seed++) * Math.PI * 2;

      this.crystalTrees.push(tree);
      this.group.add(tree);
    }

    // Large rock outcrops
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.95,
      metalness: 0.05,
    });
    for (let i = 0; i < 24; i++) {
      const rx = (rng(seed++) - 0.5) * 260;
      const rz = (rng(seed++) - 0.5) * 260;
      const distDais = Math.sqrt(rx * rx + rz * rz);
      if (distDais < 20) continue;

      const ry = this.getTerrainHeight(rx, rz);
      const rockGeo = new THREE.DodecahedronGeometry(2.5 + rng(seed++) * 3.5, 1);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(rx, ry + 1.0, rz);
      rock.rotation.set(rng(seed++), rng(seed++), rng(seed++));
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    }
  }

  private createStylizedCrystalTree(
    trunkMat: THREE.Material,
    crystalMat: THREE.Material,
    leafMat: THREE.Material
  ): THREE.Group {
    const tree = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.8, 4.5, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.25;
    trunk.castShadow = true;
    tree.add(trunk);

    // Tier 1 foliage
    const f1 = new THREE.Mesh(new THREE.ConeGeometry(3.0, 3.2, 6), leafMat);
    f1.position.y = 4.6;
    f1.castShadow = true;
    tree.add(f1);

    // Tier 2 foliage
    const f2 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.8, 6), leafMat);
    f2.position.y = 6.2;
    f2.castShadow = true;
    tree.add(f2);

    // Glowing crown crystal spire
    const spire = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), crystalMat);
    spire.scale.set(0.8, 2.2, 0.8);
    spire.position.y = 8.0;
    spire.castShadow = true;
    tree.add(spire);

    return tree;
  }

  private setupObjectives() {
    this.objectives = [
      {
        id: 'obelisk_alpha',
        name: 'Nexus Prime Obelisk',
        x: -35,
        z: -25,
        y: this.getTerrainHeight(-35, -25),
        radius: 6.0,
        discovered: false,
      },
      {
        id: 'sanctum_portal',
        name: 'Ancient Gateway',
        x: 25,
        z: 20,
        y: this.getTerrainHeight(25, 20),
        radius: 6.5,
        discovered: false,
      },
      {
        id: 'boss_summit',
        name: "Archon's Crucible",
        x: 65,
        z: 55,
        y: this.getTerrainHeight(65, 55),
        radius: 12.0,
        discovered: false,
      },
    ];
  }

  public update(delta: number, elapsed: number) {
    // Gentle floating and bobbing of ancient monoliths
    this.floatingMonoliths.forEach((m, idx) => {
      const baseY = this.getTerrainHeight(m.position.x, m.position.z) + 4;
      m.position.y = baseY + Math.sin(elapsed * 1.5 + idx) * 0.45;
      m.rotation.y += delta * 0.25;
    });
  }
}
