import { describe, expect, test } from "vitest";
import { buildDigest, extractiveDigest } from "../lib/digest";
import type { DigestItem } from "../lib/types";

const items: DigestItem[] = [
  {
    title: "Pumpkin lanterns return to the square",
    content: "The square glows.",
    feedTitle: "Town",
    link: "https://example.com/a",
  },
  {
    title: "A pumpkin record falls overnight",
    content: "Growers cheered.",
    feedTitle: "Town",
    link: "https://example.com/b",
  },
  {
    title: "Satellite maps a quiet storm",
    content: "Clouds stacked.",
    feedTitle: "Sky",
    link: "https://example.com/c",
  },
  {
    title: "Second satellite watches the pole",
    content: "Ice gleamed.",
    feedTitle: "Sky",
    link: "https://example.com/d",
  },
  {
    title: "Choir practice moved indoors",
    content: "The hall was warm.",
    feedTitle: "Chapel",
    link: "https://example.com/e",
  },
];

describe("extractiveDigest", () => {
  test("groups repeated themes and keeps leftovers", () => {
    const digest = extractiveDigest(items);
    const names = digest.topics.map((topic) => topic.name);
    expect(digest.overview).toContain("Pumpkin");
    expect(digest.overview).toContain("Satellite");
    expect(names).toEqual(expect.arrayContaining(["Pumpkin", "Satellite", "Also stirring"]));
    const pumpkin = digest.topics.find((topic) => topic.name === "Pumpkin");
    expect(pumpkin?.headlines.map((headline) => headline.title)).toEqual([
      "Pumpkin lanterns return to the square",
      "A pumpkin record falls overnight",
    ]);
    expect(digest.topics.find((topic) => topic.name === "Also stirring")?.headlines[0]?.title).toBe(
      "Choir practice moved indoors",
    );
  });

  test("does not treat link dumps as a theme", () => {
    const noisy: DigestItem[] = [
      {
        title: "Pumpkin lanterns return to the square",
        content:
          "Article URL: https://example.com/a\nComments URL: https://news.ycombinator.com/item?id=1\nPoints: 11\n# Comments: 3",
        feedTitle: "HN",
        link: "https://example.com/a",
      },
      {
        title: "A pumpkin record falls overnight",
        content:
          "Article URL: https://example.com/b\nComments URL: https://news.ycombinator.com/item?id=2\nPoints: 4\n# Comments: 1",
        feedTitle: "HN",
        link: "https://example.com/b",
      },
      {
        title: "Choir practice moved indoors",
        content: "Article URL: https://example.com/c\nPoints: 2\n# Comments: 0",
        feedTitle: "HN",
        link: "https://example.com/c",
      },
    ];
    const names = extractiveDigest(noisy).topics.map((topic) => topic.name);
    expect(names).toContain("Pumpkin");
    expect(names).not.toEqual(expect.arrayContaining(["Https", "Http", "Article", "Comments", "Points"]));
  });

  test("speaks softly when there is nothing to read", () => {
    expect(extractiveDigest([])).toEqual({
      overview: "Nothing has risen in this window. The night is quiet.",
      topics: [],
    });
  });

  test("uses a single pile when no theme repeats", () => {
    const digest = extractiveDigest([
      {
        title: "A solitary bell rings at dusk",
        content: "Nothing else rhymes with it.",
        feedTitle: "Chapel",
        link: "",
      },
    ]);
    expect(digest.topics[0]?.name).toBe("From the feeds");
    expect(digest.overview).toContain("No single theme");
  });
});

describe("buildDigest", () => {
  test("does not call the model without a key", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("network should not be called");
    };
    const digest = await buildDigest(items, { apiKey: "", fetchImpl });
    expect(digest.source).toBe("extractive");
    expect(digest.model).toBeNull();
    expect(digest.topics.length).toBeGreaterThan(0);
  });

  test("accepts a JSON digest wrapped in a fence", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: [
                  "```json",
                  JSON.stringify({
                    overview: "Two themes lead the night. The rest can wait.",
                    topics: [
                      {
                        name: "Pumpkin",
                        summary: "Lanterns are back.",
                        headlines: ["Pumpkin lanterns return to the square"],
                      },
                    ],
                  }),
                  "```",
                ].join("\n"),
              },
            },
          ],
        }),
        { status: 200 },
      );
    const digest = await buildDigest(items, { apiKey: "sk-test", model: "gpt-test-mini", fetchImpl });
    expect(digest.source).toBe("llm");
    expect(digest.model).toBe("gpt-test-mini");
    expect(digest.overview).toContain("Two themes");
    expect(digest.topics[0]?.headlines[0]?.link).toBe("https://example.com/a");
  });

  test("falls back when the model returns prose", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "Just some prose, no structure." } }] }), {
        status: 200,
      });
    const digest = await buildDigest(items, { apiKey: "sk-test", fetchImpl });
    expect(digest.source).toBe("extractive");
    expect(digest.overview).toContain("Tonight's digest");
  });
});
