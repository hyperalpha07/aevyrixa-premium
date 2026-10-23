type HomeStat = { value: string; label: string };

function unsupportedStatisticalClaim(stat: HomeStat) {
  const label = stat.label.trim();
  const value = stat.value.trim();
  // Merchandising copy must not invent a customer count, review average,
  // or an absolute service guarantee. Evidence-backed metrics should be
  // built from verified source data, not manually editable media settings.
  return (
    (/\b(customers?|buyers?|users?|orders?|sales|reviews?|ratings?|stars?)\b/i.test(label) && /\d|★|⭐/.test(value)) ||
    /^100(?:\.0+)?\s*%/i.test(value)
  );
}

export function trustworthyHomeStats(configured: readonly HomeStat[], fallback: readonly HomeStat[]) {
  return fallback.map((base, index) => {
    const chosen = configured[index];
    if (!chosen?.value?.trim() || !chosen?.label?.trim() || unsupportedStatisticalClaim(chosen)) {
      return base;
    }
    return { value: chosen.value.trim(), label: chosen.label.trim() };
  });
}
