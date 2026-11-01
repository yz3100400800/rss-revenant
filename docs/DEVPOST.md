# RSS Revenant

## Inspiration

RSS was how a lot of us learned to read the web. A site published, a reader subscribed, and the list was yours. Timelines replaced that with a ranking nobody asked to negotiate, and the format got talked about like it had died. The feeds were still there. We wanted the old reader back, with one new trick: a short briefing so a pile of posts is easier to face. Halloween made the name obvious. A revenant is something that returns. This one returns as a reader.

## What it does

RSS Revenant is a web reader. On the first visit it preloads Hacker News, BBC Technology, and NASA News, so a judge can read immediately without signing up. You can add or remove RSS and Atom URLs. The list stays in the browser.

Posts line up newest first. Open one and a summary appears above the feed text, on a paper column that stays readable against the dark Halloween chrome. Ask for the night digest and the loaded posts collapse into an overview and a few themes.

If `OPENAI_API_KEY` is set, summaries and the digest use a chat model (`OPENAI_MODEL`, default `gpt-4o-mini`, with an optional compatible `OPENAI_BASE_URL`). If the key is missing or the model fails, the same screens show an extractive fallback and say so. The demo does not depend on a key.

## How we built it

Next.js App Router and TypeScript, with no database. The feed list is `localStorage`. A server route fetches and parses RSS 2.0, Atom, and RSS 1.0 so the browser never has to call feed hosts itself. Private and local URLs are refused, including redirects onto them. HTML in feeds is reduced to text before it is shown.

The model call is a chat completion. The extractive summary scores sentences, and the extractive digest groups posts by repeated terms. Vitest covers parsing, the URL guard, both summary paths, and the digest. Specs for the three features live in `.kiro/specs` in EARS form (`WHEN ... THE System SHALL ...`), with steering docs and a save hook that runs `npm test`. Those files were written for Kiro's spec-driven workflow and the app follows them. Deploying is a stock Vercel Next.js project.

## Challenges

Feed XML is messy. One item is sometimes an object and sometimes an array, Atom links are attributes, and `content:encoded` is the real body hiding under a short description. Hacker News descriptions are mostly URLs and point counts, which make a bad summary unless you throw those lines out and keep the title.

Fetching user-supplied URLs is a sharp edge. We block non-public hosts and re-check redirects so a feed cannot point the server at a link-local address. The other hard part was the model being optional. Every AI screen had to have a finished extractive twin, or the deployed demo would be a blank card whenever a key was missing.

Making it look like Halloween without making it hard to read took longer than the parser. The frame is dark. The article sits on paper.

## Accomplishments that we're proud of

The reader works the moment you open it, with real feeds and no account. Summaries and the digest degrade on purpose, and the UI says which path you are on. Parsing and the fallback are tested. The subscription list never leaves the browser. The `.kiro` steering, specs, and hook are in the repo and match the behavior, instead of being a writeup that drifted away from the code.

## What we learned

A reader is mostly a careful fetch, a tolerant parser, and a typographic surface. The model is a layer on top, and it is only useful if the layer underneath still finishes the job. Specs helped because the fallback behavior was easy to waffle on in a UI and hard to waffle on in a `SHALL`.

## What's next

OPML import and export, so a real subscription list can move in. Folders. Fetching the article page when the feed only has a title, still behind the same public-URL rules. A slightly smarter extractive digest that notices names, not only repeated words. Sync can wait. The list being yours was the point of bringing RSS back.
