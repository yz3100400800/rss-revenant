# AI summary design

## Pipeline

`components/ArticlePane.tsx` asks `POST /api/summarize` with `{ title, content }` when a post is selected. The route calls `summarizePost` in `lib/summarize.ts`.

`summarizePost` resolves the model through `lib/llm.ts`. An explicit empty `apiKey` or a missing environment key skips the network and returns the extractive summary. A configured key calls `POST {baseUrl}/chat/completions`. The request uses `max_completion_tokens` and retries once with `max_tokens` when the endpoint answers 400. Any failure, empty completion, or thrown network error returns the extractive summary.

The result shape is `{ summary, source: "llm" | "extractive", model }`. `model` is null for the fallback. The article pane labels "Oracle · {model}" or "Extractive echo".

`GET /api/status` returns `{ enabled, model }` for the header pill. It does not return the key.

## Extractive method

`extractiveSummary` strips scripts, styles, and tags, decodes entities, drops HN-style URL and score lines, splits sentences, and keeps the two strongest. The first substantial sentence gets a lead bonus so the lede usually survives. Empty text falls back to the title, then to "No summary available."

Session cache is a map of item id to result in `Reader`. Retry is offered only when the request itself errors.
