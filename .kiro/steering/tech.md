---
inclusion: always
---

# Tech

- Next.js App Router and TypeScript. The app must build with `npm run build` and deploy on Vercel with no custom server and no database.
- React client UI. Persist the feed list in `localStorage`. Do not require sign-in.
- Fetch and parse feeds on the server (`app/api/feeds`) so the browser does not call feed hosts directly.
- Accept RSS 2.0, Atom, and RSS 1.0. Strip HTML before display. Never render feed markup as HTML.
- Refuse feed URLs that are not public `http` or `https` targets. One bad feed must not blank the others.
- Summaries and the digest go through `app/api/summarize` and `app/api/digest`. Read `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o-mini`), and optional `OPENAI_BASE_URL`.
- If the key is empty or the model request fails, return an extractive result and label it. Do not throw the failure at the reader.
- Unit tests are Vitest, in `tests/`, and `npm test` must exit. Cover feed parsing and the summarizer.
- Do not add a paid service, a required API key, or a new framework.
