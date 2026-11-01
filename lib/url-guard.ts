export class UrlGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlGuardError";
  }
}

function ipv4Parts(host: string): number[] | null {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) return null;
  const parts = match.slice(1).map((part) => Number(part));
  if (parts.some((part) => part > 255)) return null;
  return parts;
}

function isBlockedIp(host: string): boolean {
  const ipv4 = ipv4Parts(host);
  if (ipv4) {
    const [a, b] = ipv4;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  if (host.includes(":")) {
    const first = host.split(":").filter(Boolean)[0]?.toLowerCase() ?? "";
    if (host === "::" || host === "::1" || host === "0:0:0:0:0:0:0:1") return true;
    if (first.startsWith("fc") || first.startsWith("fd") || /^fe[89ab]/.test(first)) return true;
  }
  return false;
}

export function assertPublicHttpUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new UrlGuardError("Enter a full http or https URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UrlGuardError("Feed URL must be http or https.");
  }
  if (url.username || url.password) {
    throw new UrlGuardError("Feed URL cannot include a username or password.");
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const blockedHost =
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal" ||
    isBlockedIp(host);
  if (blockedHost) {
    throw new UrlGuardError("That address is not a public feed URL.");
  }
  return url;
}

export function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
