# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important:** This is Next.js 15 App Router. APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Project

Personal website for Salar — a single scrollable page with an AI chatbot that answers questions about him. See `PLAN.md` for the full MVP specification.

## Commands

```bash
npm run dev        # start dev server (http://localhost:3000)
npm run build      # production build + type check
npm run lint       # ESLint
npm run test       # Vitest unit tests
npm run test:watch # tests in watch mode
```

Run a single test file:
```bash
npx vitest run src/lib/openrouter.test.ts
```

## Architecture

### Single source of truth
`src/lib/content.ts` holds all personal data (bio, skills, projects, experience, social links). Both the UI sections and the AI chatbot system prompt are derived from this file — never hardcode personal content in components.

### AI chatbot
- **Route:** `POST /api/chat` — streaming endpoint
- **Provider:** OpenRouter (`OPENROUTER_API_KEY` in `.env.local`)
- **Helper:** `src/lib/openrouter.ts` — typed streaming wrapper around the OpenRouter chat completions API
- The system prompt is built at request-time by serialising `content.ts` into plain text; no vector DB needed
- `ChatBot.tsx` is a `'use client'` floating widget; conversation lives in React state (not persisted)

### Component model
- Server Components by default; add `'use client'` only for state, effects, or browser APIs
- Sections render from `content.ts` props — they are pure presentational Server Components
- `ChatBot.tsx` and `Nav.tsx` (scroll-aware) are the only client components at MVP

### Routing
Single route (`/`) with anchor-based scroll navigation. No multi-page routing at MVP.

### Styling
Tailwind CSS v4 + Framer Motion. Design tokens (background, surface, accent colours) are defined as CSS custom properties in `globals.css`, not in `tailwind.config.ts`.

## Code conventions

- `@/` path alias for all imports from `src/`
- Utility/helper functions and their types go in `src/lib/`
- Add/extend tests in `src/lib/*.test.ts` when adding utility functions
- Fetch in Server Components with `next: { revalidate: N }` for ISR where applicable
