import * as THREE from 'three';

/**
 * Procedural Canvas Textures for Astryx: Nexus Zero.
 * Guarantees zero 404s and instant loading without external asset dependencies.
 */

// Procedural Terrain Ground Texture (blended mossy stone, dark obsidian soil, glowing rune veins)
export function createTerrainTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base dark obsidian / slate
  ctx.fillStyle = '#101524';
  ctx.fillRect(0, 0, size, size);

  // Mottled patches
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 25 + 5;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const isMoss = Math.random() > 0.6;
    if (isMoss) {
      grad.addColorStop(0, 'rgba(18, 54, 46, 0.45)');
      grad.addColorStop(1, 'rgba(12, 28, 25, 0)');
    } else {
      grad.addColorStop(0, 'rgba(28, 38, 62, 0.55)');
      grad.addColorStop(1, 'rgba(16, 21, 36, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle celestial glowing micro-veins
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    let cx = Math.random() * size;
    let cy = Math.random() * size;
    ctx.moveTo(cx, cy);
    for (let step = 0; step < 4; step++) {
      cx += (Math.random() - 0.5) * 50;
      cy += (Math.random() - 0.5) * 50;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 24);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Ancient Stone & Rune Texture for ruins and monoliths
export function createRuneStoneTexture(runeColor = '#38bdf8'): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark weathered granite
  ctx.fillStyle = '#181b24';
  ctx.fillRect(0, 0, size, size);

  // Stone block grid lines
  ctx.strokeStyle = '#0d0f14';
  ctx.lineWidth = 3;
  const rows = 8;
  const h = size / rows;
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * h);
    ctx.lineTo(size, r * h);
    ctx.stroke();

    const cols = 4;
    const w = size / cols;
    const offset = (r % 2) * (w / 2);
    for (let c = 0; c <= cols + 1; c++) {
      ctx.beginPath();
      ctx.moveTo(c * w - offset, r * h);
      ctx.lineTo(c * w - offset, (r + 1) * h);
      ctx.stroke();
    }
  }

  // Inlaid glowing celestial runes
  ctx.shadowColor = runeColor;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = runeColor;
  ctx.lineWidth = 2.5;

  for (let i = 0; i < 18; i++) {
    const rx = (i % 6) * 85 + 20;
    const ry = Math.floor(i / 6) * 160 + 35;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 15, ry + 25);
    ctx.lineTo(rx + 30, ry);
    ctx.moveTo(rx + 15, ry + 10);
    ctx.lineTo(rx + 15, ry + 35);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rx + 15, ry + 20, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Celestial Blade Glow Map
export function createBladeGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  // Central glowing core
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#000000');
  grad.addColorStop(0.3, '#0284c7');
  grad.addColorStop(0.5, '#38bdf8');
  grad.addColorStop(0.7, '#0284c7');
  grad.addColorStop(1, '#000000');

  ctx.fillStyle = grad;
  ctx.fillRect(size * 0.25, 0, size * 0.5, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
