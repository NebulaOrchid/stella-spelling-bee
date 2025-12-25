import { motion } from 'framer-motion';

interface StarIconProps {
  filled: boolean;
  color?: string;
  size?: number;
  animate?: boolean;
}

/**
 * Custom SVG Star Icon
 *
 * Features:
 * - Filled or empty (outline) state
 * - Custom color (gym-themed)
 * - Drop shadow and glow effects
 * - Optional entrance animation
 */
export function StarIcon({ filled, color = '#fbbf24', size = 28, animate = false }: StarIconProps) {
  const starVariants = {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 500,
        damping: 15,
      }
    },
  };

  const Star = () => {
    if (filled) {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          className="drop-shadow-lg filter"
          style={{
            filter: `drop-shadow(0 0 4px ${color}80)`,
          }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    }

    // Empty star (outline only)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        className="opacity-50"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    );
  };

  if (animate) {
    return (
      <motion.div
        variants={starVariants}
        initial="hidden"
        animate="visible"
      >
        <Star />
      </motion.div>
    );
  }

  return <Star />;
}
