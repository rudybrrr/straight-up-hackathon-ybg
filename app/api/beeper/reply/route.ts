import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  chatId: z.string().trim().min(1),
  text: z.string().trim().min(1).max(4000)
});

class BeeperHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseText: string
  ) {
    super(message);
    this.name = "BeeperHttpError";
  }
}

function getBeeperConfig() {
  const token = process.env.BEEPER_TOKEN;
  const baseUrl = process.env.BEEPER_BASE_URL ?? "http://localhost:23373/v1";

  if (!token) {
    throw new Error("Missing BEEPER_TOKEN.");
  }

  return { token, baseUrl };
}

async function beeperPost(baseUrl: string, token: string, endpoint: string, body: unknown) {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store"
    });
  } catch {
    throw new Error(`Unable to connect to Beeper at ${baseUrl}. Is Beeper Desktop running?`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new BeeperHttpError(
      `Beeper HTTP ${response.status} for ${endpoint}${text ? `: ${text.slice(0, 200)}` : ""}`,
      response.status,
      text
    );
  }

  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
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

    const { token, baseUrl } = getBeeperConfig();
    const endpoint = `/chats/${encodeURIComponent(parsed.data.chatId)}/messages`;
    const text = parsed.data.text;

    // Beeper Desktop's local API schema can vary; try a few common payload keys.
    const attempts: Array<{ key: "text" | "body" | "content"; payload: Record<string, string> }> = [
      { key: "text", payload: { text } },
      { key: "body", payload: { body: text } },
      { key: "content", payload: { content: text } }
    ];

    let lastError: Error | null = null;

    for (const attempt of attempts) {
      try {
        const result = await beeperPost(baseUrl, token, endpoint, attempt.payload);
        return NextResponse.json({ ok: true, used: attempt.key, result });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Reply failed.");
      }
    }

    throw lastError ?? new Error("Reply failed.");
  } catch (error) {
    if (error instanceof BeeperHttpError) {
      const hint =
        error.status === 403
          ? "Beeper rejected this token for sending. Re-generate a token with send/write permissions in Beeper Desktop."
          : undefined;

      return NextResponse.json(
        {
          error: error.message,
          upstreamStatus: error.status,
          hint
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
