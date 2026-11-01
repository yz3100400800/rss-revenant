# Demo video script (~2:50)

No copyrighted music. Record voice only, or voice with sound you recorded yourself. Do not use a commercial track, a song, or a stock bed you do not have the rights to.

Speak the lines marked **Say** at a conversational pace. On-screen beats are what the recording should show while that line is spoken. Total target is about 170 seconds: 0:00–0:15 problem, 0:15–2:00 demo, 2:00–2:40 Kiro, 2:40–2:50 wrap.

## 0:00–0:15 — Problem

**Show:** A blank desktop, then the RSS Revenant tab. Do not play music.

**Say:** Algorithmic feeds buried an old pact. You did not choose the sources, and the sources did not belong to you. RSS was that pact: a site published, a reader subscribed. It never really died. It just got quiet.

## 0:15–2:00 — Demo

**Show:** The open reader. Point at the three sample feeds in the sidebar as they are named. Let the post list fill. Hover the "Oracle asleep" pill. Open one post and hold on the paper column, the summary label, and "Open the original". Click "Night digest", scroll the themes, close it. Paste a feed URL, show a bad URL being rejected, then add a real one. Reload the page and show the new feed still listed. Click "Restore samples".

**Say:** This is RSS Revenant. I open it and three sample feeds are already in the sidebar: Hacker News, BBC Technology, and NASA. There is no account and nothing to configure. The list lives in this browser. The pill says the oracle is asleep, because this demo has no API key, so summaries stay extractive. Posts arrive newest first under All feeds. I'll open a dispatch. The frame of the app is dark, and the reading column sits on paper so the body stays easy to read. A short summary appears above the text. The label says extractive echo, and the note says it was drawn from the feed text. Open the original leaves the reader and visits the source. Listen again refreshes the pile without touching the saved list. Set OPENAI_API_KEY and this same request calls the model named in OPENAI_MODEL. OPENAI_BASE_URL can point at a compatible host. If the call fails, the summary falls back to the echo, and the post is still there. I'll raise the night digest. It takes the posts on screen and groups repeated themes, with an overview on top. Close that. In the feed box, a local address is refused before it is stored. I'll add a public feed URL instead. The server fetches and parses it, so the browser does not cross origins. I'll reload the tab. The feed I added is still in the list. Restore samples puts the original three back.

## 2:00–2:40 — Kiro

**Show:** The `.kiro` tree in the editor: `steering/product.md` with `inclusion: always`, one `requirements.md` so the WHEN / SHALL lines are visible, `tasks.md`, and `.kiro/hooks/test-on-save.json`. If you save a TypeScript file, you can flash the test command. Do not claim a hook ran if you do not show it.

**Say:** The repo carries a .kiro directory for Kiro's spec-driven workflow, and those files are committed, not ignored. Steering for product, tech, and structure is marked inclusion always, so Kiro keeps them in context. Feed management, summaries, and the digest each have requirements in EARS form, a design, and tasks. The requirements say WHEN this happens, the system SHALL do that, and the code follows those tasks. The hook named test-on-save runs npm test after a TypeScript save. The files were written for that workflow. The spec lives next to the code, and the tests are what the hook is there to run.

## 2:40–2:50 — Wrap

**Show:** The reader again, post list visible. End on the title.

**Say:** RSS Revenant is the reader, risen. It is MIT licensed. Clone it, run npm install and npm run dev, and the feeds start talking.
