# Polyboard

Polyboard is a personal inbox triage app for fragmented communication. It is scoped to five things only:

1. Import pasted text or uploaded text/JSON/CSV files.
2. Show a unified inbox.
3. Generate a concise AI summary for each message or thread.
4. Classify each item as `Act now`, `Review soon`, or `For later`.
5. Surface a simple digest at the top.

It does not include chat, replies, tasks, calendars, team workspaces, auth, Supabase, notifications, or background jobs.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI components
- Vercel AI SDK
- Zod structured output

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
Copy-Item .env.example .env.local
```

3. Add your OpenAI key:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

If `OPENAI_API_KEY` is not set, the app falls back to local deterministic heuristics so you can still run the demo.

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supported imports

- Pasted raw text
- Uploaded `.txt`, `.json`, and `.csv` files
- Built-in sample imports for:
  - WhatsApp
  - Telegram
  - Discord
  - Email

## AI behavior

The `/api/triage` route uses the Vercel AI SDK with structured output and Zod. Each item returns:

- `summary`
- `priority`
- `reason`

The prompt is conservative by design:

- It does not invent deadlines, tasks, or events.
- It keeps summaries concise.
- It classifies vague content conservatively.
- It returns structured JSON only.

## Project structure

- `app/` - route handlers, layout, and the dashboard page
- `components/` - UI primitives and Polyboard dashboard components
- `data/` - seeded inbox data and sample imports
- `lib/` - parsing, triage, and display helpers
- `types/` - shared TypeScript types

## Run for production

```bash
npm run build
npm start
```

## Vercel

This app is ready to deploy on Vercel as-is. Add `OPENAI_API_KEY` in your Vercel project settings if you want live AI summarization and classification.
