import { describe, expect, test } from "vitest";
import { extractiveSummary, summarizePost } from "../lib/summarize";

const ARTICLE = [
  "Hi.",
  "The lanterns along the river path were repaired before midnight and the chapel doors opened again.",
  "Buy coins now.",
  "A second crew mapped every broken stone in the east yard before sunrise.",
  "The third watch counted the remaining candles and wrote the number in the margin of the book.",
  "By dawn the yard was quiet and the rope marks on the oak beam had been noted for the warden.",
].join(" ");

describe("extractiveSummary", () => {
  test("strips html and prefers informative sentences", () => {
    const summary = extractiveSummary("Bells", `<p>${ARTICLE}</p><script>alert(1)</script>`);
    expect(summary).not.toMatch(/<[^>]+>/);
    expect(summary).not.toContain("alert");
    expect(summary.toLowerCase()).toContain("lanterns");
    expect(summary.toLowerCase()).not.toContain("buy coins");
    expect(summary.length).toBeLessThan(ARTICLE.length);
  });

  test("falls back to the title when the feed text is only links and counts", () => {
    const summary = extractiveSummary(
      "Pac-Man's Siren Call",
      `<p>Article URL: <a href="https://example.com/a">https://example.com/a</a></p><p>Comments URL: <a href="https://news.ycombinator.com/item?id=1">https://news.ycombinator.com/item?id=1</a></p><p>Points: 11</p><p># Comments: 3</p>`,
    );
    expect(summary.toLowerCase()).toContain("pac-man");
    expect(summary).not.toContain("news.ycombinator.com");
  });

  test("handles empty input", () => {
    expect(extractiveSummary("", "")).toBe("No summary available.");
    expect(extractiveSummary("Only a title", "")).toContain("Only a title");
  });
});

describe("summarizePost", () => {
  test("stays extractive when no API key is set", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("network should not be called");
    };
    const result = await summarizePost({ title: "Bells", content: ARTICLE }, { apiKey: "", fetchImpl });
    expect(result.source).toBe("extractive");
    expect(result.model).toBeNull();
    expect(result.summary.toLowerCase()).toContain("lanterns");
  });

  test("uses the model response when a key is configured", async () => {
    let requestedModel = "";
    const fetchImpl: typeof fetch = async (input, init) => {
      expect(String(input)).toBe("https://example.test/v1/chat/completions");
      const body = JSON.parse(String(init?.body)) as { model: string };
      requestedModel = body.model;
      return new Response(JSON.stringify({ choices: [{ message: { content: "A quiet recap of the bells." } }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const result = await summarizePost(
      { title: "Bells", content: ARTICLE },
      { apiKey: "sk-test", model: "gpt-test-mini", baseUrl: "https://example.test/v1", fetchImpl },
    );
    expect(requestedModel).toBe("gpt-test-mini");
    expect(result).toEqual({ summary: "A quiet recap of the bells.", source: "llm", model: "gpt-test-mini" });
  });

  test("falls back when the model request fails", async () => {
    const fetchImpl: typeof fetch = async () => new Response("nope", { status: 500 });
    const result = await summarizePost({ title: "Bells", content: ARTICLE }, { apiKey: "sk-test", fetchImpl });
    expect(result.source).toBe("extractive");
    expect(result.model).toBeNull();
    expect(result.summary.toLowerCase()).toContain("lanterns");
  });

  test("retries with max_tokens when the endpoint rejects max_completion_tokens", async () => {
    const fields: string[] = [];
    const fetchImpl: typeof fetch = async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { max_completion_tokens?: number; max_tokens?: number };
      fields.push(body.max_completion_tokens ? "max_completion_tokens" : "max_tokens");
      if (body.max_completion_tokens) return new Response("unsupported", { status: 400 });
      return new Response(
        JSON.stringify({ choices: [{ message: { content: "Recovered summary from the model." } }] }),
        { status: 200 },
      );
    };
    const result = await summarizePost({ title: "Bells", content: ARTICLE }, { apiKey: "sk-test", fetchImpl });
    expect(fields).toEqual(["max_completion_tokens", "max_tokens"]);
    expect(result.source).toBe("llm");
    expect(result.summary).toContain("Recovered");
  });
});
