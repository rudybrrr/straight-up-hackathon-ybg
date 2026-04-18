import type { InboxItem } from "@/types/polyboard";

export const seededInbox: InboxItem[] = [
  {
    id: "seed-whatsapp-launch",
    source: "WhatsApp",
    sender: "Priya Nair",
    chatOrThreadName: "Launch review",
    timestamp: "2026-04-18T09:12:00+08:00",
    rawContent: "Can you send the latest deck before 11:30? The client moved the review earlier.",
    summary: "Priya moved the launch review earlier and wants the latest deck before 11:30.",
    priority: "act_now",
    reason: "A direct ask with a near-term time makes this urgent.",
    messageCount: 3,
    isThread: true
  },
  {
    id: "seed-telegram-ops",
    source: "Telegram",
    sender: "Mina",
    chatOrThreadName: "Ops sync",
    timestamp: "2026-04-18T08:41:00+08:00",
    rawContent: "The vendor pushed the export file. Please check the report before the standup.",
    summary: "The vendor sent an export file and the report needs a quick check before standup.",
    priority: "act_now",
    reason: "It asks for a specific check before an upcoming meeting.",
    messageCount: 2,
    isThread: true
  },
  {
    id: "seed-discord-feedback",
    source: "Discord",
    sender: "Design Crew",
    chatOrThreadName: "#launch-studio",
    timestamp: "2026-04-17T21:15:00+08:00",
    rawContent: "Need one more pass on the homepage copy before we freeze it.",
    summary: "The homepage copy needs one more review before the freeze.",
    priority: "review_soon",
    reason: "Important for the launch, but it is not framed as a crisis.",
    messageCount: 4,
    isThread: true
  },
  {
    id: "seed-email-billing",
    source: "Email",
    sender: "Orbit Billing",
    chatOrThreadName: "April invoice",
    timestamp: "2026-04-17T18:02:00+08:00",
    rawContent: "Your invoice is ready for this cycle. The renewal stays unchanged unless you update the plan.",
    summary: "Orbit sent this cycle’s invoice and renewal notice.",
    priority: "review_soon",
    reason: "It is relevant account information, but no immediate response is required.",
    messageCount: 1,
    isThread: false
  },
  {
    id: "seed-whatsapp-family",
    source: "WhatsApp",
    sender: "Daniel",
    chatOrThreadName: "Family group",
    timestamp: "2026-04-17T20:44:00+08:00",
    rawContent: "Dinner is at 7. Sharing the cafe address here.",
    summary: "Dinner time and the cafe address were shared for later reference.",
    priority: "for_later",
    reason: "This is informational and does not appear to need action.",
    messageCount: 5,
    isThread: true
  },
  {
    id: "seed-email-newsletter",
    source: "Email",
    sender: "Weekly Digest",
    chatOrThreadName: "Product round-up",
    timestamp: "2026-04-16T07:00:00+08:00",
    rawContent: "A short roundup of productivity articles and release notes for the week.",
    summary: "A weekly roundup of articles and release notes.",
    priority: "for_later",
    reason: "This is purely informational and can wait until later.",
    messageCount: 1,
    isThread: false
  }
];

