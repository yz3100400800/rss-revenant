# How this repo uses Kiro

RSS Revenant keeps a `.kiro` directory at the repository root so Kiro's spec-driven workflow has something real to read. The directory is committed. It is not gitignored. Nothing in here is a claim about a feature that is not actually in the tree.

These files were authored for Kiro's spec-driven workflow. The application implements the requirements and tasks they describe. Steering, specs, and the save hook are present as files Kiro can load. This note does not invent extra Kiro machinery beyond what is listed below.

## Steering

`.kiro/steering/` holds three documents, each with YAML front matter `inclusion: always`:

- `product.md` — what the reader is, who it is for, and what it refuses to become (no accounts, no database, no engagement ranking).
- `tech.md` — Next.js App Router, server-side feed fetch, the optional model, the extractive fallback, and Vitest.
- `structure.md` — where routes, `lib/`, the client, tests, and `.kiro` live.

`inclusion: always` is Kiro's mark for steering that should stay in context on every turn, rather than steering that is pulled in only when a file matches.

## Specs

Three features each have the trio Kiro expects under `.kiro/specs/<feature>/`:

| Feature | Path | What it locks |
| --- | --- | --- |
| Feed management | `.kiro/specs/feed-management/` | Sample feeds, local storage, public URL checks, server parse, per-feed errors |
| AI summaries | `.kiro/specs/ai-summaries/` | Model call, extractive fallback, source labels, session reuse |
| Digest | `.kiro/specs/digest/` | Night digest, model JSON, extractive themes, empty state |

`requirements.md` is written in EARS form: `WHEN ... THE System SHALL ...`, with ids such as `FM-1` and `AI-4`. `design.md` names the modules and the request flow that satisfy those requirements. `tasks.md` is the implementation checklist, marked done, and each task points back at the requirement ids.

The code follows that split. Parsing and summarization live in `lib/` and are what `tests/` exercises. Route handlers stay thin. The reader UI is the client shell described in the feed-management design.

## Hooks

`.kiro/hooks/test-on-save.json` is a v1 hook:

- name: `test-on-save`
- trigger: `PostFileSave`
- matcher: `\.(ts|tsx)$`
- action: command `npm test`

On a TypeScript save, Kiro's hook runner is configured to run the Vitest suite. `npm test` is `vitest run`, so the command exits instead of watching. The suite covers feed parsing, the public-URL guard, the summarizer (including the no-key and failed-model paths), and the digest.

## What is not in `.kiro`

There is no second hook, no steering file with a different inclusion mode, and no spec for accounts or a database. Those were left out because the product does not have them. If a behavior is not in the requirements, it is not a promised behavior.
