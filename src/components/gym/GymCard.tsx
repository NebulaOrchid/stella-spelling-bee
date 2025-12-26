import { motion } from 'framer-motion';
import { StarIcon } from './StarIcon';
import type { Gym } from '../../types';

interface GymCardProps {
  gym: Gym;
  stars?: number; // 0-3 stars earned
  onClick?: () => void;
  onVideoClick?: () => void; // Optional: Click handler for replay video icon
}

/**
 * Gym Card Component (Image-based)
 *
 * Displays gym badge image with star overlay at bottom
 * - Uses custom gym images (PNG)
 * - Shows 0-3 stars based on progress
 * - No lock state (all gyms accessible)
 * - Stars overlaid on semi-transparent bottom banner
 */
export function GymCard({ gym, stars = 0, onClick, onVideoClick }: GymCardProps) {
  // Determine image source (fallback to emoji if no image)
  const hasImage = gym.imageUrl && gym.imageUrl.trim() !== '';
  const imageSource = hasImage ? gym.imageUrl : undefined;

  // DEBUG: Log gym data to see if imageUrl is present
  console.log('[GymCard]', gym.name, {
    hasImageUrl: !!gym.imageUrl,
    imageUrl: gym.imageUrl,
    hasImage,
    imageSource,
  });

  // Progressive lighting based on stars earned
  // 0 stars: Mostly grayed out (80% grayscale, 40% brightness)
  // 1 star:  Partially lit (60% grayscale, 70% brightness)
  // 2 stars: More lit (30% grayscale, 90% brightness)
  // 3 stars: Fully lit (0% grayscale, 110% brightness + glow)
  const getImageFilter = () => {
    switch (stars) {
      case 0:
        return 'grayscale(80%) brightness(0.4)'; // Mostly grayed out (some color visible)
      case 1:
        return 'grayscale(60%) brightness(0.7)'; // Starting to light up
      case 2:
        return 'grayscale(30%) brightness(0.9)'; // Almost full color
      case 3:
        return 'grayscale(0%) brightness(1.1) saturate(1.2)'; // Fully lit + vibrant
      default:
        return 'grayscale(80%) brightness(0.4)';
    }
  };

  // Dark overlay for 0 stars
  const showDarkOverlay = stars === 0;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl shadow-2xl cursor-pointer group"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* Gym Image */}
      {imageSource ? (
        <img
          src={imageSource}
          alt={gym.name}
          className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-105"
          style={{ filter: getImageFilter() }}
        />
      ) : (
        // Fallback: Emoji-based display (if no image)
        <div
          className="aspect-[3/4] flex items-center justify-center text-8xl"
          style={{ backgroundColor: `${gym.color}20` }}
        >
          {gym.emoji}
        </div>
      )}

      {/* Dark overlay (only for 0 stars) */}
      {showDarkOverlay && (
        <div className="absolute inset-0 bg-black/30 transition-opacity duration-700" />
      )}

      {/* Star Overlay at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 pb-5">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((starNumber) => (
            <StarIcon
              key={starNumber}
              filled={starNumber <= stars}
              color={gym.color}
              size={32}
              animate={false}
            />
          ))}
        </div>
      </div>

      {/* Glow effect (3 stars = always visible, hover enhances it) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          stars === 3 ? 'opacity-60 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-60'
        }`}
        style={{
          boxShadow: `inset 0 0 60px ${gym.color}60, 0 0 40px ${gym.color}40`,
        }}
      />

      {/* Replay Video Icon (top-right corner, only if video exists and 3 stars earned) */}
      {gym.rewardVideoUrl && stars >= 3 && onVideoClick && (
        <motion.button
          className="absolute top-3 right-3 p-3 bg-black/70 rounded-full backdrop-blur-sm hover:bg-black/90 transition-all"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering card onClick
            onVideoClick();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              `0 0 0 0 ${gym.color}00`,
              `0 0 0 8px ${gym.color}40`,
              `0 0 0 0 ${gym.color}00`,
            ],
          }}
          transition={{
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          aria-label="Replay reward video"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </motion.button>
      )}
    </motion.div>
  );
}
