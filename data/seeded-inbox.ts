import type { InboxItem } from "@/types/orgis";

export const seededInbox: InboxItem[] = [
  {
    id: "seed-whatsapp-launch",
    source: "WhatsApp",
    sender: "Priya Nair",
    chatOrThreadName: "Client launch room",
    timestamp: "2026-04-18T09:12:00+08:00",
    rawContent: "The client moved the review earlier. Can you send the final deck before 11:30?",
    summary: "Priya moved the review earlier and wants the final deck before 11:30.",
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
    id: "seed-slack-launch-ops",
    source: "Slack",
    sender: "Ari Chen",
    chatOrThreadName: "#launch-ops",
    timestamp: "2026-04-18T10:14:00+08:00",
    rawContent: "Legal approved the copy. Please pin the launch note and post it at 12:00.",
    summary: "Ari confirmed approval and needs the launch note pinned and posted at noon.",
    priority: "act_now",
    reason: "It includes a concrete action and a same-day publish time.",
    messageCount: 7,
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
    id: "seed-slack-assets",
    source: "Slack",
    sender: "Growth Pod",
    chatOrThreadName: "#campaign-assets",
    timestamp: "2026-04-17T18:02:00+08:00",
    rawContent: "Need a quick approval on the thumbnail set before the scheduler starts at 3 tomorrow.",
    summary: "Growth needs a thumbnail approval before tomorrow afternoon's scheduler run.",
    priority: "review_soon",
    reason: "This matters soon, but it is not as urgent as the items due today.",
    messageCount: 3,
    isThread: true
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
    id: "seed-telegram-community",
    source: "Telegram",
    sender: "Community mods",
    chatOrThreadName: "Weekend planning",
    timestamp: "2026-04-16T07:00:00+08:00",
    rawContent: "Collected sticker pack ideas and volunteer shifts for the weekend drop. Review later when free.",
    summary: "The community team collected weekend ideas and volunteer coverage notes.",
    priority: "for_later",
    reason: "This is purely informational and can wait until later.",
    messageCount: 4,
    isThread: true
  }
];
