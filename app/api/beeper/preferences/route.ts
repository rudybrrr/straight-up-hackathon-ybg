import { NextResponse } from "next/server";
import {
  getBeeperTriagePreferences,
  updateBeeperTriagePreferences
} from "@/lib/beeper-preferences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const preferences = await getBeeperTriagePreferences();
    return NextResponse.json(preferences);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      familyRedEnabled?: boolean;
      businessRedEnabled?: boolean;
    };

    const preferences = await updateBeeperTriagePreferences({
      familyRedEnabled:
        typeof body.familyRedEnabled === "boolean" ? body.familyRedEnabled : undefined,
      businessRedEnabled:
        typeof body.businessRedEnabled === "boolean" ? body.businessRedEnabled : undefined
    });

    return NextResponse.json(preferences);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
