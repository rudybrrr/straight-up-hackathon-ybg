# Orgis

Orgis is a personal inbox triage app for fragmented communication. It is scoped to a few narrow things:

1. Import pasted text or uploaded text/JSON/CSV files.
2. Show a unified inbox.
3. Generate a concise AI summary for each message or thread.
4. Classify each item as `Act now`, `Review soon`, or `For later`.
5. Surface a simple digest at the top.
6. Optionally sync Beeper messages into MySQL for downstream processing.

It does not include chat, replies, tasks, calendars, team workspaces, auth, Supabase, notifications, or background jobs.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI components
- Vercel AI SDK
- Zod structured output
- mysql2

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

4. If you want Beeper syncing, add your Beeper and MySQL settings:

```bash
BEEPER_TOKEN=your_beeper_token
BEEPER_BASE_URL=http://localhost:23373/v1
MYSQL_URL=mysql://root:password@localhost:3306/orgis
```

You can also use the split MySQL fields shown in `.env.example` instead of `MYSQL_URL`.

5. Create the MySQL table:

Run the SQL in `sql/beeper-schema.sql` against your MySQL database using your preferred client or CLI.

6. Start the app:

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

## Beeper sync

The project includes a Beeper ingestion path for messages you want to store in MySQL:

- `POST /api/beeper/sync` polls only the latest message in each chat and inserts it into `beeper_messages` if it has not been seen before.
- `scripts/beeper-listener.ts` runs the same sync loop continuously for local or server-side use.
- Incoming messages are stored with metadata, the raw payload, sender info, and timestamps.
- Start the listener with `npm run beeper:listen`.
- The Beeper tables are created automatically the first time the sync runs.
- Each stored message is automatically sent to OpenAI and labeled `red`, `yellow`, or `green`.
- The basic live board is available at `/beeper`.

By default, self-sent messages are skipped. Set `BEEPER_STORE_SELF_MESSAGES=true` if you want those stored too.
Because this is polling-based, it watches for the newest message rather than backfilling full chat history.

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
- `components/` - UI primitives and Orgis dashboard components
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

If you enable Beeper syncing in production, run the listener script in a long-lived Node process or call the sync endpoint from a scheduler. The polling loop is not meant to live inside a serverless function.
