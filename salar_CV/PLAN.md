# Salar CV — Personal Website MVP Plan

## Goals
Build a visually striking personal website with a built-in AI chatbot that answers questions about Salar. The site should feel premium, load fast, and be easy to maintain.

---

## Tech Stack
| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 App Router | SSR, ISR, file-based routing |
| Styling | Tailwind CSS v4 | Utility-first, fast iteration |
| Language | TypeScript | Type safety |
| AI bot | OpenRouter API (key already in `.env`) | Access to frontier models; no separate Anthropic account needed |
| Animations | Framer Motion | Smooth, production-quality motion |
| Icons | Lucide React | Consistent, lightweight |
| Fonts | Geist (Sans + Mono) | Modern, legible, ships with Next.js |
| Deployment | Vercel | Zero-config Next.js hosting |

---

## File Structure
```
salar_CV/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout — fonts, metadata, nav, footer
│   │   ├── page.tsx            # Home page (hero + sections)
│   │   ├── globals.css         # Tailwind base + custom design tokens
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts    # POST /api/chat — streams AI responses
│   ├── components/
│   │   ├── Nav.tsx             # Sticky top nav with scroll-aware opacity
│   │   ├── Hero.tsx            # Full-viewport hero with animated headline
│   │   ├── About.tsx           # Short bio + photo
│   │   ├── Skills.tsx          # Animated skill/tech grid
│   │   ├── Projects.tsx        # Project cards with live/GitHub links
│   │   ├── Experience.tsx      # Timeline of roles
│   │   ├── Contact.tsx         # Email link + social icons
│   │   ├── ChatBot.tsx         # Floating chat UI (client component)
│   │   └── ChatMessage.tsx     # Individual message bubble
│   └── lib/
│       ├── content.ts          # All personal data (bio, skills, projects…)
│       └── openrouter.ts       # Typed OpenRouter streaming helper
├── public/
│   ├── avatar.jpg              # Profile photo
│   └── og-image.png            # Open Graph image for social sharing
├── .env.local                  # OPENROUTER_API_KEY (already exists as .env)
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Pages & Routes
| Route | Description |
|---|---|
| `/` | Single-page layout: Hero → About → Skills → Projects → Experience → Contact |
| `/api/chat` | Streaming POST endpoint; reads from `lib/content.ts` to build the system prompt |

The site is a single scrollable page (SPA feel) with anchor-based navigation — no multi-page routing needed for MVP.

---

## Sections Breakdown

### 1. Nav
- Sticky, glass-morphism background on scroll
- Logo / name on left, anchor links on right
- Mobile: hamburger → slide-down menu
- Dark/light toggle (optional stretch goal)

### 2. Hero
- Full-viewport height
- Large animated headline: `"Hi, I'm Salar"` with a typewriter or reveal effect
- Subtitle: one-line role description
- Two CTAs: `View Projects` (scroll) + `Chat with my AI` (opens chatbot)
- Subtle background: animated gradient mesh or particle field

### 3. About
- Two-column layout: photo left, bio right (stacks on mobile)
- 2–3 short paragraphs on who you are, what you do, what you care about
- Quick-stats row: years of experience, projects shipped, tech used

### 4. Skills
- Icon grid grouped by category (Languages, Frameworks, Tools, Cloud)
- Hover reveals skill name and confidence level
- Entry animation: stagger fade-in on scroll

### 5. Projects
- Card grid (2–3 columns)
- Each card: project name, short description, tech tags, screenshot/icon, GitHub + live links
- Featured project gets a wider card spanning full row

### 6. Experience
- Vertical timeline, alternating left/right on desktop
- Each entry: company, role, date range, 2–3 bullet achievements
- Animate entries into view on scroll

### 7. Contact
- Minimal section: one-liner CTA, email button, social icon row (GitHub, LinkedIn, Twitter/X)
- No backend form needed for MVP — mailto link is sufficient

### 8. AI Chatbot (Floating Widget)
- Fixed bottom-right button (chat bubble icon)
- Expands into a 380×520 px panel
- Streaming responses from `/api/chat`
- System prompt is built from `lib/content.ts` — the AI knows your bio, skills, projects, experience, and contact info
- Suggested starter questions shown before first message:
  - "What technologies do you work with?"
  - "Tell me about your experience"
  - "What projects have you built?"
- Conversation persists while page is open (React state)
- Model: `anthropic/claude-sonnet-4-5` via OpenRouter (can be swapped)

---

## AI Bot — `/api/chat` Design
```ts
// Pseudo-code
POST /api/chat
body: { messages: { role, content }[] }

system prompt = `
  You are an AI assistant for Salar's personal website.
  Answer questions about Salar based only on the following facts.
  Be friendly, concise, and professional.
  If asked something you don't know, say so.

  --- FACTS ---
  ${buildContextFromContent()}
`

→ stream response via OpenRouter chat completions (SSE)
→ return ReadableStream to client
```

The `buildContextFromContent()` function serialises `lib/content.ts` into plain text so the AI always has up-to-date info without a vector DB.

---

## Design System

### Palette (dark-first)
| Token | Value | Use |
|---|---|---|
| `background` | `#0a0a0f` | Page background |
| `surface` | `#111118` | Cards, panels |
| `border` | `#1e1e2e` | Subtle dividers |
| `accent` | `#7c6aff` | Primary purple — buttons, highlights |
| `accent-2` | `#00d4ff` | Cyan — gradient pair |
| `text` | `#e8e8f0` | Body text |
| `muted` | `#6b6b80` | Secondary text |

### Typography
- Headings: Geist Sans, bold, large tracking
- Body: Geist Sans, regular
- Code snippets: Geist Mono

### Motion
- Page-load: hero text fades + slides up (300ms)
- Scroll-triggered: sections animate in with Framer Motion `useInView`
- Chatbot open/close: spring animation
- Card hover: subtle lift + border glow

---

## Content File (`lib/content.ts`) — Shape
```ts
export const content = {
  name: "Salar",
  email: "Salar_@live.co.uk",
  role: "...",
  bio: "...",
  location: "...",
  skills: [{ category: "...", items: ["..."] }],
  projects: [{ name, description, tech, github, live }],
  experience: [{ company, role, start, end, bullets }],
  social: { github, linkedin, twitter },
}
```
All personal data lives here — the AI bot and every UI section pull from this single source of truth.

---

## Build Order (recommended implementation sequence)
1. `npx create-next-app@latest` — scaffold project with TypeScript + Tailwind
2. Populate `lib/content.ts` with real personal data
3. Build static sections: Hero → About → Skills → Projects → Experience → Contact
4. Wire up `/api/chat` route with OpenRouter streaming
5. Build `ChatBot.tsx` floating widget
6. Polish animations and mobile layout
7. Add `og-image.png` and metadata for social sharing
8. Deploy to Vercel

---

## Stretch Goals (post-MVP)
- Dark/light theme toggle
- Blog section (MDX-powered)
- Contact form with email delivery (Resend API)
- Project case-study detail pages
- Analytics (Vercel Analytics, free tier)
- CV/resume PDF download button
