import { loadFeeds } from "@/lib/fetch-feed";
import { json, readBody } from "@/lib/http";
import { asRecord } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readBody(request);
  if (body === undefined) return json({ error: "Invalid JSON." }, 400);
  const urls = asRecord(body)?.urls;
  if (!Array.isArray(urls)) return json({ error: "Expected urls." }, 400);
  try {
    const feeds = await loadFeeds(urls);
    return json({ feeds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load feeds.";
    return json({ error: message }, 400);
  }
}
