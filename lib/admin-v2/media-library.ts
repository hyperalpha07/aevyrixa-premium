const libraryPrefix = "media-library/";
const supportedExtensions = new Set(["jpg", "png", "webp"]);
const mediaMaxBytes = 20 * 1024 * 1024;

export type MediaLibraryPath = string & { readonly __mediaLibraryPath: unique symbol };

function slug(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.slice(0, 72) || "image";
}

function fileParts(filename: string) {
  const clean = filename.trim().replace(/\\/g, "/").split("/").at(-1) ?? "";
  const extension = clean.toLowerCase().split(".").at(-1) ?? "";
  const stem = clean.slice(0, -(extension.length + 1));
  return { stem, extension };
}

export function libraryMediaPathFromFilename(filename: string, id: string): MediaLibraryPath | null {
  const { stem, extension } = fileParts(filename);
  if (!supportedExtensions.has(extension) || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return `${libraryPrefix}${slug(stem)}-${id.toLowerCase()}.${extension}` as MediaLibraryPath;
}

export function isLibraryMediaPath(value: unknown): value is MediaLibraryPath {
  if (typeof value !== "string") return false;
  const filename = value.slice(libraryPrefix.length);
  return value.startsWith(libraryPrefix)
    && /^[a-z0-9][a-z0-9-]{0,108}\.(?:jpg|png|webp)$/i.test(filename)
    && !value.includes("..")
    && value.length <= 160;
}

export function mediaLibraryFilename(path: string) {
  return decodeURIComponent(path.split("/").at(-1) ?? path);
}

export function renameLibraryMediaPath(path: string, filename: string): MediaLibraryPath | null {
  if (!isLibraryMediaPath(path)) return null;
  const current = fileParts(mediaLibraryFilename(path));
  const requested = fileParts(filename);
  if (!requested.stem || requested.extension !== current.extension) return null;
  const id = current.stem.match(/-([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i)?.[1];
  return id ? libraryMediaPathFromFilename(`${requested.stem}.${requested.extension}`, id) : null;
}

export function validMediaLibraryListItem(value: unknown): value is { name: string; metadata?: Record<string, unknown> } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === "string" && isLibraryMediaPath(`${libraryPrefix}${item.name}`)
    && (item.metadata === undefined || (typeof item.metadata === "object" && item.metadata !== null && !Array.isArray(item.metadata)));
}

export function mediaLibraryUploadProblem(file: Pick<File, "name" | "size">) {
  if (!file.name || file.size <= 0) return "Choose a non-empty image file.";
  if (file.size > mediaMaxBytes) return "Image must be 20 MB or smaller.";
  return null;
}
