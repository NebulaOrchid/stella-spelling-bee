import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CountdownDisplayProps {
  startFrom: number;
  onComplete: () => void;
  gymColor?: string;
}

/**
 * Countdown Display Component
 * Shows animated countdown from startFrom to 1, then calls onComplete
 */
export function CountdownDisplay({ startFrom, onComplete, gymColor = '#3b82f6' }: CountdownDisplayProps) {
  const [count, setCount] = useState(startFrom);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="card flex items-center justify-center p-12">
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0, rotate: 180 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
          className="text-center"
        >
          {count > 0 ? (
            <>
              <motion.div
                className="text-9xl font-bold mb-4"
                style={{ color: gymColor }}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: 0,
                }}
              >
                {count}
              </motion.div>
              <p className="text-2xl font-semibold text-text-muted">
                Get ready...
              </p>
            </>
          ) : (
            <>
              <motion.div
                className="text-7xl mb-4"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 0.8,
                }}
              >
                🎤
              </motion.div>
              <p className="text-3xl font-bold" style={{ color: gymColor }}>
                GO!
              </p>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
