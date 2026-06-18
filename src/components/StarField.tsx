import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Cinematic starfield.
 * - Multiple star layers at different distances.
 * - Realistic stellar color temperatures (blue O/B, white A/F, yellow G/K, red M).
 * - Soft circular alpha map → glowing gas, not square pixels.
 * - Heavy bloom on a fraction of bright stars for a photographic feel.
 */
function StarField() {
  const starsRef = useRef<THREE.Points>(null);

  // Circular soft alpha map for glowing stars (not square pixels).
  const starTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    g.addColorStop(0.15, 'rgba(255, 255, 255, 0.95)');
    g.addColorStop(0.35, 'rgba(255, 255, 255, 0.55)');
    g.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
    g.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Stellar color temperature palette (realistic astronomical colors)
  // https://en.wikipedia.org/wiki/Stellar_classification
  const stellarPalette = useMemo(
    () => [
      new THREE.Color('#AEC6FF'), // O / B — hot blue
      new THREE.Color('#CAD8FF'), // A — blue-white
      new THREE.Color('#F8F7FF'), // F — white
      new THREE.Color('#FFF4E8'), // G — yellow-white (Sun-like)
      new THREE.Color('#FFD2A1'), // K — orange
      new THREE.Color('#FFCC6F'), // K warm
      new THREE.Color('#FFB56C'), // K deep
      new THREE.Color('#FF8854'), // M — red-orange
      new THREE.Color('#E0E8FF'), // faint cool
    ],
    []
  );

  // Background star sphere — 9000 stars across the sky
  const { positions, colors } = useMemo(() => {
    const count = 9000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Uniform sphere distribution
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 600 + Math.random() * 600;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Color: mostly faint white/blue, some warm orange, few red
      const roll = Math.random();
      let color: THREE.Color;
      if (roll < 0.55) color = stellarPalette[Math.floor(Math.random() * 3)]; // blue-white
      else if (roll < 0.85) color = stellarPalette[3 + Math.floor(Math.random() * 3)]; // yellow/orange
      else color = stellarPalette[7 + Math.floor(Math.random() * 2)]; // red
      const brightness = 0.35 + Math.random() * 0.65;
      colors[i * 3] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;
    }

    return { positions, colors };
  }, [stellarPalette]);

  // Milky Way band — dense cluster of faint stars forming a galactic ribbon
  const { mwPositions, mwColors } = useMemo(() => {
    const count = 6000;
    const mwPositions = new Float32Array(count * 3);
    const mwColors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Tilted disk distribution
      const angle = Math.random() * Math.PI * 2;
      const r = 400 + Math.random() * 400;
      const diskThickness = 25 + Math.random() * 25;
      const y = (Math.random() - 0.5) * diskThickness;

      let x = Math.cos(angle) * r;
      let z = Math.sin(angle) * r;
      // Tilt the plane ~60° so the band cuts diagonally across the sky
      const tilt = Math.PI / 3;
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
      const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);

      mwPositions[i * 3] = x;
      mwPositions[i * 3 + 1] = y2;
      mwPositions[i * 3 + 2] = z2;

      const c = stellarPalette[Math.floor(Math.random() * 4)];
      const b = 0.25 + Math.random() * 0.4;
      mwColors[i * 3] = c.r * b;
      mwColors[i * 3 + 1] = c.g * b;
      mwColors[i * 3 + 2] = c.b * b;
    }

    return { mwPositions, mwColors };
  }, [stellarPalette]);

  // Foreground bright stars — separate layer with larger point size for photographic variety
  const { brightPositions, brightColors } = useMemo(() => {
    const count = 600;
    const brightPositions = new Float32Array(count * 3);
    const brightColors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 500 + Math.random() * 400;
      brightPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      brightPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      brightPositions[i * 3 + 2] = r * Math.cos(phi);
      const c = stellarPalette[Math.floor(Math.random() * stellarPalette.length)];
      brightColors[i * 3] = c.r;
      brightColors[i * 3 + 1] = c.g;
      brightColors[i * 3 + 2] = c.b;
    }
    return { brightPositions, brightColors };
  }, [stellarPalette]);

  // Nebula clouds — soft large color patches that add depth
  const { nebPositions, nebColors } = useMemo(() => {
    const clusters = [
      { x: 380, y: 120, z: -260, color: new THREE.Color('#FF4488'), spread: 100 },
      { x: -300, y: -80, z: 380, color: new THREE.Color('#3366FF'), spread: 90 },
      { x: 140, y: 200, z: 500, color: new THREE.Color('#44FFAA'), spread: 70 },
      { x: -480, y: 50, z: -180, color: new THREE.Color('#FF8844'), spread: 95 },
      { x: 300, y: -180, z: 400, color: new THREE.Color('#B070FF'), spread: 80 },
    ];
    const perCluster = 120;
    const total = perCluster * clusters.length;
    const nebPositions = new Float32Array(total * 3);
    const nebColors = new Float32Array(total * 3);
    let idx = 0;
    for (const cl of clusters) {
      for (let i = 0; i < perCluster; i++, idx++) {
        nebPositions[idx * 3] = cl.x + (Math.random() - 0.5) * cl.spread;
        nebPositions[idx * 3 + 1] = cl.y + (Math.random() - 0.5) * cl.spread * 0.6;
        nebPositions[idx * 3 + 2] = cl.z + (Math.random() - 0.5) * cl.spread;
        const b = 0.15 + Math.random() * 0.35;
        nebColors[idx * 3] = cl.color.r * b;
        nebColors[idx * 3 + 1] = cl.color.g * b;
        nebColors[idx * 3 + 2] = cl.color.b * b;
      }
    }
    return { nebPositions, nebColors };
  }, []);

  const nebulaTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0.0, 'rgba(255, 255, 255, 0.22)');
    g.addColorStop(0.3, 'rgba(255, 255, 255, 0.10)');
    g.addColorStop(0.7, 'rgba(255, 255, 255, 0.03)');
    g.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = clock.getElapsedTime() * 0.000012;
    }
  });

  return (
    <group>
      {/* Background stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.6}
          vertexColors
          transparent
          opacity={0.95}
          sizeAttenuation
          map={starTexture}
          alphaMap={starTexture}
          alphaTest={0.001}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      {/* Milky Way band */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[mwPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[mwColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.1}
          vertexColors
          transparent
          opacity={0.65}
          sizeAttenuation
          map={starTexture}
          alphaMap={starTexture}
          alphaTest={0.001}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      {/* Foreground bright stars — larger apparent size */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[brightPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[brightColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={3.2}
          vertexColors
          transparent
          opacity={0.95}
          sizeAttenuation
          map={starTexture}
          alphaMap={starTexture}
          alphaTest={0.001}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      {/* Nebula clouds */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nebPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[nebColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={8}
          vertexColors
          transparent
          opacity={0.45}
          sizeAttenuation
          map={nebulaTexture}
          alphaMap={nebulaTexture}
          alphaTest={0.001}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

export default StarField;
