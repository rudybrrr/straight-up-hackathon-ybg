import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureBeeperSchema } from "@/lib/beeper-schema";
import { getMysqlPool } from "@/lib/mysql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  messageId: z.string().trim().min(1),
  pinned: z.boolean()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload.", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await ensureBeeperSchema();

    const pool = getMysqlPool();
    if (parsed.data.pinned) {
      await pool.execute(
        `
          INSERT INTO beeper_message_pins (beeper_message_id)
          VALUES (?)
          ON DUPLICATE KEY UPDATE
            pinned_at = CURRENT_TIMESTAMP(3)
        `,
        [parsed.data.messageId]
      );
    } else {
      await pool.execute(
        `
          DELETE FROM beeper_message_pins
          WHERE beeper_message_id = ?
        `,
        [parsed.data.messageId]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
