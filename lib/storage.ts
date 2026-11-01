import { SAMPLE_FEEDS } from "./sample-feeds";
import type { StoredFeed } from "./types";

const FEEDS_KEY = "rss-revenant.feeds.v1";
const SEEDED_KEY = "rss-revenant.seeded.v1";

export const MAX_FEEDS = 20;

function canStore(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function copySamples(): StoredFeed[] {
  return SAMPLE_FEEDS.map((feed) => ({ url: feed.url, title: feed.title }));
}

function isStoredFeed(value: unknown): value is StoredFeed {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.url === "string" && /^https?:\/\//i.test(record.url) && typeof record.title === "string";
}

export function isPlaceholderTitle(feed: StoredFeed): boolean {
  if (!feed.title.trim()) return true;
  try {
    const url = new URL(feed.url);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const title = feed.title.trim().toLowerCase();
    return title === host || title === url.hostname.toLowerCase();
  } catch {
    return false;
  }
}

export function loadFeeds(): StoredFeed[] {
  if (!canStore()) return copySamples();
  try {
    const seeded = localStorage.getItem(SEEDED_KEY) === "1";
    const raw = localStorage.getItem(FEEDS_KEY);
    if (!seeded || raw == null) {
      const samples = copySamples();
      localStorage.setItem(SEEDED_KEY, "1");
      localStorage.setItem(FEEDS_KEY, JSON.stringify(samples));
      return samples;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredFeed).slice(0, MAX_FEEDS);
  } catch {
    return copySamples();
  }
}

export function saveFeeds(feeds: StoredFeed[]): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(SEEDED_KEY, "1");
    localStorage.setItem(FEEDS_KEY, JSON.stringify(feeds.slice(0, MAX_FEEDS)));
  } catch {
    // Private mode and full storage still leave the in-memory list usable.
  }
}

export function restoreSamples(): StoredFeed[] {
  const samples = copySamples();
  saveFeeds(samples);
  return samples;
}
