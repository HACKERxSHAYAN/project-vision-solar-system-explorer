import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SunProps {
  radius: number;
  onClick: () => void;
  isSelected: boolean;
}

/**
 * Photorealistic Sun — a perfect sphere with pure emissive surface.
 * The blinding volumetric glow is produced entirely by the Bloom post-process,
 * which reads the HDR emissive colors and bleeds them into surrounding pixels.
 */
function Sun({ radius, onClick, isSelected }: SunProps) {
  const sunRef = useRef<THREE.Mesh>(null);
  const coronaHaloRef = useRef<THREE.Mesh>(null);
  const outerHaloRef = useRef<THREE.Mesh>(null);

  // A clean, physically-plausible photosphere gradient — no noise, no particles.
  const sunTexture = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Uniform photosphere base — soft radial falloff so limb darkening reads
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0.0, '#FFFFFF');
    g.addColorStop(0.18, '#FFF6C8');
    g.addColorStop(0.45, '#FFD264');
    g.addColorStop(0.72, '#FF9A20');
    g.addColorStop(1.0, '#FF6200');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // Subtle large-scale brightness patches (granulation, no speckle)
    for (let i = 0; i < 28; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 80 + Math.random() * 180;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255, 248, 210, 0.10)');
      rg.addColorStop(1, 'rgba(255, 180, 80, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);

  // Corona halo — a soft, thin, additive sphere behind the sun that bloom will flare.
  const coronaTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 60, 128, 128, 128);
    g.addColorStop(0.0, 'rgba(255, 220, 140, 0.55)');
    g.addColorStop(0.45, 'rgba(255, 150, 50, 0.18)');
    g.addColorStop(0.8, 'rgba(255, 90, 10, 0.04)');
    g.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sunRef.current) {
      // Gentle rotation for slow surface drift
      sunRef.current.rotation.y = t * 0.015;
    }
    if (coronaHaloRef.current) {
      // Subtle breathing — bloom will amplify it
      const s = 1 + Math.sin(t * 0.4) * 0.012;
      coronaHaloRef.current.scale.setScalar(s);
    }
    if (outerHaloRef.current) {
      outerHaloRef.current.rotation.z = t * 0.02;
    }
  });

  return (
    <group onClick={onClick}>
      {/*
        Primary illumination — the Sun IS the light source.
        distance=0 (infinite range) and decay=0 (no distance falloff)
        guarantees every planet from Mercury to Pluto receives full,
        uniform illumination. The realistic day/night terminator still
        forms naturally from each planet's own surface normal relative
        to the light direction. This is necessary because physically-
        correct PointLight attenuation in Three.js dims outer planets
        to near-invisible levels.
      */}
      <pointLight
        color="#FFF4D8"
        intensity={5.5}
        distance={0}
        decay={0}
        castShadow={false}
      />

      {/* Warm fill so the lit face has a gentle solar tint */}
      <pointLight
        color="#FFD090"
        intensity={1.2}
        distance={0}
        decay={0}
      />

      {/* Perfect photosphere sphere — HDR emissive so Bloom produces a blinding glow */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshBasicMaterial
          map={sunTexture}
          toneMapped={false} // critical — keep HDR so bloom fires
        />
      </mesh>

      {/* Corona halo — sits just outside the sphere, additive, drives bloom flare */}
      <mesh ref={coronaHaloRef}>
        <sphereGeometry args={[radius * 1.08, 64, 64]} />
        <meshBasicMaterial
          map={coronaTexture}
          transparent
          opacity={0.75}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Far optical flare — very faint, gives bloom something to bleed */}
      <mesh ref={outerHaloRef}>
        <sphereGeometry args={[radius * 1.35, 48, 48]} />
        <meshBasicMaterial
          color="#FF8A20"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Extremely faint outer optical bloom halo */}
      <mesh>
        <sphereGeometry args={[radius * 2.0, 32, 32]} />
        <meshBasicMaterial
          color="#FF4400"
          transparent
          opacity={0.035}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Selection indicator */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[radius * 2.4, 32, 32]} />
          <meshBasicMaterial
            color="#FFA040"
            transparent
            opacity={0.04}
            wireframe={false}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

export default Sun;
