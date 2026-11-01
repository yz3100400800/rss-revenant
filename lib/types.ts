export type FeedItem = {
  id: string;
  feedUrl: string;
  feedTitle: string;
  title: string;
  link: string;
  publishedAt: string | null;
  contentText: string;
};

export type ParsedFeed = {
  url: string;
  title: string;
  description: string;
  items: FeedItem[];
};

export type FeedResult =
  | (ParsedFeed & { ok: true })
  | { ok: false; url: string; error: string };

export type SummaryResult = {
  summary: string;
  source: "llm" | "extractive";
  model: string | null;
};

export type DigestHeadline = {
  title: string;
  link: string;
  feedTitle: string;
};

export type DigestTopic = {
  name: string;
  summary: string;
  headlines: DigestHeadline[];
};

export type DigestResult = {
  overview: string;
  topics: DigestTopic[];
  source: "llm" | "extractive";
  model: string | null;
};

export type DigestItem = {
  title: string;
  content: string;
  feedTitle: string;
  link: string;
};

export type StoredFeed = {
  url: string;
  title: string;
};
