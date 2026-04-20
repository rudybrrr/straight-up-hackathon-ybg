export type SourcePlatform = "WhatsApp" | "Telegram" | "Discord" | "Slack" | "Email" | "Other";

export type Priority = "act_now" | "review_soon" | "for_later";

export type PriorityFilter = Priority | "all";

export interface DraftInboxItem {
  id: string;
  source: SourcePlatform;
  sender: string;
  chatOrThreadName: string;
  timestamp: string;
  rawContent: string;
  messageCount?: number;
  isThread: boolean;
}

export interface InboxItem extends DraftInboxItem {
  summary: string;
  priority: Priority;
  reason: string;
  beeperChatId?: string;
  beeperMessageId?: string;
  accountId?: string;
}

export interface TriageResponse {
  summary: string;
  priority: Priority;
  reason: string;
}

