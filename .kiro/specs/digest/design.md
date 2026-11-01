# Digest design

## Request

The Night digest button calls `POST /api/digest` with `{ items: [{ title, content, feedTitle, link }] }` taken from the posts on screen, trimmed and capped at 40. The route calls `buildDigest` in `lib/digest.ts`.

The response is `{ overview, topics, source, model }`. Each topic is `{ name, summary, headlines: [{ title, link, feedTitle }] }`.

## Model

The prompt asks for JSON only: an overview and topics whose headlines are exact input titles. `parse` accepts a fenced blob by slicing from the first `{` to the last `}`. Headlines that are not loaded titles are dropped. If no topic survives, the result is discarded and the extractive digest is used. The dialog labels the source the same way a post summary does.

## Extractive grouping

Terms are lowercased words longer than three characters with stopwords removed. URLs, bare numbers, and Hacker News score lines are ignored, so a link-heavy feed does not become a theme named after `https`. A term that appears in two or more posts can become a topic, up to four, ordered by document frequency then name. Each post joins its strongest matching topic. A theme is kept only when at least two posts land in it. Smaller matches, and posts that match nothing, land in "Also stirring". If no term repeats, the overview says no theme dominates and the headlines sit under "From the feeds". An empty input returns a quiet overview and no topics, without a model call.

The dialog traps Escape and a backdrop click, and can raise the digest again.
