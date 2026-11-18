const moneyFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatMoney(n: number) {
  return `৳${moneyFmt.format(n)}`;
}

/**
 * Money to the paisa, for bill breakdowns where the parts must visibly add
 * up to the total: ৳145.42 + ৳533.34 = ৳678.76. (Whole-taka rounding of each
 * part made the bill look ৳1 higher than its parts.) Whole amounts stay short:
 * ৳500, never ৳500.00; others always show two decimals: ৳333.30, not ৳333.3.
 */
export function formatMoneyExact(n: number) {
  const paisa = Math.round(n * 100);
  const digits = paisa % 100 === 0 ? 0 : 2;
  return `৳${(paisa / 100).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
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
