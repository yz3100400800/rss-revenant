# AI summary requirements

AI-1. WHEN the user opens a post, THE System SHALL request a short summary of that post's title and feed text.

AI-2. WHEN `OPENAI_API_KEY` is set, THE System SHALL summarize the post with a chat completion using `OPENAI_MODEL`, or `gpt-4o-mini` when `OPENAI_MODEL` is unset.

AI-3. WHEN `OPENAI_BASE_URL` is set, THE System SHALL send the chat completion to that OpenAI-compatible base URL.

AI-4. WHEN `OPENAI_API_KEY` is missing or blank, THE System SHALL show an extractive summary built from the post text and still show the post.

AI-5. WHEN the model request fails or returns nothing usable, THE System SHALL fall back to the extractive summary and still show the post.

AI-6. WHEN a summary is shown, THE System SHALL label whether it came from the model or from the extractive fallback.

AI-7. WHEN a summary has already been produced for a post in the current session, THE System SHALL reuse it instead of requesting another one.

AI-8. WHEN post text contains HTML, THE System SHALL summarize readable text rather than raw tags, and THE System SHALL ignore feed lines that are only article URLs, comment URLs, or point counts.

AI-9. WHEN the reader loads, THE System SHALL show whether a model key is configured, without revealing the key.
