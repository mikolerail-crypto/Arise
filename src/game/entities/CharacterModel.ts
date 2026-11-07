import * as THREE from 'three';

/**
 * Procedural 3D Anime Hero Model: Zane, the Celestial Wanderer.
 * Features 12+ articulated parts, cyber-coat, stylized spiky hair,
 * glowing celestial visor, and Astraea (emissive Katana).
 */
export class CharacterModel {
  public group: THREE.Group;

  // Articulated segments for procedural animations
  public root: THREE.Group;
  public hips: THREE.Group;
  public spine: THREE.Group;
  public chest: THREE.Group;
  public head: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftForearm: THREE.Group;
  public rightForearm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public leftKnee: THREE.Group;
  public rightKnee: THREE.Group;
  public sword: THREE.Group;
  public scarfTails: THREE.Mesh[] = [];

  // Materials
  public bodyMat!: THREE.MeshStandardMaterial;
  public coatMat!: THREE.MeshStandardMaterial;
  public armorMat!: THREE.MeshStandardMaterial;
  public hairMat!: THREE.MeshStandardMaterial;
  public skinMat!: THREE.MeshStandardMaterial;
  public glowMat!: THREE.MeshStandardMaterial;
  public bladeGlowMat!: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.root = new THREE.Group();
    this.group.add(this.root);

    this.hips = new THREE.Group();
    this.spine = new THREE.Group();
    this.chest = new THREE.Group();
    this.head = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftForearm = new THREE.Group();
    this.rightForearm = new THREE.Group();
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.leftKnee = new THREE.Group();
    this.rightKnee = new THREE.Group();
    this.sword = new THREE.Group();

    this.initMaterials();
    this.assembleRig();
    this.buildSword();
  }

  private initMaterials() {
    // Cyber-suit base
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.65,
      metalness: 0.35,
    });

    // Wandering Coat (dark midnight blue with cyan lining)
    this.coatMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Lightweight Celestial Armor Pauldrons & Gauntlets
    this.armorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.25,
      metalness: 0.85,
    });

    // Anime Silver/White Spiky Hair
    this.hairMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.5,
      metalness: 0.1,
    });

    // Anime Face Skin
    this.skinMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.7,
      metalness: 0.05,
    });

    // Glowing Visor / Celestial Eye / Sash Accents
    this.glowMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x22d3ee,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.9,
    });

    // Astraea Blade Edge
    this.bladeGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.2,
      roughness: 0.15,
      metalness: 0.95,
    });
  }

  private assembleRig() {
    // 1. Hips / Pelvis
    this.hips.position.y = 1.05;
    this.root.add(this.hips);

    const hipsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.32), this.bodyMat);
    hipsMesh.castShadow = true;
    this.hips.add(hipsMesh);

    // Celestial Sash / Belt
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.36), this.glowMat);
    this.hips.add(belt);

    // Scarf tails hanging from belt
    for (let i = 0; i < 2; i++) {
      const tailGeo = new THREE.BoxGeometry(0.12, 0.75, 0.03);
      tailGeo.translate(0, -0.35, 0);
      const tail = new THREE.Mesh(tailGeo, this.glowMat);
      tail.position.set(i === 0 ? -0.16 : 0.16, -0.05, -0.18);
      this.hips.add(tail);
      this.scarfTails.push(tail);
    }

    // 2. Spine & Chest
    this.spine.position.y = 0.2;
    this.hips.add(this.spine);

    this.chest.position.y = 0.35;
    this.spine.add(this.chest);

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.36), this.coatMat);
    chestMesh.castShadow = true;
    this.chest.add(chestMesh);

    // Armor breastplate detail
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.38, 0.12), this.armorMat);
    chestPlate.position.set(0, 0.02, 0.18);
    this.chest.add(chestPlate);

    // Coat tails (flowing behind)
    const coatTails = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.85, 0.04), this.coatMat);
    coatTails.position.set(0, -0.5, -0.18);
    coatTails.rotation.x = 0.15;
    this.chest.add(coatTails);

    // 3. Head & Anime Spiky Hair
    this.head.position.y = 0.42;
    this.chest.add(this.head);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.32), this.skinMat);
    headMesh.position.y = 0.15;
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Glowing anime eye visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.06), this.glowMat);
    visor.position.set(0, 0.17, 0.165);
    this.head.add(visor);

    // Anime Spiky Hair Clusters
    const hairSpikes = [
      { pos: [0, 0.38, 0.04], rot: [0.2, 0, 0], scale: [0.18, 0.45, 0.18] },
      { pos: [-0.14, 0.35, 0], rot: [0.1, 0, -0.3], scale: [0.15, 0.4, 0.15] },
      { pos: [0.14, 0.35, 0], rot: [0.1, 0, 0.3], scale: [0.15, 0.4, 0.15] },
      { pos: [0, 0.32, -0.14], rot: [-0.3, 0, 0], scale: [0.2, 0.45, 0.2] },
      { pos: [-0.12, 0.22, 0.16], rot: [0.4, 0, -0.2], scale: [0.1, 0.25, 0.1] },
      { pos: [0.12, 0.22, 0.16], rot: [0.4, 0, 0.2], scale: [0.1, 0.25, 0.1] },
    ];
    hairSpikes.forEach((s) => {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), this.hairMat);
      spike.position.set(s.pos[0], s.pos[1], s.pos[2]);
      spike.rotation.set(s.rot[0], s.rot[1], s.rot[2]);
      spike.scale.set(s.scale[0], s.scale[1], s.scale[2]);
      this.head.add(spike);
    });

    // 4. Arms & Pauldrons
    // Left Arm
    this.leftArm.position.set(-0.38, 0.18, 0);
    this.chest.add(this.leftArm);

    const lPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.24), this.armorMat);
    lPauldron.position.set(-0.02, 0.05, 0);
    this.leftArm.add(lPauldron);

    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.36, 6), this.bodyMat);
    lUpperArm.position.set(0, -0.2, 0);
    this.leftArm.add(lUpperArm);

    this.leftForearm.position.set(0, -0.38, 0);
    this.leftArm.add(this.leftForearm);

    const lLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.35, 6), this.armorMat);
    lLowerArm.position.set(0, -0.18, 0);
    this.leftForearm.add(lLowerArm);

    // Right Arm (Sword Hand)
    this.rightArm.position.set(0.38, 0.18, 0);
    this.chest.add(this.rightArm);

    const rPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.24), this.armorMat);
    rPauldron.position.set(0.02, 0.05, 0);
    this.rightArm.add(rPauldron);

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.36, 6), this.bodyMat);
    rUpperArm.position.set(0, -0.2, 0);
    this.rightArm.add(rUpperArm);

    this.rightForearm.position.set(0, -0.38, 0);
    this.rightArm.add(this.rightForearm);

    const rLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.35, 6), this.armorMat);
    rLowerArm.position.set(0, -0.18, 0);
    this.rightForearm.add(rLowerArm);

    // 5. Legs
    // Left Leg
    this.leftLeg.position.set(-0.18, -0.18, 0);
    this.hips.add(this.leftLeg);

    const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.48, 6), this.bodyMat);
    lThigh.position.set(0, -0.24, 0);
    lThigh.castShadow = true;
    this.leftLeg.add(lThigh);

    this.leftKnee.position.set(0, -0.48, 0);
    this.leftLeg.add(this.leftKnee);

    const lShin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.46, 6), this.armorMat);
    lShin.position.set(0, -0.23, 0);
    lShin.castShadow = true;
    this.leftKnee.add(lShin);

    const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.26), this.armorMat);
    lFoot.position.set(0, -0.45, 0.06);
    this.leftKnee.add(lFoot);

    // Right Leg
    this.rightLeg.position.set(0.18, -0.18, 0);
    this.hips.add(this.rightLeg);

    const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.48, 6), this.bodyMat);
    rThigh.position.set(0, -0.24, 0);
    rThigh.castShadow = true;
    this.rightLeg.add(rThigh);

    this.rightKnee.position.set(0, -0.48, 0);
    this.rightLeg.add(this.rightKnee);

    const rShin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.46, 6), this.armorMat);
    rShin.position.set(0, -0.23, 0);
    rShin.castShadow = true;
    this.rightKnee.add(rShin);

    const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.26), this.armorMat);
    rFoot.position.set(0, -0.45, 0.06);
    this.rightKnee.add(rFoot);
  }

  private buildSword() {
    // Astraea - Celestial Blade attached to right forearm
    this.sword.position.set(0, -0.35, 0.1);
    this.rightForearm.add(this.sword);

    // Hilt / Grip
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 })
    );
    grip.rotation.x = Math.PI / 2;
    this.sword.add(grip);

    // Guard / Tsuba
    const tsuba = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.12), this.armorMat);
    tsuba.position.set(0, 0, 0.18);
    this.sword.add(tsuba);

    // Glowing Katana Blade
    const bladeGeo = new THREE.BoxGeometry(0.04, 0.12, 1.45);
    bladeGeo.translate(0, 0, 0.75);
    const blade = new THREE.Mesh(bladeGeo, this.bladeGlowMat);
    blade.castShadow = true;
    this.sword.add(blade);

    // Blade Point / Tip
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 4), this.bladeGlowMat);
    tip.position.set(0, 0, 1.55);
    tip.rotation.x = Math.PI / 2;
    this.sword.add(tip);
  }

  /**
   * Procedural dynamic animation pose updater.
   */
  public animatePose(
    state: 'idle' | 'run' | 'jump' | 'dodge' | 'attack1' | 'attack2' | 'attack3' | 'nova' | 'pierce',
    progress: number,
    animTime: number
  ) {
    // Sway scarf tails naturally
    const tailWave = Math.sin(animTime * 6) * 0.2;
    this.scarfTails.forEach((tail, idx) => {
      tail.rotation.x = -0.25 + tailWave * (idx % 2 === 0 ? 1 : 0.8);
      tail.rotation.z = Math.cos(animTime * 4 + idx) * 0.1;
    });

    switch (state) {
      case 'idle': {
        const breath = Math.sin(animTime * 2.5);
        this.root.position.y = breath * 0.03;
        this.chest.rotation.x = breath * 0.03;
        this.chest.rotation.y = 0;
        this.chest.rotation.z = 0;

        // Ready combat idle stance
        this.leftArm.rotation.set(0.3 + breath * 0.05, 0, 0.3);
        this.leftForearm.rotation.set(-0.6, 0, 0);

        this.rightArm.rotation.set(-0.2 + breath * 0.05, 0.2, -0.2);
        this.rightForearm.rotation.set(-0.8, 0.3, 0);

        this.leftLeg.rotation.set(0, 0, 0);
        this.rightLeg.rotation.set(0, 0, 0);
        this.leftKnee.rotation.set(0, 0, 0);
        this.rightKnee.rotation.set(0, 0, 0);
        this.sword.rotation.set(0.3, 0, 0);
        break;
      }

      case 'run': {
        const cycle = animTime * 12;
        const legSwing = Math.sin(cycle) * 0.75;
        const armSwing = Math.sin(cycle) * 0.65;

        this.root.position.y = Math.abs(Math.sin(cycle)) * 0.08;
        this.chest.rotation.x = 0.25; // forward sprint lean
        this.chest.rotation.y = Math.sin(cycle) * 0.1;

        // Alternating legs
        this.leftLeg.rotation.x = legSwing;
        this.rightLeg.rotation.x = -legSwing;
        this.leftKnee.rotation.x = legSwing > 0 ? legSwing * 1.2 : 0.1;
        this.rightKnee.rotation.x = -legSwing > 0 ? -legSwing * 1.2 : 0.1;

        // Alternating arms with sword held forward
        this.leftArm.rotation.x = -armSwing * 0.8;
        this.leftForearm.rotation.x = -0.5;

        this.rightArm.rotation.set(0.2 + armSwing * 0.4, 0.1, -0.3);
        this.rightForearm.rotation.set(-0.9, 0, 0);
        this.sword.rotation.set(0.4, 0.2, 0);
        break;
      }

      case 'jump': {
        this.chest.rotation.x = -0.15;
        this.leftLeg.rotation.set(-0.4, 0, 0.1);
        this.rightLeg.rotation.set(-0.6, 0, -0.1);
        this.leftKnee.rotation.set(0.8, 0, 0);
        this.rightKnee.rotation.set(1.1, 0, 0);

        this.leftArm.rotation.set(-0.6, 0, 0.4);
        this.rightArm.rotation.set(-0.8, 0, -0.4);
        this.sword.rotation.set(0.2, 0, 0);
        break;
      }

      case 'dodge': {
        // Astral phase dash: aerodynamic low dive
        this.chest.rotation.set(0.7, 0, 0);
        this.leftLeg.rotation.set(-0.8, 0, 0);
        this.rightLeg.rotation.set(0.4, 0, 0);
        this.leftArm.rotation.set(-1.2, 0, 0.4);
        this.rightArm.rotation.set(-1.4, 0, -0.3);
        this.sword.rotation.set(1.2, 0, 0);
        break;
      }

      case 'attack1': {
        // Horizontal forward slash
        const p = Math.min(1, progress);
        const swing = Math.sin(p * Math.PI);
        this.chest.rotation.y = -0.8 + p * 1.6;
        this.rightArm.rotation.set(0.4 - p * 0.8, 0.8 - p * 1.4, -0.2);
        this.rightForearm.rotation.set(-0.3, 0, 0);
        this.sword.rotation.set(0.2, 0, swing * 1.5);
        this.leftArm.rotation.set(-0.4, 0, 0.6);
        break;
      }

      case 'attack2': {
        // Upward diagonal slash
        const p = Math.min(1, progress);
        this.chest.rotation.set(0.2 - p * 0.4, 0.6 - p * 1.2, 0);
        this.rightArm.rotation.set(1.2 - p * 2.2, -0.4, 0.3);
        this.rightForearm.rotation.set(-0.2, 0, 0);
        this.sword.rotation.set(-0.4, p * 1.0, 0);
        break;
      }

      case 'attack3': {
        // 360 Spin Finisher
        const p = Math.min(1, progress);
        this.root.rotation.y = p * Math.PI * 2;
        this.chest.rotation.x = 0.2;
        this.rightArm.rotation.set(0, 0, -1.2); // blade held flat outwards
        this.rightForearm.rotation.set(-0.1, 0, 0);
        this.leftArm.rotation.set(0, 0, 1.2);
        this.sword.rotation.set(0, 0, 1.57);
        break;
      }

      case 'nova': {
        // Celestial Nova: Leap up and slam sword into earth
        const p = Math.min(1, progress);
        if (p < 0.4) {
          // Windup leap
          this.root.position.y = p * 4;
          this.rightArm.rotation.set(-2.2, 0, 0); // blade raised overhead
          this.sword.rotation.set(-0.5, 0, 0);
        } else {
          // Impact slam
          this.root.position.y = 0;
          this.chest.rotation.x = 0.8;
          this.rightArm.rotation.set(0.8, 0, 0);
          this.rightForearm.rotation.set(-0.4, 0, 0);
          this.sword.rotation.set(1.6, 0, 0); // blade impaling ground
          this.leftArm.rotation.set(0.4, 0, 0.8);
        }
        break;
      }

      case 'pierce': {
        // Void Piercer: Super-speed lunging thrust
        const p = Math.min(1, progress);
        this.chest.rotation.set(0.4, -0.2, 0);
        this.leftLeg.rotation.set(0.6, 0, 0);
        this.rightLeg.rotation.set(-0.8, 0, 0);
        this.rightArm.rotation.set(-1.57, 0, 0); // straight forward thrust
        this.rightForearm.rotation.set(0, 0, 0);
        this.sword.rotation.set(1.57, 0, 0);
        this.leftArm.rotation.set(0.8, 0, 0.4);
        break;
      }
    }
  }
}
