import { motion } from 'framer-motion';

interface TypeBadgeAnimationProps {
  emoji: string;
  name: string;
  color: string;
  animated?: boolean;
}

/**
 * Pokemon type badge-style animation for gym branding
 *
 * Features:
 * - Floating badge with gym emoji and name
 * - Subtle glow effect matching gym color
 * - Optional hover rotation effect
 */
export function TypeBadgeAnimation({ emoji, name, color, animated = true }: TypeBadgeAnimationProps) {
  return (
    <motion.div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-lg"
      style={{
        backgroundColor: `${color}20`,
        borderColor: color,
        borderWidth: 2,
      }}
      animate={
        animated
          ? {
              y: [0, -5, 0],
            }
          : {}
      }
      transition={
        animated
          ? {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : {}
      }
      whileHover={{
        scale: 1.05,
        rotate: [0, -2, 2, 0],
        transition: { duration: 0.3 },
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-md"
        style={{ backgroundColor: color }}
      />

      {/* Emoji */}
      <span className="text-2xl relative z-10">{emoji}</span>

      {/* Name */}
      <span
        className="text-lg font-bold relative z-10"
        style={{ color }}
      >
        {name}
      </span>
    </motion.div>
  );
}
