import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import StarField from './StarField';
import Sun from './Sun';
import Planet from './Planet';
import AsteroidBelt from './AsteroidBelt';
import PostProcessing from './PostProcessing';
import { PLANET_DATA } from '../data/planets';
import type { PlanetData } from '../data/planets';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';

interface SceneProps {
  selectedPlanet: PlanetData | null;
  onSelectPlanet: (planet: PlanetData | null) => void;
  showOrbits: boolean;
  timeScale: number;
  resetTrigger: number;
}

// Ref-tracked planet positions for camera focus
const planetPositions: Record<string, THREE.Vector3> = {};

function CameraController({
  selectedPlanet,
  controlsRef,
  resetTrigger,
}: {
  selectedPlanet: PlanetData | null;
  controlsRef: React.MutableRefObject<OrbitControlsType | null>;
  resetTrigger: number;
}) {
  const { camera } = useThree();
  const prevSelected = useRef<string | null>(null);
  const isAnimating = useRef(false);
  const liveFollow = useRef(false);

  // Continuous tracking: every frame, update controls.target to follow the focused planet
  useFrame(() => {
    if (!controlsRef.current || !window.focusedPlanetMesh) return;

    const targetVec = new THREE.Vector3();
    window.focusedPlanetMesh.mesh.getWorldPosition(targetVec);

    // Continuously point camera at planet's current position
    controlsRef.current.target.copy(targetVec);
    controlsRef.current.update();
  });

  // Live-follow selected planet during orbit
  useFrame(() => {
    if (!liveFollow.current || !selectedPlanet || isAnimating.current) return;
    const pos = planetPositions[selectedPlanet.id];
    if (!pos || !controlsRef.current) return;

    controlsRef.current.target.lerp(pos, 0.04);
    controlsRef.current.update();
  });

  useEffect(() => {
    if (!controlsRef.current) return;
    liveFollow.current = false;

    if (resetTrigger > 0 && !selectedPlanet) {
      isAnimating.current = true;
      gsap.killTweensOf(camera.position);
      const ctrl = controlsRef.current;
      gsap.to(camera.position, {
        x: 0, y: 60, z: 180,
        duration: 2.0,
        ease: 'power3.inOut',
        onUpdate: () => {
          ctrl.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
          ctrl.update();
        },
        onComplete: () => { isAnimating.current = false; }
      });
      return;
    }

    if (!selectedPlanet) return;
    if (prevSelected.current === selectedPlanet.id) return;
    prevSelected.current = selectedPlanet.id;

    isAnimating.current = true;
    const ctrl = controlsRef.current;

    const focusDist = selectedPlanet.id === 'sun'
      ? selectedPlanet.radius * 3.5
      : Math.max(selectedPlanet.radius * 5.5 + 6, 10);

    const offset = new THREE.Vector3(focusDist * 0.8, focusDist * 0.5, focusDist);

    gsap.killTweensOf(camera.position);
    gsap.to(camera.position, {
      duration: 2.4,
      ease: 'power3.inOut',
      onUpdate: () => {
        // Calculate dynamic target based on focused planet's current world position
        if (window.focusedPlanetMesh && window.focusedPlanetMesh.mesh) {
          const planetWorldPos = new THREE.Vector3();
          window.focusedPlanetMesh.mesh.getWorldPosition(planetWorldPos);

          // Dynamic target: planet position + offset (flies alongside the moving planet)
          const targetCamPos = planetWorldPos.clone().add(offset);

          // Smoothly move camera towards the dynamic target
          camera.position.lerp(targetCamPos, 0.12);
        }
        ctrl.update();
      },
      onComplete: () => {
        isAnimating.current = false;
        liveFollow.current = true;
      }
    });
  }, [selectedPlanet, camera, controlsRef, resetTrigger]);

  return null;
}

function PlanetPositionTracker({ id, orbitRadius, orbitSpeed, timeScale }: {
  id: string;
  orbitRadius: number;
  orbitSpeed: number;
  timeScale: number;
}) {
  const angle = useRef(Math.random() * Math.PI * 2);

  useFrame(() => {
    angle.current = (angle.current + orbitSpeed * timeScale * 0.016) % (Math.PI * 2);
    if (!planetPositions[id]) planetPositions[id] = new THREE.Vector3();
    planetPositions[id].set(
      Math.cos(angle.current) * orbitRadius,
      0,
      Math.sin(angle.current) * orbitRadius
    );
  });

  return null;
}

function Scene({ selectedPlanet, onSelectPlanet, showOrbits, timeScale, resetTrigger }: SceneProps) {
  const controlsRef = useRef<OrbitControlsType | null>(null);

  const handlePlanetClick = useCallback((data: PlanetData) => {
    onSelectPlanet(data);
  }, [onSelectPlanet]);

  const handleSunClick = useCallback(() => {
    onSelectPlanet(PLANET_DATA[0]);
  }, [onSelectPlanet]);

  useEffect(() => {
    // Initialize sun position
    planetPositions['sun'] = new THREE.Vector3(0, 0, 0);
  }, []);

  return (
    <>
      {/* Camera controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.035}
        minDistance={3}
        maxDistance={600}
        rotateSpeed={0.45}
        zoomSpeed={1.0}
        panSpeed={0.6}
        makeDefault
      />

      <CameraController
        selectedPlanet={selectedPlanet}
        controlsRef={controlsRef}
        resetTrigger={resetTrigger}
      />

      {/*
        Very faint ambient so pitch-black shadow sides stay space-like
        but still reveal faint surface detail (craters, continents).
        The Sun is the ONLY strong light — terminators are sharp.
      */}
      <ambientLight intensity={0.035} color="#0a1028" />

      {/* Cool hemisphere fill mimicking scattered starlight on dark sides */}
      <hemisphereLight args={['#0a1428', '#020308', 0.04]} />

      {/* Deep space background */}
      <StarField />

      {/* Sun */}
      <Sun
        radius={PLANET_DATA[0].radius}
        onClick={handleSunClick}
        isSelected={selectedPlanet?.id === 'sun'}
      />

      {/* Planets */}
      {PLANET_DATA.slice(1).map((planet) => (
        <group key={planet.id}>
          <PlanetPositionTracker
            id={planet.id}
            orbitRadius={planet.orbitRadius}
            orbitSpeed={planet.orbitSpeed}
            timeScale={timeScale}
          />
          <Planet
            data={planet}
            onClick={handlePlanetClick}
            isSelected={selectedPlanet?.id === planet.id}
            showOrbits={showOrbits}
            timeScale={timeScale}
            focusedId={selectedPlanet?.id || null}
          />
        </group>
      ))}

      {/* Main Asteroid Belt (between Mars and Jupiter) */}
      <AsteroidBelt
        innerRadius={43}
        outerRadius={52}
        count={2000}
        color="#9A8070"
        opacity={0.6}
        rotationSpeed={0.0001}
        thickness={1.5}
      />

      {/* Kuiper Belt (beyond Neptune/Pluto) */}
      <AsteroidBelt
        innerRadius={170}
        outerRadius={220}
        count={3000}
        color="#607080"
        opacity={0.35}
        rotationSpeed={0.00005}
        thickness={8}
      />

      {/* Kuiper Belt sparse outer ring */}
      <AsteroidBelt
        innerRadius={220}
        outerRadius={280}
        count={1000}
        color="#506070"
        opacity={0.2}
        rotationSpeed={0.00003}
        thickness={12}
      />

      {/* Post-processing effects */}
      <PostProcessing />
    </>
  );
}

export default Scene;
