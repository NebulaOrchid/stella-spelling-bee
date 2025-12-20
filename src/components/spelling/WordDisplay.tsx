import { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { openAIService } from '../../services/api';
import { soundManager } from '../../services/sound';
import type { Word } from '../../types';

interface WordDisplayProps {
  word: Word;
  onPronunciationComplete?: () => void;
  onRequestDefinition?: () => Promise<void>;
  onRequestSentence?: () => Promise<void>;
}

export function WordDisplay({ word, onPronunciationComplete }: WordDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDefinition, setShowDefinition] = useState(false);
  const [showSentence, setShowSentence] = useState(false);
  const hasAutoPlayedRef = useRef<string | null>(null);

  // Auto-play word pronunciation when word changes
  useEffect(() => {
    // Only auto-play if we haven't already played this word
    if (hasAutoPlayedRef.current === word.id) {
      return;
    }

    const autoPlayWord = async () => {
      // Mark as played BEFORE starting
      hasAutoPlayedRef.current = word.id;

      try {
        setIsPlaying(true);
        const { audioUrl } = await openAIService.textToSpeech(word.word, 'nova', 1.0);
        await soundManager.playWord(audioUrl);
      } catch (error) {
        console.error('Error speaking word:', error);
      } finally {
        setIsPlaying(false);

        // Notify parent that pronunciation is complete
        if (onPronunciationComplete) {
          onPronunciationComplete();
        }
      }
    };

    autoPlayWord();
  }, [word.id]); // Only depend on word.id

  const speakWord = async () => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      const { audioUrl } = await openAIService.textToSpeech(word.word, 'nova', 1.0);
      await soundManager.playWord(audioUrl);
    } catch (error) {
      console.error('Error speaking word:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const speakDefinition = async () => {
    if (!word.definition || isPlaying) return;

    try {
      setIsPlaying(true);
      const text = `${word.word}. ${word.definition}`;
      const { audioUrl } = await openAIService.textToSpeech(text, 'nova', 1.0);
      await soundManager.playWord(audioUrl);
    } catch (error) {
      console.error('Error speaking definition:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const speakSentence = async () => {
    if (!word.sentence || isPlaying) return;

    try {
      setIsPlaying(true);
      const { audioUrl} = await openAIService.textToSpeech(word.sentence, 'nova', 1.0);
      await soundManager.playWord(audioUrl);
    } catch (error) {
      console.error('Error speaking sentence:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="card space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-text-muted mb-4">
          {isPlaying ? 'Listen carefully...' : 'Spell this word:'}
        </h2>

        <button
          onClick={speakWord}
          disabled={isPlaying}
          className="group relative"
        >
          <div className="text-8xl mb-4 transition-transform group-hover:scale-110 group-active:scale-95">
            {isPlaying ? '🔊' : '🎤'}
          </div>
          <p className="text-lg text-text-muted">
            {isPlaying ? 'Playing...' : 'Click to hear again'}
          </p>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setShowDefinition(!showDefinition);
            if (!showDefinition) speakDefinition();
          }}
          disabled={!word.definition || isPlaying}
        >
          {showDefinition ? 'Hide' : 'Show'} Definition
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setShowSentence(!showSentence);
            if (!showSentence) speakSentence();
          }}
          disabled={!word.sentence || isPlaying}
        >
          {showSentence ? 'Hide' : 'Show'} Example
        </Button>
      </div>

      {showDefinition && word.definition && (
        <div className="p-4 bg-accent/10 rounded-lg border-2 border-accent">
          <p className="text-sm font-semibold text-accent mb-1">Definition:</p>
          <p className="text-text">{word.definition}</p>
        </div>
      )}

      {showSentence && word.sentence && (
        <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
          <p className="text-sm font-semibold text-primary mb-1">Example Sentence:</p>
          <p className="text-text">{word.sentence}</p>
        </div>
      )}
    </div>
  );
}
