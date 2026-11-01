import { json } from "@/lib/http";
import { llmStatus } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return json(llmStatus());
}
