import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGym } from '../../contexts/GymContext';
import { soundManager } from '../../services/sound';
import type { Gym } from '../../types';

interface StarCelebrationProps {
  gym: Gym;
}

/**
 * Star Celebration Component
 * Shown when a player earns a star
 */
export function StarCelebration({ gym }: StarCelebrationProps) {
  const { dismissCelebration } = useGym();

  useEffect(() => {
    // Play star earned sound
    soundManager.playEffect('star-earned').catch(console.error);

    // Trigger confetti
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 },
      colors: [gym.color, '#ffd700', '#ffffff'],
    });

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      dismissCelebration();
    }, 3000);

    return () => clearTimeout(timer);
  }, [gym, dismissCelebration]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={dismissCelebration}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
        className="text-center"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          className="text-9xl mb-6"
        >
          ⭐
        </motion.div>

        <h2 className="text-5xl font-bold text-white mb-4">
          Star Earned!
        </h2>

        <p className="text-2xl text-white/90 mb-6">
          Perfect spelling! Keep it up!
        </p>

        <div className="text-lg text-white/70">
          Click anywhere to continue
        </div>
      </motion.div>
    </motion.div>
  );
}
