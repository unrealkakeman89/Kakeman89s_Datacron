export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function localizeOr(localize, key, fallback) {
  if (typeof localize !== "function") return fallback;
  const value = localize(key);
  if (!value || value === key) return fallback;
  return value;
}

/**
 * Format a ChatMessage card from an already-calculated result. Does not recalculate.
 * @param {object} result
 * @param {(key: string) => string} [localize]
 */
export function buildDroidAllyQuoteHtml(result, localize) {
  const title = localizeOr(
    localize,
    "KAKEMAN89SDATACRON.DroidAllyPricing.ChatTitle",
    "Droid Ally Pricing"
  );
  const name = result?.normalizedInput?.droidName || result?.input?.droidName || "Unnamed Droid";
  const presetId = result?.preset?.id ?? "";
  const finalCost = String(result?.finalCost ?? "");
  const finalLabel = localizeOr(
    localize,
    "KAKEMAN89SDATACRON.DroidAllyPricing.FinalPrice",
    "Final price"
  );
  const items = (result?.lineItems ?? result?.breakdown ?? [])
    .map(
      (row) =>
        `<li><span>${escapeHtml(row.key)} (${escapeHtml(row.formula)})</span>: <strong>${escapeHtml(
          String(row.amount)
        )}</strong></li>`
    )
    .join("");

  return `
    <div class="kakeman89s-datacron-droid-quote">
      <h2>${escapeHtml(title)}</h2>
      <p><strong>${escapeHtml(name)}</strong></p>
      <p>${escapeHtml(presetId)}</p>
      <p><strong>${escapeHtml(finalLabel)}:</strong> ${escapeHtml(finalCost)}</p>
      <ul>${items}</ul>
    </div>
  `;
}
