# Agent Rules — salar_CV

> **Important:** This is Next.js 15 App Router. APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Project
Personal website for Salar with an AI chatbot. See `PLAN.md` for the full MVP spec and `CLAUDE.MD` for architecture guidance.

## Rules
- All personal content (bio, skills, projects, experience) lives in `src/lib/content.ts` — never hardcode it in components or the API route
- Server Components by default; only add `'use client'` for state, effects, or browser APIs
- The chatbot system prompt is built at request-time from `content.ts` — do not introduce a vector DB or external knowledge store
- The OpenRouter key is in `.env.local` as `OPENROUTER_API_KEY` — never log or expose it client-side
- Tailwind design tokens (colours, spacing) are CSS custom properties in `globals.css`, not in `tailwind.config.ts`
