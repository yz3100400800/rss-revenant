import { json, readBody } from "@/lib/http";
import { asRecord } from "@/lib/records";
import { summarizePost } from "@/lib/summarize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readBody(request);
  if (body === undefined) return json({ error: "Invalid JSON." }, 400);
  const record = asRecord(body);
  const title = typeof record?.title === "string" ? record.title.slice(0, 500) : "";
  const content = typeof record?.content === "string" ? record.content.slice(0, 12_000) : "";
  if (!title.trim() && !content.trim()) return json({ error: "Expected a title or some post text." }, 400);
  const result = await summarizePost({ title, content });
  return json(result);
}
