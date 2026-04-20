import { NextResponse } from "next/server";
import { fetchBeeperBoardGroups } from "@/lib/beeper-board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const groups = await fetchBeeperBoardGroups(100);
    const total = groups.reduce((sum, group) => sum + group.messages.length, 0);

    return NextResponse.json({
      groups,
      total,
      refreshedAt: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
