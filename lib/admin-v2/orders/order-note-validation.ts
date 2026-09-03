import type { OrderNoteType } from "@/app/lib/order-types";

export const adminV2OrderNoteTypes = ["internal", "customer", "delivery", "payment"] as const;
export const adminV2OrderNoteMaxLength = 2000;

export function validateAdminV2OrderNote(input: unknown): {
  noteBody?: string;
  noteType?: OrderNoteType;
  errors: string[];
} {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { errors: ["Invalid note payload."] };
  }

  const record = input as Record<string, unknown>;
  const noteBody = typeof record.noteBody === "string" ? record.noteBody.trim() : "";
  const noteType = typeof record.noteType === "string" ? record.noteType : "internal";
  const errors: string[] = [];

  if (!noteBody) errors.push("Note body is required.");
  if (noteBody.length > adminV2OrderNoteMaxLength) {
    errors.push(`Note body must be ${adminV2OrderNoteMaxLength} characters or fewer.`);
  }
  if (!adminV2OrderNoteTypes.includes(noteType as OrderNoteType)) {
    errors.push("Note type is invalid.");
  }

  return errors.length > 0
    ? { errors }
    : { noteBody, noteType: noteType as OrderNoteType, errors };
}
