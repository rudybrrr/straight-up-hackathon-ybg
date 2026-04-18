import type { SourcePlatform } from "@/types/polyboard";

export type SampleImportKey = "whatsapp" | "telegram" | "discord" | "email";

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
    description: "Pasted text blocks with thread metadata.",
    content: `Source: WhatsApp
Sender: Priya Nair
Chat: Launch review
Timestamp: 2026-04-18 09:12 AM
Messages: 3
Content:
Can you send the latest deck before 11:30? The client moved the review earlier.

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
    description: "Structured JSON for quick import testing.",
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
    "sender": "Alex",
    "chatOrThreadName": "Shared links",
    "timestamp": "2026-04-17T21:15:00+08:00",
    "rawContent": "Sent the article on faster inbox triage. Worth a read when you have time.",
    "messageCount": 1,
    "isThread": false
  }
]`
  },
  {
    key: "discord",
    label: "Discord sample",
    source: "Discord",
    format: "csv",
    description: "CSV rows with raw content and thread flags.",
    content: `source,sender,chatOrThreadName,timestamp,messageCount,isThread,rawContent
Discord,Design Crew,#launch-studio,2026-04-18T07:52:00+08:00,4,true,"Need one more pass on the homepage copy before we freeze it."
Discord,Community Bot,#announcements,2026-04-17T19:30:00+08:00,1,false,"New patch notes are live. FYI only."`
  },
  {
    key: "email",
    label: "Email sample",
    source: "Email",
    format: "text",
    description: "Classic email blocks with subject and body.",
    content: `Source: Email
From: Orbit Billing
Subject: April invoice is available
Timestamp: 2026-04-18 06:25 AM
Body:
Your invoice is attached for this cycle. The renewal stays unchanged unless you update the plan.

---

Source: Email
From: Weekly Digest
Subject: Inbox research roundup
Timestamp: 2026-04-17 07:00 AM
Body:
A short roundup of productivity articles and release notes for the week.`
  }
];
