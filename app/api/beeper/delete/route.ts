import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureBeeperSchema } from "@/lib/beeper-schema";
import { getMysqlPool } from "@/lib/mysql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  messageIds: z.array(z.string().trim().min(1)).min(1).max(200)
});

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

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

    const messageIds = uniqueStrings(parsed.data.messageIds);
    if (messageIds.length === 0) {
      return NextResponse.json({ error: "No message ids provided." }, { status: 400 });
    }

    const placeholders = messageIds.map(() => "?").join(", ");
    const pool = getMysqlPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [pinnedRows] = await connection.execute(
        `
          SELECT beeper_message_id
          FROM beeper_message_pins
          WHERE beeper_message_id IN (${placeholders})
        `,
        messageIds
      );

      const pinnedIds = (pinnedRows as Array<{ beeper_message_id: string }>).map(
        (row) => row.beeper_message_id
      );

      if (pinnedIds.length > 0) {
        await connection.rollback();
        return NextResponse.json(
          {
            error: "Pinned messages must be unpinned before deletion.",
            pinnedIds
          },
          { status: 409 }
        );
      }

      await connection.execute(
        `
          DELETE FROM beeper_message_triage
          WHERE beeper_message_id IN (${placeholders})
        `,
        messageIds
      );

      await connection.execute(
        `
          DELETE FROM beeper_message_pins
          WHERE beeper_message_id IN (${placeholders})
        `,
        messageIds
      );

      const [result] = await connection.execute(
        `
          DELETE FROM beeper_messages
          WHERE beeper_message_id IN (${placeholders})
        `,
        messageIds
      );

      await connection.commit();

      const deleted = (result as { affectedRows?: number }).affectedRows ?? 0;
      return NextResponse.json({ ok: true, deleted });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

