import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

const beeperTriageSchema = z.object({
  priorityColor: z.enum(["red", "yellow", "green"]),
  summary: z.string().trim().min(1).max(220),
  reason: z.string().trim().min(1).max(180)
});

export type BeeperTriageResult = z.infer<typeof beeperTriageSchema>;

export type BeeperTriageInput = {
  senderName: string;
  chatName: string;
  sourcePlatform: string;
  rawContent: string;
  timestamp: string;
};

const urgentSignals = [
  /\basap\b/i,
  /\burgent\b/i,
  /\bright away\b/i,
  /\bimmediately\b/i,
  /\btoday\b/i,
  /\bbefore (?:noon|lunch|eod|end of day|\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\b/i,
  /\bdeadline\b/i,
  /\bblocked\b/i,
  /\baction required\b/i,
  /\bneed you to\b/i,
  /\bcan you\b/i,
  /\bcould you\b/i,
  /\bplease (?:send|share|review|confirm|check|fix|update|book|pay|reply|handle|do)\b/i,
  /\bcan you\b/i,
  /\bcould you\b/i,
  /\bplease\b/i,
  /\bconfirm\b/i,
  /\bcan you please\b/i,
  /\bi need you to\b/i
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
  /\bfollow up\b/i,
  /\bsend\b/i
];

const lowPrioritySignals = [
  /\bfyi\b/i,
  /\bnewsletter\b/i,
  /\bannouncement\b/i,
  /\bdigest\b/i,
  /\brelease notes?\b/i,
  /\bno action\b/i,
  /\bfor reference\b/i,
  /\bwhen you have time\b/i,
  /\binformation only\b/i,
  /\bjust letting you know\b/i,
  /\bprofanity\b/i,
  /\babuse\b/i
];

const uselessInfoSignals = [/^[\p{L}]{1,12}$/u];

function normalizeContent(rawContent: string) {
  return rawContent.replace(/\s+/g, " ").trim();
}

function shorten(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

function fallbackTriage(input: BeeperTriageInput): BeeperTriageResult {
  const cleaned = normalizeContent(input.rawContent);
  const lead = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  const summary = shorten(lead.replace(/^(subject|body|message|content)\s*:\s*/i, ""), 180);

  let priorityColor: BeeperTriageResult["priorityColor"] = "yellow";
  if (cleaned.length <= 12 && uselessInfoSignals.some((pattern) => pattern.test(cleaned))) {
    priorityColor = "green";
  }
  if (lowPrioritySignals.some((pattern) => pattern.test(cleaned))) {
    priorityColor = "green";
  }
  if (reviewSignals.some((pattern) => pattern.test(cleaned))) {
    priorityColor = "yellow";
  }
  if (urgentSignals.some((pattern) => pattern.test(cleaned))) {
    priorityColor = "red";
  }

  const reasonByColor: Record<BeeperTriageResult["priorityColor"], string> = {
    red: "This looks time-sensitive or important enough to reply quickly.",
    yellow: "This matters, but it does not look urgent right now.",
    green: "This appears informational or low urgency, so it can wait."
  };

  return {
    priorityColor,
    summary: summary || "Incoming message.",
    reason: reasonByColor[priorityColor]
  };
}

function buildPrompt(input: BeeperTriageInput) {
  return [
    "Classify this message for reply urgency.",
    "Return only structured output that matches the schema.",
    "Do not write a reply.",
    "Use concise, human-readable language.",
    "Red means the sender is directly asking the receiver to do a task, or the message is urgent/time-sensitive/important enough to reply soon.",
    "Yellow means it is worth replying to, but it can wait a bit and does not require immediate action.",
    "Green means low urgency, informational, no action is needed, or the message is just meaningless, abusive, profane, or isolated language with no actionable request.",
    "Mark red when the sender asks the receiver to perform a task such as send, review, confirm, fix, update, book, pay, reply, handle, or do something.",
    "Do not mark red just because the message contains profanity, insults, or slurs unless there is also a direct task request or urgent action.",
    "",
    "Message:",
    JSON.stringify(input, null, 2)
  ].join("\n");
}

export async function triageBeeperMessage(input: BeeperTriageInput): Promise<BeeperTriageResult> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackTriage(input);
  }

  const modelName = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  try {
    const { output } = await generateText({
      model: openai(modelName),
      system:
        "You classify incoming messages by reply urgency. Be concise, deterministic, and conservative.",
      prompt: buildPrompt(input),
      output: Output.object({
        name: "BeeperPriority",
        description: "A red/yellow/green priority label with a short summary and reason.",
        schema: beeperTriageSchema
      }),
      temperature: 0,
      maxOutputTokens: 160
    });

    return beeperTriageSchema.parse(output);
  } catch {
    return fallbackTriage(input);
  }
}
