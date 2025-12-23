import { Howl } from 'howler';
import type { ISound, SoundEffect } from '../../types';

/**
 * Sound Manager using Howler.js
 * Handles word pronunciation and sound effects
 * Easy to swap/add sound packs later
 */
export class SoundManager implements ISound {
  private currentWordSound: Howl | null = null;
  private effectSounds: Map<SoundEffect, Howl> = new Map();
  private volume: number = 0.8;

  constructor() {
    this.preloadEffects();
  }

  /**
   * Preload common sound effects
   * In MVP, we'll use simple beep sounds or data URIs
   * Later can be replaced with custom sound packs
   */
  private preloadEffects(): void {
    // Load custom sound effects from public/sounds folder
    const effects: SoundEffect[] = ['correct', 'incorrect', 'celebration', 'click', 'whoosh'];

    effects.forEach((effect) => {
      const sound = new Howl({
        src: [`/sounds/${effect}.mp3`],
        volume: this.volume,
        preload: true,
        html5: true, // Better for mobile
        onload: () => {
          console.log(`[SOUND] ✅ Loaded: ${effect}.mp3`);
        },
        onloaderror: (_id, error) => {
          console.warn(`[SOUND] ⚠️ Could not load ${effect}.mp3:`, error);
        },
      });

      this.effectSounds.set(effect, sound);
    });
  }

  /**
   * Play word pronunciation from TTS audio URL
   */
  async playWord(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any currently playing word
      if (this.currentWordSound) {
        this.currentWordSound.stop();
        this.currentWordSound.unload();
      }

      this.currentWordSound = new Howl({
        src: [audioUrl],
        format: ['mp3'], // OpenAI TTS returns MP3 format
        volume: this.volume,
        html5: true,
        onend: () => resolve(),
        onload: () => {
          console.log('[SOUND] ✅ TTS audio loaded successfully');
        },
        onloaderror: (_, error) => {
          console.error('[SOUND] ❌ Error loading word audio:', error);
          reject(error);
        },
        onplayerror: (_, error) => {
          console.error('[SOUND] ❌ Error playing word audio:', error);
          reject(error);
        },
      });

      this.currentWordSound.play();
    });
  }

  /**
   * Play a sound effect
   */
  async playEffect(effectName: SoundEffect): Promise<void> {
    return new Promise((resolve) => {
      const sound = this.effectSounds.get(effectName);

      if (!sound) {
        console.warn(`[SOUND] Sound effect "${effectName}" not found`);
        resolve();
        return;
      }

      console.log(`[SOUND] 🔊 Playing: ${effectName}`);

      // Clone the sound to allow overlapping plays
      const soundId = sound.play();

      sound.once('end', () => {
        console.log(`[SOUND] ✅ Finished: ${effectName}`);
        resolve();
      }, soundId);

      sound.once('playerror', (_id, error) => {
        console.error(`[SOUND] ❌ Error playing ${effectName}:`, error);
        resolve();
      }, soundId);
    });
  }

  /**
   * Set global volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));

    // Update volume for all sounds
    if (this.currentWordSound) {
      this.currentWordSound.volume(this.volume);
    }

    this.effectSounds.forEach((sound) => {
      sound.volume(this.volume);
    });
  }

  /**
   * Stop all sounds
   */
  stop(): void {
    if (this.currentWordSound) {
      this.currentWordSound.stop();
    }

    this.effectSounds.forEach((sound) => {
      sound.stop();
    });
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
