import { parseFeedXml } from "./parse-feed";
import type { FeedResult, ParsedFeed } from "./types";
import { assertPublicHttpUrl } from "./url-guard";

const MAX_BYTES = 2_000_000;
const MAX_REDIRECTS = 3;

export type FetchOptions = {
  fetchImpl?: typeof fetch;
};

function failureMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Could not load feed.";
}

export async function fetchFeed(input: string, options: FetchOptions = {}): Promise<ParsedFeed> {
  const fetchImpl = options.fetchImpl ?? fetch;
  let current = assertPublicHttpUrl(input);
  const original = current.toString();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let response: Response;
    try {
      response = await fetchImpl(current.toString(), {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        headers: {
          accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
          "user-agent": "RSSRevenant/1.0 (feed reader)",
        },
        signal: AbortSignal.timeout(12_000),
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      if (name === "TimeoutError" || name === "AbortError") {
        throw new Error("The feed took too long to respond.");
      }
      throw new Error("Could not reach the feed.");
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("The feed redirect was missing a location.");
      if (hop === MAX_REDIRECTS) throw new Error("The feed redirected too many times.");
      current = assertPublicHttpUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) throw new Error(`Feed request failed (${response.status}).`);
    const xml = await response.text();
    if (xml.length > MAX_BYTES) throw new Error("The feed is too large.");
    return parseFeedXml(xml, original);
  }

  throw new Error("The feed redirected too many times.");
}

export async function loadFeeds(urls: unknown, options: FetchOptions = {}): Promise<FeedResult[]> {
  if (!Array.isArray(urls)) throw new Error("Expected a list of feed URLs.");
  const unique: string[] = [];
  for (const value of urls) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed || unique.includes(trimmed)) continue;
    unique.push(trimmed);
    if (unique.length >= 20) break;
  }

  return Promise.all(
    unique.map(async (url) => {
      try {
        const parsed = await fetchFeed(url, options);
        return { ok: true as const, ...parsed };
      } catch (error) {
        return { ok: false as const, url, error: failureMessage(error) };
      }
    }),
  );
}
