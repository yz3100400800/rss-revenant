# Digest tasks

- [x] 1. Extractive digest
  - [x] 1.1 Group loaded posts by repeated terms and keep a leftover group
    - Requirements: DG-3, DG-6
  - [x] 1.2 Return a quiet empty state without calling the model
    - Requirements: DG-4
- [x] 2. Model digest
  - [x] 2.1 Request JSON topics when a key is set and keep only headlines that match loaded titles
    - Requirements: DG-1, DG-2
  - [x] 2.2 Fall back to the extractive digest when the model output is not usable
    - Requirements: DG-3
- [x] 3. Reader
  - [x] 3.1 Open a night-digest dialog from the loaded posts and label the source
    - Requirements: DG-1, DG-5
  - [x] 3.2 Link only public http(s) headlines
    - Requirements: DG-7
- [x] 4. Tests
  - [x] 4.1 Cover theme grouping, the empty state, the no-key path, fenced JSON, and unusable prose
    - Requirements: DG-2, DG-3, DG-4
