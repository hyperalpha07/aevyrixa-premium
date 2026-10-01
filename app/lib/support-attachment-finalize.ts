import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  SUPPORT_ATTACHMENT_LIMIT,
  SUPPORT_ATTACHMENT_MAX_BYTES,
  cleanupSupportAttachmentFiles,
  supportAttachmentIndicator,
  validateUploadedSupportAttachments,
  type PreparedSupportAttachment,
} from "@/app/lib/support-attachments";
import {
  addMessage,
  addMessageAttachments,
  deleteSupportMessage,
  getSupportMessageWithAttachments,
  type SenderType,
  type SupportMessageWithAttachments,
} from "@/app/lib/support-store";

const MANIFEST_VERSION = 1;
const MANIFEST_TTL_MS = 15 * 60 * 1000;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export type SupportAttachmentManifest = {
  v: number;
  conversationId: string;
  messageId: string;
  senderType: SenderType;
  attachments: PreparedSupportAttachment[];
  expiresAt: number;
};

function signingSecret() {
  const dedicated = process.env.SUPPORT_ATTACHMENT_SIGNING_SECRET || "";
  if (process.env.NODE_ENV === "production" && !dedicated) {
    throw new Error("SUPPORT_ATTACHMENT_SIGNING_SECRET is required for support attachment manifests in production.");
  }
  const secret = dedicated || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!secret) throw new Error("Support attachment signing secret is not configured.");
  return secret;
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function createSupportAttachmentManifest(input: {
  conversationId: string;
  messageId: string;
  senderType: SenderType;
  attachments: PreparedSupportAttachment[];
  now?: number;
}) {
  const manifest: SupportAttachmentManifest = {
    v: MANIFEST_VERSION,
    conversationId: input.conversationId,
    messageId: input.messageId,
    senderType: input.senderType,
    attachments: input.attachments,
    expiresAt: (input.now ?? Date.now()) + MANIFEST_TTL_MS,
  };
  const payload = base64url(JSON.stringify(manifest));
  return `${payload}.${signPayload(payload)}`;
}

function verifySignature(payload: string, signature: string) {
  const expected = signPayload(payload);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function verifySupportAttachmentManifest(token: string, expected: {
  conversationId: string;
  senderType: SenderType;
  messageId?: string;
  now?: number;
}) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !verifySignature(payload, signature)) {
    throw new Error("Invalid support attachment manifest.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid support attachment manifest.");
  }
  const manifest = parseSupportAttachmentManifest(decoded);

  if (manifest.expiresAt < (expected.now ?? Date.now())) throw new Error("Support attachment manifest expired.");
  if (manifest.conversationId !== expected.conversationId) throw new Error("Support attachment manifest conversation mismatch.");
  if (manifest.senderType !== expected.senderType) throw new Error("Support attachment manifest sender mismatch.");
  if (expected.messageId && manifest.messageId !== expected.messageId) throw new Error("Support attachment manifest message mismatch.");
  const prefix = `support/${manifest.conversationId}/${manifest.messageId}/`;
  if (manifest.attachments.some(attachment => !attachment.storage_path.startsWith(prefix))) {
    throw new Error("Support attachment manifest path mismatch.");
  }
  return manifest;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeNonEmptyId(value: unknown) {
  return typeof value === "string" && SAFE_ID_PATTERN.test(value);
}

function parseSupportAttachmentManifest(decoded: unknown): SupportAttachmentManifest {
  if (!isPlainRecord(decoded)) throw new Error("Invalid support attachment manifest.");
  if (decoded.v !== MANIFEST_VERSION) throw new Error("Unsupported support attachment manifest.");
  if (!isSafeNonEmptyId(decoded.conversationId)) throw new Error("Support attachment manifest conversation mismatch.");
  if (!isSafeNonEmptyId(decoded.messageId)) throw new Error("Support attachment manifest message mismatch.");
  if (decoded.senderType !== "admin" && decoded.senderType !== "customer") {
    throw new Error("Support attachment manifest sender mismatch.");
  }
  if (typeof decoded.expiresAt !== "number" || !Number.isFinite(decoded.expiresAt)) {
    throw new Error("Invalid support attachment manifest expiry.");
  }
  if (!Array.isArray(decoded.attachments) || decoded.attachments.length < 1 || decoded.attachments.length > SUPPORT_ATTACHMENT_LIMIT) {
    throw new Error("Support attachment manifest attachment count is invalid.");
  }

  const attachments = decoded.attachments.map((attachment): PreparedSupportAttachment => {
    if (!isPlainRecord(attachment)) throw new Error("Invalid support attachment manifest attachment.");
    const { storage_path, file_name, mime_type, size_bytes } = attachment;
    if (typeof storage_path !== "string" || !storage_path || storage_path.includes("..") || storage_path.includes("\\")) {
      throw new Error("Support attachment manifest path mismatch.");
    }
    if (typeof file_name !== "string" || !file_name.trim() || file_name.length > 180) {
      throw new Error("Invalid support attachment manifest filename.");
    }
    if (typeof mime_type !== "string" || !mime_type.trim() || mime_type.length > 120) {
      throw new Error("Invalid support attachment manifest MIME type.");
    }
    if (typeof size_bytes !== "number" || !Number.isInteger(size_bytes) || size_bytes < 1 || size_bytes > SUPPORT_ATTACHMENT_MAX_BYTES) {
      throw new Error("Invalid support attachment manifest size.");
    }
    return { storage_path, file_name, mime_type, size_bytes };
  });

  return {
    v: MANIFEST_VERSION,
    conversationId: decoded.conversationId as string,
    messageId: decoded.messageId as string,
    senderType: decoded.senderType as SenderType,
    attachments,
    expiresAt: decoded.expiresAt as number,
  };
}

function manifestAttachmentsCommitted(message: SupportMessageWithAttachments, manifest: SupportAttachmentManifest) {
  const attachments = message.attachments ?? [];
  if (attachments.length !== manifest.attachments.length) return false;
  const committed = new Map(attachments.map(attachment => [attachment.storage_path, attachment]));
  return manifest.attachments.every(expected => {
    const actual = committed.get(expected.storage_path);
    return Boolean(
      actual &&
      actual.file_name === expected.file_name &&
      actual.mime_type === expected.mime_type &&
      actual.size_bytes === expected.size_bytes
    );
  });
}

async function getConcurrentFinalizedMessage(manifest: SupportAttachmentManifest, conversationId: string) {
  const existing = await getSupportMessageWithAttachments(manifest.messageId, conversationId).catch(() => null);
  return existing && manifestAttachmentsCommitted(existing, manifest) ? existing : null;
}

export async function finalizeSupportAttachmentMessage(input: {
  conversationId: string;
  body: string;
  senderType: SenderType;
  manifestToken: string;
  submittedMessageId?: string;
}): Promise<SupportMessageWithAttachments> {
  const body = input.body.trim();
  const manifest = verifySupportAttachmentManifest(input.manifestToken, {
    conversationId: input.conversationId,
    senderType: input.senderType,
    messageId: input.submittedMessageId,
  });

  const existing = await getSupportMessageWithAttachments(manifest.messageId, input.conversationId);
  if (existing) return existing;

  let validated: PreparedSupportAttachment[] = [];
  let message: SupportMessageWithAttachments | null = null;
  try {
    validated = await validateUploadedSupportAttachments(manifest.attachments);
    const messageText = body || supportAttachmentIndicator({ length: validated.length }, input.senderType);
    message = await addMessage(input.conversationId, messageText, input.senderType, { id: manifest.messageId });
    message.attachments = await addMessageAttachments(message.id, input.conversationId, validated);
    return message;
  } catch (error) {
    const concurrent = await getConcurrentFinalizedMessage(manifest, input.conversationId);
    if (concurrent) return concurrent;

    if (message) {
      await deleteSupportMessage(message.id, input.conversationId).catch(() => null);
      const afterDelete = await getConcurrentFinalizedMessage(manifest, input.conversationId);
      if (afterDelete) return afterDelete;
    }

    await cleanupSupportAttachmentFiles(manifest.attachments.map(file => file.storage_path)).catch(() => null);
    throw error;
  }
}
