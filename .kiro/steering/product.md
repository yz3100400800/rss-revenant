---
inclusion: always
---

# Product

RSS Revenant is a Halloween-themed RSS and Atom reader for the Kiroween 2026 hackathon, Resurrection category. It brings back the classic reader: a person chooses feeds, reads new posts, and is not ranked by an engagement auction.

The reader must be usable the moment it opens. The first visit preloads Hacker News, BBC Technology, and NASA News. There is no account and no database. The feed list lives in the browser.

Every opened post gets a short summary. A night digest groups the loaded posts into a few themes. When `OPENAI_API_KEY` is set, both features call a chat model. When the key is missing or the model fails, the same screens show an extractive fallback. The deployed demo must never depend on a key being present.

The chrome can be spooky. The reading column must stay high-contrast and quiet. Theme is seasoning. The text is the product.

## Out of scope

- Accounts, sync, or a hosted database
- Writing or editing posts
- Fetching and storing full article pages beyond the feed text
- Ranking posts by predicted engagement
