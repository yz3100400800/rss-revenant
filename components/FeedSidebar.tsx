import type { FormEvent } from "react";
import type { FeedResult, StoredFeed } from "@/lib/types";

type FeedSidebarProps = {
  feeds: StoredFeed[];
  results: Record<string, FeedResult | undefined>;
  activeFeed: string;
  totalItems: number;
  draftUrl: string;
  addError: string | null;
  onDraft: (value: string) => void;
  onAdd: (event: FormEvent) => void;
  onSelect: (url: string) => void;
  onRemove: (url: string) => void;
  onRestore: () => void;
};

export function FeedSidebar({
  feeds,
  results,
  activeFeed,
  totalItems,
  draftUrl,
  addError,
  onDraft,
  onAdd,
  onSelect,
  onRemove,
  onRestore,
}: FeedSidebarProps) {
  return (
    <aside className="sidebar">
      <p className="col-label">Feeds</p>
      <form className="add-form" onSubmit={onAdd}>
        <label className="field">
          <span>Feed URL</span>
          <span className="add-row">
            <input
              className="text-input"
              type="url"
              inputMode="url"
              placeholder="https://example.com/feed.xml"
              value={draftUrl}
              onChange={(event) => onDraft(event.target.value)}
              required
            />
            <button className="primary-button" type="submit">
              Add
            </button>
          </span>
        </label>
        {addError ? <p className="alert" role="alert">{addError}</p> : null}
      </form>
      <ul className="feed-list">
        <li>
          <button
            type="button"
            className="feed-select"
            aria-current={activeFeed === "all" ? "true" : undefined}
            onClick={() => onSelect("all")}
          >
            <span className="feed-name">All feeds</span>
            <span className="feed-meta">{totalItems} posts</span>
          </button>
        </li>
        {feeds.map((feed) => {
          const result = results[feed.url];
          const meta = result?.ok ? `${result.items.length} posts` : result ? "Unavailable" : "Waiting";
          return (
            <li key={feed.url} className="feed-row">
              <button
                type="button"
                className="feed-select"
                aria-current={activeFeed === feed.url ? "true" : undefined}
                onClick={() => onSelect(feed.url)}
              >
                <span className="feed-name">{feed.title}</span>
                <span className="feed-meta">{meta}</span>
                {result && !result.ok ? <span className="feed-error">{result.error}</span> : null}
              </button>
              <button type="button" className="icon-button" aria-label={`Remove ${feed.title}`} onClick={() => onRemove(feed.url)}>
                ×
              </button>
            </li>
          );
        })}
      </ul>
      <p className="hint">Up to 20 feeds, stored in this browser.</p>
      <button type="button" className="ghost-button" onClick={onRestore}>
        Restore samples
      </button>
    </aside>
  );
}
