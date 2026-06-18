import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { PlanetData, MoonData } from '../data/planets';

interface PlanetProps {
  data: PlanetData;
  onClick: (data: PlanetData) => void;
  isSelected: boolean;
  showOrbits: boolean;
  timeScale: number;
  focusedId: string | null;
}

/* =============================================================
   PROCEDURAL PBR TEXTURE GENERATION
   All planets receive Albedo, Normal and Roughness maps derived
   from the same height field, so lighting reacts coherently.
============================================================= */

type HField = { heights: Float32Array; w: number; h: number };

// Hash-noise helper for repeatable procedural textures
function hash2(x: number, y: number): number {
  let h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

function smoothNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fbm(x: number, y: number, octaves = 5): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * smoothNoise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum;
}

function computeHeightField(
  w: number,
  h: number,
  fn: (u: number, v: number) => number
): HField {
  const heights = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      heights[y * w + x] = Math.max(0, Math.min(1, fn(u, v)));
    }
  }
  return { heights, w, h };
}

function heightToNormalTexture(hf: HField, strength = 2.0): HTMLCanvasElement {
  const { heights, w, h } = hf;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const l = heights[y * w + ((x - 1 + w) % w)];
      const r = heights[y * w + ((x + 1) % w)];
      const t = heights[((y - 1 + h) % h) * w + x];
      const b = heights[((y + 1) % h) * w + x];
      const dx = (l - r) * strength;
      const dy = (t - b) * strength;
      const dz = 1.0;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const idx = (y * w + x) * 4;
      img.data[idx + 0] = Math.floor(((dx / len) * 0.5 + 0.5) * 255);
      img.data[idx + 1] = Math.floor(((dy / len) * 0.5 + 0.5) * 255);
      img.data[idx + 2] = Math.floor(((dz / len) * 0.5 + 0.5) * 255);
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function heightToRoughnessTexture(
  hf: HField,
  baseRoughness: number,
  variation: number
): HTMLCanvasElement {
  const { heights, w, h } = hf;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hgt = heights[y * w + x];
      const rough = Math.max(0, Math.min(1, baseRoughness + (hgt - 0.5) * variation));
      const val = Math.floor(rough * 255);
      const idx = (y * w + x) * 4;
      img.data[idx + 0] = val;
      img.data[idx + 1] = val;
      img.data[idx + 2] = val;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* ----- Per-planet albedo generators ----- */

function earthAlbedoCanvas(): HTMLCanvasElement {
  const w = 1024, h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean base — vivid blue so oceans read instantly as oceans
  const og = ctx.createLinearGradient(0, 0, 0, h);
  og.addColorStop(0, '#0A3D7A');
  og.addColorStop(0.5, '#1865B0');
  og.addColorStop(1, '#0A3D7A');
  ctx.fillStyle = og;
  ctx.fillRect(0, 0, w, h);

  // Ocean color variation via fbm noise
  const oceanNoise = computeHeightField(w, h, (u, v) => fbm(u * 12, v * 12, 4));
  const img = ctx.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = oceanNoise.heights[y * w + x];
      const idx = (y * w + x) * 4;
      img.data[idx + 0] = Math.min(255, img.data[idx + 0] + n * 18);
      img.data[idx + 1] = Math.min(255, img.data[idx + 1] + n * 28);
      img.data[idx + 2] = Math.min(255, img.data[idx + 2] + n * 40);
    }
  }
  ctx.putImageData(img, 0, 0);

  // Land mask via continental noise field
  const landNoise = computeHeightField(w, h, (u, v) =>
    fbm(u * 4 + 0.3, v * 4 + 1.7, 5) +
    fbm(u * 9 + 3.1, v * 9 + 2.2, 3) * 0.35
  );

  // Continent blobs
  const continents = [
    { cx: 0.12, cy: 0.32, r: 0.13 }, // N America
    { cx: 0.14, cy: 0.62, r: 0.08 }, // S America
    { cx: 0.42, cy: 0.34, r: 0.07 }, // Europe
    { cx: 0.45, cy: 0.62, r: 0.12 }, // Africa
    { cx: 0.62, cy: 0.35, r: 0.18 }, // Asia
    { cx: 0.72, cy: 0.62, r: 0.07 }, // Australia
  ];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      let inLand = false;
      for (const c of continents) {
        // wrap-aware distance
        const du = Math.min(Math.abs(u - c.cx), 1 - Math.abs(u - c.cx));
        const dv = v - c.cy;
        const dist = Math.sqrt(du * du + dv * dv);
        if (dist < c.r + (landNoise.heights[y * w + x] - 0.5) * 0.08) {
          inLand = true;
          break;
        }
      }
      if (inLand) {
        const n = landNoise.heights[y * w + x];
        // Altitude-based coloring — vivid and distinct
        const lat = Math.abs(v - 0.5);
        let r, g, b;
        if (lat > 0.45) {
          r = 230; g = 240; b = 250; // ice
        } else if (n < 0.28) {
          r = 20 + n * 80; g = 100 + n * 120; b = 30 + n * 50; // deep jungle — vivid green
        } else if (n < 0.5) {
          r = 55 + n * 100; g = 125 + n * 90; b = 40 + n * 40; // temperate forest
        } else if (n < 0.72) {
          r = 175 + n * 60; g = 155 + n * 40; b = 80 + n * 25; // savanna / dry
        } else {
          r = 140 + n * 50; g = 115 + n * 40; b = 80 + n * 30; // mountain
        }
        const idx = (y * w + x) * 4;
        img.data[idx + 0] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  // Polar ice caps
  const polN = ctx.createLinearGradient(0, 0, 0, 50);
  polN.addColorStop(0, 'rgba(230,240,250,0.9)');
  polN.addColorStop(1, 'rgba(230,240,250,0)');
  ctx.fillStyle = polN;
  ctx.fillRect(0, 0, w, 50);
  const polS = ctx.createLinearGradient(0, h - 50, 0, h);
  polS.addColorStop(0, 'rgba(230,240,250,0)');
  polS.addColorStop(1, 'rgba(230,240,250,0.9)');
  ctx.fillStyle = polS;
  ctx.fillRect(0, h - 50, w, 50);

  return canvas;
}

function moonAlbedoCanvas(): HTMLCanvasElement {
  const w = 512, h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#8A8A88';
  ctx.fillRect(0, 0, w, h);

  // Mare (dark plains)
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 30 + Math.random() * 80;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(60, 60, 62, 0.5)');
    g.addColorStop(1, 'rgba(60, 60, 62, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Craters
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 2 + Math.random() * 12;
    ctx.strokeStyle = 'rgba(40, 40, 40, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    // rim highlight
    ctx.strokeStyle = 'rgba(180, 180, 175, 0.4)';
    ctx.beginPath();
    ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.9, 0, Math.PI * 2);
    ctx.stroke();
  }
  return canvas;
}

function genericAlbedo(id: string, baseColor: string): HTMLCanvasElement {
  const w = 1024, h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const base = new THREE.Color(baseColor);
  const br = Math.floor(base.r * 255);
  const bg = Math.floor(base.g * 255);
  const bb = Math.floor(base.b * 255);

  // Base fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  if (id === 'mercury') {
    // Mercury — grey-brown surface with base tone so craters read
    const mBase = ctx.createLinearGradient(0, 0, 0, h);
    mBase.addColorStop(0, '#9C9088');
    mBase.addColorStop(0.5, '#8A7E76');
    mBase.addColorStop(1, '#968A82');
    ctx.fillStyle = mBase;
    ctx.fillRect(0, 0, w, h);
    // Heavy cratering
    for (let i = 0; i < 280; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 3 + Math.random() * 24;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(35, 32, 28, 0.75)');
      g.addColorStop(0.7, 'rgba(90, 85, 80, 0.3)');
      g.addColorStop(1, 'rgba(140, 135, 130, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(215, 210, 200, 0.22)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  } else if (id === 'venus') {
    // Venus — thick sulfuric-yellow swirling clouds
    const vg = ctx.createLinearGradient(0, 0, 0, h);
    vg.addColorStop(0, '#E8B840');
    vg.addColorStop(0.5, '#F0C858');
    vg.addColorStop(1, '#D0A030');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
    for (let band = 0; band < 24; band++) {
      const y = (band / 24) * h;
      const hh = 20 + Math.random() * 40;
      const vary = (Math.random() - 0.5) * 40;
      ctx.fillStyle = `rgba(${Math.min(255, 235 + vary)},${Math.min(255, 180 + vary)},${Math.max(0, 60 + vary)},0.4)`;
      ctx.fillRect(0, y, w, hh);
    }
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const rx = 40 + Math.random() * 140;
      const ry = 6 + Math.random() * 16;
      ctx.fillStyle = `rgba(255, 230, 140, ${0.08 + Math.random() * 0.14})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'mars') {
    // Mars — vivid red iron-oxide desert with dark maria and polar caps
    const mg = ctx.createLinearGradient(0, 0, 0, h);
    mg.addColorStop(0, '#D25530');
    mg.addColorStop(0.5, '#D94A1E');
    mg.addColorStop(1, '#A03018');
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, w, h);
    // Dark regions (Syrtis Major style)
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * w;
      const y = 50 + Math.random() * (h - 100);
      const r = 20 + Math.random() * 90;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(70, 25, 10, 0.5)');
      g.addColorStop(1, 'rgba(70, 25, 10, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Polar ice
    const pn = ctx.createLinearGradient(0, 0, 0, 60);
    pn.addColorStop(0, 'rgba(240, 240, 235, 0.85)');
    pn.addColorStop(1, 'rgba(240, 240, 235, 0)');
    ctx.fillStyle = pn;
    ctx.fillRect(0, 0, w, 60);
    const ps = ctx.createLinearGradient(0, h - 60, 0, h);
    ps.addColorStop(0, 'rgba(240, 240, 235, 0)');
    ps.addColorStop(1, 'rgba(240, 240, 235, 0.75)');
    ctx.fillStyle = ps;
    ctx.fillRect(0, h - 60, w, 60);
  } else if (id === 'jupiter') {
    // Jupiter — vivid horizontal bands with turbulence + Great Red Spot
    const bands = [
      { y: 0,   h: 45, r: 215, g: 175, b: 125 },
      { y: 45,  h: 35, r: 155, g: 95,  b: 55  },
      { y: 80,  h: 50, r: 235, g: 195, b: 140 },
      { y: 130, h: 28, r: 140, g: 85,  b: 48  },
      { y: 158, h: 62, r: 225, g: 180, b: 120 },
      { y: 220, h: 22, r: 115, g: 70,  b: 38  },
      { y: 242, h: 48, r: 230, g: 185, b: 130 },
      { y: 290, h: 32, r: 165, g: 108, b: 65  },
      { y: 322, h: 58, r: 245, g: 200, b: 145 },
      { y: 380, h: 28, r: 135, g: 85,  b: 50  },
      { y: 408, h: 58, r: 225, g: 175, b: 115 },
      { y: 466, h: 46, r: 185, g: 130, b: 75  },
    ];
    for (const band of bands) {
      ctx.fillStyle = `rgb(${band.r},${band.g},${band.b})`;
      ctx.fillRect(0, (band.y / 512) * h, w, (band.h / 512) * h);
    }
    // turbulence
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const rx = 20 + Math.random() * 80;
      const ry = 4 + Math.random() * 8;
      ctx.fillStyle = `rgba(${br},${bg},${bb},0.15)`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Great Red Spot — vivid, distinct
    const grs = ctx.createRadialGradient(w * 0.32, h * 0.57, 5, w * 0.32, h * 0.57, 45);
    grs.addColorStop(0, 'rgba(220, 70, 35, 1.0)');
    grs.addColorStop(0.5, 'rgba(230, 85, 50, 0.85)');
    grs.addColorStop(1, 'rgba(200, 60, 40, 0)');
    ctx.fillStyle = grs;
    ctx.beginPath();
    ctx.ellipse(w * 0.32, h * 0.57, 55, 32, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Inner swirl
    const grsInner = ctx.createRadialGradient(w * 0.32, h * 0.57, 0, w * 0.32, h * 0.57, 18);
    grsInner.addColorStop(0, 'rgba(140, 40, 20, 0.8)');
    grsInner.addColorStop(1, 'rgba(140, 40, 20, 0)');
    ctx.fillStyle = grsInner;
    ctx.beginPath();
    ctx.ellipse(w * 0.32, h * 0.57, 20, 12, 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'saturn') {
    // Saturn — warm golden horizontal bands
    const sat = ctx.createLinearGradient(0, 0, 0, h);
    sat.addColorStop(0, '#F0D890');
    sat.addColorStop(0.5, '#E0C478');
    sat.addColorStop(1, '#D4B060');
    ctx.fillStyle = sat;
    ctx.fillRect(0, 0, w, h);
    for (let band = 0; band < 18; band++) {
      const y = (band / 18) * h;
      const hh = 15 + Math.random() * 25;
      const vary = (Math.random() - 0.5) * 25;
      ctx.fillStyle = `rgba(${Math.min(255, 220 + vary)},${Math.min(255, 185 + vary)},${Math.max(0, 95 + vary)},0.35)`;
      ctx.fillRect(0, y, w, hh);
    }
  } else if (id === 'uranus') {
    // Uranus — pale cyan/teal smooth world
    const ug = ctx.createLinearGradient(0, 0, 0, h);
    ug.addColorStop(0, '#9FFFE4');
    ug.addColorStop(0.5, '#5FE8D4');
    ug.addColorStop(1, '#30C0B0');
    ctx.fillStyle = ug;
    ctx.fillRect(0, 0, w, h);
    for (let b = 0; b < 10; b++) {
      const y = (b / 10) * h;
      ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.06})`;
      ctx.fillRect(0, y, w, 25 + Math.random() * 20);
    }
  } else if (id === 'neptune') {
    // Neptune — deep royal blue with dark spot
    const ng = ctx.createLinearGradient(0, 0, 0, h);
    ng.addColorStop(0, '#4A6CE8');
    ng.addColorStop(0.5, '#3050C8');
    ng.addColorStop(1, '#1A2890');
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, w, h);
    for (let b = 0; b < 12; b++) {
      const y = (b / 12) * h;
      ctx.fillStyle = `rgba(100,130,230,${0.1 + Math.random() * 0.18})`;
      ctx.fillRect(0, y, w, 15 + Math.random() * 20);
    }
    // Great Dark Spot
    const ds = ctx.createRadialGradient(w * 0.6, h * 0.42, 5, w * 0.6, h * 0.42, 55);
    ds.addColorStop(0, 'rgba(10, 15, 60, 0.9)');
    ds.addColorStop(0.7, 'rgba(15, 25, 90, 0.4)');
    ds.addColorStop(1, 'rgba(30, 50, 140, 0)');
    ctx.fillStyle = ds;
    ctx.beginPath();
    ctx.ellipse(w * 0.6, h * 0.42, 58, 38, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'pluto') {
    const pg = ctx.createLinearGradient(0, 0, w, h);
    pg.addColorStop(0, '#D4B890');
    pg.addColorStop(0.5, '#C4A078');
    pg.addColorStop(1, '#DCBFA0');
    ctx.fillStyle = pg;
    ctx.fillRect(0, 0, w, h);
    // Tombaugh Regio (heart)
    const hr = ctx.createRadialGradient(w * 0.45, h * 0.53, 10, w * 0.45, h * 0.53, 100);
    hr.addColorStop(0, 'rgba(240, 235, 220, 0.8)');
    hr.addColorStop(0.6, 'rgba(230, 225, 210, 0.4)');
    hr.addColorStop(1, 'rgba(210, 200, 180, 0)');
    ctx.fillStyle = hr;
    ctx.beginPath();
    ctx.ellipse(w * 0.45, h * 0.53, 95, 80, 0.1, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 2 + Math.random() * 10;
      ctx.fillStyle = `rgba(90, 75, 55, 0.4)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Generic noise fallback
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 10 + Math.random() * 50;
      const vary = (Math.random() - 0.5) * 50;
      ctx.fillStyle = `rgba(${Math.max(0, Math.min(255, br + vary))},${Math.max(0, Math.min(255, bg + vary))},${Math.max(0, Math.min(255, bb + vary))},0.3)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas;
}

/* =============================================================
   ORBIT PATH
============================================================= */

function OrbitPath({ radius, color, isDwarf }: { radius: number; color: string; isDwarf?: boolean }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) {
      const angle = (i / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    // @ts-expect-error three.js line element
    <line geometry={geometry}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={isDwarf ? 0.1 : 0.18}
        linewidth={1}
      />
    </line>
  );
}

/* =============================================================
   MOON — extracted component so hooks run correctly
============================================================= */

function MoonMesh({ moon }: { moon: MoonData }) {
  const moonTex = useMemo(() => {
    const c = moonAlbedoCanvas();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group userData={{ moonId: moon.id }}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[moon.radius, 48, 48]} />
        <meshStandardMaterial map={moonTex} roughness={1.0} metalness={0.0} />
      </mesh>
    </group>
  );
}

/* =============================================================
   SATURN RINGS — proper ring geometry with radial transparency
============================================================= */

function SaturnRings({ innerR, outerR }: { innerR: number; outerR: number }) {
  const ringTexture = useMemo(() => {
    const w = 1024, h = 16;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0.00, 'rgba(180, 140, 70, 0.0)');
    g.addColorStop(0.04, 'rgba(190, 150, 80, 0.55)');
    g.addColorStop(0.15, 'rgba(210, 175, 95, 0.75)');
    g.addColorStop(0.22, 'rgba(180, 140, 70, 0.25)'); // Cassini gap hint
    g.addColorStop(0.28, 'rgba(220, 185, 105, 0.85)');
    g.addColorStop(0.45, 'rgba(200, 165, 90, 0.65)');
    g.addColorStop(0.55, 'rgba(170, 135, 65, 0.45)');
    g.addColorStop(0.70, 'rgba(210, 175, 95, 0.6)');
    g.addColorStop(0.85, 'rgba(160, 120, 55, 0.3)');
    g.addColorStop(1.00, 'rgba(130, 90, 40, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // fine grain noise for individual particles
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        if (Math.random() < 0.12) {
          ctx.fillStyle = `rgba(${180 + Math.random() * 70}, ${140 + Math.random() * 50}, ${70 + Math.random() * 40}, 0.15)`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
      <ringGeometry args={[innerR, outerR, 256]} />
      <meshStandardMaterial
        map={ringTexture}
        side={THREE.DoubleSide}
        transparent
        opacity={0.95}
        depthWrite={false}
        roughness={0.95}
        metalness={0.0}
      />
    </mesh>
  );
}

/* =============================================================
   PLANET
============================================================= */

function Planet({ data, onClick, isSelected, showOrbits, timeScale, focusedId }: PlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const angle = useRef(Math.random() * Math.PI * 2);

  // ---- PBR texture stack: albedo + normal + roughness ----
  const { albedoTex, normalTex, roughTex, cloudTex } = useMemo(() => {
    const albedo = data.id === 'earth' ? earthAlbedoCanvas() : genericAlbedo(data.id, data.color);
    const tex = new THREE.CanvasTexture(albedo);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;

    // Normal map — computed from a matching height field
    const heightFn = (u: number, v: number) => {
      if (data.id === 'earth') {
        // Land is high, ocean low
        const n = fbm(u * 12, v * 12, 4);
        const landMask = fbm(u * 4 + 0.3, v * 4 + 1.7, 5);
        return landMask > 0.48 ? 0.5 + n * 0.5 : 0.2 + n * 0.15;
      }
      return fbm(u * 8, v * 8, 5);
    };
    const hf = computeHeightField(512, 256, heightFn);
    const normalCanvas = heightToNormalTexture(hf, data.id === 'earth' ? 3.0 : 2.0);
    const nTex = new THREE.CanvasTexture(normalCanvas);
    nTex.wrapS = THREE.RepeatWrapping;
    nTex.wrapT = THREE.ClampToEdgeWrapping;

    const roughCanvas = heightToRoughnessTexture(hf, 0.85, 0.4);
    const rTex = new THREE.CanvasTexture(roughCanvas);
    rTex.wrapS = THREE.RepeatWrapping;
    rTex.wrapT = THREE.ClampToEdgeWrapping;

    let cTex: THREE.CanvasTexture | undefined;
    if (data.cloudLayer) {
      const cw = 1024, ch = 512;
      const cc = document.createElement('canvas');
      cc.width = cw;
      cc.height = ch;
      const cctx = cc.getContext('2d')!;
      cctx.clearRect(0, 0, cw, ch);
      // Procedural fbm cloud layer
      for (let y = 0; y < ch; y += 2) {
        for (let x = 0; x < cw; x += 2) {
          const u = x / cw;
          const v = y / ch;
          const n = fbm(u * 8, v * 8, 5);
          if (n > 0.48) {
            const a = Math.min(1, (n - 0.48) * 4);
            cctx.fillStyle = `rgba(255,255,255,${a * 0.9})`;
            cctx.fillRect(x, y, 2, 2);
          }
        }
      }
      cTex = new THREE.CanvasTexture(cc);
      cTex.colorSpace = THREE.SRGBColorSpace;
    }

    return { albedoTex: tex, normalTex: nTex, roughTex: rTex, cloudTex: cTex };
  }, [data.id, data.color, data.cloudLayer]);

  const glowColor = useMemo(() => data.atmosphereColor || data.color, [data.atmosphereColor, data.color]);

  const orbitColor = data.type === 'dwarf' ? '#888888' : '#4488CC';

  useFrame(() => {
    angle.current = (angle.current + data.orbitSpeed * timeScale * 0.016) % (Math.PI * 2);
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angle.current) * data.orbitRadius;
      groupRef.current.position.z = Math.sin(angle.current) * data.orbitRadius;
    }
    if (planetRef.current) {
      planetRef.current.rotation.y += data.rotationSpeed;
      // Track actual world position using getWorldPosition
      const worldPos = new THREE.Vector3();
      planetRef.current.getWorldPosition(worldPos);
      if (!window.planetWorldPositions) window.planetWorldPositions = {};
      window.planetWorldPositions[data.id] = worldPos;

      // Track focused planet mesh for continuous camera follow
      if (isSelected) {
        if (!window.focusedPlanetMesh) window.focusedPlanetMesh = {};
        window.focusedPlanetMesh.mesh = planetRef.current;
        window.focusedPlanetMesh.id = data.id;
        window.focusedPlanetMesh.worldPos = worldPos;
      }
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += data.rotationSpeed * 1.15;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.0002;
    }
    if (groupRef.current && data.moons) {
      data.moons.forEach((moon, idx) => {
        const moonGroup = groupRef.current!.children.find(c => c.userData.moonId === moon.id);
        if (moonGroup) {
          const moonAngle = angle.current * 4 + idx * Math.PI;
          moonGroup.position.x = Math.cos(moonAngle) * moon.orbitRadius;
          moonGroup.position.z = Math.sin(moonAngle) * moon.orbitRadius;
        }
      });
    }
  });

  return (
    <>
      {showOrbits && data.orbitRadius > 0 && (
        <OrbitPath radius={data.orbitRadius} color={orbitColor} isDwarf={data.type === 'dwarf'} />
      )}

      <group
        ref={groupRef}
        rotation={[0, 0, (data.tilt * Math.PI) / 180]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(data);
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {/* Planet body — PBR, reacting to Sun's point light */}
        <mesh ref={planetRef} castShadow receiveShadow>
          <sphereGeometry args={[data.radius, 96, 96]} />
          <meshStandardMaterial
            map={albedoTex}
            normalMap={normalTex}
            normalScale={new THREE.Vector2(0.6, 0.6)}
            roughnessMap={roughTex}
            roughness={0.9}
            metalness={0.02}
            emissive={new THREE.Color(data.emissive || '#000000')}
            emissiveIntensity={data.emissiveIntensity || 0}
          />
        </mesh>

        {/* Cloud layer (Earth only) */}
        {data.cloudLayer && cloudTex && (
          <mesh ref={cloudRef}>
            <sphereGeometry args={[data.radius * 1.015, 80, 80]} />
            <meshStandardMaterial
              map={cloudTex}
              transparent
              opacity={0.85}
              depthWrite={false}
              roughness={1.0}
              metalness={0.0}
            />
          </mesh>
        )}

        {/* Atmospheric glow */}
        {data.atmosphereColor && (
          <mesh ref={atmosphereRef}>
            <sphereGeometry args={[data.radius * (data.atmosphereSize || 1.12), 48, 48]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={0.18}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )}
        {data.atmosphereColor && (
          <mesh>
            <sphereGeometry args={[data.radius * ((data.atmosphereSize || 1.12) * 1.06), 48, 48]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={0.07}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )}

        {/* Saturn rings */}
        {data.rings && (
          <SaturnRings innerR={data.rings.innerRadius} outerR={data.rings.outerRadius} />
        )}

        {/* Moons — PBR spheres */}
        {data.moons?.map((moon) => (
          <MoonMesh key={moon.id} moon={moon} />
        ))}

        {/* Hover/Selection indicator */}
        {(hovered || isSelected) && (
          <mesh>
            <sphereGeometry args={[data.radius * 1.25, 24, 24]} />
            <meshBasicMaterial
              color={isSelected ? '#60A5FA' : '#FFFFFF'}
              transparent
              opacity={isSelected ? 0.08 : 0.04}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        )}

        {hovered && !isSelected && focusedId === null && (
          <Html
            position={[0, data.radius * 1.6, 0]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div className="planet-label">{data.name}</div>
          </Html>
        )}
      </group>
    </>
  );
}

export default Planet;
