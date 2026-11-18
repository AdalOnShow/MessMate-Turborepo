const moneyFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatMoney(n: number) {
  return `৳${moneyFmt.format(n)}`;
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(n);
}

/** Up to two uppercase initials from a name, falling back to the email's local part. */
export function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "User";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/*
 * Calendar dates (expense, deposit and bazaar dates) are stored as UTC
 * midnight of the chosen day. They must be built and shown in UTC: showing
 * them in the browser's timezone moved late-evening entries in Dhaka
 * (UTC+6) to the next day.
 */

/** The local calendar day of `date`, as UTC midnight ISO. */
export function toDateOnlyISO(date: Date = new Date()): string {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString();
}

/** A stored calendar date as a local Date (for date pickers). */
export function fromDateOnlyISO(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Formats a stored calendar date without shifting it by the timezone. */
export function formatDateOnly(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  return new Date(iso).toLocaleDateString("en-US", {
    ...options,
    timeZone: "UTC",
  });
}
