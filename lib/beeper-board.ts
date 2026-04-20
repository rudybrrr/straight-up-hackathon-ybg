import { ensureBeeperSchema } from "@/lib/beeper-schema";
import { getMysqlPool } from "@/lib/mysql";

export type BeeperPriorityColor = "red" | "yellow" | "green";

export type BeeperBoardMessage = {
  beeperMessageId: string;
  beeperChatId: string;
  accountId: string;
  senderName: string;
  chatName: string;
  sourcePlatform: string;
  rawContent: string;
  messageTimestamp: string;
  priorityColor: BeeperPriorityColor;
  summary: string;
  reason: string;
  triagedAt: string | null;
};

export type BeeperBoardGroup = {
  color: BeeperPriorityColor;
  title: string;
  description: string;
  messages: BeeperBoardMessage[];
};

const priorityMeta: Record<BeeperPriorityColor, { title: string; description: string }> = {
  red: {
    title: "Red",
    description: "Urgent or important. Reply soon."
  },
  yellow: {
    title: "Yellow",
    description: "Worth replying to, but it can wait."
  },
  green: {
    title: "Green",
    description: "Low urgency or informational."
  }
};

export async function fetchBeeperBoardMessages(limit = 100) {
  await ensureBeeperSchema();

  const pool = getMysqlPool();
  const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
  const [rows] = await pool.execute(
    `
      SELECT
        m.beeper_message_id,
        m.beeper_chat_id,
        m.account_id,
        m.sender_name,
        m.chat_name,
        m.source_platform,
        m.raw_content,
        m.message_timestamp,
        COALESCE(t.priority_color, 'yellow') AS priority_color,
        COALESCE(t.summary, '') AS summary,
        COALESCE(t.reason, '') AS reason,
        t.triaged_at
      FROM beeper_messages m
      LEFT JOIN beeper_message_triage t
        ON t.beeper_message_id = m.beeper_message_id
      ORDER BY m.message_timestamp DESC
      LIMIT ${safeLimit}
    `
  );

  const result = rows as Array<{
    beeper_message_id: string;
    beeper_chat_id: string;
    account_id: string;
    sender_name: string;
    chat_name: string;
    source_platform: string;
    raw_content: string;
    message_timestamp: Date | string;
    priority_color: BeeperPriorityColor;
    summary: string;
    reason: string;
    triaged_at: Date | string | null;
  }>;

  return result.map((row) => ({
    beeperMessageId: row.beeper_message_id,
    beeperChatId: row.beeper_chat_id,
    accountId: row.account_id,
    senderName: row.sender_name,
    chatName: row.chat_name,
    sourcePlatform: row.source_platform,
    rawContent: row.raw_content,
    messageTimestamp:
      row.message_timestamp instanceof Date
        ? row.message_timestamp.toISOString()
        : String(row.message_timestamp),
    priorityColor: row.priority_color,
    summary: row.summary,
    reason: row.reason,
    triagedAt:
      row.triaged_at instanceof Date
        ? row.triaged_at.toISOString()
        : row.triaged_at
          ? String(row.triaged_at)
          : null
  }));
}

export async function fetchBeeperBoardGroups(limit = 100) {
  const messages = await fetchBeeperBoardMessages(limit);

  const grouped: Record<BeeperPriorityColor, BeeperBoardMessage[]> = {
    red: [],
    yellow: [],
    green: []
  };

  for (const message of messages) {
    grouped[message.priorityColor].push(message);
  }

  return (["red", "yellow", "green"] as const).map((color) => ({
    color,
    title: priorityMeta[color].title,
    description: priorityMeta[color].description,
    messages: grouped[color]
  })) satisfies BeeperBoardGroup[];
}
