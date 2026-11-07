import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export class EnvironmentManager {
  public dirLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  public rimLight!: THREE.DirectionalLight;
  public skyDome!: THREE.Mesh;
  public starsParticles!: THREE.Points;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, isSoftwareGl: boolean) {
    this.setupLighting(scene, isSoftwareGl);
    this.setupSkyAndAtmosphere(scene);
    this.setupEnvironmentReflection(scene, renderer);
  }

  private setupLighting(scene: THREE.Scene, isSoftwareGl: boolean) {
    // 1. Cool Sky / Warm Ground Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1528, 0.75);
    scene.add(this.hemiLight);

    // 2. Key Sun / Celestial Star Directional Light
    this.dirLight = new THREE.DirectionalLight(0xfff3d6, 1.4);
    this.dirLight.position.set(50, 90, 45);

    if (!isSoftwareGl) {
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 2048;
      this.dirLight.shadow.mapSize.height = 2048;
      this.dirLight.shadow.camera.near = 10;
      this.dirLight.shadow.camera.far = 240;

      const d = 50;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.dirLight.shadow.bias = -0.0005;
      this.dirLight.shadow.normalBias = 0.02;
    }
    scene.add(this.dirLight);

    // 3. Rim / Accent Backlight for crisp anime character silhouettes
    this.rimLight = new THREE.DirectionalLight(0x06b6d4, 0.85);
    this.rimLight.position.set(-60, 40, -50);
    scene.add(this.rimLight);
  }

  private setupSkyAndAtmosphere(scene: THREE.Scene) {
    // Horizon Fog matching sky bottom color
    const fogColor = new THREE.Color(0x070b16);
    scene.fog = new THREE.FogExp2(fogColor, 0.0075);
    scene.background = fogColor;

    // Atmospheric Sky Dome with celestial gradient
    const skyGeo = new THREE.SphereGeometry(300, 32, 24);
    skyGeo.scale(-1, 1, 1);

    // Procedural Sky Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#020617'); // Zenith deep space
    grad.addColorStop(0.3, '#0b1329'); // Astral navy
    grad.addColorStop(0.65, '#0f2744'); // Aurora cyan-indigo
    grad.addColorStop(0.85, '#172554'); // Horizon twilight
    grad.addColorStop(1.0, '#070b16'); // Ground fog blend

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    const skyTex = new THREE.CanvasTexture(canvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;

    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(this.skyDome);

    // Starfield Points
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 280 + Math.random() * 15;

      const sinPhi = Math.sin(phi);
      starPositions[i * 3] = r * sinPhi * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 15; // Upper hemisphere
      starPositions[i * 3 + 2] = r * sinPhi * Math.sin(theta);
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 1.8,
      transparent: true,
      opacity: 0.85,
    });
    this.starsParticles = new THREE.Points(starGeo, starMat);
    scene.add(this.starsParticles);
  }

  private setupEnvironmentReflection(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback if environment generation fails
    }
  }

  public updateKeyLightTarget(playerPos: THREE.Vector3) {
    this.dirLight.position.set(playerPos.x + 40, playerPos.y + 75, playerPos.z + 35);
    this.dirLight.target.position.copy(playerPos);
    this.dirLight.target.updateMatrixWorld();
  }
}
