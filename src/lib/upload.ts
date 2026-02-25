/**
 * Base URL for serving uploaded files (images, documents).
 * Use this so images work when the app is server-rendered or behind a proxy.
 */
export function getUploadUrl(relativePath: string): string {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  const base = process.env.NEXTAUTH_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
  const path = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${base}${path}`;
}
