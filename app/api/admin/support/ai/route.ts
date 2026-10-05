import OpenAI from "openai";
import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

const languages = new Set(["English", "Bangla", "Sinhala"]);

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

function outputText(response: unknown) {
  const record = response && typeof response === "object" ? response as { output_text?: unknown } : {};
  if (typeof record.output_text === "string") return record.output_text.trim();
  return "";
}

async function createAiResponse(client: OpenAI, input: Parameters<OpenAI["responses"]["create"]>[0]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    return await client.responses.create(input, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const session = await verifyFreshAdminRequestPermission(request, "support.reply");
  if (!session) return forbiddenAdminResponse();
  if (!process.env.OPENAI_API_KEY) {
    return json({ error: "AI is not configured." }, { status: 503 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  const action = payload.action;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_SUPPORT_MODEL || "gpt-6-luna";

  try {
    if (action === "translate") {
      const text = typeof payload.text === "string" ? payload.text.trim().slice(0, 4000) : "";
      const targetLanguage = typeof payload.targetLanguage === "string" ? payload.targetLanguage.trim() : "";
      if (!text) return json({ error: "Text is required." }, { status: 400 });
      if (!languages.has(targetLanguage)) return json({ error: "Unsupported target language." }, { status: 400 });
      const response = await createAiResponse(client, {
        model,
        input: [
          { role: "system", content: "Translate customer-support text. Return only the translated text. Do not add commentary." },
          { role: "user", content: `Target language: ${targetLanguage}\n\nText:\n${text}` },
        ],
      });
      return json({ text: outputText(response) });
    }

    if (action === "suggest") {
      const history = Array.isArray(payload.history) ? payload.history.slice(-12) : [];
      const bounded = history
        .map(item => {
          const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
          const sender = record.sender_type === "admin" ? "Admin" : "Customer";
          const body = typeof record.body === "string" ? record.body.trim().slice(0, 1000) : "";
          return body ? `${sender}: ${body}` : "";
        })
        .filter(Boolean)
        .join("\n")
        .slice(0, 6000);
      if (!bounded) return json({ error: "Conversation history is required." }, { status: 400 });
      const response = await createAiResponse(client, {
        model,
        input: [
          {
            role: "system",
            content:
              "You draft concise customer-support replies for Noromi Care admins. Return one draft only. Do not invent order, payment, refund, or medical facts. If information is missing, ask a polite clarification question. Preserve the customer's language when reasonable.",
          },
          { role: "user", content: bounded },
        ],
      });
      return json({ text: outputText(response) });
    }

    return json({ error: "Unsupported AI action." }, { status: 400 });
  } catch (error) {
    console.error("Support AI request failed:", error instanceof Error ? error.message : "unknown error");
    return json({ error: "AI request failed." }, { status: 503 });
  }
}
