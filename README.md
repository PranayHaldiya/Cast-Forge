# CastForge

An instant AI podcast studio. Type a topic (or paste any URL), pick a show format, cast your AI hosts, and get a fully produced multi-voice podcast episode — script, voices, sound effects, and mastered audio — in about 60 seconds.

<img width="1654" height="1312" alt="Screenshot 2026-04-07 181256" src="https://github.com/user-attachments/assets/88aaca0a-11f3-4969-949b-abeb37fa35fc" />


## Features

- **Topic or URL** — type a subject or paste any article URL; the app extracts the topic automatically
- **Six show formats** — Comedy Roast, Fierce Debate, Deep Explainer, True Crime, Hot Takes, Expert Interview
- **Six host presets** — preconfigured personality pairs (Comedy Duo, Debate Rivals, Crime Narrators, Explainer Experts, Hot Takes Crew, Interview Masters)
- **AI script generation** — Gemini writes a punchy multi-voice dialogue with emotion direction
- **Voice synthesis** — ElevenLabs generates distinct voices per host, stitched sequentially
- **Sound design** — contextual sound effects + intro/outro music mixed with FFmpeg
- **Live progress stream** — real-time SSE updates from script → voices → recording → mastering
- **Episode library** — browse, play, download, and delete all produced episodes
- **WaveSurfer player** — waveform visualization, playback controls, speed adjustment, transcript

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL + Drizzle ORM |
| AI — Script | Google Gemini (`gemini-3-flash-preview`) via Replit AI |
| AI — Voices | ElevenLabs Voice Design + TTS Flash |
| Audio mixing | FFmpeg |
| API contract | OpenAPI 3 → Orval codegen (React Query hooks + Zod schemas) |
| Monorepo | pnpm workspaces |

## Project Structure

```
artifacts/
  castforge/          React + Vite frontend
  api-server/         Express API backend
lib/
  api-spec/           OpenAPI spec (source of truth)
  api-client-react/   Generated React Query hooks
  api-zod/            Generated Zod validators
  db/                 Drizzle schema + client
```

## Getting Started

Prerequisites: Node.js 24, pnpm, PostgreSQL, FFmpeg, an ElevenLabs API key.

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Set secrets
# ELEVENLABS_API_KEY — your ElevenLabs API key
# SESSION_SECRET     — any random string

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (separate terminal)
pnpm --filter @workspace/castforge run dev
```

After starting both servers, open the frontend URL in your browser.

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/castforge/fetch-url` | Extract a podcast topic from any URL |
| `POST` | `/api/castforge/generate` | Generate an episode (SSE stream) |
| `GET` | `/api/castforge/episodes` | List all episodes |
| `GET` | `/api/castforge/episodes/:id` | Get a single episode |
| `DELETE` | `/api/castforge/episodes/:id` | Delete an episode |
| `GET` | `/api/castforge/presets` | List host presets |
| `POST` | `/api/castforge/voices/preview` | Preview a voice from a description |
| `POST` | `/api/castforge/voices/save` | Save a voice to the library |

The full contract lives in `lib/api-spec/openapi.yaml`. Run `pnpm --filter @workspace/api-spec run codegen` after any spec change to regenerate the client hooks and Zod schemas.

## Generation Pipeline

1. **Voices** — ElevenLabs Voice Design creates a unique voice per host from their personality description
2. **Script** — Gemini writes a dialogue with bracketed emotion markers (`[excited]`, `[laughing]`, etc.)
3. **Recording** — each script line is synthesised via ElevenLabs TTS sequentially; emotion markers are stripped before synthesis but kept in the stored transcript
4. **Stitching** — FFmpeg concatenates all audio buffers into a single track
5. **Mastering** — FFmpeg wraps the dialogue with intro and outro music

Audio files are saved to `artifacts/api-server/uploads/castforge/` and served at `/api/castforge/audio/:filename`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key for voice generation |
| `SESSION_SECRET` | Yes | Secret for session signing |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | Auto | Set by the runtime per service |

## Design

Control Room Noir aesthetic — warm near-black background, amber-gold primary, on-air red accent. Bebas Neue for display headings, Syne for UI copy, JetBrains Mono for labels and technical text. Scan-line texture overlay, animated VU meter, framer-motion stagger reveals.
