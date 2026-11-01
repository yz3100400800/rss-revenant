import { describe, expect, test } from "vitest";
import { assertPublicHttpUrl, safeHttpUrl } from "../lib/url-guard";

describe("assertPublicHttpUrl", () => {
  test("accepts public http(s) feeds", () => {
    expect(assertPublicHttpUrl("https://hnrss.org/frontpage").hostname).toBe("hnrss.org");
    expect(assertPublicHttpUrl("http://8.8.8.8/rss.xml").hostname).toBe("8.8.8.8");
  });

  test("rejects non-public and non-http targets", () => {
    const blocked = [
      "javascript:alert(1)",
      "not a url",
      "http://127.0.0.1/rss",
      "http://localhost/rss",
      "http://169.254.169.254/latest",
      "http://10.1.2.3/rss",
      "http://192.168.1.5/a",
      "http://[::1]/rss",
      "https://user:pass@example.com/rss",
      "http://printer.local/feed",
    ];
    for (const url of blocked) {
      expect(() => assertPublicHttpUrl(url), url).toThrow();
    }
  });

  test("only links out over http(s)", () => {
    expect(safeHttpUrl("https://example.com/post")).toBe("https://example.com/post");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
  });
});
