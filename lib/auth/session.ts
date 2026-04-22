const DEFAULT_POST_LOGIN_PATH = "/calendar";

export function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

export function resolvePostLoginPath(
  requestedPath: string | null | undefined,
  fallback = DEFAULT_POST_LOGIN_PATH,
): string {
  if (!requestedPath) return fallback;
  return isSafeInternalPath(requestedPath) ? requestedPath : fallback;
}
