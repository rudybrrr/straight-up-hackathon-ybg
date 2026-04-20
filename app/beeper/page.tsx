import { fetchBeeperBoardGroups } from "@/lib/beeper-board";
import { BeeperBoardLive } from "@/components/orgis/beeper-board-live";

export default async function BeeperPage() {
  const groups = await fetchBeeperBoardGroups(100);
  return <BeeperBoardLive initialGroups={groups} />;
}
