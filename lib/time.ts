export function formatWhen(iso: string | null, now = Date.now()): string {
  if (!iso) return "Undated";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "Undated";
  const delta = now - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (Math.abs(delta) < minute) return "Just now";
  if (delta < 0) {
    return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  if (delta < hour) return `${Math.round(delta / minute)}m ago`;
  if (delta < day) return `${Math.round(delta / hour)}h ago`;
  if (delta < 14 * day) return `${Math.round(delta / day)}d ago`;
  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatFull(iso: string | null): string {
  if (!iso) return "Undated";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "Undated";
  return new Date(then).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
