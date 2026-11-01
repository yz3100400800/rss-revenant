---
inclusion: always
---

# Structure

```
app/                  App Router pages and route handlers
app/api/feeds         POST { urls } -> parsed feeds or per-feed errors
app/api/summarize     POST { title, content } -> summary
app/api/digest        POST { items } -> overview and topics
app/api/status        GET { enabled, model }
components/           Reader shell and the four panes
lib/parse-feed.ts     RSS and Atom parsing
lib/fetch-feed.ts     Public-URL fetch with manual redirects
lib/summarize.ts      Extractive summary and model fallback
lib/digest.ts         Extractive themes and model JSON digest
lib/storage.ts        localStorage feed list and sample seeding
lib/sample-feeds.ts   The three preloaded feeds
tests/                Vitest
.kiro/                Steering, specs, and the save hook
docs/                 Hackathon writeups
```

Keep parsing, summarization, and digest logic in `lib/` so tests do not need the network or React. Route handlers should stay thin. The client may import types, storage, and URL checks. It must not import the XML parser.

`.kiro` is part of the product. Do not gitignore it.
