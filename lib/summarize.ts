import { completeChat, type LlmConfig } from "./llm";
import { htmlToText, readableBody, significantWords } from "./text";
import type { SummaryResult } from "./types";

const SYSTEM_PROMPT =
  "You summarize RSS posts for a calm reading app. Write 2 short sentences. Use only facts present in the text. Do not add a preamble, a title, or bullet points.";

function preferProse(text: string): string {
  return readableBody(text).replace(/\s+/g, " ").trim();
}

function splitSentences(text: string): string[] {
  const parts = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
  const substantial = parts.filter((sentence) => sentence.length >= 40);
  return substantial.length > 0 ? substantial : parts;
}

export function extractiveSummary(title: string, content: string, maxSentences = 2): string {
  const cleanTitle = htmlToText(title).trim();
  const prose = preferProse(htmlToText(content));
  const source = prose.length >= 80 ? prose : [cleanTitle, prose].filter(Boolean).join(". ");
  const sentences = splitSentences(source);
  if (sentences.length === 0) return cleanTitle ? `${cleanTitle.replace(/[.!?]$/, "")}.` : "No summary available.";
  if (sentences.length <= maxSentences) return clamp(sentences.join(" "));

  const frequencies = new Map<string, number>();
  for (const word of significantWords(sentences.join(" "), 2)) {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }

  const ranked = sentences.map((sentence, index) => {
    const words = significantWords(sentence, 2);
    const density = words.reduce((sum, word) => sum + (frequencies.get(word) ?? 0), 0) / Math.max(words.length, 1);
    const leadBonus = index === 0 ? 0.45 : 0;
    return { sentence, index, score: density + leadBonus + (sentences.length - index) * 0.01 };
  });
  ranked.sort((a, b) => b.score - a.score || a.index - b.index);
  const picked = ranked.slice(0, maxSentences).sort((a, b) => a.index - b.index);
  return clamp(picked.map((item) => item.sentence).join(" "));
}

function clamp(summary: string): string {
  if (summary.length <= 500) return summary;
  const sliced = summary.slice(0, 497).replace(/\s+\S*$/, "");
  return `${sliced || summary.slice(0, 497)}…`;
}

export async function summarizePost(
  input: { title: string; content: string },
  llm?: LlmConfig,
): Promise<SummaryResult> {
  const title = htmlToText(input.title).slice(0, 500);
  const content = htmlToText(input.content).slice(0, 8000);
  const fallback = (): SummaryResult => ({
    summary: extractiveSummary(title, content),
    source: "extractive",
    model: null,
  });

  try {
    const chat = await completeChat(
      SYSTEM_PROMPT,
      `Title: ${title || "(untitled)"}\n\n${content || "No body text was included."}`,
      llm,
      400,
    );
    if (!chat) return fallback();
    return { summary: chat.text.slice(0, 1000), source: "llm", model: chat.model };
  } catch {
    return fallback();
  }
}
