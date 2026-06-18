import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface IntroScreenProps {
  onComplete: () => void;
}

function IntroScreen({ onComplete }: IntroScreenProps) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2200);

    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 8 + 2;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
      setProgress(Math.min(100, prog));
    }, 80);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, [onComplete]);

  const systemMessages = [
    'Initializing heliocentric coordinate system...',
    'Loading planetary ephemeris data (IAU 2006)...',
    'Calibrating stellar cartography — 13,000 objects...',
    'Rendering deep space environment...',
    'Activating GPU shader pipeline...',
    'Establishing telemetry link...',
    'System ready. Welcome, Explorer.',
  ];

  return (
    <motion.div
      className="intro-screen"
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
    >
      {/* Animated star bg */}
      <div className="intro-stars">
        {Array.from({ length: 80 }).map((_, i) => (
          <motion.div
            key={i}
            className="intro-star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
            }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: Math.random() * 3 + 1,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="intro-content">
        {/* Orbital animation */}
        <motion.div
          className="intro-orbit-container"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="intro-sun" />
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="intro-ring"
              style={{ width: `${ring * 70 + 40}px`, height: `${ring * 70 + 40}px` }}
              animate={{ rotate: 360 }}
              transition={{ duration: ring * 4 + 3, repeat: Infinity, ease: 'linear' }}
            >
              <div className="intro-planet" style={{
                background: ring === 1 ? '#B5B5B5' : ring === 2 ? '#2F6DA4' : '#C1440E',
                width: ring === 1 ? '8px' : ring === 2 ? '10px' : '8px',
                height: ring === 1 ? '8px' : ring === 2 ? '10px' : '8px',
              }} />
            </motion.div>
          ))}
        </motion.div>

        {/* Title */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="intro-title-block"
            >
              <div className="intro-eyebrow">HELIOCENTRIC VISUALIZATION PLATFORM</div>
              <h1 className="intro-title">
                Solar System
                <br />
                <span className="intro-title-highlight">Explorer</span>
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tagline */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="intro-tagline"
            >
              Journey through 4.6 billion years of cosmic history.
              <br />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                An immersive scientific visualization of our solar system.
              </span>
            </motion.p>
          )}
        </AnimatePresence>

        {/* Loading bar */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="intro-loading"
            >
              <div className="intro-loading-bar">
                <motion.div
                  className="intro-loading-fill"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="intro-loading-text">
                <span>{systemMessages[Math.floor((progress / 100) * systemMessages.length)]}</span>
                <span>{Math.floor(progress)}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom credits */}
      <div className="intro-footer">
        <span>SCIENTIFIC DATA</span>
        <span>·</span>
        <span>NASA JPL EPHEMERIS</span>
        <span>·</span>
        <span>IAU PLANETARY DATA</span>
      </div>
    </motion.div>
  );
}

export default IntroScreen;
