import { paragraphs, readableBody } from "@/lib/text";
import { formatFull } from "@/lib/time";
import type { FeedItem, SummaryResult } from "@/lib/types";
import { safeHttpUrl } from "@/lib/url-guard";

type ArticlePaneProps = {
  item: FeedItem | null;
  summary: SummaryResult | null;
  summaryLoading: boolean;
  summaryError: string | null;
  onBack: () => void;
  onRetry: () => void;
};

export function ArticlePane({ item, summary, summaryLoading, summaryError, onBack, onRetry }: ArticlePaneProps) {
  if (!item) {
    return (
      <section className="article-col" aria-label="Reading">
        <article className="paper welcome">
          <p className="kicker">Resurrection</p>
          <h2>The reader, risen.</h2>
          <p>
            RSS was the web&apos;s quiet agreement: a site published, a reader subscribed, and nobody auctioned the space
            in between. The timeline buried that pact. The feeds kept speaking anyway.
          </p>
          <p>
            Hacker News, BBC Technology, and NASA are already on the table. Open a dispatch for a short summary, then
            raise a night digest across everything loaded. With an API key the oracle writes them. Without one, an
            extractive echo still does the job.
          </p>
        </article>
      </section>
    );
  }

  const link = safeHttpUrl(item.link);
  const body = paragraphs(readableBody(item.contentText));
  const label = summary?.source === "llm" ? `Oracle · ${summary.model ?? "model"}` : "Extractive echo";

  return (
    <section className="article-col" aria-label="Reading">
      <article className="paper">
        <button type="button" className="back ghost-button" onClick={onBack}>
          All dispatches
        </button>
        <p className="kicker">{item.feedTitle}</p>
        <h2>{item.title}</h2>
        <p className="byline">{formatFull(item.publishedAt)}</p>
        {link ? (
          <p>
            <a className="text-link" href={link} target="_blank" rel="noreferrer">
              Open the original
            </a>
          </p>
        ) : null}
        <aside className="summary" aria-live="polite">
          <p className="summary-label">{summary ? label : "Summary"}</p>
          {summaryLoading ? <p>The oracle is listening…</p> : null}
          {summaryError ? (
            <p className="alert" role="alert">
              {summaryError}{" "}
              <button type="button" className="ghost-button" onClick={onRetry}>
                Try again
              </button>
            </p>
          ) : null}
          {summary ? <p>{summary.summary}</p> : null}
          {summary?.source === "extractive" ? (
            <p className="byline">Drawn from the feed text. Set OPENAI_API_KEY to wake the model.</p>
          ) : null}
        </aside>
        <div className="body-copy">
          {body.length > 0 ? (
            body.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)
          ) : (
            <p>This feed item did not include a writeup. The original is linked above.</p>
          )}
        </div>
      </article>
    </section>
  );
}
