import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { File as FormidableFile } from 'formidable';
import formidable from 'formidable';
import fs from 'fs';

/**
 * Vercel Serverless Function for Speech-to-Text using OpenAI Whisper
 *
 * POST /api/whisper
 * Body: FormData with 'audio' file
 * Returns: { text: string, confidence?: number }
 */

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB limit
    });

    const [fields, files] = await form.parse(req);

    // Get the audio file
    const audioFile = files.audio?.[0] as FormidableFile | undefined;

    if (!audioFile) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(audioFile.filepath);

    // DIAGNOSTIC LOGGING
    console.log('[WHISPER API] File info:', {
      originalFilename: audioFile.originalFilename,
      mimetype: audioFile.mimetype,
      size: audioFile.size,
      bufferLength: fileBuffer.length,
    });

    // Validate blob is not empty
    if (fileBuffer.length === 0) {
      console.error('[WHISPER API] Empty audio file received!');
      return res.status(400).json({ error: 'Empty audio file' });
    }

    // Create a File object for OpenAI with explicit webm extension
    const file = new File(
      [fileBuffer],
      'recording.webm', // Force .webm extension
      { type: 'audio/webm' } // Force audio/webm MIME type
    );

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey,
    });

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json', // Get more detailed response
    });

    // Clean up temp file
    fs.unlinkSync(audioFile.filepath);

    // Return transcription
    return res.status(200).json({
      text: transcription.text,
      // @ts-ignore - verbose_json includes duration
      duration: transcription.duration,
      // Note: Whisper doesn't provide confidence scores in the API
      // We can add word-level timestamps if needed in the future
    });
  } catch (error) {
    console.error('Whisper API Error:', error);

    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        error: error.message,
        type: error.type,
      });
    }

    // Generic error
    return res.status(500).json({
      error: 'Failed to transcribe audio',
    });
  }
}
