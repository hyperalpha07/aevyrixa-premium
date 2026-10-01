export const SUPPORT_ATTACHMENT_LIMIT = 5;
export const SUPPORT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const SUPPORT_ATTACHMENT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const allowedMimeTypes = new Set<string>(SUPPORT_ATTACHMENT_ALLOWED_MIME_TYPES);

export type SupportAttachmentLike = {
  name: string;
  type: string;
  size: number;
};

export function supportAttachmentExtension(name: string) {
  const match = name.trim().toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export function validateSupportAttachmentFile(file: SupportAttachmentLike) {
  if (file.size <= 0) {
    return `${file.name || "Attachment"} is empty.`;
  }
  if (!allowedMimeTypes.has(file.type)) {
    return `${file.name || "Attachment"} uses an unsupported file type.`;
  }
  if (file.size > SUPPORT_ATTACHMENT_MAX_BYTES) {
    return `${file.name || "Attachment"} is larger than 10 MB.`;
  }
  return "";
}

export function validateSupportAttachmentFiles(files: SupportAttachmentLike[]) {
  if (files.length > SUPPORT_ATTACHMENT_LIMIT) return `Attach up to ${SUPPORT_ATTACHMENT_LIMIT} files.`;
  for (const file of files) {
    const error = validateSupportAttachmentFile(file);
    if (error) return error;
  }
  return "";
}

export function supportAttachmentAccept() {
  return SUPPORT_ATTACHMENT_ALLOWED_MIME_TYPES.join(",");
}

export function formatSupportAttachmentSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}
