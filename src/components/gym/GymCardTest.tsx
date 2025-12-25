import { useState } from 'react';
import { GymCard } from './GymCard';
import { Button } from '../common/Button';
import type { Gym } from '../../types';

/**
 * Gym Card Test Page
 *
 * Interactive testing environment for the new image-based gym cards
 * - Test progressive lighting (0-3 stars)
 * - Preview grayscale → full color transition
 * - Adjust star count with buttons
 */
export function GymCardTest() {
  const [stars, setStars] = useState(0);

  // Test gym data (Fire Gym)
  const fireGym: Gym = {
    id: 'gym-01',
    name: 'Flame Badge',
    emoji: '🔥',
    imageUrl: '/images/gyms/fire-gym.png', // ← Your uploaded image
    theme: 'Fire',
    color: '#ef4444',
    miniGames: [],
    wordIds: [],
  };

  // Cycle through star states
  const incrementStars = () => {
    setStars((prev) => (prev >= 3 ? 0 : prev + 1));
  };

  const decrementStars = () => {
    setStars((prev) => (prev <= 0 ? 3 : prev - 1));
  };

  const getStateDescription = () => {
    switch (stars) {
      case 0:
        return 'Mostly grayed out (80% grayscale, 40% brightness, dark overlay)';
      case 1:
        return 'Starting to light up (60% grayscale, 70% brightness)';
      case 2:
        return 'Almost full color (30% grayscale, 90% brightness)';
      case 3:
        return 'Fully lit (Full color, 110% brightness, vibrant saturation, glow effect)';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">🔥 Gym Card Test</h1>
          <p className="text-gray-400">Testing progressive lighting effect with Fire Gym</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Card Preview */}
          <div className="space-y-6">
            <div className="card bg-gray-800/50 border-2 border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Card Preview</h2>

              {/* Gym Card */}
              <div className="max-w-sm mx-auto">
                <GymCard gym={fireGym} stars={stars} />
              </div>

              {/* Image Note */}
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  📁 <strong>Required:</strong> Upload <code className="bg-black/30 px-2 py-1 rounded">fire-gym.png</code> to{' '}
                  <code className="bg-black/30 px-2 py-1 rounded">public/images/gyms/</code>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Controls & Info */}
          <div className="space-y-6">
            {/* Star Controls */}
            <div className="card bg-gray-800/50 border-2 border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Star Controls</h2>

              {/* Current State */}
              <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold">Current Stars:</span>
                  <span className="text-4xl font-bold text-orange-400">{stars}/3</span>
                </div>
                <p className="text-gray-300 text-sm">{getStateDescription()}</p>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button variant="secondary" size="lg" onClick={decrementStars}>
                  ← Remove Star
                </Button>
                <Button variant="secondary" size="lg" onClick={incrementStars}>
                  Add Star →
                </Button>
              </div>

              {/* Quick Select */}
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => setStars(count)}
                    className={`p-3 rounded-lg font-bold transition-all ${
                      stars === count
                        ? 'bg-orange-500 text-white scale-105'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {count} ⭐
                  </button>
                ))}
              </div>
            </div>

            {/* Visual States Reference */}
            <div className="card bg-gray-800/50 border-2 border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Visual States</h2>

              <div className="space-y-3">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">0 Stars (Mostly Grayed Out)</span>
                    <span className="text-gray-400">☆ ☆ ☆</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">80% grayscale, 40% brightness, dark overlay</p>
                </div>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">1 Star (Starting to Light)</span>
                    <span className="text-orange-400">⭐ ☆ ☆</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">60% grayscale, 70% brightness</p>
                </div>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">2 Stars (Almost Full Color)</span>
                    <span className="text-orange-400">⭐ ⭐ ☆</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">30% grayscale, 90% brightness</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">3 Stars (Fully Lit!) ✨</span>
                    <span className="text-orange-400">⭐ ⭐ ⭐</span>
                  </div>
                  <p className="text-xs text-orange-200 mt-1">Full color, 110% brightness, vibrant, glow effect</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="card bg-blue-500/10 border-2 border-blue-500/30">
              <h2 className="text-xl font-bold text-blue-300 mb-3">📝 Testing Instructions</h2>
              <ol className="text-blue-200 text-sm space-y-2 list-decimal list-inside">
                <li>Upload <code className="bg-black/30 px-1 py-0.5 rounded">fire-gym.png</code> to <code className="bg-black/30 px-1 py-0.5 rounded">public/images/gyms/</code></li>
                <li>Click "Add Star" or "Remove Star" to see the lighting progression</li>
                <li>Hover over the card to see the glow effect</li>
                <li>Watch the smooth transition between states (700ms animation)</li>
                <li>Verify 3-star state has visible glow effect</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
