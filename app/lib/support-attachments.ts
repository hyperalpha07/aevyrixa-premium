import "server-only";

import type { SenderType } from "@/app/lib/support-store";
import {
  SUPPORT_ATTACHMENT_LIMIT,
  SUPPORT_ATTACHMENT_MAX_BYTES,
  supportAttachmentExtension,
  validateSupportAttachmentFiles,
  validateSupportAttachmentFile,
} from "@/app/lib/support-attachment-rules";

export const SUPPORT_ATTACHMENT_BUCKET = "support-attachments";
export { SUPPORT_ATTACHMENT_LIMIT, SUPPORT_ATTACHMENT_MAX_BYTES, validateSupportAttachmentFiles, validateSupportAttachmentFile };

export type SupportAttachment = {
  id: string;
  message_id: string;
  conversation_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  signed_url?: string;
};

export type PreparedSupportAttachment = {
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
};

export type SupportAttachmentUploadMetadata = {
  file_name: string;
  mime_type: string;
  size_bytes: number;
};

export type PreparedSupportAttachmentUpload = PreparedSupportAttachment & {
  upload_url: string;
  token?: string;
};

const mimeExtensions: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
};

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

function authHeaders(extra: Record<string, string> = {}) {
  const key = serviceKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

function hasStorageConfig() {
  return Boolean(baseUrl() && serviceKey());
}

function safeFileName(name: string) {
  const fallback = "attachment";
  const clean = (name || fallback)
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return clean || fallback;
}

export function safeSupportAttachmentDisplayName(name: string) {
  const fallback = "attachment";
  const clean = (name || fallback)
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    .replace(/[\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return clean || fallback;
}

export function supportAttachmentPath(conversationId: string, messageId: string, fileName: string) {
  return `support/${conversationId}/${messageId}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
}

function validateSupportAttachmentMetadata(file: SupportAttachmentUploadMetadata): { error: string } | { displayName: string } {
  const displayName = safeSupportAttachmentDisplayName(file.file_name);
  const basicError = validateSupportAttachmentFile({
    name: displayName,
    type: file.mime_type,
    size: file.size_bytes,
  });
  if (basicError) return { error: basicError };

  const extension = supportAttachmentExtension(displayName);
  const expectedExtensions = mimeExtensions[file.mime_type] ?? [];
  if (!expectedExtensions.includes(extension)) {
    return { error: `${displayName} file extension does not match its declared type.` };
  }

  return { displayName };
}

function bytesStartWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function bytesEqualText(bytes: Uint8Array, offset: number, text: string) {
  return text.split("").every((char, index) => bytes[offset + index] === char.charCodeAt(0));
}

function zipContainsOfficeWordPart(bytes: Uint8Array) {
  const haystack = Buffer.from(bytes).toString("latin1");
  return haystack.includes("[Content_Types].xml") && haystack.includes("word/");
}

export function validateSupportAttachmentBuffer(input: SupportAttachmentUploadMetadata & { bytes: Uint8Array }): { error: string } | { displayName: string } {
  const metadata = validateSupportAttachmentMetadata(input);
  if ("error" in metadata) return { error: metadata.error };

  const bytes = input.bytes;
  if (bytes.byteLength !== input.size_bytes) {
    return { error: `${metadata.displayName} uploaded size does not match the prepared file size.` };
  }
  let validSignature = false;

  if (input.mime_type === "image/jpeg") {
    validSignature = bytesStartWith(bytes, [0xff, 0xd8, 0xff]);
  } else if (input.mime_type === "image/png") {
    validSignature = bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  } else if (input.mime_type === "image/webp") {
    validSignature = bytesStartWith(bytes, [0x52, 0x49, 0x46, 0x46]) && bytesEqualText(bytes, 8, "WEBP");
  } else if (input.mime_type === "application/pdf") {
    validSignature = bytesEqualText(bytes, 0, "%PDF-");
  } else if (input.mime_type === "application/msword") {
    validSignature = bytesStartWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  } else if (input.mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    validSignature = bytesStartWith(bytes, [0x50, 0x4b, 0x03, 0x04]) && zipContainsOfficeWordPart(bytes);
  }

  if (!validSignature) {
    return { error: `${metadata.displayName} content does not match its declared file type.` };
  }

  return { displayName: metadata.displayName };
}

export async function validateSupportAttachmentUpload(file: File): Promise<{ error: string } | { buffer: Buffer; displayName: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateSupportAttachmentBuffer({
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    bytes: new Uint8Array(buffer),
  });
  if ("error" in validation) return { error: validation.error };
  return { buffer, displayName: validation.displayName };
}

async function storageFetch(path: string, init: RequestInit) {
  if (!hasStorageConfig()) throw new Error("Support attachment storage is not configured.");
  const response = await fetch(`${baseUrl()}/storage/v1/${path}`, {
    ...init,
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Support attachment storage failed ${response.status}: ${detail.slice(0, 200)}`);
  }
  return response;
}

export async function prepareSupportAttachmentUploads(
  conversationId: string,
  messageId: string,
  files: SupportAttachmentUploadMetadata[]
): Promise<PreparedSupportAttachmentUpload[]> {
  const listError = validateSupportAttachmentFiles(files.map(file => ({
    name: file.file_name,
    type: file.mime_type,
    size: file.size_bytes,
  })));
  if (listError) throw new Error(listError);

  const prepared: PreparedSupportAttachmentUpload[] = [];
  for (const file of files) {
    const metadata = validateSupportAttachmentMetadata(file);
    if ("error" in metadata) throw new Error(metadata.error);
    const storagePath = supportAttachmentPath(conversationId, messageId, metadata.displayName);
    const response = await storageFetch(`object/upload/sign/${SUPPORT_ATTACHMENT_BUCKET}/${storagePath}`, {
      method: "POST",
      headers: authHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({}),
    });
    const data = await response.json() as { signedURL?: string; signedUrl?: string; url?: string; token?: string; path?: string };
    const signed = data.signedURL || data.signedUrl || data.url || "";
    if (!signed) throw new Error("Could not create signed upload URL.");
    prepared.push({
      storage_path: storagePath,
      file_name: metadata.displayName,
      mime_type: file.mime_type,
      size_bytes: file.size_bytes,
      upload_url: signed.startsWith("http") ? signed : `${baseUrl()}/storage/v1${signed}`,
      token: data.token,
    });
  }
  return prepared;
}

export async function validateUploadedSupportAttachments(attachments: PreparedSupportAttachment[]) {
  const validated: PreparedSupportAttachment[] = [];
  for (const attachment of attachments) {
    const response = await storageFetch(`object/${SUPPORT_ATTACHMENT_BUCKET}/${attachment.storage_path}`, {
      method: "GET",
      headers: authHeaders(),
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const validation = validateSupportAttachmentBuffer({
      file_name: attachment.file_name,
      mime_type: attachment.mime_type,
      size_bytes: attachment.size_bytes,
      bytes,
    });
    if ("error" in validation) throw new Error(validation.error);
    validated.push({ ...attachment, file_name: validation.displayName });
  }
  return validated;
}

export async function cleanupSupportAttachmentFiles(paths: string[]) {
  if (!paths.length || !hasStorageConfig()) return;
  await storageFetch(`object/${SUPPORT_ATTACHMENT_BUCKET}`, {
    method: "DELETE",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ prefixes: paths }),
  });
}

export async function signedSupportAttachmentUrl(storagePath: string) {
  if (!hasStorageConfig()) return "";
  const response = await storageFetch(`object/sign/${SUPPORT_ATTACHMENT_BUCKET}/${storagePath}`, {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ expiresIn: 60 * 10 }),
  });
  const data = await response.json() as { signedURL?: string; signedUrl?: string };
  const signed = data.signedURL || data.signedUrl || "";
  return signed ? `${baseUrl()}/storage/v1${signed}` : "";
}

export function supportAttachmentIndicator(files: { length: number }, senderType: SenderType) {
  const count = files.length;
  if (!count) return "";
  return senderType === "admin"
    ? `[Admin sent ${count} attachment${count === 1 ? "" : "s"}]`
    : `[Customer sent ${count} attachment${count === 1 ? "" : "s"}]`;
}
