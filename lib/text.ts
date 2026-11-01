const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

export const STOPWORDS = new Set(
  `a an the and or but if of in on for to with from by at as is are was were be been being it this that these those not no into over after before about than then so such its their his her you your we our they them i he she his her our your its just more most some any can will would could should there here when where what which who whom why how than then also said says say new news have has had does did done into onto off out up down under again further once only own same other than too very http https www html htm href url`.split(
    /\s+/,
  ),
);

export function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (full, digits: string) => {
      const code = Number(digits);
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : full;
    })
    .replace(/&#x([0-9a-f]+);/gi, (full, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : full;
    })
    .replace(/&([a-z]+);/gi, (full, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? full);
}

export function htmlToText(input: string): string {
  if (!input) return "";
  let current = input.replace(/^\uFEFF/, "");
  for (let pass = 0; pass < 2; pass += 1) {
    const decoded = decodeEntities(current);
    if (decoded === current) break;
    current = decoded;
  }
  const stripped = current
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|li|tr|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return stripped
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function significantWords(text: string, minLength = 3): string[] {
  return (
    text
      .toLowerCase()
      .match(/[a-z0-9']+/g)
      ?.filter((word) => word.length > minLength && !STOPWORDS.has(word) && !/^\d+$/.test(word)) ?? []
  );
}

export function readableBody(text: string): string {
  const withoutLinks = text
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\bwww\.\S+/gi, " ")
    .replace(/\b(article|comments)\s+url\s*:?/gi, " ")
    .replace(/\bpoints\s*:\s*\d+/gi, " ")
    .replace(/#\s*comments\s*:\s*\d+/gi, " ");
  return withoutLinks
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 1)
    .join("\n");
}

export function excerpt(text: string, max = 180): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const sliced = flat.slice(0, max - 1);
  const trimmed = sliced.replace(/\s+\S*$/, "");
  return `${trimmed || sliced}…`;
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}
