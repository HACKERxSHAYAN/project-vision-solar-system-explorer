import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { PlanetData } from '../data/planets';

interface HUDProps {
  selectedPlanet: PlanetData | null;
  showOrbits: boolean;
  onToggleOrbits: () => void;
  timeScale: number;
  onTimeScaleChange: (scale: number) => void;
  onResetCamera: () => void;
  onSelectPlanet: (id: string) => void;
  planets: PlanetData[];
}

const distanceMap: Record<string, string> = {
  sun: '0 AU',
  mercury: '0.39 AU',
  venus: '0.72 AU',
  earth: '1.00 AU',
  mars: '1.52 AU',
  jupiter: '5.20 AU',
  saturn: '9.58 AU',
  uranus: '19.20 AU',
  neptune: '30.05 AU',
  pluto: '39.48 AU',
};

function HUD({ selectedPlanet, showOrbits, onToggleOrbits, timeScale, onTimeScaleChange, onResetCamera, onSelectPlanet, planets }: HUDProps) {
  const [systemTime, setSystemTime] = useState(new Date());
  const [showPlanetNav, setShowPlanetNav] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toUTCString().replace('GMT', 'UTC');
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hud-top"
      >
        {/* Left: Logo */}
        <div className="hud-logo">
          <div className="hud-logo-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" stroke="#60A5FA" strokeWidth="1.5" opacity="0.5" />
              <circle cx="20" cy="20" r="12" stroke="#60A5FA" strokeWidth="1" opacity="0.6" />
              <circle cx="20" cy="20" r="6" fill="#60A5FA" opacity="0.8" />
              <ellipse cx="20" cy="20" rx="18" ry="6" stroke="#60A5FA" strokeWidth="1" opacity="0.4" />
            </svg>
          </div>
          <div>
            <div className="hud-logo-title">SOLAR SYSTEM EXPLORER</div>
            <div className="hud-logo-sub">Heliocentric Visualization Platform v2.0</div>
          </div>
        </div>

        {/* Center: Selected planet */}
        <div className="hud-center">
          <AnimatePresence mode="wait">
            {selectedPlanet ? (
              <motion.div
                key={selectedPlanet.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="hud-selected"
              >
                <div className="hud-selected-label">OBSERVING TARGET</div>
                <div className="hud-selected-name">{selectedPlanet.name}</div>
                <div className="hud-selected-dist">{distanceMap[selectedPlanet.id] || '—'} from Sun</div>
              </motion.div>
            ) : (
              <motion.div
                key="free"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hud-selected"
              >
                <div className="hud-selected-label">MODE</div>
                <div className="hud-selected-name">FREE EXPLORATION</div>
                <div className="hud-selected-dist">Click any body to focus</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: System time + status */}
        <div className="hud-right">
          <div className="hud-status">
            <div className="status-dot" />
            <span className="status-text">SYSTEMS NOMINAL</span>
          </div>
          <div className="hud-time">
            <div className="hud-time-label">SYSTEM TIME</div>
            <div className="hud-time-value">{formatTime(systemTime)}</div>
          </div>
        </div>
      </motion.div>

      {/* Left sidebar controls */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="hud-left"
      >
        {/* Time control */}
        <div className="hud-widget">
          <div className="widget-label">TIME SCALE</div>
          <div className="time-scale-display">
            <span className="time-scale-value">{timeScale}×</span>
          </div>
          <div className="time-scale-controls">
            {[0.25, 0.5, 1, 2, 5, 10].map(scale => (
              <button
                key={scale}
                className={`scale-btn ${timeScale === scale ? 'active' : ''}`}
                onClick={() => onTimeScaleChange(scale)}
              >
                {scale}×
              </button>
            ))}
          </div>
        </div>

        {/* Orbit toggle */}
        <button className={`hud-toggle ${showOrbits ? 'active' : ''}`} onClick={onToggleOrbits}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="12" cy="12" rx="10" ry="4" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
          <span>ORBITAL PATHS</span>
          <div className={`toggle-dot ${showOrbits ? 'on' : 'off'}`} />
        </button>

        {/* Reset camera */}
        <button className="hud-action-btn" onClick={onResetCamera}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          RESET VIEW
        </button>

        {/* Planet quick nav */}
        <button className="hud-action-btn" onClick={() => setShowPlanetNav(!showPlanetNav)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
          NAVIGATE
        </button>

        {/* Scale reference */}
        <div className="hud-widget scale-widget">
          <div className="widget-label">SCALE REFERENCE</div>
          <div className="scale-bar">
            <div className="scale-unit">1 unit = 10M km</div>
            <div className="scale-vis">
              <div className="scale-line" />
              <span>10M km</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Planet navigation flyout */}
      <AnimatePresence>
        {showPlanetNav && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="planet-nav"
          >
            <div className="planet-nav-title">QUICK NAVIGATION</div>
            {planets.map((p) => (
              <button
                key={p.id}
                className={`planet-nav-item ${selectedPlanet?.id === p.id ? 'active' : ''}`}
                onClick={() => {
                  onSelectPlanet(p.id);
                  setShowPlanetNav(false);
                }}
              >
                <div className="nav-dot" style={{ background: p.color }} />
                <span>{p.name}</span>
                <span className="nav-dist">{distanceMap[p.id]}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom HUD bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hud-bottom"
      >
        <div className="bottom-stat">
          <span className="bottom-stat-label">BODIES TRACKED</span>
          <span className="bottom-stat-value">11</span>
        </div>
        <div className="bottom-divider" />
        <div className="bottom-stat">
          <span className="bottom-stat-label">STAR FIELD</span>
          <span className="bottom-stat-value">13,000+</span>
        </div>
        <div className="bottom-divider" />
        <div className="bottom-stat">
          <span className="bottom-stat-label">ORBIT ENGINE</span>
          <span className="bottom-stat-value">KEPLERIAN</span>
        </div>
        <div className="bottom-divider" />
        <div className="bottom-stat">
          <span className="bottom-stat-label">RENDER</span>
          <span className="bottom-stat-value">WebGL 2.0</span>
        </div>
        <div className="bottom-divider" />
        <div className="bottom-controls-hint">
          <kbd>Drag</kbd> Orbit &nbsp;
          <kbd>Scroll</kbd> Zoom &nbsp;
          <kbd>Click</kbd> Focus
        </div>
      </motion.div>

      {/* Corner brackets */}
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />
    </>
  );
}

export default HUD;
