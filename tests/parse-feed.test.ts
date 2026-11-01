import { describe, expect, test } from "vitest";
import { fetchFeed, loadFeeds } from "../lib/fetch-feed";
import { FeedParseError, parseFeedXml } from "../lib/parse-feed";

const RSS = `<?xml version="1.0"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[Graveyard Gazette]]></title>
    <description>News from the crypt</description>
    <item>
      <title>Older bells</title>
      <link>https://example.com/old</link>
      <pubDate>Thu, 01 Oct 2026 18:00:00 GMT</pubDate>
      <description>The older note is long enough to be kept as the body of the first card.</description>
    </item>
    <item>
      <title>Bell &amp; Candle</title>
      <link>https://example.com/bells</link>
      <guid isPermaLink="false">bells-1</guid>
      <pubDate>Fri, 30 Oct 2026 18:00:00 GMT</pubDate>
      <description>Short dek.</description>
      <content:encoded><![CDATA[<p>The long encoded body is the one the reader should keep because it tells the chapel story.</p><script>alert(1)</script>]]></content:encoded>
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Lantern</title>
  <subtitle>A small light</subtitle>
  <entry>
    <title>Wick &amp; wire</title>
    <id>urn:lantern:1</id>
    <updated>2026-10-31T12:00:00Z</updated>
    <link rel="self" href="https://example.com/feed.xml"/>
    <link rel="alternate" href="https://example.com/wick"/>
    <summary>A short summary line.</summary>
    <content type="html">&lt;p&gt;Wire hums in the wall. Wick holds the flame through the night watch and the morning after.&lt;/p&gt;</content>
  </entry>
</feed>`;

const RDF = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>RDF Shelf</title>
    <description>Old cards</description>
    <link>https://example.com/rdf</link>
  </channel>
  <item>
    <title>Card one</title>
    <link>https://example.com/card</link>
    <description>A card from the old catalog of the library stacks.</description>
    <dc:date>2026-10-01T00:00:00Z</dc:date>
  </item>
</rdf:RDF>`;

describe("parseFeedXml", () => {
  test("parses RSS 2.0, prefers encoded content, and sorts newest first", () => {
    const feed = parseFeedXml(RSS, "https://example.com/rss.xml");
    expect(feed.title).toBe("Graveyard Gazette");
    expect(feed.description).toBe("News from the crypt");
    expect(feed.items.map((item) => item.title)).toEqual(["Bell & Candle", "Older bells"]);
    expect(feed.items[0]?.link).toBe("https://example.com/bells");
    expect(feed.items[0]?.contentText).toContain("long encoded body");
    expect(feed.items[0]?.contentText).not.toContain("Short dek");
    expect(feed.items[0]?.contentText).not.toContain("alert");
    expect(feed.items[0]?.contentText).not.toContain("<p>");
    expect(feed.items[0]?.publishedAt).toBe("2026-10-30T18:00:00.000Z");
  });

  test("parses Atom alternate links and html content", () => {
    const feed = parseFeedXml(ATOM, "https://example.com/atom.xml");
    expect(feed.title).toBe("Atom Lantern");
    expect(feed.description).toBe("A small light");
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]?.title).toBe("Wick & wire");
    expect(feed.items[0]?.link).toBe("https://example.com/wick");
    expect(feed.items[0]?.contentText).toContain("Wire hums in the wall");
    expect(feed.items[0]?.contentText).not.toContain("<p>");
  });

  test("parses RSS 1.0", () => {
    const feed = parseFeedXml(RDF, "https://example.com/rdf.xml");
    expect(feed.title).toBe("RDF Shelf");
    expect(feed.items[0]?.title).toBe("Card one");
    expect(feed.items[0]?.link).toBe("https://example.com/card");
    expect(feed.items[0]?.publishedAt).toBe("2026-10-01T00:00:00.000Z");
  });

  test("rejects documents that are not feeds", () => {
    expect(() => parseFeedXml("", "https://example.com/rss.xml")).toThrow(FeedParseError);
    expect(() => parseFeedXml("<html><body>nope</body></html>", "https://example.com/rss.xml")).toThrow(/RSS or Atom/);
  });
});

describe("fetchFeed", () => {
  test("parses a fetched RSS document and skips private URLs", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return new Response(RSS, { status: 200, headers: { "content-type": "application/rss+xml" } });
    };
    const feeds = await loadFeeds(["javascript:alert(1)", "https://example.com/rss.xml", "https://example.com/rss.xml"], {
      fetchImpl,
    });
    expect(calls).toBe(1);
    expect(feeds[0]?.ok).toBe(false);
    expect(feeds[1]?.ok).toBe(true);
    if (feeds[1]?.ok) expect(feeds[1].title).toBe("Graveyard Gazette");
  });

  test("does not follow a redirect to a private host", async () => {
    const fetchImpl: typeof fetch = async (_input, init) => {
      expect(init?.redirect).toBe("manual");
      return new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest/meta-data" } });
    };
    await expect(fetchFeed("https://feeds.example.com/rss.xml", { fetchImpl })).rejects.toThrow(/public feed URL/i);
  });
});
