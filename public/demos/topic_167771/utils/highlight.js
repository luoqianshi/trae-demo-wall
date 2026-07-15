function highlightSegments(text, query) {
  const q = String(query || "").trim();
  if (!q) return [{ text: String(text || ""), highlight: false }];

  const textStr = String(text || "");
  const qLower = q.toLowerCase();
  const textLower = textStr.toLowerCase();

  const segments = [];
  let lastIndex = 0;

  while (true) {
    const idx = textLower.indexOf(qLower, lastIndex);
    if (idx === -1) {
      if (lastIndex < textStr.length) {
        segments.push({ text: textStr.slice(lastIndex), highlight: false });
      }
      break;
    }

    if (idx > lastIndex) {
      segments.push({ text: textStr.slice(lastIndex, idx), highlight: false });
    }

    segments.push({ text: textStr.slice(idx, idx + q.length), highlight: true });
    lastIndex = idx + q.length;
  }

  return segments;
}

export { highlightSegments };