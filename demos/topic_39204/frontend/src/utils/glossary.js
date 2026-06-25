export function parseGlossary(value) {
  return value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 24);
}

export function mergeGlossary(baseGlossary, nextGlossary) {
  return [...new Set([...(baseGlossary || []), ...(nextGlossary || [])])].slice(0, 24);
}
