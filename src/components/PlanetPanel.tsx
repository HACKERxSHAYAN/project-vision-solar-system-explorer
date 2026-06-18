import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { PlanetData } from '../data/planets';

interface PlanetPanelProps {
  planet: PlanetData | null;
  onClose: () => void;
}

const planetColors: Record<string, string> = {
  sun: '#FFA040',
  mercury: '#B5B5B5',
  venus: '#E8C170',
  earth: '#4FC3F7',
  mars: '#C1440E',
  jupiter: '#C88B3A',
  saturn: '#E8D5A3',
  uranus: '#7FFFD4',
  neptune: '#3F54BA',
  pluto: '#C4A882',
};

const planetIcons: Record<string, string> = {
  sun: '☀️',
  mercury: '🔘',
  venus: '🌕',
  earth: '🌍',
  mars: '🔴',
  jupiter: '🟤',
  saturn: '🪐',
  uranus: '🩵',
  neptune: '🔵',
  pluto: '⚪',
};

function PlanetPanel({ planet, onClose }: PlanetPanelProps) {
  const [activeTab, setActiveTab] = useState<'facts' | 'story'>('story');

  if (!planet) return null;
  const accentColor = planetColors[planet.id] || '#60A5FA';
  const icon = planetIcons[planet.id] || '🌑';

  return (
    <AnimatePresence>
      {planet && (
        <motion.div
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="planet-panel absolute bottom-8 right-8 bg-slate-900/70 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-6 flex flex-col h-full"
          style={{ '--accent': accentColor, maxHeight: '80vh' } as React.CSSProperties}
        >
          {/* Header */}
          <div className="panel-header" style={{ borderColor: `${accentColor}40` }}>
            <div className="panel-header-content">
              <div className="planet-icon" style={{ background: `${accentColor}20`, borderColor: `${accentColor}40` }}>
                <span>{icon}</span>
              </div>
              <div>
                <div className="panel-type-badge" style={{ color: accentColor }}>
                  {planet.type === 'star' ? 'HOST STAR' :
                   planet.type === 'dwarf' ? 'DWARF PLANET' :
                   planet.type === 'moon' ? 'NATURAL SATELLITE' : 'PLANET'}
                </div>
                <h2 className="panel-title">{planet.name}</h2>
                <p className="panel-tagline">{planet.description}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="panel-close-btn"
              aria-label="Close panel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Divider with glow */}
          <div className="panel-divider" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

          {/* Tabs */}
          <div className="panel-tabs">
            <button
              className={`panel-tab ${activeTab === 'story' ? 'active' : ''}`}
              style={activeTab === 'story' ? { color: accentColor, borderColor: accentColor } : {}}
              onClick={() => setActiveTab('story')}
            >
              Discovery
            </button>
            <button
              className={`panel-tab ${activeTab === 'facts' ? 'active' : ''}`}
              style={activeTab === 'facts' ? { color: accentColor, borderColor: accentColor } : {}}
              onClick={() => setActiveTab('facts')}
            >
              Data
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto pb-4 pr-2">
            {/* Content */}
            <div className="panel-content" style={{ maxHeight: 'none', overflowY: 'visible', pointerEvents: 'auto' }}>
              <AnimatePresence mode="wait">
                {activeTab === 'story' ? (
                  <motion.div
                    key="story"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="panel-story">{planet.story}</p>
                    <div className="fun-fact-box" style={{ borderColor: `${accentColor}40`, background: `${accentColor}08` }}>
                      <div className="fun-fact-label" style={{ color: accentColor }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z" />
                        </svg>
                        FASCINATING FACT
                      </div>
                      <p className="fun-fact-text">{planet.facts.funFact}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="facts"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="facts-grid">
                      {[
                        { label: 'Diameter', value: planet.facts.diameter, icon: '⊙' },
                        { label: 'Distance from Sun', value: planet.facts.distanceFromSun, icon: '↔' },
                        { label: 'Orbital Period', value: planet.facts.orbitalPeriod, icon: '↺' },
                        { label: 'Surface Gravity', value: planet.facts.gravity, icon: '↓' },
                        { label: 'Temperature', value: planet.facts.temperature, icon: '◈' },
                        { label: 'Known Moons', value: planet.facts.moons, icon: '◯' },
                      ].map((fact) => (
                        <div key={fact.label} className="fact-item" style={{ borderColor: `${accentColor}20` }}>
                          <div className="fact-icon" style={{ color: accentColor }}>{fact.icon}</div>
                          <div className="fact-label">{fact.label}</div>
                          <div className="fact-value">{fact.value}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Orbital visualization mini widget */}
          <div className="panel-orbit-viz mt-auto shrink-0" style={{ borderColor: `${accentColor}15` }}>
            <div className="orb-viz-label" style={{ color: accentColor }}>ORBITAL TRAJECTORY</div>
            <div className="orb-viz-container">
              <motion.div
                className="orb-viz-planet"
                style={{ background: accentColor, boxShadow: `0 0 10px ${accentColor}` }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              <div className="orb-viz-ring" style={{ borderColor: `${accentColor}30` }} />
              <div className="orb-viz-sun" />
            </div>
          </div>

          {/* Bottom indicator */}
          <div className="panel-footer">
            <div className="signal-dot" style={{ background: accentColor }} />
            <span className="signal-text">LIVE TELEMETRY</span>
            <div className="signal-bar" style={{ background: `${accentColor}60` }}>
              <motion.div
                className="signal-fill"
                style={{ background: accentColor }}
                animate={{ width: ['20%', '90%', '40%', '75%', '20%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PlanetPanel;
