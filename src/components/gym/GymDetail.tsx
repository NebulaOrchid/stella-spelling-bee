import { useState, useEffect, useRef } from 'react';
import { useGym } from '../../contexts/GymContext';
import { Button } from '../common/Button';
import { MiniGameCard } from './MiniGameCard';
import { GymRewardVideo } from './GymRewardVideo';
import { ProgressStorage } from '../../services/storage/progressStorage';

/**
 * Gym Detail Screen
 * Shows a single gym with its 3 mini-games
 */
export function GymDetail() {
  const { selectedGym, gymProgress, startMiniGame, returnToGymSelection, markVideoAsPlayed } = useGym();
  const [showRewardVideo, setShowRewardVideo] = useState(false);
  const previousStarsRef = useRef<number>(0);

  if (!selectedGym) {
    return null;
  }

  const progress = ProgressStorage.getGymProgress(gymProgress, selectedGym.id);
  if (!progress) {
    return null;
  }

  const { badgeUnlocked, starsEarned, hasAutoPlayedVideo } = progress;

  // Auto-play reward video when achieving 3 stars for the first time
  useEffect(() => {
    // Check conditions for auto-playing video:
    // 1. Gym has a reward video
    // 2. Just achieved 3 stars (stars changed from < 3 to 3)
    // 3. Video hasn't been auto-played before
    const justAchieved3Stars = previousStarsRef.current < 3 && starsEarned === 3;
    const shouldAutoPlay = selectedGym.rewardVideoUrl && justAchieved3Stars && !hasAutoPlayedVideo;

    if (shouldAutoPlay) {
      console.log('[GymDetail] Auto-playing reward video for:', selectedGym.name);
      setShowRewardVideo(true);
      markVideoAsPlayed(selectedGym.id);
    }

    // Update previous stars count
    previousStarsRef.current = starsEarned;
  }, [starsEarned, selectedGym, hasAutoPlayedVideo, markVideoAsPlayed]);

  // Handle video close
  const handleVideoClose = () => {
    setShowRewardVideo(false);
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: `linear-gradient(135deg, ${selectedGym.color}10 0%, transparent 100%)`,
      }}
    >
      {/* Back button */}
      <div className="mb-6">
        <Button variant="secondary" onClick={returnToGymSelection}>
          ← Back to Gyms
        </Button>
      </div>

      {/* Gym header */}
      <div className="text-center mb-12">
        {/* Gym icon - image for Fire Gym, emoji for others */}
        {selectedGym.theme === 'Fire' ? (
          <div className="flex justify-center mb-4 animate-bounce">
            <img
              src="/images/gyms/fire-gym-icon.png"
              alt="Fire Gym Icon"
              className="w-32 h-32 object-contain"
            />
          </div>
        ) : (
          <div className="text-9xl mb-4 animate-bounce">{selectedGym.emoji}</div>
        )}
        <h1 className="text-5xl font-bold mb-2" style={{ color: selectedGym.color }}>
          {selectedGym.name}
        </h1>
        <p className="text-2xl text-text-secondary mb-4">{selectedGym.theme} Gym</p>

        {/* Badge status */}
        <div className="inline-block px-6 py-3 rounded-full border-2" style={{
          borderColor: selectedGym.color,
          backgroundColor: badgeUnlocked ? `${selectedGym.color}20` : 'transparent',
        }}>
          {badgeUnlocked ? (
            <div className="flex items-center gap-2 text-xl">
              <span>🏆</span>
              <span className="font-bold">Badge Unlocked!</span>
              <span>🏆</span>
            </div>
          ) : (
            <div className="text-lg">
              <span className="font-bold">{starsEarned}/3</span> stars earned
            </div>
          )}
        </div>
      </div>

      {/* Mini-games */}
      <div className="max-w-6xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Complete all 3 challenges to unlock the badge!
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {selectedGym.miniGames.map(miniGame => {
            const miniGameProgress = progress.miniGames.find(
              mg => mg.miniGameId === miniGame.id
            );

            if (!miniGameProgress) return null;

            return (
              <MiniGameCard
                key={miniGame.id}
                miniGame={miniGame}
                progress={miniGameProgress}
                gymColor={selectedGym.color}
                onPlay={() => startMiniGame(miniGame.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-text-muted max-w-2xl mx-auto">
        <div className="card bg-surface/50">
          <h3 className="font-bold text-lg mb-2">How to Earn a Star ⭐</h3>
          <p className="text-sm mb-2">
            Spell <span className="font-bold">all words correctly on your first try</span> to earn a star!
          </p>
          <p className="text-sm">
            You can replay any challenge to improve your score and earn the star.
          </p>
        </div>
      </div>

      {/* Reward Video Modal */}
      {selectedGym.rewardVideoUrl && (
        <GymRewardVideo
          videoUrl={selectedGym.rewardVideoUrl}
          gymColor={selectedGym.color}
          gymName={selectedGym.name}
          isOpen={showRewardVideo}
          onClose={handleVideoClose}
          autoPlay={true}
        />
      )}
    </div>
  );
}
