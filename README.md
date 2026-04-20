# Orgis

Orgis is a local-first inbox triage app for fragmented communication.

## What it does

- Imports pasted text or uploaded `.txt`, `.json`, and `.csv` files.
- Shows a unified inbox on `/`.
- Generates concise summaries and priorities for inbox items.
- Supports Slack, WhatsApp, Telegram, Discord, Email, and other text-based imports.
- Can sync Beeper messages into MySQL, triage them with OpenAI, and store `red`, `yellow`, or `green` labels.
- Lets you reply to Beeper chats and delete stored Beeper rows from the dashboard.

## What it does not do

- No calendar
- No task management
- No team workspace
- No auth
- No Supabase
- No websocket push layer

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI components
- Vercel AI SDK
- Zod structured output
- MySQL via `mysql2`

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create your local env file.

```bash
Copy-Item .env.example .env.local
```

3. Add your OpenAI key.

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

If `OPENAI_API_KEY` is missing, the app falls back to local heuristics for triage.

4. If you want Beeper sync, add the Beeper and MySQL settings.

```bash
BEEPER_TOKEN=your_beeper_token
BEEPER_BASE_URL=http://localhost:23373/v1
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=orgis
```

`MYSQL_URL` is optional. You can use it instead of the split MySQL fields if you prefer.

5. Start the app.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Beeper sync

Orgis includes a Beeper ingestion path:

- `POST /api/beeper/sync` polls Beeper and stores only unseen recent messages.
- `scripts/beeper-listener.ts` runs the same sync loop continuously.
- New messages are saved to MySQL, then triaged into `red`, `yellow`, or `green`.
- Burst typing is grouped so rapid multi-line sends can be triaged together.
- Self-sent messages are skipped by default unless `BEEPER_STORE_SELF_MESSAGES=true`.

Run the listener with:

```bash
npm run beeper:listen
```

The Beeper tables are created automatically the first time the sync runs.

## Main UI

The main dashboard is the homepage at `/`.

It includes:

- inbox digest
- priority filters
- source filters
- read/unread state
- Beeper reply and delete actions in the message drawer

## Project structure

- `app/` - routes and API handlers
- `components/` - UI components
- `data/` - sample inbox data
- `lib/` - parsing, triage, Beeper sync, and MySQL helpers
- `types/` - shared TypeScript types

## Production

```bash
npm run build
npm start
```

## Notes

- `/origins` redirects to `/`.
- The old `/beeper` page was removed; the Beeper data now lives inside the main dashboard flow.
- If you run Beeper sync in production, keep the listener in a long-lived Node process or scheduler.
