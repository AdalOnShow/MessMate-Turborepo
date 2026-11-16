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
