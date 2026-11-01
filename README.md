# RSS Revenant

RSS Revenant is a web reader that brings the classic feed ritual back: you pick the sources, the new posts line up newest first, and a short summary sits beside the original. A night digest gathers what just loaded into a few themes.

The chrome is Halloween. The reading column is paper, on purpose. Spooky is the frame. The text has to stay easy to read.

It is an entry for the Kiroween 2026 hackathon, Resurrection category.

## Why this is a resurrection

RSS was the quiet agreement of the early web. A site published a feed. A reader subscribed. Nothing in the middle auctioned your attention. Social timelines buried that habit and called the format dead. The feeds did not die. They kept updating.

RSS Revenant digs the reader back up. Subscriptions stay on your machine. Summaries and the daily digest are the new part: a model when you give it a key, and an extractive echo when you do not. The demo works either way.

## What you can do

- Open the app and read three sample feeds immediately: Hacker News, BBC Technology, and NASA News. No account.
- Add or remove RSS and Atom URLs. The list is stored in this browser (`localStorage`), up to 20 feeds.
- Read a post with a short summary. The label says whether a model wrote it or the extractive fallback did.
- Raise a night digest across the posts currently loaded.
- Feeds are fetched by the server, so the browser does not have to call other sites directly.

## Run locally

Node.js 20.9 or newer.

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The sample feeds load on the first visit.

`npm test` runs the Vitest suite (feed parsing, URL checks, summaries, digest) and exits. `npm run build` produces the production build.

## Environment variables

Copy `.env.example` to `.env.local` if you want model summaries. All of these are optional. With none of them set, summaries and the digest still work.

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | No | Enables model summaries and the model digest. When it is unset or the request fails, the app uses the extractive fallback. |
| `OPENAI_MODEL` | No | Chat model name. Defaults to `gpt-4o-mini`. |
| `OPENAI_BASE_URL` | No | OpenAI-compatible chat completions base URL. Defaults to `https://api.openai.com/v1`. |

The key stays on the server. The status pill only reports whether a key is configured.

## Deploy to Vercel

The app is a Next.js App Router project with no database and no custom server.

1. Push this repository to GitHub.
2. In Vercel, import the repository. The framework preset is Next.js and should be detected automatically.
3. Leave the build command as `next build` (or the default) and the output as the Next.js default. Do not add a database or a rewrite.
4. Optionally set `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_BASE_URL` in the project environment. The deployment works with those variables empty.
5. Deploy. The first visit in a browser seeds the sample feeds in that browser.

## Project docs

- [docs/KIRO_USAGE.md](docs/KIRO_USAGE.md) — the `.kiro` steering files, specs, and save hook
- [docs/VIDEO_SCRIPT.md](docs/VIDEO_SCRIPT.md) — a short demo script
- [docs/DEVPOST.md](docs/DEVPOST.md) — Devpost description
- [docs/SOCIAL_DRAFT.md](docs/SOCIAL_DRAFT.md) — draft X post

Specs for feed management, summaries, and the digest live in `.kiro/specs`.

## License

RSS Revenant is released under the MIT License. See [LICENSE](LICENSE). Copyright (c) 2026 youyu.manman.
