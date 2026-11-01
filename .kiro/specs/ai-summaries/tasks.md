# AI summary tasks

- [x] 1. Extractive summarizer
  - [x] 1.1 Reduce HTML to sentences and score them, with a lead bonus
    - Requirements: AI-4, AI-8
  - [x] 1.2 Fall back to the title when the body is only links and counts
    - Requirements: AI-8
- [x] 2. Model path
  - [x] 2.1 Call the configured chat model and base URL when a key is present
    - Requirements: AI-2, AI-3
  - [x] 2.2 On a missing key, a failed call, or an empty completion, return the extractive summary
    - Requirements: AI-4, AI-5
- [x] 3. Reader
  - [x] 3.1 Summarize the open post, label the source, and reuse the session result
    - Requirements: AI-1, AI-6, AI-7
  - [x] 3.2 Show whether the oracle is awake without exposing the key
    - Requirements: AI-9
- [x] 4. Tests
  - [x] 4.1 Cover extractive output, the no-key path, a successful model call, and a failed model call
    - Requirements: AI-4, AI-5, AI-8
