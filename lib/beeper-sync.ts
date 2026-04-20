import { getMysqlPool } from "@/lib/mysql";
import { ensureBeeperSchema } from "@/lib/beeper-schema";
import { triageBeeperMessage } from "@/lib/beeper-triage";

type BeeperChat = {
  id: string;
  name?: string;
  accountID?: string;
  accountId?: string;
  [key: string]: unknown;
};

type BeeperMessage = {
  id: string;
  timestamp?: string;
  senderName?: string;
  isSender?: boolean;
  text?: string;
  body?: string;
  content?: string;
  rawContent?: string;
  [key: string]: unknown;
};

type BeeperListResponse<T> = {
  items?: T[];
  [key: string]: unknown;
};

type BeeperChatState = {
  beeperChatId: string;
  lastMessageId: string | null;
  lastMessageTimestamp: string | null;
};

type BeeperBurstMessage = {
  id: string;
  timestamp: string;
  senderName: string;
  isSender: boolean;
  text: string;
};

export type SyncedBeeperMessage = {
  beeperMessageId: string;
  beeperChatId: string;
  accountId: string;
  sourcePlatform: string;
  chatName: string;
  senderName: string;
  messageTimestamp: string;
  rawContent: string;
  isSender: boolean;
  payloadJson: string;
};

type StoredBeeperTriage = {
  beeperMessageId: string;
  priorityColor: "red" | "yellow" | "green";
  summary: string;
  reason: string;
  modelName: string | null;
};

export type BeeperSyncResult = {
  chatsScanned: number;
  messagesFetched: number;
  messagesStored: number;
  messagesSkipped: number;
};

function getBeeperConfig() {
  const token = process.env.BEEPER_TOKEN;
  const baseUrl = process.env.BEEPER_BASE_URL ?? "http://localhost:23373/v1";
  const chatLimit = Number(process.env.BEEPER_CHAT_LIMIT ?? 25);
  const storeSelfMessages = process.env.BEEPER_STORE_SELF_MESSAGES === "true";

  if (!token) {
    throw new Error("Missing BEEPER_TOKEN.");
  }

  return {
    token,
    baseUrl,
    chatLimit,
    storeSelfMessages
  };
}

function inferSourcePlatform(accountId: string) {
  const lower = accountId.toLowerCase();
  if (lower.includes("discord")) return "Discord";
  if (lower.includes("telegram")) return "Telegram";
  if (lower.includes("whatsapp")) return "WhatsApp";
  if (lower.includes("email")) return "Email";
  return "Other";
}

function pickMessageText(message: BeeperMessage) {
  const text = message.text ?? message.body ?? message.content ?? message.rawContent ?? "";
  return String(text).trim();
}

function normalizeBurstText(text: string) {
  return text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function toSqlDateTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  }

  return date.toISOString().slice(0, 19).replace("T", " ");
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "Could not serialize payload." });
  }
}

async function beeperFetch<T>(baseUrl: string, token: string, endpoint: string) {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });
  } catch {
    throw new Error(`Unable to connect to Beeper at ${baseUrl}. Is Beeper Desktop running?`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: check BEEPER_TOKEN.");
    }

    throw new Error(`Beeper HTTP error ${response.status} for ${endpoint}`);
  }

  return (await response.json()) as T;
}

function buildStoredMessage(chat: BeeperChat, message: BeeperMessage): SyncedBeeperMessage | null {
  const accountId = String(chat.accountID ?? chat.accountId ?? "").trim();
  const chatName = String(chat.name ?? "Private Chat").trim();
  const senderName = String(message.senderName ?? "Someone").trim();
  const rawContent = pickMessageText(message);
  const timestamp = String(message.timestamp ?? "").trim();

  if (!message.id || !accountId || !timestamp) {
    return null;
  }

  return {
    beeperMessageId: String(message.id),
    beeperChatId: String(chat.id),
    accountId,
    sourcePlatform: inferSourcePlatform(accountId),
    chatName: chatName || "Private Chat",
    senderName: senderName || "Someone",
    messageTimestamp: toSqlDateTime(timestamp),
    rawContent: rawContent || "[Media/Attachment]",
    isSender: Boolean(message.isSender),
    payloadJson: safeJson({ chat, message })
  };
}

function buildBurstStoredMessage(
  chat: BeeperChat,
  burst: BeeperBurstMessage[]
): SyncedBeeperMessage | null {
  const first = burst[0];
  const last = burst[burst.length - 1];

  if (!first || !last) {
    return null;
  }

  const accountId = String(chat.accountID ?? chat.accountId ?? "").trim();
  const chatName = String(chat.name ?? "Private Chat").trim();
  const senderName = String(first.senderName ?? "Someone").trim();
  const rawContent = normalizeBurstText(
    burst
      .map((entry) => entry.text)
      .filter(Boolean)
      .join("\n")
  );

  if (!first.id || !accountId || !first.timestamp) {
    return null;
  }

  return {
    beeperMessageId: String(last.id),
    beeperChatId: String(chat.id),
    accountId,
    sourcePlatform: inferSourcePlatform(accountId),
    chatName: chatName || "Private Chat",
    senderName: senderName || "Someone",
    messageTimestamp: toSqlDateTime(last.timestamp),
    rawContent: rawContent || "[Media/Attachment]",
    isSender: Boolean(first.isSender),
    payloadJson: safeJson({
      chat,
      burst
    })
  };
}

function messageFromApi(chat: BeeperChat, message: BeeperMessage): BeeperBurstMessage | null {
  const rawContent = pickMessageText(message);
  const timestamp = String(message.timestamp ?? "").trim();
  const senderName = String(message.senderName ?? "Someone").trim();

  if (!message.id || !timestamp) {
    return null;
  }

  return {
    id: String(message.id),
    timestamp,
    senderName: senderName || "Someone",
    isSender: Boolean(message.isSender),
    text: rawContent || "[Media/Attachment]"
  };
}

function collectNewMessages(messages: BeeperMessage[], lastMessageId: string | null) {
  const newestFirst = [...messages];
  const lastSeenIndex = lastMessageId
    ? newestFirst.findIndex((message) => String(message.id) === lastMessageId)
    : -1;

  const unseenNewestFirst = lastSeenIndex >= 0 ? newestFirst.slice(0, lastSeenIndex) : newestFirst;
  return unseenNewestFirst.reverse();
}

function groupBurstMessages(messages: BeeperBurstMessage[], gapMs = 15000) {
  const bursts: BeeperBurstMessage[][] = [];
  let currentBurst: BeeperBurstMessage[] = [];

  for (const message of messages) {
    if (currentBurst.length === 0) {
      currentBurst = [message];
      continue;
    }

    const previous = currentBurst[currentBurst.length - 1];
    const previousTime = new Date(previous.timestamp).getTime();
    const currentTime = new Date(message.timestamp).getTime();
    const sameSender = previous.senderName === message.senderName && previous.isSender === message.isSender;
    const closeInTime = Math.abs(currentTime - previousTime) <= gapMs;

    if (sameSender && closeInTime) {
      currentBurst.push(message);
    } else {
      bursts.push(currentBurst);
      currentBurst = [message];
    }
  }

  if (currentBurst.length > 0) {
    bursts.push(currentBurst);
  }

  return bursts;
}

async function storeMessage(message: SyncedBeeperMessage) {
  const pool = getMysqlPool();
  const [result] = await pool.execute(
    `
      INSERT IGNORE INTO beeper_messages (
        beeper_message_id,
        beeper_chat_id,
        account_id,
        source_platform,
        chat_name,
        sender_name,
        message_timestamp,
        raw_content,
        is_sender,
        payload_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      message.beeperMessageId,
      message.beeperChatId,
      message.accountId,
      message.sourcePlatform,
      message.chatName,
      message.senderName,
      message.messageTimestamp,
      message.rawContent,
      message.isSender,
      message.payloadJson
    ]
  );

  return (result as { affectedRows?: number }).affectedRows ?? 0;
}

async function getChatState(beeperChatId: string) {
  const pool = getMysqlPool();
  const [rows] = await pool.execute(
    `
      SELECT beeper_chat_id, last_message_id, last_message_timestamp
      FROM beeper_chat_state
      WHERE beeper_chat_id = ?
      LIMIT 1
    `,
    [beeperChatId]
  );

  const stateRows = rows as Array<{
    beeper_chat_id: string;
    last_message_id: string | null;
    last_message_timestamp: Date | string | null;
  }>;

  const row = stateRows[0];
  if (!row) {
    return null;
  }

  return {
    beeperChatId: row.beeper_chat_id,
    lastMessageId: row.last_message_id,
    lastMessageTimestamp:
      row.last_message_timestamp instanceof Date
        ? row.last_message_timestamp.toISOString()
        : row.last_message_timestamp
  } satisfies BeeperChatState;
}

async function upsertChatState(state: BeeperChatState) {
  const pool = getMysqlPool();
  await pool.execute(
    `
      INSERT INTO beeper_chat_state (
        beeper_chat_id,
        last_message_id,
        last_message_timestamp
      )
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        last_message_id = VALUES(last_message_id),
        last_message_timestamp = VALUES(last_message_timestamp),
        updated_at = CURRENT_TIMESTAMP(3)
    `,
    [state.beeperChatId, state.lastMessageId, state.lastMessageTimestamp]
  );
}

async function upsertMessageTriage(triage: StoredBeeperTriage) {
  const pool = getMysqlPool();
  await pool.execute(
    `
      INSERT INTO beeper_message_triage (
        beeper_message_id,
        priority_color,
        summary,
        reason,
        model_name,
        triaged_at
      )
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE
        priority_color = VALUES(priority_color),
        summary = VALUES(summary),
        reason = VALUES(reason),
        model_name = VALUES(model_name),
        triaged_at = CURRENT_TIMESTAMP(3)
    `,
    [triage.beeperMessageId, triage.priorityColor, triage.summary, triage.reason, triage.modelName]
  );
}

function isNewerMessage(current: { id: string }, state: BeeperChatState | null) {
  if (!state?.lastMessageId) {
    return true;
  }

  return current.id !== state.lastMessageId;
}

export async function syncBeeperMessages() {
  await ensureBeeperSchema();

  const config = getBeeperConfig();
  const chatsResponse = await beeperFetch<BeeperListResponse<BeeperChat>>(
    config.baseUrl,
    config.token,
    `/chats?limit=${config.chatLimit}`
  );

  const chats = chatsResponse.items ?? [];
  let messagesFetched = 0;
  let messagesStored = 0;
  let messagesSkipped = 0;

  for (const chat of chats) {
    const chatState = await getChatState(chat.id);
    const messagesResponse = await beeperFetch<BeeperListResponse<BeeperMessage>>(
      config.baseUrl,
      config.token,
      `/chats/${encodeURIComponent(chat.id)}/messages?limit=10`
    );

    const apiMessages = messagesResponse.items ?? [];
    const newMessages = collectNewMessages(apiMessages, chatState?.lastMessageId ?? null)
      .map((message) => messageFromApi(chat, message))
      .filter((message): message is BeeperBurstMessage => message !== null);

    messagesFetched += newMessages.length;

    if (newMessages.length === 0) {
      continue;
    }

    const bursts = groupBurstMessages(newMessages);

    for (const burst of bursts) {
      const storedMessage = buildBurstStoredMessage(chat, burst);
      if (!storedMessage) {
        messagesSkipped += 1;
        continue;
      }

      const shouldStore = config.storeSelfMessages || !storedMessage.isSender;
      if (!shouldStore) {
        messagesSkipped += 1;
        await upsertChatState({
          beeperChatId: chat.id,
          lastMessageId: storedMessage.beeperMessageId,
          lastMessageTimestamp: storedMessage.messageTimestamp
        });
        continue;
      }

      const affectedRows = await storeMessage(storedMessage);
      if (affectedRows > 0) {
        messagesStored += 1;
      } else {
        messagesSkipped += 1;
      }

      const triage = await triageBeeperMessage({
        senderName: storedMessage.senderName,
        chatName: storedMessage.chatName,
        sourcePlatform: storedMessage.sourcePlatform,
        rawContent: storedMessage.rawContent,
        timestamp: storedMessage.messageTimestamp
      });

      await upsertMessageTriage({
        beeperMessageId: storedMessage.beeperMessageId,
        priorityColor: triage.priorityColor,
        summary: triage.summary,
        reason: triage.reason,
        modelName: process.env.OPENAI_API_KEY ? process.env.OPENAI_MODEL || "gpt-4.1-mini" : null
      });

      await upsertChatState({
        beeperChatId: chat.id,
        lastMessageId: storedMessage.beeperMessageId,
        lastMessageTimestamp: storedMessage.messageTimestamp
      });
    }
  }

  return {
    chatsScanned: chats.length,
    messagesFetched,
    messagesStored,
    messagesSkipped
  } satisfies BeeperSyncResult;
}
