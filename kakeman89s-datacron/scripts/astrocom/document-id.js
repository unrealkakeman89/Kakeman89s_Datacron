function fnv1a32(input, seed) {
  let hash = seed;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function toHex8(value) {
  return value.toString(16).padStart(8, "0");
}

/**
 * Produce a Foundry-safe 16-character alphanumeric id from a stable key.
 * Deterministic and independent of display names.
 */
export function foundryIdFromKey(key) {
  const material = `kakeman89s-datacron:astrocom:v1:${key}`;
  const left = fnv1a32(material, 2166136261);
  const right = fnv1a32(material, 84696351);
  return `${toHex8(left)}${toHex8(right)}`;
}

export function journalDocumentId(stableId) {
  return foundryIdFromKey(`journal:${stableId}`);
}

export function folderDocumentId(packKey, folderPath) {
  return foundryIdFromKey(`folder:${packKey}:${folderPath.join("/")}`);
}

export function pageDocumentId(stableId) {
  return foundryIdFromKey(`page:${stableId}`);
}
