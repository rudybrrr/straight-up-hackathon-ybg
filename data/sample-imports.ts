import type { SourcePlatform } from "@/types/orgis";

export type SampleImportKey = "whatsapp" | "telegram" | "discord" | "slack";

export interface SampleImport {
  key: SampleImportKey;
  label: string;
  source: SourcePlatform;
  format: "text" | "json" | "csv";
  description: string;
  content: string;
}

export const sampleImports: SampleImport[] = [
  {
    key: "whatsapp",
    label: "WhatsApp sample",
    source: "WhatsApp",
    format: "text",
    description: "Quick copied threads with sender, chat, and timing details.",
    content: `Source: WhatsApp
Sender: Priya Nair
Chat: Client launch room
Timestamp: 2026-04-18 09:12 AM
Messages: 3
Content:
The client moved the review earlier. Can you send the final deck before 11:30?

---

Source: WhatsApp
Sender: Daniel
Chat: Family group
Timestamp: 2026-04-17 08:44 PM
Messages: 5
Content:
Dinner is at 7. Sharing the cafe address here.`
  },
  {
    key: "telegram",
    label: "Telegram sample",
    source: "Telegram",
    format: "json",
    description: "Structured JSON for testing multi-thread imports.",
    content: `[
  {
    "source": "Telegram",
    "sender": "Mina",
    "chatOrThreadName": "Ops sync",
    "timestamp": "2026-04-18T08:41:00+08:00",
    "rawContent": "The vendor pushed the export file. Please check the report before the standup.",
    "messageCount": 2,
    "isThread": true
  },
  {
    "source": "Telegram",
    "sender": "Community mods",
    "chatOrThreadName": "Weekend planning",
    "timestamp": "2026-04-17T21:15:00+08:00",
    "rawContent": "Collected sticker pack ideas and volunteer shifts for the weekend drop. Review later when free.",
    "messageCount": 4,
    "isThread": true
  }
]`
  },
  {
    key: "discord",
    label: "Discord sample",
    source: "Discord",
    format: "csv",
    description: "CSV rows from channel exports with thread counts.",
    content: `source,sender,chatOrThreadName,timestamp,messageCount,isThread,rawContent
Discord,Design Crew,#launch-studio,2026-04-18T07:52:00+08:00,4,true,"Need one more pass on the homepage copy before we freeze it."
Discord,Community Bot,#announcements,2026-04-17T19:30:00+08:00,1,false,"New patch notes are live. FYI only."`
  },
  {
    key: "slack",
    label: "Slack sample",
    source: "Slack",
    format: "text",
    description: "Channel-style text blocks with app, sender, and channel metadata.",
    content: `App: Slack
Sender: Ari Chen
Channel: #launch-ops
Timestamp: 2026-04-18 10:14 AM
Messages: 7
Content:
Legal approved the copy. Please pin the launch note and post it at 12:00.

---

App: Slack
Sender: Growth Pod
Channel: #campaign-assets
Timestamp: 2026-04-17 06:42 PM
Messages: 3
Content:
Moodboard links are here for whenever you review the next batch.`
  }
];
