# Stella Spelling Bee

A voice-first spelling practice app for kids, powered by OpenAI Whisper and TTS.

## Features

- Voice-powered spelling recognition using OpenAI Whisper API
- Natural word pronunciation using OpenAI TTS
- Progressive Web App (PWA) - works offline and can be installed
- Built with scalability in mind for future gamification features

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with theme-ready CSS variables
- **APIs**: OpenAI Whisper (speech-to-text) + OpenAI TTS (text-to-speech)
- **Sound**: Howler.js for audio management
- **Hosting**: Vercel (frontend + serverless functions)
- **Storage**: localStorage (easy to swap to database later)

## Project Structure

```
src/
├── components/          # React components
│   ├── common/         # Reusable UI components
│   └── spelling/       # Spelling-specific components
├── services/           # External services & abstractions
│   ├── api/           # API clients (OpenAI)
│   ├── storage/       # Storage abstraction (localStorage)
│   └── sound/         # Sound management (Howler.js)
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── data/              # Static data (CSV files, etc.)
└── contexts/          # React contexts for state management
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_api_key_here
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Deploying to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add your `OPENAI_API_KEY` as an environment variable in the Vercel dashboard.

## Architecture Principles

- **Separation of Concerns**: UI components know nothing about storage or API calls
- **Abstract Storage**: Easy swap from localStorage to database
- **Abstract Sound**: Easy swap/add sound packs
- **Theme-Ready**: CSS variables for colors, easy theming later
- **Component Composition**: Small, reusable components for future features

## Future Enhancements

- Gamification: XP, levels, streaks, unlockables
- Custom themes and sound packs
- Animations using Framer Motion
- User accounts and cloud sync
- Parent dashboard for progress tracking
- Custom word lists

## License

MIT
