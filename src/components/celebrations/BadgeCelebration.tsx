import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGym } from '../../contexts/GymContext';
import { soundManager } from '../../services/sound';
import type { Gym } from '../../types';

interface BadgeCelebrationProps {
  gym: Gym;
}

/**
 * Badge Celebration Component
 * Shown when a player unlocks a badge (earns all 3 stars)
 */
export function BadgeCelebration({ gym }: BadgeCelebrationProps) {
  const { dismissCelebration } = useGym();

  useEffect(() => {
    // Play badge unlock sound (epic victory music)
    soundManager.playEffect('badge-unlock').catch(console.error);

    // Trigger massive confetti burst
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = [gym.color, '#ffd700', '#ffffff'];

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
    }, 250);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      dismissCelebration();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [gym, dismissCelebration]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={dismissCelebration}
    >
      <div className="text-center px-6">
        {/* Badge icon with epic animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: [0, 1.3, 1],
            rotate: 0,
          }}
          transition={{
            duration: 1,
            times: [0, 0.7, 1],
          }}
          className="relative inline-block mb-8"
        >
          <motion.div
            animate={{
              filter: [
                'brightness(1) drop-shadow(0 0 20px gold)',
                'brightness(1.5) drop-shadow(0 0 40px gold)',
                'brightness(1.2) drop-shadow(0 0 30px gold)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="text-9xl"
          >
            {gym.emoji}
          </motion.div>

          {/* Rotating sparkles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 text-4xl"
              initial={{ scale: 0 }}
              animate={{
                rotate: 360,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              style={{
                transform: `rotate(${i * 45}deg) translateY(-80px)`,
              }}
            >
              ✨
            </motion.div>
          ))}
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-6xl font-bold text-white mb-4"
        >
          Badge Unlocked!
        </motion.h2>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-3xl font-bold mb-6"
          style={{ color: gym.color }}
        >
          {gym.name}
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-2xl text-white/90 mb-8"
        >
          You're a spelling champion! 🏆
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-lg text-white/70"
        >
          Click anywhere to continue
        </motion.div>
      </div>
    </motion.div>
  );
}
