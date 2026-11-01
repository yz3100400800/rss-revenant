# Digest requirements

DG-1. WHEN the user asks for the night digest, THE System SHALL build a digest across the posts currently loaded, up to 40 posts.

DG-2. WHEN `OPENAI_API_KEY` is set, THE System SHALL ask the model for an overview and named topics whose headlines are titles of loaded posts.

DG-3. WHEN the model is unavailable, fails, or returns nothing structured enough to render, THE System SHALL build an extractive digest that groups posts by repeated terms.

DG-4. WHEN no posts are loaded, THE System SHALL say that there is nothing to digest and SHALL NOT call the model.

DG-5. WHEN a digest is shown, THE System SHALL label whether it came from the model or from the extractive fallback.

DG-6. WHEN the extractive digest finds no repeated theme, THE System SHALL still list the loaded headlines under one group.

DG-7. WHEN a headline has a public http(s) link, THE System SHALL offer that link, and WHEN a link is not http or https, THE System SHALL show the title as text.
