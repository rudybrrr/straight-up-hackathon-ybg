# Orgis

**The AI inbox that turns scattered messages into one priority queue.**

Orgis stands for **Organised Real-time Global Inbox System**. It is built for people whose important messages are split across WhatsApp, Telegram, Discord, Slack, email-style threads, and Beeper-supported apps. Instead of forcing users to open every app, scan every unread badge, and guess what matters, Orgis compiles incoming messages into a single dashboard, summarizes each one, explains the priority, and lets the user act from one place.

The core promise is simple:

> Stop managing apps. Start managing decisions.

## The Problem

Modern communication is fragmented. A student, founder, freelancer, organizer, or team lead can receive important asks from five different channels in the same hour:

- A client asks for a deck before a deadline.
- A family member sends something time-sensitive.
- A Discord group posts a noisy thread.
- A Slack channel drops a reminder.
- A Telegram chat shares something useful, but not urgent.

The real pain is not receiving messages. The pain is **deciding what deserves attention now**.

Current alternatives are weak:

- App notifications are noisy and platform-specific.
- Manual scanning wastes time and attention.
- Generic AI chatbots require copy-pasting and prompting.
- Simple wrappers summarize messages but do not create an action workflow.

Orgis reframes the challenge as a triage system: one queue, one priority model, one place to decide.

## Target Users

Orgis is designed for high-message-volume users who live across multiple communication tools:

- Students balancing school, clubs, friends, and family chats.
- Founders and freelancers juggling clients, collaborators, and personal messages.
- Community managers watching Discord, Telegram, Slack, and WhatsApp groups.
- Busy professionals who use Beeper or similar tools to centralize messaging.

The shared use case is clear: **"I need to know which message needs a reply first without opening every app."**

## What Orgis Does

Orgis turns raw messages into an operational inbox.

1. **Ingest**
   - Syncs recent messages from Beeper Desktop's local API.
   - Supports multiple source platforms through Beeper account metadata.
   - Includes parsing logic for text, JSON, and CSV-style message imports.

2. **Normalize**
   - Converts platform-specific messages into one shared inbox item shape.
   - Infers the source platform from account data.
   - Groups rapid multi-line sends into one burst so users see the conversation as a human would.

3. **Triage**
   - Uses OpenAI through the Vercel AI SDK for structured priority output.
   - Validates summaries, reasons, and labels with Zod schemas.
   - Falls back to deterministic local heuristics when no OpenAI key is configured.
   - Labels messages as red/yellow/green, mapped in the UI to Act now, Review soon, and For later.

4. **Act**
   - Shows a unified dashboard sorted by priority, pin state, and time.
   - Supports search, source filters, read/unread state, pinned messages, and clear-read flows.
   - Opens a detail drawer with the original message, summary, reason, reply box, and Beeper deep link.
   - Sends replies back through Beeper when configured.
   - Can notify the user when new red messages arrive.

## Why This Fits the Challenge

### Challenge-Solution Fit

Orgis directly solves the challenge of fragmented communication overload. The user is not trying to generate text; they are trying to recover attention. The product is targeted at people who already have too many channels and need a trusted "what should I handle first?" layer.

The solution is meaningful because it collapses a repeated daily workflow:

```text
Open app -> scan chats -> guess urgency -> switch app -> repeat
```

into:

```text
Open Orgis -> see priority queue -> reply or ignore
```

### Technological Execution

Orgis goes beyond a simple LLM wrapper. The system has a full ingestion, storage, triage, and action loop:

```text
Beeper Desktop API
  -> sync route or polling listener
  -> burst grouping and dedupe
  -> MySQL storage
  -> OpenAI structured triage or local fallback
  -> priority dashboard
  -> reply, pin, delete, notify
```

Key technical choices:

- **Next.js 15 App Router** for the product and API routes.
- **TypeScript** across the app.
- **Vercel AI SDK + OpenAI** for model calls.
- **Zod structured output** so triage is validated, not free-form.
- **MySQL via mysql2** for durable message state.
- **Beeper Desktop local API** for real multi-app message ingestion and replies.
- **Idempotent inserts** to avoid duplicating synced messages.
- **Chat state tracking** so polling only handles unseen messages.
- **Preference-aware triage** for "family always red" and "business always red" modes.
- **Heuristic fallback** so the demo still works without an API key.

This is a workflow system: data comes in, is normalized, classified, stored, displayed, and acted on.

### Product Thinking and UI/UX

The interface is built around the user's real decision path:

- **Priority view** for deciding what needs attention first.
- **New messages view** for quickly clearing unread items.
- **Source filters** for narrowing by WhatsApp, Telegram, Discord, Slack, Email, or Other.
- **Search** across sender, chat, summary, original content, reason, source, and priority.
- **Pinned messages** for anything the user must not lose.
- **Read/unread state** stored locally to support repeated daily use.
- **Message drawer** with the summary, priority reason, original content, reply composer, and Beeper open-link.
- **Red alerts** through browser notifications when high-priority messages arrive.

The UI does not ask users to understand AI. It gives them an inbox they already know how to use, but with better prioritization.

### Originality and Insight

Most AI inbox products focus on summarization. Orgis focuses on **attention routing**.

The core insight is that users do not need a chatbot inside every messaging app. They need a cross-platform control layer that answers:

- What is urgent?
- Why is it urgent?
- What can wait?
- Where should I reply?

Orgis also treats personal context as a product control. Family and business priority modes let users tune what "urgent" means for their life instead of accepting a one-size-fits-all model.

### Evidence of Real Demand

The demand behind Orgis comes from a visible, repeated behavior: people already manually triage messages across platforms every day. They mute chats, pin chats, forward messages to themselves, rely on notification badges, and still miss important asks.

For judging, this section should be backed with the team's remote-week evidence. Suggested validation table:

| Demand signal | What to record |
| --- | --- |
| User interviews | Number of people interviewed and the common pain they repeated |
| Survey result | Percent who check 3+ messaging apps daily |
| Time test | How long users take to find the most urgent message manually vs. with Orgis |
| Willingness signal | Who asked to keep using it, connect Beeper, or test on real messages |

Recommended interview prompt:

> "Show us the messages you checked today. Which ones did you need to reply to first, and how did you decide?"

Orgis is built to make that decision faster, clearer, and less stressful.

## Demo Flow

Use this path when presenting to judges:

1. Start the app and open the dashboard.
2. Run Beeper sync or the listener to pull recent messages.
3. Show messages sorted and filtered by Act now, Review soon, and For later.
4. Open a red message and point to the generated summary and reason.
5. Toggle family or business priority mode to show personalization.
6. Pin an important message.
7. Send a reply through the drawer.
8. Mark messages read, switch to New messages, and show how the inbox clears.

The story to tell:

> "Orgis does not just summarize messages. It decides what deserves attention, explains why, and lets the user act immediately."

## Current Feature Set

- Unified priority dashboard at `/`.
- Beeper-backed message ingestion through `POST /api/beeper/sync`.
- Continuous polling listener with `npm run beeper:listen`.
- MySQL-backed message, triage, pin, preference, and chat-state tables.
- Red/yellow/green AI triage with summaries and explanations.
- Deterministic fallback triage when `OPENAI_API_KEY` is missing.
- Burst grouping for rapid consecutive messages.
- Source detection for WhatsApp, Telegram, Discord, Email, and Other.
- Search, filters, read/unread tracking, pins, and clear-read deletion.
- Browser notifications for new red messages.
- Reply support through Beeper.
- Text/JSON/CSV parsing utilities and sample imports for demo data.

## What It Intentionally Does Not Do

Orgis stays focused on inbox triage.

- No calendar.
- No task management suite.
- No team workspace.
- No auth layer.
- No Supabase dependency.
- No websocket push layer.

Those are deliberate scope choices. The product is strongest when it stays focused on one job: helping users decide which message needs attention first.

## Tech Stack

- **Framework:** Next.js 15 App Router
- **Language:** TypeScript
- **UI:** React 19, Tailwind CSS, shadcn-style components, lucide-react icons
- **AI:** Vercel AI SDK, `@ai-sdk/openai`, Zod structured output
- **Database:** MySQL with `mysql2`
- **Messaging integration:** Beeper Desktop local API
- **Runtime scripts:** `tsx`

## Architecture

Important files:

- `app/page.tsx` - renders the main dashboard.
- `components/orgis/dashboard.tsx` - unified inbox UI, filters, sync polling, notifications, pins, read state.
- `components/orgis/message-drawer.tsx` - message details, explanation, original content, reply flow.
- `lib/beeper-sync.ts` - Beeper ingestion, burst grouping, dedupe, storage, and triage.
- `lib/beeper-triage.ts` - red/yellow/green priority logic, OpenAI structured output, fallback rules.
- `lib/beeper-board.ts` - dashboard query and priority grouping.
- `lib/beeper-schema.ts` - automatic MySQL table creation.
- `lib/import-parsers.ts` - text, JSON, and CSV import normalization.
- `app/api/beeper/*` - sync, board, reply, delete, pin, and preference APIs.
- `app/api/triage/route.ts` - structured triage endpoint for imported inbox items.

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```powershell
Copy-Item .env.example .env.local
```

Add an OpenAI key if you want model-backed triage:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

If `OPENAI_API_KEY` is missing, Orgis uses local heuristic triage so the app can still run.

## Beeper and MySQL Setup

For the full real-message workflow, configure Beeper and MySQL:

```bash
BEEPER_TOKEN=your_beeper_token
BEEPER_BASE_URL=http://localhost:23373/v1
BEEPER_CHAT_LIMIT=25
BEEPER_STORE_SELF_MESSAGES=false
BEEPER_POLL_INTERVAL_MS=2000

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=orgis
```

`MYSQL_URL` or `DATABASE_URL` can be used instead of the split MySQL fields.

The Beeper tables are created automatically when sync runs.

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run a one-time sync:

```powershell
Invoke-RestMethod -Method Post http://localhost:3000/api/beeper/sync
```

Or start continuous sync:

```bash
npm run beeper:listen
```

## Production

Build & start:

```bash
npm run build
npm start
```

If Beeper sync is used in production or a long-running demo, keep `npm run beeper:listen` running in a separate process or scheduler.

## Why Orgis Wins

Orgis is not trying to be another chat app. It is the decision layer above the chat apps users already have.

It has a clear target user, a painful daily workflow, a real integration path, a structured AI system, a usable inbox UI, and an original framing: **AI should not just answer messages; it should protect attention!**
