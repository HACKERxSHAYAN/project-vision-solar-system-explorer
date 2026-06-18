import { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import Scene from './components/Scene';
import HUD from './components/HUD';
import PlanetPanel from './components/PlanetPanel';
import IntroScreen from './components/IntroScreen';
import TelemetryWidget from './components/TelemetryWidget';
import WelcomeHint from './components/WelcomeHint';
import { PLANET_DATA } from './data/planets';
import type { PlanetData } from './data/planets';
import './styles/space.css';

function DiscoveryToast({ planet }: { planet: PlanetData | null }) {
  if (!planet) return null;
  return (
    <motion.div
      className="discovery-toast"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="toast-icon">🔭</span>
      <div>
        <div className="toast-text">TARGET ACQUIRED</div>
        <div className="toast-sub">Focusing on {planet.name}</div>
      </div>
    </motion.div>
  );
}

function App() {
  const [introComplete, setIntroComplete] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [showOrbits, setShowOrbits] = useState(true);
  const [timeScale, setTimeScale] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelectPlanet = useCallback((planet: PlanetData | null) => {
    setSelectedPlanet(planet);
    if (planet) {
      setShowToast(true);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setShowToast(false), 2500);
    }
  }, []);

  const handleSelectById = useCallback((id: string) => {
    const planet = PLANET_DATA.find(p => p.id === id) || null;
    handleSelectPlanet(planet);
  }, [handleSelectPlanet]);

  const handleClose = useCallback(() => {
    setSelectedPlanet(null);
  }, []);

  const handleResetCamera = useCallback(() => {
    setSelectedPlanet(null);
    setResetTrigger(prev => prev + 1);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000005', overflow: 'hidden' }}>
      <AnimatePresence>
        {!introComplete && (
          <IntroScreen onComplete={() => setIntroComplete(true)} />
        )}
      </AnimatePresence>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 60, 180], fov: 55, near: 0.1, far: 2000 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        dpr={[1, 2]}
        shadows={false}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene
          selectedPlanet={selectedPlanet}
          onSelectPlanet={handleSelectPlanet}
          showOrbits={showOrbits}
          timeScale={timeScale}
          resetTrigger={resetTrigger}
        />
      </Canvas>

      {/* Scan line overlay */}
      <div className="scan-overlay" />

      {/* HUD - only show after intro */}
      {introComplete && (
        <>
          <HUD
            selectedPlanet={selectedPlanet}
            showOrbits={showOrbits}
            onToggleOrbits={() => setShowOrbits(prev => !prev)}
            timeScale={timeScale}
            onTimeScaleChange={setTimeScale}
            onResetCamera={handleResetCamera}
            onSelectPlanet={handleSelectById}
            planets={PLANET_DATA}
          />

          <TelemetryWidget planet={selectedPlanet} />
          <WelcomeHint hasSelected={!!selectedPlanet} />

          <AnimatePresence>
            {showToast && <DiscoveryToast planet={selectedPlanet} />}
          </AnimatePresence>

          <PlanetPanel
            planet={selectedPlanet}
            onClose={handleClose}
          />
        </>
      )}
    </div>
  );
}

export default App;
