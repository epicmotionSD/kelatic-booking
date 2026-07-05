// Sales tax for commerce orders (Kelatic Vitality House).
// Tax is charged on the taxable base — the subtotal after any discounts.
// Tips are never taxed.
//
// Rates are keyed by tenant slug so other tenants are unaffected (they get 0).
// Kelatic Vitality House collects 8.5% (Texas state + local).
const TAX_RATE_BY_SLUG: Record<string, number> = {
  vitality: 0.085,
};

type BusinessLike = { slug?: string | null } | null | undefined;

/** Fractional tax rate for a business (e.g. 0.085), or 0 if none applies. */
export function taxRateForBusiness(business: BusinessLike): number {
  if (!business?.slug) return 0;
  return TAX_RATE_BY_SLUG[business.slug] ?? 0;
}

/** Tax owed in cents on a taxable base (subtotal minus discounts). */
export function computeTaxCents(taxableBaseCents: number, business: BusinessLike): number {
  const rate = taxRateForBusiness(business);
  if (rate <= 0 || taxableBaseCents <= 0) return 0;
  return Math.round(taxableBaseCents * rate);
}
