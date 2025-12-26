import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GymRewardVideoProps {
  videoUrl: string;
  gymColor: string;
  gymName: string;
  isOpen: boolean;
  onClose: () => void;
  autoPlay?: boolean;
}

/**
 * Gym Reward Video Modal
 *
 * Shows a video reward for completing all 3 mini-games in a gym
 * - Large centered modal with video player
 * - Close button and backdrop click to dismiss
 * - Escape key support
 * - Optional auto-play for first-time achievement
 */
export function GymRewardVideo({
  videoUrl,
  gymColor,
  gymName,
  isOpen,
  onClose,
  autoPlay = false,
}: GymRewardVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Auto-play video when modal opens (if enabled)
  useEffect(() => {
    if (isOpen && autoPlay && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn('[GymRewardVideo] Auto-play failed:', err);
      });
    }
  }, [isOpen, autoPlay]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-surface rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full"
            style={{
              boxShadow: `0 0 40px ${gymColor}40`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-6 py-4 border-b-2"
              style={{ borderColor: `${gymColor}40` }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold" style={{ color: gymColor }}>
                  {gymName} - Congratulations! 🎉
                </h2>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                  aria-label="Close video"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="bg-black">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full max-h-[70vh] object-contain"
                controlsList="nodownload"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-surface/50 text-center">
              <p className="text-text-secondary">
                You've earned all 3 stars in this gym! Amazing work! ⭐⭐⭐
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
