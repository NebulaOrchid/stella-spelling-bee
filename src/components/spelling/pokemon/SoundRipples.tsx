import { motion } from 'framer-motion';

interface SoundRipplesProps {
  color: string;      // Gym color for ripples
  isActive: boolean;  // Whether to show ripples
  size: number;       // Match pokeball size (140px)
}

/**
 * Sound wave ripples animation around pokeball
 *
 * Features:
 * - 4 concentric circles emanating from center
 * - Subtle opacity (20-30%) to avoid distraction
 * - Continuous loop during recording
 * - Staggered animation for smooth effect
 */
export function SoundRipples({ color, isActive, size }: SoundRipplesProps) {
  if (!isActive) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ width: size, height: size }}
    >
      {[0, 1, 2, 3].map((index) => (
        <motion.div
          key={index}
          className="absolute rounded-full border-2"
          style={{
            borderColor: color,
            width: size,
            height: size,
          }}
          animate={{
            scale: [0.8, 1.8],
            opacity: [0.3, 0],
          }}
          transition={{
            duration: 1.5,
            delay: index * 0.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
