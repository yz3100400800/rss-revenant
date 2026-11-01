import { buildDigest } from "@/lib/digest";
import { json, readBody } from "@/lib/http";
import { asRecord } from "@/lib/records";
import type { DigestItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readItems(value: unknown): DigestItem[] {
  if (!Array.isArray(value)) return [];
  const items: DigestItem[] = [];
  for (const entry of value) {
    const record = asRecord(entry);
    if (!record) continue;
    const title = typeof record.title === "string" ? record.title : "";
    const content = typeof record.content === "string" ? record.content : "";
    const feedTitle = typeof record.feedTitle === "string" ? record.feedTitle : "";
    const link = typeof record.link === "string" ? record.link : "";
    if (!title.trim() && !content.trim()) continue;
    items.push({ title, content, feedTitle, link });
    if (items.length >= 40) break;
  }
  return items;
}

export async function POST(request: Request) {
  const body = await readBody(request);
  if (body === undefined) return json({ error: "Invalid JSON." }, 400);
  const items = asRecord(body)?.items;
  if (!Array.isArray(items)) return json({ error: "Expected items." }, 400);
  const digest = await buildDigest(readItems(items));
  return json(digest);
}
