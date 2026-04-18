import type { DraftInboxItem, SourcePlatform } from "@/types/polyboard";

const platformLookup: Record<string, SourcePlatform> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  discord: "Discord",
  email: "Email"
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `pb_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeSource(value: unknown): SourcePlatform {
  const text = String(value ?? "").trim().toLowerCase();
  if (text in platformLookup) {
    return platformLookup[text];
  }

  return "Other";
}

function normalizeBoolean(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) {
    return undefined;
  }

  if (["true", "yes", "1", "y"].includes(text)) {
    return true;
  }

  if (["false", "no", "0", "n"].includes(text)) {
    return false;
  }

  return undefined;
}

function normalizeCount(value: unknown) {
  const count = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(count) && count > 0 ? count : undefined;
}

function normalizeTimestamp(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) {
    return new Date().toISOString();
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return text;
}

function normalizeString(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function getField(input: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (key in input) {
      return input[key];
    }
  }

  return undefined;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function looksLikeCsv(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return false;
  }

  return lines[0].includes(",") && lines[1].includes(",");
}

function parseCsv(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function parseJson(content: string) {
  const parsed = JSON.parse(content);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === "object") {
    if (Array.isArray((parsed as { items?: unknown[] }).items)) {
      return (parsed as { items: unknown[] }).items;
    }

    if (Array.isArray((parsed as { messages?: unknown[] }).messages)) {
      return (parsed as { messages: unknown[] }).messages;
    }
  }

  return [parsed];
}

function parseTextBlocks(content: string) {
  return content
    .split(/\n\s*---+\s*\n|\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function parseMetadataBlock(block: string) {
  const lines = block.split(/\r?\n/);
  const metadata: Record<string, string> = {};
  const bodyLines: string[] = [];
  let readingBody = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (readingBody) {
        bodyLines.push("");
      }
      continue;
    }

    if (readingBody) {
      bodyLines.push(trimmed);
      continue;
    }

    const bodyLabel = trimmed.match(/^(content|body|message|raw content)\s*:\s*(.*)$/i);
    if (bodyLabel) {
      readingBody = true;
      if (bodyLabel[2]) {
        bodyLines.push(bodyLabel[2]);
      }
      continue;
    }

    const metadataMatch = trimmed.match(/^(source|platform|sender|from|chat|thread|subject|timestamp|date|messages|message count|count|is thread|isthread)\s*:\s*(.*)$/i);
    if (metadataMatch) {
      metadata[metadataMatch[1].toLowerCase()] = metadataMatch[2];
      continue;
    }

    if (!metadata.source) {
      const inferred = platformLookup[trimmed.toLowerCase()];
      if (inferred) {
        metadata.source = inferred;
        continue;
      }
    }

    bodyLines.push(trimmed);
  }

  return { metadata, body: bodyLines.join("\n").trim() };
}

function toDraftInboxItem(input: Record<string, unknown>, fallbackContent: string): DraftInboxItem {
  let source = normalizeSource(getField(input, "source", "platform"));
  const hasEmailCues = Boolean(getField(input, "from", "subject", "body"));
  if (source === "Other" && hasEmailCues) {
    source = "Email";
  }
  const sender = normalizeString(getField(input, "sender", "from"), "Unknown sender");
  const chatOrThreadName = normalizeString(
    getField(
      input,
      "chatOrThreadName",
      "chat",
      "thread",
      "subject",
      "chatorthreadname"
    ),
    source === "Email" ? "Email thread" : `${source} thread`
  );
  const timestamp = normalizeTimestamp(getField(input, "timestamp", "date"));
  const rawContent = normalizeString(
    getField(input, "rawContent", "content", "body", "message", "rawcontent"),
    fallbackContent
  );
  const messageCount = normalizeCount(
    getField(input, "messageCount", "message count", "messagecount", "count")
  );
  const inferredThread = normalizeBoolean(getField(input, "isThread", "is thread", "isthread", "threaded"));

  return {
    id: createId(),
    source,
    sender,
    chatOrThreadName,
    timestamp,
    rawContent,
    messageCount,
    isThread: inferredThread ?? (messageCount ? messageCount > 1 : false)
  };
}

function normalizeObject(input: unknown, fallbackContent: string): DraftInboxItem | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

    return toDraftInboxItem(input as Record<string, unknown>, fallbackContent);
  }

export function parseImportedContent(content: string, fileName?: string): DraftInboxItem[] {
  const trimmed = content.trim();
  if (!trimmed) {
    return [];
  }

  const extension = fileName?.split(".").pop()?.toLowerCase();

  if (extension === "json" || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return parseJson(trimmed)
        .map((entry) => normalizeObject(entry, trimmed))
        .filter((item): item is DraftInboxItem => Boolean(item));
    } catch {
      // Fall through to other parsers.
    }
  }

  if (extension === "csv" || looksLikeCsv(trimmed)) {
    try {
      return parseCsv(trimmed).map((row) => {
        const normalizedRow: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
          normalizedRow[key] = value;
        }

        return toDraftInboxItem(normalizedRow, trimmed);
      });
    } catch {
      // Fall through to text parsing.
    }
  }

  return parseTextBlocks(trimmed).map((block) => {
    const { metadata, body } = parseMetadataBlock(block);
    const source = metadata.source ?? metadata.platform;
    const sender = metadata.sender ?? metadata.from;
    const chat = metadata.chat ?? metadata.thread ?? metadata.subject;

    return toDraftInboxItem(
      {
        source,
        sender,
        chatOrThreadName: chat,
        timestamp: metadata.timestamp ?? metadata.date,
        messageCount: metadata.messages ?? metadata["message count"] ?? metadata.count,
        isThread: metadata["is thread"] ?? metadata.isthread,
        rawContent: body || block
      },
      body || block
    );
  });
}
