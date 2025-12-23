import { motion } from 'framer-motion';
import { PokeballAnimation } from './PokeballAnimation';
import { SoundRipples } from './SoundRipples';

interface BigPokeballListeningProps {
  gymColor: string;
  message?: string;
  isRecording?: boolean;
  timeRemaining?: number;
}

/**
 * Big Animated Pokeball Display
 * Shows a large pulsing pokeball while the word is being pronounced or during recording
 */
export function BigPokeballListening({
  gymColor,
  message = 'Listen carefully...',
  isRecording = false,
  timeRemaining,
}: BigPokeballListeningProps) {
  return (
    <div className="card flex flex-col items-center justify-center p-12 space-y-6">
      {/* Big pulsing pokeball with sound ripples during recording */}
      {/* Fixed container to prevent layout shift during animation */}
      <div className="relative flex items-center justify-center" style={{ width: '220px', height: '220px' }}>
        {isRecording && (
          <SoundRipples color={gymColor} isActive={true} size={200} />
        )}
        <motion.div
          className="absolute"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <PokeballAnimation
            state="pulsing"
            color={gymColor}
            size={200}
          />
        </motion.div>
      </div>

      {/* Sound waves animation */}
      {/* Fixed height container to prevent layout shift */}
      <div className="flex items-center justify-center gap-2" style={{ height: '40px' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-2 rounded-full"
            style={{ backgroundColor: gymColor }}
            animate={{
              height: [20, 40, 20],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Message */}
      <motion.div
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-center"
      >
        <p className="text-2xl font-bold" style={{ color: gymColor }}>
          {message}
        </p>
        {!isRecording && (
          <p className="text-lg text-text-muted mt-2">
            Word → Definition → Word
          </p>
        )}
      </motion.div>

      {/* Time remaining during recording */}
      {timeRemaining !== undefined && isRecording && (
        <motion.p
          className="text-lg font-bold"
          style={{ color: gymColor }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {timeRemaining}s remaining
        </motion.p>
      )}

      {/* Listening indicator */}
      {/* Fixed size container to prevent layout shift from scale animation */}
      <div className="relative flex items-center justify-center" style={{ width: '96px', height: '96px' }}>
        <motion.div
          className="absolute"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ fontSize: '4rem' }}
        >
          {isRecording ? '🎙️' : '🔊'}
        </motion.div>
      </div>
    </div>
  );
}
