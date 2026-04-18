import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import {
  applyTriageResult,
  buildTriagePrompt,
  fallbackTriage,
  triageRequestSchema,
  triageResponseSchema
} from "@/lib/triage";

export const runtime = "nodejs";

const modelName = process.env.OPENAI_MODEL || "gpt-4.1-mini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = triageRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          issues: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      parsed.data.items.map(async (item) => {
        if (!process.env.OPENAI_API_KEY) {
          return applyTriageResult(item, fallbackTriage(item));
        }

        try {
          const { output } = await generateText({
            model: openai(modelName),
            system:
              "You triage a personal inbox. Be concise, conservative, and deterministic. Never invent deadlines, tasks, meetings, or events. Do not write a reply.",
            prompt: buildTriagePrompt(item),
            output: Output.object({
              name: "OrgisTriage",
              description: "A concise summary, priority, and reason for a compiled chat item.",
              schema: triageResponseSchema
            }),
            temperature: 0,
            maxOutputTokens: 160
          });

          return applyTriageResult(item, output);
        } catch {
          return applyTriageResult(item, fallbackTriage(item));
        }
      })
    );

    return NextResponse.json({ items: results });
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
