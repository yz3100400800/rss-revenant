import { useEffect, useRef } from "react";
import type { DigestResult } from "@/lib/types";
import { safeHttpUrl } from "@/lib/url-guard";

type DigestDialogProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  digest: DigestResult | null;
  onClose: () => void;
  onAgain: () => void;
};

export function DigestDialog({ open, loading, error, digest, onClose, onAgain }: DigestDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const label = digest?.source === "llm" ? `Oracle · ${digest.model ?? "model"}` : "Extractive echo";

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="digest-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-head">
          <div>
            <p className="eyebrow">{digest ? label : "Night digest"}</p>
            <h2 id="digest-title">Tonight&apos;s digest</h2>
          </div>
          <button ref={closeRef} type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>
        {loading ? <p aria-live="polite">Gathering the night&apos;s reading…</p> : null}
        {error ? <p className="alert" role="alert">{error}</p> : null}
        {digest ? (
          <>
            <p>{digest.overview}</p>
            {digest.topics.map((topic) => (
              <section className="topic" key={topic.name}>
                <h3>{topic.name}</h3>
                <p>{topic.summary}</p>
                <ul className="headlines">
                  {topic.headlines.map((headline, index) => {
                    const href = safeHttpUrl(headline.link);
                    return (
                      <li key={`${topic.name}-${headline.title}-${index}`}>
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer">
                            {headline.title}
                          </a>
                        ) : (
                          headline.title
                        )}
                        {headline.feedTitle ? <span className="feed-meta"> · {headline.feedTitle}</span> : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            <p>
              <button type="button" className="ghost-button" onClick={onAgain} disabled={loading}>
                Raise again
              </button>
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
