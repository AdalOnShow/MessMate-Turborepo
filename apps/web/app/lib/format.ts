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
