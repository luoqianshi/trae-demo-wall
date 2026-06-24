import { formatClock } from "./format.js";

export function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function buildExportContent(formatId, rangeId, timelineEntries) {
  const filtered = timelineEntries.filter((entry) => {
    if (rangeId === "finalOnly") {
      return entry.finalText;
    }
    if (rangeId === "volatileOnly") {
      return entry.highVolatility;
    }
    return true;
  });

  if (formatId === "subtitle") {
    return filtered
      .map((entry, index) => {
        const start = formatClock(entry.firstSeenAt);
        const end = formatClock(entry.finalizedAt || entry.latestUpdatedAt);
        return `${index + 1}\n${start} --> ${end}\n${entry.finalText || entry.displayText}\n${
          entry.sourceText
        }\n`;
      })
      .join("\n");
  }

  if (formatId === "revision") {
    return filtered
      .map(
        (entry) =>
          `#${entry.sentenceIndex + 1}\n首次出现: ${formatClock(entry.firstSeenAt)}\n最近更新: ${formatClock(
            entry.latestUpdatedAt
          )}\n定稿时间: ${formatClock(entry.finalizedAt)}\n修订次数: ${entry.revisionCount}\n高波动: ${
            entry.highVolatility ? "是" : "否"
          }\n原文: ${entry.sourceText}\n定稿: ${entry.finalText || entry.displayText}\n`
      )
      .join("\n");
  }

  if (formatId === "uncertain") {
    return filtered
      .filter((entry) => entry.highVolatility || !entry.finalText)
      .map(
        (entry) =>
          `#${entry.sentenceIndex + 1} [${formatClock(entry.latestUpdatedAt)}] ${
            entry.finalText || entry.displayText
          }\n原文: ${entry.sourceText}\n原因: ${
            entry.highVolatility ? "多次修订 / 定稿较慢" : "仍未定稿"
          }\n`
      )
      .join("\n");
  }

  return filtered
    .map(
      (entry) =>
        `#${entry.sentenceIndex + 1}\n原文: ${entry.sourceText}\n译文: ${
          entry.finalText || entry.displayText
        }\n首次出现: ${formatClock(entry.firstSeenAt)}\n定稿时间: ${formatClock(
          entry.finalizedAt
        )}\n`
    )
    .join("\n");
}
