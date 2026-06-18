import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface WelcomeHintProps {
  hasSelected: boolean;
}

function WelcomeHint({ hasSelected }: WelcomeHintProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (hasSelected) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, [hasSelected]);

  return (
    <AnimatePresence>
      {visible && !hasSelected && (
        <motion.div
          className="welcome-hint"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hint-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
              <circle cx="12" cy="12" r="10" stroke="#60A5FA" strokeWidth="1.5" opacity="0.6" />
              <path d="M12 8v4M12 16h.01" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="hint-content">
            <div className="hint-title">Begin Your Exploration</div>
            <div className="hint-desc">
              Click any planet to discover its story<br />
              Drag to orbit · Scroll to zoom
            </div>
          </div>
          <button className="hint-close" onClick={() => setVisible(false)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WelcomeHint;
