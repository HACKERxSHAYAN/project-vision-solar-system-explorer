import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { PlanetData } from '../data/planets';

interface TelemetryWidgetProps {
  planet: PlanetData | null;
}

function TelemetryWidget({ planet }: TelemetryWidgetProps) {
  const [fps, setFps] = useState(60);
  const [orbitAngle, setOrbitAngle] = useState(0);

  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    let rafId: number;
    const measure = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime > 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(measure);
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrbitAngle(prev => (prev + (planet ? planet.orbitSpeed * 20 : 1)) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [planet]);

  return (
    <motion.div
      className="telemetry-widget"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.6 }}
    >
      <div className="tele-row">
        <span className="tele-label">RENDER FPS</span>
        <span className="tele-value" style={{ color: fps >= 50 ? '#22C55E' : fps >= 30 ? '#F59E0B' : '#EF4444' }}>
          {fps}
        </span>
      </div>
      <div className="tele-divider" />
      <div className="tele-row">
        <span className="tele-label">ORBIT θ</span>
        <span className="tele-value">{Math.floor(orbitAngle)}°</span>
      </div>
      <div className="tele-divider" />
      <div className="tele-row">
        <span className="tele-label">RENDERER</span>
        <span className="tele-value" style={{ color: '#60A5FA' }}>WebGL2</span>
      </div>
    </motion.div>
  );
}

export default TelemetryWidget;
