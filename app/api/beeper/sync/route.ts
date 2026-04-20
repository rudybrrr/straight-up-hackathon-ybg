import { NextResponse } from "next/server";
import { syncBeeperMessages } from "@/lib/beeper-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await syncBeeperMessages();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}
