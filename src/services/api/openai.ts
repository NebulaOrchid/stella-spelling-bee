import type { TTSResponse, WhisperResponse } from '../../types';

/**
 * OpenAI API Service
 * Handles Whisper (speech-to-text) and TTS (text-to-speech)
 *
 * Note: API calls go through Vercel serverless functions for security
 * Never expose API keys in client-side code
 */
export class OpenAIService {
  private baseUrl: string;

  constructor() {
    // In production, this will be your Vercel deployment URL
    // In development, it points to local Vercel dev server
    this.baseUrl = import.meta.env.VITE_API_URL || '/api';
  }

  /**
   * Convert text to speech using OpenAI TTS
   * Returns URL to audio file
   */
  async textToSpeech(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova',
    speed: number = 1.0
  ): Promise<TTSResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          speed,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      return {
        audioUrl,
      };
    } catch (error) {
      console.error('Error calling TTS API:', error);
      throw error;
    }
  }

  /**
   * Convert speech to text using OpenAI Whisper
   * Accepts audio blob from microphone
   */
  async speechToText(audioBlob: Blob): Promise<WhisperResponse> {
    try {
      // Validate blob before sending
      console.log('[OPENAI SERVICE] Sending audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type,
      });

      if (audioBlob.size === 0) {
        throw new Error('Audio blob is empty');
      }

      const formData = new FormData();
      // Explicitly create a File with webm extension
      const audioFile = new File([audioBlob], 'recording.webm', {
        type: 'audio/webm',
      });
      formData.append('audio', audioFile);

      const response = await fetch(`${this.baseUrl}/whisper`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        text: data.text,
        confidence: data.confidence,
      };
    } catch (error) {
      console.error('Error calling Whisper API:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
