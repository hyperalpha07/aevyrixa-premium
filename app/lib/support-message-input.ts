export type SupportMessageInput = {
  body: string;
  token: string;
  sourcePage: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function readSupportMessageInput(request: Request): Promise<{ input: SupportMessageInput } | { error: string; status: number }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return { error: "Use signed attachment upload endpoints for files.", status: 413 };
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    return {
      input: {
        body: text(payload.body ?? payload.message),
        token: text(payload.token),
        sourcePage: text(payload.sourcePage),
      },
    };
  } catch {
    return { error: "Invalid request body.", status: 400 };
  }
}
