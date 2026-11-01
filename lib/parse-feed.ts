import { XMLParser } from "fast-xml-parser";
import { asArray, asRecord } from "./records";
import { htmlToText } from "./text";
import type { FeedItem, ParsedFeed } from "./types";

export class FeedParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedParseError";
  }
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
});

const MAX_ITEMS = 40;

export function nodeText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
    return String(node).trim();
  }
  if (Array.isArray(node)) return node.map(nodeText).filter(Boolean).join(" ").trim();
  const record = asRecord(node);
  if (!record) return "";
  const chunks: string[] = [];
  for (const key of ["#text", "#cdata", "__cdata"]) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") chunks.push(String(value));
  }
  return chunks.join(" ").trim();
}

function collectLinks(value: unknown): { href: string; rel: string }[] {
  const links: { href: string; rel: string }[] = [];
  for (const entry of asArray(value)) {
    if (typeof entry === "string" || typeof entry === "number") {
      const href = String(entry).trim();
      if (href) links.push({ href, rel: "alternate" });
      continue;
    }
    const record = asRecord(entry);
    if (!record) continue;
    const hrefValue = record["@_href"];
    const href = (typeof hrefValue === "string" ? hrefValue : nodeText(record)).trim();
    if (!href) continue;
    const relValue = record["@_rel"];
    const rel = typeof relValue === "string" && relValue.trim() ? relValue.trim() : "alternate";
    links.push({ href, rel });
  }
  return links;
}

function bestLink(item: Record<string, unknown>): string {
  const links = [...collectLinks(item.link), ...collectLinks(item["atom:link"])];
  const alternate = links.find((link) => link.rel === "alternate" && /^https?:/i.test(link.href));
  if (alternate) return alternate.href;
  const http = links.find((link) => /^https?:/i.test(link.href));
  if (http) return http.href;
  const guid = nodeText(item.guid);
  if (/^https?:/i.test(guid)) return guid;
  return "";
}

function pickDate(item: Record<string, unknown>): string | null {
  const raw =
    nodeText(item.pubDate) ||
    nodeText(item.published) ||
    nodeText(item.updated) ||
    nodeText(item["dc:date"]) ||
    nodeText(item.date);
  if (!raw) return null;
  const ms = Date.parse(raw);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

function pickContent(item: Record<string, unknown>): string {
  const candidates = [item["content:encoded"], item.encoded, item.content, item.description, item.summary];
  let best = "";
  for (const candidate of candidates) {
    const text = htmlToText(nodeText(candidate));
    if (text.length > best.length) best = text;
  }
  return best.slice(0, 8000);
}

function hostFrom(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Feed";
  }
}

function readItems(nodes: unknown, feedUrl: string, feedTitle: string): FeedItem[] {
  const seen = new Map<string, number>();
  const items: FeedItem[] = [];
  for (const node of asArray(nodes).slice(0, 100)) {
    const record = asRecord(node);
    if (!record) continue;
    const title = htmlToText(nodeText(record.title)) || "(untitled)";
    const link = bestLink(record);
    const guid = nodeText(record.guid) || nodeText(record.id);
    const base = `${feedUrl}::${guid || link || title}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    items.push({
      id: count === 0 ? base : `${base}::${count}`,
      feedUrl,
      feedTitle,
      title,
      link,
      publishedAt: pickDate(record),
      contentText: pickContent(record),
    });
  }
  items.sort((a, b) => {
    const left = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const right = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return right - left;
  });
  return items.slice(0, MAX_ITEMS);
}

function channelFrom(value: unknown): Record<string, unknown> | null {
  return asRecord(asArray(value)[0]);
}

export function parseFeedXml(xml: string, feedUrl: string): ParsedFeed {
  const cleaned = xml.replace(/^\uFEFF/, "").trim();
  if (!cleaned) throw new FeedParseError("Feed response was empty.");

  let document: unknown;
  try {
    document = parser.parse(cleaned);
  } catch {
    throw new FeedParseError("Feed XML could not be parsed.");
  }

  const root = asRecord(document);
  if (!root) throw new FeedParseError("Feed XML could not be parsed.");

  const rss = asRecord(root.rss);
  if (rss) {
    const channel = channelFrom(rss.channel);
    if (!channel) throw new FeedParseError("RSS feed is missing a channel.");
    const title = htmlToText(nodeText(channel.title)) || hostFrom(feedUrl);
    return {
      url: feedUrl,
      title,
      description: htmlToText(nodeText(channel.description)),
      items: readItems(channel.item, feedUrl, title),
    };
  }

  const atom = asRecord(root.feed);
  if (atom) {
    const title = htmlToText(nodeText(atom.title)) || hostFrom(feedUrl);
    return {
      url: feedUrl,
      title,
      description: htmlToText(nodeText(atom.subtitle)),
      items: readItems(atom.entry, feedUrl, title),
    };
  }

  const rdf = asRecord(root["rdf:RDF"]) ?? asRecord(root.RDF);
  if (rdf) {
    const channel = channelFrom(rdf.channel);
    const title = htmlToText(nodeText(channel?.title)) || hostFrom(feedUrl);
    return {
      url: feedUrl,
      title,
      description: htmlToText(nodeText(channel?.description)),
      items: readItems(rdf.item, feedUrl, title),
    };
  }

  throw new FeedParseError("Document is not RSS or Atom.");
}
