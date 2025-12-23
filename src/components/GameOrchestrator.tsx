import { useGym } from '../contexts/GymContext';
import { GymSelection } from './gym/GymSelection';
import { GymDetail } from './gym/GymDetail';
import { SpellingGame } from './spelling/SpellingGame';
import { StarCelebration } from './celebrations/StarCelebration';
import { BadgeCelebration } from './celebrations/BadgeCelebration';

/**
 * Game Orchestrator
 * Determines which screen to show based on current state
 *
 * Flow:
 * - No gym selected → GymSelection
 * - Gym selected but no mini-game → GymDetail
 * - Mini-game selected and session active → SpellingGame
 * - Celebrations overlay on top when triggered
 */
export function GameOrchestrator() {
  const { selectedGym, selectedMiniGame, showStarCelebration, showBadgeCelebration, celebrationGym } = useGym();

  // Determine which main screen to show
  let mainScreen;

  if (selectedMiniGame) {
    // Playing a mini-game (session will be created by SpellingGame)
    mainScreen = <SpellingGame />;
  } else if (selectedGym) {
    // Viewing gym detail
    mainScreen = <GymDetail />;
  } else {
    // Main gym selection
    mainScreen = <GymSelection />;
  }

  return (
    <>
      {mainScreen}

      {/* Celebration overlays */}
      {showStarCelebration && celebrationGym && (
        <StarCelebration gym={celebrationGym} />
      )}

      {showBadgeCelebration && celebrationGym && (
        <BadgeCelebration gym={celebrationGym} />
      )}
    </>
  );
}
