import { z } from "zod";
import type { DraftInboxItem, InboxItem, Priority, TriageResponse } from "@/types/orgis";

export const triageResponseSchema = z.object({
  summary: z.string().trim().min(1).max(220),
  priority: z.enum(["act_now", "review_soon", "for_later"]),
  reason: z.string().trim().min(1).max(180)
});

export const triageRequestSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      source: z.enum(["WhatsApp", "Telegram", "Discord", "Email", "Other"]),
      sender: z.string().min(1),
      chatOrThreadName: z.string().min(1),
      timestamp: z.string().min(1),
      rawContent: z.string().min(1),
      messageCount: z.number().int().positive().optional(),
      isThread: z.boolean()
    })
  )
});

const urgentSignals = [
  /\basap\b/i,
  /\burgent\b/i,
  /\bright away\b/i,
  /\bimmediately\b/i,
  /\bbefore (?:noon|lunch|eod|end of day|\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\b/i,
  /\btoday\b/i,
  /\bmoved earlier\b/i,
  /\bdeadline\b/i,
  /\bblocked\b/i,
  /\bcan you (?:send|share|confirm|review)\b/i,
  /\bcould you (?:send|share|confirm|review)\b/i,
  /\bplease (?:send|share|confirm|review)\b/i,
  /\bneed you to\b/i,
  /\bneed this\b/i,
  /\bconfirm\b/i
];

const reviewSignals = [
  /\breview\b/i,
  /\bcheck\b/i,
  /\bupdate\b/i,
  /\bshared\b/i,
  /\binvoice\b/i,
  /\breminder\b/i,
  /\bquestion\b/i,
  /\bfeedback\b/i,
  /\bfollow up\b/i
];

const laterSignals = [
  /\bfyi\b/i,
  /\bnewsletter\b/i,
  /\bannouncement\b/i,
  /\bdigest\b/i,
  /\brelease notes?\b/i,
  /\bno action\b/i,
  /\bfor reference\b/i,
  /\bwhen you have time\b/i,
  /\blow priority\b/i,
  /\binformation only\b/i
];

function normalizeContent(rawContent: string) {
  return rawContent.replace(/\s+/g, " ").trim();
}

function shorten(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

export function fallbackTriage(item: DraftInboxItem): TriageResponse {
  const cleaned = normalizeContent(item.rawContent);
  const lead = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  const summary = shorten(lead.replace(/^(subject|body|message|content)\s*:\s*/i, ""), 180);

  let priority: Priority = "review_soon";
  if (laterSignals.some((pattern) => pattern.test(cleaned))) {
    priority = "for_later";
  }
  if (reviewSignals.some((pattern) => pattern.test(cleaned))) {
    priority = "review_soon";
  }
  if (urgentSignals.some((pattern) => pattern.test(cleaned))) {
    priority = "act_now";
  }

  const reasonByPriority: Record<Priority, string> = {
    act_now: "A direct ask or time-sensitive cue suggests immediate attention.",
    review_soon: "Important enough to check soon, but not urgent enough to interrupt now.",
    for_later: "This reads as informational or low urgency, so it can wait."
  };

  return {
    summary: summary || "Incoming message.",
    priority,
    reason: reasonByPriority[priority]
  };
}

export function buildTriagePrompt(item: DraftInboxItem) {
  return [
    "Classify this personal inbox item.",
    "You are not a chatbot. Do not write a reply.",
    "Return only structured output that matches the schema.",
    "Use concise, human-readable language.",
    "Do not invent deadlines, meetings, tasks, or events.",
    "If content is vague, classify conservatively.",
    "",
    "Priority rules:",
    "- act_now: urgent, time-sensitive, direct asks, or important updates that likely need immediate attention.",
    "- review_soon: relevant and important but not urgent.",
    "- for_later: informational, passive, or low urgency.",
    "",
    "Item:",
    JSON.stringify(item, null, 2)
  ].join("\n");
}

export function sanitizeTriageResponse(result: TriageResponse): TriageResponse {
  return {
    summary: shorten(result.summary.trim(), 220),
    priority: result.priority,
    reason: shorten(result.reason.trim(), 180)
  };
}

export function applyTriageResult(item: DraftInboxItem, triage: TriageResponse): InboxItem {
  return {
    ...item,
    ...sanitizeTriageResponse(triage)
  };
}
