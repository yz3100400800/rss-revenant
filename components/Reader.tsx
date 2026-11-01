"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArticlePane } from "@/components/ArticlePane";
import { DigestDialog } from "@/components/DigestDialog";
import { FeedSidebar } from "@/components/FeedSidebar";
import { PostList } from "@/components/PostList";
import { isPlaceholderTitle, loadFeeds, MAX_FEEDS, restoreSamples, saveFeeds } from "@/lib/storage";
import type { DigestResult, FeedItem, FeedResult, StoredFeed, SummaryResult } from "@/lib/types";
import { assertPublicHttpUrl } from "@/lib/url-guard";

function hostnameTitle(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Feed";
  }
}

export function Reader() {
  const [feeds, setFeeds] = useState<StoredFeed[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [results, setResults] = useState<Record<string, FeedResult>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFeed, setActiveFeed] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, SummaryResult>>({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryNonce, setSummaryNonce] = useState(0);
  const [digestOpen, setDigestOpen] = useState(false);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);
  const [digest, setDigest] = useState<DigestResult | null>(null);
  const [status, setStatus] = useState<{ enabled: boolean; model: string } | null>(null);
  const [draftUrl, setDraftUrl] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const feedsRef = useRef(feeds);
  feedsRef.current = feeds;
  const requestRef = useRef(0);
  const summariesRef = useRef(summaries);
  summariesRef.current = summaries;

  useEffect(() => {
    setFeeds(loadFeeds());
    setHydrated(true);
    fetch("/api/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { enabled?: boolean; model?: string }) => {
        setStatus({ enabled: Boolean(data.enabled), model: data.model || "gpt-4o-mini" });
      })
      .catch(() => setStatus({ enabled: false, model: "gpt-4o-mini" }));
  }, []);

  const refresh = useCallback(async (list: StoredFeed[]) => {
    const requestId = ++requestRef.current;
    if (list.length === 0) {
      setResults({});
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: list.map((feed) => feed.url) }),
      });
      const data = (await response.json()) as { feeds?: FeedResult[]; error?: string };
      if (!response.ok || !data.feeds) throw new Error(data.error || "Could not load feeds.");
      if (requestRef.current !== requestId) return;
      const next: Record<string, FeedResult> = {};
      for (const feed of data.feeds) next[feed.url] = feed;
      setResults(next);
    } catch (error) {
      if (requestRef.current !== requestId) return;
      setLoadError(error instanceof Error ? error.message : "Could not load feeds.");
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, []);

  const urlsKey = feeds.map((feed) => feed.url).join("|");

  useEffect(() => {
    if (!hydrated) return;
    void refresh(feedsRef.current);
  }, [hydrated, urlsKey, refresh]);

  useEffect(() => {
    if (!hydrated) return;
    let changed = false;
    const next = feeds.map((feed) => {
      const result = results[feed.url];
      if (!result?.ok || !isPlaceholderTitle(feed) || !result.title || result.title === feed.title) return feed;
      changed = true;
      return { ...feed, title: result.title };
    });
    if (!changed) return;
    setFeeds(next);
    saveFeeds(next);
  }, [results, feeds, hydrated]);

  const items = useMemo(() => {
    const merged: FeedItem[] = [];
    for (const feed of feeds) {
      const result = results[feed.url];
      if (!result?.ok) continue;
      const feedTitle = feed.title || result.title;
      for (const item of result.items) merged.push({ ...item, feedTitle });
    }
    merged.sort((a, b) => {
      const left = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const right = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return right - left;
    });
    return merged;
  }, [feeds, results]);

  const visible = activeFeed === "all" ? items : items.filter((item) => item.feedUrl === activeFeed);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const activeTitle = activeFeed === "all" ? "All feeds" : (feeds.find((feed) => feed.url === activeFeed)?.title ?? "Feed");

  useEffect(() => {
    if (selectedId && !visible.some((item) => item.id === selectedId)) setSelectedId(null);
  }, [visible, selectedId]);

  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  useEffect(() => {
    const current = selectedRef.current;
    if (!current) return;
    const id = current.id;
    if (summariesRef.current[id]) {
      setSummaryLoading(false);
      setSummaryError(null);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setSummaryLoading(true);
    setSummaryError(null);
    fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: current.title,
        content: current.contentText.slice(0, 8000),
        url: current.link,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as SummaryResult & { error?: string };
        if (!response.ok) throw new Error(data.error || "The summary failed.");
        if (!active) return;
        setSummaries((existing) => ({ ...existing, [id]: data }));
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSummaryError(error instanceof Error ? error.message : "The summary failed.");
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [selected?.id, summaryNonce]);

  function commitFeeds(next: StoredFeed[], active: string) {
    setFeeds(next);
    saveFeeds(next);
    setActiveFeed(active);
    setDigest(null);
  }

  function addFeed(event: FormEvent) {
    event.preventDefault();
    let normalized = "";
    try {
      normalized = assertPublicHttpUrl(draftUrl).toString();
    } catch (error) {
      setAddError(error instanceof Error ? error.message : "Enter a full http or https URL.");
      return;
    }
    if (feeds.some((feed) => feed.url === normalized)) {
      setAddError("That feed is already in the list.");
      return;
    }
    if (feeds.length >= MAX_FEEDS) {
      setAddError("The list holds 20 feeds. Remove one first.");
      return;
    }
    setAddError(null);
    setDraftUrl("");
    commitFeeds([...feeds, { url: normalized, title: hostnameTitle(normalized) }], normalized);
  }

  function removeFeed(url: string) {
    commitFeeds(
      feeds.filter((feed) => feed.url !== url),
      activeFeed === url ? "all" : activeFeed,
    );
    setResults((current) => {
      const copy = { ...current };
      delete copy[url];
      return copy;
    });
  }

  const closeDigest = useCallback(() => setDigestOpen(false), []);

  const raiseDigest = useCallback(
    async (force = false) => {
      setDigestOpen(true);
      if (digestLoading) return;
      if (digest && !force) return;
      setDigestLoading(true);
      setDigestError(null);
      try {
        const response = await fetch("/api/digest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.slice(0, 40).map((item) => ({
              title: item.title,
              content: item.contentText.slice(0, 500),
              feedTitle: item.feedTitle,
              link: item.link,
            })),
          }),
        });
        const data = (await response.json()) as DigestResult & { error?: string };
        if (!response.ok) throw new Error(data.error || "The digest failed.");
        setDigest(data);
      } catch (error) {
        setDigestError(error instanceof Error ? error.message : "The digest failed.");
      } finally {
        setDigestLoading(false);
      }
    },
    [digest, digestLoading, items],
  );

  const awake = Boolean(status?.enabled);

  return (
    <div className="app">
      <a className="skip" href="#dispatches">
        Skip to dispatches
      </a>
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <p className="eyebrow">Kiroween 2026 · Resurrection</p>
            <h1 className="brand-title">RSS Revenant</h1>
          </div>
        </div>
        <div className="top-actions">
          <span
            className={awake ? "status-pill awake" : "status-pill"}
            title="Set OPENAI_API_KEY to use a model. Otherwise summaries stay extractive."
          >
            {awake ? `Oracle awake · ${status?.model}` : "Oracle asleep"}
          </span>
          <button type="button" className="primary-button" onClick={() => void raiseDigest(false)} disabled={!hydrated || items.length === 0}>
            Night digest
          </button>
        </div>
      </header>
      <main className={selected ? "workspace has-selection" : "workspace"}>
        {hydrated ? (
          <>
            <FeedSidebar
              feeds={feeds}
              results={results}
              activeFeed={activeFeed}
              totalItems={items.length}
              draftUrl={draftUrl}
              addError={addError}
              onDraft={setDraftUrl}
              onAdd={addFeed}
              onSelect={setActiveFeed}
              onRemove={removeFeed}
              onRestore={() => {
                commitFeeds(restoreSamples(), "all");
                setSelectedId(null);
                setAddError(null);
              }}
            />
            <PostList
              title={activeTitle}
              items={visible}
              selectedId={selectedId}
              loading={loading}
              error={loadError}
              hasFeeds={feeds.length > 0}
              onSelect={setSelectedId}
              onRefresh={() => void refresh(feeds)}
            />
            <ArticlePane
              item={selected}
              summary={selected ? (summaries[selected.id] ?? null) : null}
              summaryLoading={summaryLoading && Boolean(selected)}
              summaryError={summaryError}
              onBack={() => setSelectedId(null)}
              onRetry={() => setSummaryNonce((value) => value + 1)}
            />
          </>
        ) : (
          <p className="booting">Raising the reader…</p>
        )}
      </main>
      <DigestDialog
        open={digestOpen}
        loading={digestLoading}
        error={digestError}
        digest={digest}
        onClose={closeDigest}
        onAgain={() => void raiseDigest(true)}
      />
    </div>
  );
}
