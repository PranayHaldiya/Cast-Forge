# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

---

## CastForge — Instant AI Podcast Studio

### Product Overview

CastForge lets users type a topic, pick a show format, configure AI hosts, and generate a fully produced multi-voice podcast episode instantly.

### Architecture

- **Frontend**: React + Vite app at `/` (`artifacts/castforge`)
- **Backend**: Express API server (`artifacts/api-server`) at `/api`
- **Database**: PostgreSQL via Drizzle ORM — `episodes` table

### Key Features

1. **Home Page** (`/`) — Topic input, 6 format cards, 6 host preset cards, generate button
2. **Studio Page** (`/studio`) — SSE streaming progress during generation (script → voices → audio mixing)
3. **Library Page** (`/episodes`) — Grid of all produced episodes
4. **Episode Player** (`/episodes/:id`) — WaveSurfer.js waveform, playback controls, transcript

### AI Services

- **Script generation**: Google Gemini (`gemini-3-flash-preview`) via Replit AI integration — no user API key needed
- **Voice synthesis**: ElevenLabs (API key in `ELEVENLABS_API_KEY` secret)
- **Audio mixing**: FFmpeg (system binary)

### Show Formats

`comedy`, `debate`, `explainer`, `true_crime`, `hot_takes`, `interview`

### Host Presets

- Comedy Duo (Laugh icon) — Sam + Alex
- Debate Rivals (Swords icon) — Jordan + Taylor
- Crime Narrators (Search icon) — Morgan + Casey
- Explainer Experts (GraduationCap icon) — Dr. Rivera + Jamie
- Hot Takes Crew (Flame icon) — Blake + Quinn
- Interview Masters (Mic2 icon) — Diana + Marcus

### Important Files

- `artifacts/castforge/src/pages/home.tsx` — Main studio UI
- `artifacts/castforge/src/pages/studio.tsx` — SSE generation progress
- `artifacts/castforge/src/pages/library.tsx` — Episode library
- `artifacts/castforge/src/pages/episode.tsx` — Episode player with WaveSurfer
- `artifacts/castforge/src/components/layout/AppLayout.tsx` — Nav + layout
- `artifacts/api-server/src/routes/castforge/generate.ts` — SSE pipeline
- `artifacts/api-server/src/lib/elevenlabs.ts` — ElevenLabs fetch client
- `artifacts/api-server/src/lib/script-generator.ts` — Gemini script generation
- `artifacts/api-server/src/lib/audio-mixer.ts` — FFmpeg mixing
- `artifacts/api-server/src/routes/castforge/presets.ts` — Host presets
- `lib/db/src/schema/episodes.ts` — Episodes DB schema
- `lib/api-spec/openapi.yaml` — Full API contract

### Design System

- Dark near-black background (`hsl(240, 10%, 3.9%)`)
- Electric purple primary (`hsl(258, 90%, 66%)`)
- Warm amber accent (`hsl(38, 92%, 50%)`)
- No emojis anywhere — Lucide React icons throughout
- Framer Motion animations on all transitions
- Dark class applied via `document.documentElement.classList.add("dark")` in `main.tsx`

### Audio Storage

Generated audio files saved to `artifacts/api-server/uploads/castforge/` and served at `/api/castforge/audio/:filename`.
