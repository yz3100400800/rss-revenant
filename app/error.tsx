"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="booting">
      <p className="eyebrow">RSS Revenant</p>
      <h1>The séance broke.</h1>
      <p>{error.message || "Something went wrong while raising the reader."}</p>
      <button type="button" className="primary-button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
