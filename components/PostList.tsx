import { excerpt, readableBody } from "@/lib/text";
import { formatWhen } from "@/lib/time";
import type { FeedItem } from "@/lib/types";

type PostListProps = {
  title: string;
  items: FeedItem[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  hasFeeds: boolean;
  onSelect: (id: string) => void;
  onRefresh: () => void;
};

export function PostList({ title, items, selectedId, loading, error, hasFeeds, onSelect, onRefresh }: PostListProps) {
  return (
    <section className="list-col" id="dispatches" aria-labelledby="dispatch-heading">
      <div className="list-head">
        <h2 className="col-label" id="dispatch-heading">
          {title}
        </h2>
        <button type="button" className="ghost-button" onClick={onRefresh}>
          Listen again
        </button>
      </div>
      <p className="feed-meta" aria-live="polite">
        {loading ? "Listening to the feeds…" : `${items.length} ${items.length === 1 ? "dispatch" : "dispatches"}`}
      </p>
      {error ? <p className="alert" role="alert">{error}</p> : null}
      {items.length === 0 && !loading ? (
        <p className="empty">
          {hasFeeds ? "No dispatches came back from these feeds." : "The list is empty. Add a feed, or restore the samples."}
        </p>
      ) : (
        <ul className="post-list">
          {items.map((item) => {
            const blurb = excerpt(readableBody(item.contentText));
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="post"
                  aria-current={item.id === selectedId ? "true" : undefined}
                  onClick={() => onSelect(item.id)}
                >
                  <span className="post-kicker">
                    <span>{item.feedTitle}</span>
                    <span>{formatWhen(item.publishedAt)}</span>
                  </span>
                  <span className="post-title">{item.title}</span>
                  {blurb ? <span className="post-excerpt">{blurb}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
