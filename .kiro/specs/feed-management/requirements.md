# Feed management requirements

FM-1. WHEN a visitor opens the reader and this browser has no saved feed list, THE System SHALL preload Hacker News (`https://hnrss.org/frontpage`), BBC Technology (`https://feeds.bbci.co.uk/news/technology/rss.xml`), and NASA News (`https://www.nasa.gov/news-release/feed/`) so the reader can be tried without an account.

FM-2. WHEN the user submits a public http or https feed URL that is not already stored, THE System SHALL add it to the feed list and save the list in browser local storage.

FM-3. WHEN the user submits a value that is not a public http or https URL, THE System SHALL reject it with an explanation and leave the stored list unchanged.

FM-4. WHEN the user submits a feed URL that is already stored, THE System SHALL leave the list unchanged and explain that the feed is already present.

FM-5. WHEN the stored list already holds 20 feeds, THE System SHALL refuse another addition until one is removed.

FM-6. WHEN the user removes a feed, THE System SHALL delete it from the list and from local storage.

FM-7. WHEN the user removes every feed and later reloads, THE System SHALL keep the list empty until the user adds a feed or restores the samples.

FM-8. WHEN the user restores the sample feeds, THE System SHALL replace the stored list with the three built-in feeds.

FM-9. WHEN feeds are stored, THE System SHALL request them through the same-origin server route and SHALL NOT require the browser to call the feed hosts directly.

FM-10. WHEN a feed URL is not a public http or https address, THE System SHALL refuse to fetch it, including when a public URL redirects to a non-public host.

FM-11. WHEN one feed fails to load, THE System SHALL show that failure and still show items from the feeds that succeeded.

FM-12. WHEN items from more than one feed are shown together, THE System SHALL order them with the newest dated item first.

FM-13. WHEN the user selects one feed, THE System SHALL show only that feed's items, and WHEN the user selects all feeds, THE System SHALL show the merged list.

FM-14. WHEN the user reloads the app, THE System SHALL restore the feed list from local storage.

FM-15. WHEN a newly added feed reports a title and the stored title is only the hostname, THE System SHALL replace the placeholder with the feed title.
