import { completeChat, type LlmConfig } from "./llm";
import { asArray, asRecord } from "./records";
import { htmlToText, readableBody, significantWords } from "./text";
import type { DigestHeadline, DigestItem, DigestResult, DigestTopic } from "./types";

const SYSTEM_PROMPT =
  'You write a daily digest of RSS posts. Respond with JSON only, no markdown fence. Shape: {"overview": string, "topics": [{"name": string, "summary": string, "headlines": string[]}]}. Use 3 to 5 topics when there is enough material. headlines must be exact post titles from the input. overview is two sentences. Do not invent posts.';

function feedCount(items: DigestItem[]): number {
  return new Set(items.map((item) => item.feedTitle || "Feed")).size;
}

function formatList(names: string[]): string {
  if (names.length === 0) return "a scatter of headlines";
  if (names.length === 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function displayTopic(word: string, items: DigestItem[]): string {
  const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, "i");
  for (const item of items) {
    const match = `${item.title} ${item.content}`.match(pattern);
    if (!match) continue;
    const raw = match[0];
    if (raw === raw.toUpperCase() && raw.length <= 5) return raw.toUpperCase();
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function toHeadline(title: string, items: DigestItem[]): DigestHeadline {
  const match = items.find((item) => item.title === title);
  return { title, link: match?.link ?? "", feedTitle: match?.feedTitle ?? "" };
}

export function extractiveDigest(items: DigestItem[]): Pick<DigestResult, "overview" | "topics"> {
  if (items.length === 0) {
    return {
      overview: "Nothing has risen in this window. The night is quiet.",
      topics: [],
    };
  }

  const documentFrequency = new Map<string, number>();
  const docs = items.map((item) => {
    const body = readableBody(item.content).slice(0, 280);
    const words = new Set(significantWords(`${item.title} ${item.title} ${body}`, 3));
    for (const word of words) documentFrequency.set(word, (documentFrequency.get(word) ?? 0) + 1);
    return words;
  });

  const topicWords = [...documentFrequency.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([word]) => word);

  if (topicWords.length === 0) {
    return {
      overview: `Tonight's digest gathers ${items.length} ${items.length === 1 ? "dispatch" : "dispatches"} from ${feedCount(items)} ${feedCount(items) === 1 ? "feed" : "feeds"}. No single theme dominates.`,
      topics: [
        {
          name: "From the feeds",
          summary: "A mixed pile of headlines, with no repeated theme strong enough to name.",
          headlines: items.slice(0, 6).map((item) => toHeadline(item.title, items)),
        },
      ],
    };
  }

  const groups = new Map<string, DigestItem[]>(topicWords.map((word) => [word, []]));
  const leftovers: DigestItem[] = [];
  items.forEach((item, index) => {
    const words = docs[index] ?? new Set<string>();
    let best: string | null = null;
    let bestScore = 0;
    for (const word of words) {
      if (!groups.has(word)) continue;
      const score = documentFrequency.get(word) ?? 0;
      if (score > bestScore) {
        best = word;
        bestScore = score;
      }
    }
    if (best) groups.get(best)?.push(item);
    else leftovers.push(item);
  });

  const strongWords = topicWords.filter((word) => (groups.get(word)?.length ?? 0) >= 2);
  for (const word of topicWords) {
    if (strongWords.includes(word)) continue;
    leftovers.push(...(groups.get(word) ?? []));
  }

  if (strongWords.length === 0) {
    return {
      overview: `Tonight's digest gathers ${items.length} ${items.length === 1 ? "dispatch" : "dispatches"} from ${feedCount(items)} ${feedCount(items) === 1 ? "feed" : "feeds"}. No single theme dominates.`,
      topics: [
        {
          name: "From the feeds",
          summary: "A mixed pile of headlines, with no repeated theme strong enough to name.",
          headlines: items.slice(0, 6).map((item) => toHeadline(item.title, items)),
        },
      ],
    };
  }

  const topics: DigestTopic[] = strongWords.map((word) => {
    const grouped = groups.get(word) ?? [];
    const name = displayTopic(word, grouped);
    return {
      name,
      summary: `${grouped.length} pieces circle around “${name}.”`,
      headlines: grouped.slice(0, 4).map((item) => toHeadline(item.title, items)),
    };
  });

  if (leftovers.length > 0) {
    topics.push({
      name: "Also stirring",
      summary: "The rest of the night's reading, off the main themes.",
      headlines: leftovers.slice(0, 4).map((item) => toHeadline(item.title, items)),
    });
  }

  const names = topics.filter((topic) => topic.name !== "Also stirring").map((topic) => topic.name);
  return {
    overview: `Tonight's digest gathers ${items.length} ${items.length === 1 ? "dispatch" : "dispatches"} from ${feedCount(items)} ${feedCount(items) === 1 ? "feed" : "feeds"}. The loudest themes are ${formatList(names)}.`,
    topics,
  };
}

function parseDigestModel(text: string, items: DigestItem[]): Pick<DigestResult, "overview" | "topics"> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  const record = asRecord(parsed);
  if (!record || typeof record.overview !== "string" || !record.overview.trim()) return null;
  const known = new Set(items.map((item) => item.title));
  const topics: DigestTopic[] = [];
  for (const entry of asArray(record.topics)) {
    const topic = asRecord(entry);
    if (!topic || typeof topic.name !== "string" || typeof topic.summary !== "string") continue;
    const headlines = asArray(topic.headlines)
      .filter((headline): headline is string => typeof headline === "string" && known.has(headline))
      .slice(0, 5)
      .map((headline) => toHeadline(headline, items));
    if (!topic.name.trim() || headlines.length === 0) continue;
    topics.push({ name: topic.name.trim(), summary: topic.summary.trim(), headlines });
    if (topics.length >= 6) break;
  }
  if (topics.length === 0) return null;
  return { overview: record.overview.trim(), topics };
}

function cleanItems(items: DigestItem[]): DigestItem[] {
  return items.slice(0, 40).map((item) => ({
    title: htmlToText(item.title).slice(0, 300),
    content: htmlToText(item.content).slice(0, 500),
    feedTitle: htmlToText(item.feedTitle).slice(0, 120) || "Feed",
    link: (item.link ?? "").slice(0, 1000),
  }));
}

function digestPrompt(items: DigestItem[]): string {
  const lines = items.map((item, index) => {
    const blurb = item.content.replace(/\s+/g, " ").slice(0, 240);
    return `${index + 1}. [${item.feedTitle}] ${item.title}${blurb ? ` — ${blurb}` : ""}`;
  });
  return `Posts:\n${lines.join("\n")}`;
}

export async function buildDigest(items: DigestItem[], llm?: LlmConfig): Promise<DigestResult> {
  const clean = cleanItems(items.filter((item) => item.title.trim() || item.content.trim()));
  const extractive = extractiveDigest(clean);
  if (clean.length === 0) return { ...extractive, source: "extractive", model: null };

  try {
    const chat = await completeChat(SYSTEM_PROMPT, digestPrompt(clean), llm, 900);
    if (!chat) return { ...extractive, source: "extractive", model: null };
    const parsed = parseDigestModel(chat.text, clean);
    if (!parsed) return { ...extractive, source: "extractive", model: null };
    return { ...parsed, source: "llm", model: chat.model };
  } catch {
    return { ...extractive, source: "extractive", model: null };
  }
}
