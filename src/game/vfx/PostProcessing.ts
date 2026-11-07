import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';

/**
 * Cinematic color grade applied after tone mapping:
 * lift/gamma/gain split-toning, vignette, subtle chromatic aberration,
 * animated film grain and a damage pulse.
 */
const CinematicGradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uVignette: { value: 0.42 },
    uGrain: { value: 0.045 },
    uAberration: { value: 0.0016 },
    uDamage: { value: 0 },
    uSaturation: { value: 1.08 },
    uContrast: { value: 1.06 },
    uShadowTint: { value: new THREE.Color(0x0a1a33) },
    uHighlightTint: { value: new THREE.Color(0xffe2b8) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;
    uniform float uDamage;
    uniform float uSaturation;
    uniform float uContrast;
    uniform vec3 uShadowTint;
    uniform vec3 uHighlightTint;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = uv - 0.5;
      float dist = length(center);

      // Radial chromatic aberration (stronger at edges and on hit)
      float ab = uAberration * (0.4 + dist * 2.0) + uDamage * 0.006;
      vec2 dir = normalize(center + 1e-5) * ab;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + dir).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - dir).b;

      // Contrast around mid grey
      col = (col - 0.5) * uContrast + 0.5;

      // Saturation
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, uSaturation);

      // Split toning: cool shadows, warm highlights
      float l = clamp(luma, 0.0, 1.0);
      col += uShadowTint * (1.0 - l) * 0.18;
      col = mix(col, col * uHighlightTint, smoothstep(0.55, 1.0, l) * 0.22);

      // Vignette
      float vig = smoothstep(0.85, 0.18, dist * (1.0 + uVignette));
      col *= mix(1.0, vig, 0.85);

      // Damage pulse — crimson edge burn
      float edge = smoothstep(0.25, 0.75, dist);
      col = mix(col, vec3(0.55, 0.02, 0.06), edge * uDamage * 0.75);

      // Film grain
      float g = hash(uv * uResolution + fract(uTime * 13.37) * 100.0) - 0.5;
      col += g * uGrain;

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }
  `,
};

export class PostProcessing {
  public composer: EffectComposer;
  public bloom: UnrealBloomPass;
  public grade: ShaderPass;
  private damage = 0;
  private lastHp = -1;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    width: number,
    height: number
  ) {
    const pixelRatio = renderer.getPixelRatio();
    const target = new THREE.WebGLRenderTarget(width * pixelRatio, height * pixelRatio, {
      type: THREE.HalfFloatType,
      samples: 4,
    });

    this.composer = new EffectComposer(renderer, target);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(width, height);

    this.composer.addPass(new RenderPass(scene, camera));

    this.bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.65, 0.55, 0.82);
    this.composer.addPass(this.bloom);

    // Tone mapping + sRGB conversion
    this.composer.addPass(new OutputPass());

    this.grade = new ShaderPass(CinematicGradeShader);
    this.grade.uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio);
    this.composer.addPass(this.grade);

    this.composer.addPass(new SMAAPass(width * pixelRatio, height * pixelRatio));
  }

  public setSize(width: number, height: number) {
    this.composer.setSize(width, height);
    this.bloom.setSize(width, height);
    const pr = this.composer.renderer.getPixelRatio();
    this.grade.uniforms.uResolution.value.set(width * pr, height * pr);
  }

  /** Feeds player HP so that taking damage triggers a crimson screen pulse. */
  public trackPlayerHp(hp: number, maxHp: number) {
    if (this.lastHp >= 0 && hp < this.lastHp) {
      const lost = (this.lastHp - hp) / maxHp;
      this.damage = Math.min(1, this.damage + 0.35 + lost * 2.5);
    }
    this.lastHp = hp;
    // Persistent low-health warning glow
    const lowHp = hp / maxHp < 0.3 ? 0.25 + Math.sin(performance.now() / 220) * 0.08 : 0;
    this.grade.uniforms.uDamage.value = Math.max(this.damage, lowHp);
  }

  public render(delta: number, elapsed: number) {
    this.damage = Math.max(0, this.damage - delta * 1.8);
    this.grade.uniforms.uTime.value = elapsed;
    this.composer.render(delta);
  }

  public dispose() {
    this.composer.dispose();
  }
}
