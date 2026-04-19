import { syncBeeperMessages } from "@/lib/beeper-sync";

const pollInterval = Number(process.env.BEEPER_POLL_INTERVAL_MS ?? 2000);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Beeper listener started.");
  console.log(`Polling every ${pollInterval}ms.`);

  while (true) {
    try {
      const result = await syncBeeperMessages();
      console.log(
        `Synced ${result.messagesStored} new messages from ${result.chatsScanned} chats.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      console.error(`Beeper sync failed: ${message}`);
    }

    await sleep(pollInterval);
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown fatal error.";
  console.error(`Fatal Beeper listener error: ${message}`);
  process.exit(1);
});
