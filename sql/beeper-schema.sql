CREATE TABLE IF NOT EXISTS beeper_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  beeper_message_id VARCHAR(191) NOT NULL,
  beeper_chat_id VARCHAR(191) NOT NULL,
  account_id VARCHAR(191) NOT NULL,
  source_platform VARCHAR(32) NOT NULL,
  chat_name VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  message_timestamp DATETIME(3) NOT NULL,
  raw_content TEXT NOT NULL,
  is_sender BOOLEAN NOT NULL DEFAULT FALSE,
  payload_json JSON NULL,
  ingested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uniq_beeper_message_id (beeper_message_id),
  KEY idx_message_timestamp (message_timestamp),
  KEY idx_account_chat (account_id, beeper_chat_id)
);

CREATE TABLE IF NOT EXISTS beeper_chat_state (
  beeper_chat_id VARCHAR(191) NOT NULL PRIMARY KEY,
  last_message_id VARCHAR(191) NULL,
  last_message_timestamp DATETIME(3) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);
