/**
 * Deterministic preview + hash. Consumes mapping; does not calculate cost.
 */

function canonicalJson(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

function fnv1aHex(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function calculationIdentity(calculation) {
  const result = calculation?.result ?? null;
  return {
    status: calculation?.status ?? null,
    ok: Boolean(calculation?.ok),
    profileId: result?.profileId ?? null,
    grandTotal: result?.grandTotal ?? null,
    buildDays: result?.buildDays ?? null
  };
}

function hashableActorSource(actorSource) {
  if (!actorSource || typeof actorSource !== "object") return actorSource ?? null;
  const cloned = structuredClone(actorSource);
  for (const ns of Object.keys(cloned.flags ?? {})) {
    if (cloned.flags[ns] && typeof cloned.flags[ns] === "object") {
      delete cloned.flags[ns].previewHash;
      delete cloned.flags[ns].createdAt;
    }
  }
  return cloned;
}

export function computePreviewHash(parts = {}) {
  const payload = {
    actorSource: hashableActorSource(parts.actorSource),
    embeddedItemSources: parts.embeddedItemSources ?? [],
    tokenSource: parts.tokenSource ?? null,
    folderId: parts.folderId ?? null,
    ownership: parts.ownership ?? null,
    imagePath: parts.imagePath ?? null,
    draftRevision: Number(parts.draftRevision ?? 0),
    calculationIdentity: parts.calculationIdentity ?? null,
    operationId: parts.operationId ?? null
  };
  return fnv1aHex(canonicalJson(payload));
}

/**
 * @param {{
 *   mapping: object,
 *   draft: object,
 *   calculation: object,
 *   options: object
 * }} input
 */
export function buildCreationPreview(input = {}) {
  const mapping = input.mapping;
  const draft = input.draft;
  const calculation = input.calculation ?? draft?.calculation;
  const options = input.options ?? {};
  const actor = mapping?.actorSource ?? {};
  const identity = calculationIdentity(calculation);
  const previewHash = computePreviewHash({
    actorSource: actor,
    embeddedItemSources: mapping?.embeddedItemSources,
    tokenSource: mapping?.tokenSource,
    folderId: options.folderId ?? actor.folder ?? null,
    ownership: actor.ownership ?? null,
    imagePath: options.imagePath ?? null,
    draftRevision: draft?.revision,
    calculationIdentity: identity,
    operationId: options.operationId ?? mapping?.provenance?.operationId ?? null
  });

  return Object.freeze({
    previewHash,
    actorName: actor.name ?? "",
    actorType: actor.type ?? null,
    starshipIdentity: actor.flags?.sw5e?.legacyStarshipActor?.type ?? null,
    size: actor.system?.traits?.size ?? null,
    tier: actor.system?.details?.tier ?? null,
    hull: actor.system?.attributes?.hp?.max ?? null,
    shields: actor.system?.attributes?.hp?.temp ?? null,
    movement: "from-mapped-items",
    mappedItems: structuredClone(mapping?.embeddedItemSources ?? []),
    unmappedFields: structuredClone(mapping?.unmappedFields ?? []),
    warnings: structuredClone(mapping?.mappingWarnings ?? []),
    cost: identity.grandTotal,
    buildTime: identity.buildDays,
    folderId: options.folderId ?? actor.folder ?? null,
    ownership: structuredClone(actor.ownership ?? {}),
    image: actor.img ?? null,
    token: structuredClone(mapping?.tokenSource ?? null),
    provenance: structuredClone(mapping?.provenance ?? null),
    draftRevision: Number(draft?.revision ?? 0),
    calculationIdentity: identity,
    operationId: options.operationId ?? mapping?.provenance?.operationId ?? null
  });
}

export function previewIsCurrent(preview, mapping, draft, calculation, options = {}) {
  if (!preview?.previewHash) return false;
  const next = buildCreationPreview({ mapping, draft, calculation, options });
  return next.previewHash === preview.previewHash;
}
