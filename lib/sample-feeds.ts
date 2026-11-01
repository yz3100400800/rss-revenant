import type { StoredFeed } from "./types";

export const SAMPLE_FEEDS: readonly StoredFeed[] = Object.freeze([
  Object.freeze({ url: "https://hnrss.org/frontpage", title: "Hacker News" }),
  Object.freeze({ url: "https://feeds.bbci.co.uk/news/technology/rss.xml", title: "BBC Technology" }),
  Object.freeze({ url: "https://www.nasa.gov/news-release/feed/", title: "NASA News" }),
]);
