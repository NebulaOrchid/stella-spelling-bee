# API Setup Guide

## Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (you won't be able to see it again!)
5. Add billing information if you haven't already

## Step 2: Add API Key to `.env` File

Open the `.env` file in the root directory and replace `your_api_key_here` with your actual API key:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** Never commit the `.env` file to git! It's already in `.gitignore`.

## Step 3: Set Up Vercel (for deployment)

### Option A: Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy your app:
```bash
vercel
```

3. Add your API key as an environment variable in Vercel:
   - Go to your project in the Vercel dashboard
   - Settings → Environment Variables
   - Add `OPENAI_API_KEY` with your key
   - Apply to all environments (Production, Preview, Development)

### Option B: Test Locally with Vercel Dev

1. Install Vercel CLI (if not already):
```bash
npm install -g vercel
```

2. Run local development server:
```bash
vercel dev
```

This will:
- Start a local Vercel development server
- Make your API routes available at `http://localhost:3000/api/*`
- Load environment variables from `.env`
- Simulate the production environment locally

## API Endpoints

### Text-to-Speech (TTS)

**Endpoint:** `POST /api/tts`

**Request Body:**
```json
{
  "text": "Hello world",
  "voice": "nova",
  "speed": 1.0
}
```

**Available Voices:**
- `alloy` - Neutral and balanced
- `echo` - Clear and direct
- `fable` - Warm and storytelling
- `onyx` - Deep and authoritative
- `nova` - Friendly and warm (recommended for kids)
- `shimmer` - Soft and gentle

**Response:** Audio file (audio/mpeg)

### Speech-to-Text (Whisper)

**Endpoint:** `POST /api/whisper`

**Request:** FormData with audio file
```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');
```

**Response:**
```json
{
  "text": "h e l l o",
  "duration": 2.5
}
```

## Testing the API

### Test with curl

**TTS:**
```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello Stella","voice":"nova"}' \
  --output test.mp3
```

**Whisper:**
```bash
curl -X POST http://localhost:3000/api/whisper \
  -F "audio=@recording.webm" \
  | jq
```

### Test in Browser Console

Open your app and run this in the console:

```javascript
// Test TTS
fetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello Stella',
    voice: 'nova'
  })
})
  .then(res => res.blob())
  .then(blob => {
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
  });
```

## Costs

OpenAI pricing (as of 2024):
- **Whisper**: $0.006 per minute of audio
- **TTS**: $15.00 per 1M characters (HD: $30.00)

For a typical spelling bee session:
- 20 words × 2 seconds TTS each = ~40 seconds = $0.004
- 20 words × 5 letters × 1 second each = ~100 seconds Whisper = $0.01
- **Total per session: ~$0.014 (about 1.4 cents)**

Very affordable for a kid's learning app!

## Troubleshooting

### "OPENAI_API_KEY is not set"
- Make sure `.env` file exists in the root directory
- Check that the variable is named exactly `OPENAI_API_KEY`
- Restart your dev server after adding the key

### "Invalid API key"
- Verify your API key is correct
- Check that you have billing set up in OpenAI
- Make sure you copied the entire key (starts with `sk-`)

### "Rate limit exceeded"
- You're making too many requests
- Add rate limiting to your API routes
- Upgrade your OpenAI plan if needed

### API not working in development
- Use `vercel dev` instead of `npm run dev` to test API routes locally
- Regular Vite dev server doesn't support serverless functions

### CORS errors
- API routes should work since they're on the same domain
- If issues persist, add CORS headers to the API responses

## Next Steps

Once your API is set up:
1. Test both endpoints locally
2. Build the voice recording component
3. Integrate TTS for word pronunciation
4. Test the full spelling loop
5. Deploy to Vercel

## Security Notes

- API keys are kept server-side in serverless functions
- Never expose `OPENAI_API_KEY` in client-side code
- The `.env` file is in `.gitignore` to prevent accidental commits
- Add rate limiting for production use
- Consider adding authentication for API endpoints
