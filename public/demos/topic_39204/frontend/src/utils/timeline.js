import { splitDiffSegments } from "./diff.js";

export function buildTimelineEntry(item) {
  const firstSeenAt = item.firstSeenAt || item.sourceFirstSeenAt || item.timestamp || Date.now();
  const finalizedAt = item.finalizedAt || null;
  const latestUpdatedAt = item.lastUpdatedAt || item.sourceLastUpdatedAt || firstSeenAt;
  const sourceText = item.sourceText || "";
  const draftText = item.draftText || "";
  const finalText = item.finalText || "";
  const revisionCount = Number(item.revisionCount || 0);
  const sourceRevisionCount = Number(item.sourceRevisionCount || item.revision || 0);
  const highVolatility =
    Boolean(item.highVolatility) ||
    revisionCount >= 3 ||
    sourceRevisionCount >= 4 ||
    (finalizedAt && finalizedAt - firstSeenAt >= 5000);
  const confidenceScore = Number(item.confidenceScore ?? NaN);
  const confidenceLevel = item.confidenceLevel || "";
  const confidenceFactors = Array.isArray(item.confidenceFactors) ? item.confidenceFactors : [];

  return {
    sentenceId: item.sentenceId || item.sentenceIndex || String(firstSeenAt),
    sentenceIndex: Number(item.sentenceIndex ?? 0),
    sourceLang: item.sourceLang,
    targetLang: item.targetLang,
    sourceText,
    draftText,
    finalText,
    displayText: finalText || draftText || item.displayText || item.text || "",
    firstSeenAt,
    latestUpdatedAt,
    finalizedAt,
    revisionCount,
    sourceRevisionCount,
    settleDelayMs: finalizedAt ? Math.max(0, finalizedAt - firstSeenAt) : null,
    isFinal: Boolean(finalText || item.isFinal),
    highVolatility,
    history: Array.isArray(item.history) ? item.history : [],
    confidenceScore: Number.isFinite(confidenceScore) ? confidenceScore : null,
    confidenceLevel,
    confidenceFactors,
  };
}

export function buildRevisionStats(timelineEntries) {
  const finalizedEntries = timelineEntries.filter((entry) => entry.finalText);
  const changedEntries = finalizedEntries.filter(
    (entry) => entry.draftText && entry.finalText && entry.draftText !== entry.finalText
  );
  const reviewEntries = timelineEntries.filter(
    (entry) => !entry.finalText || entry.highVolatility || (entry.revisionCount || 0) >= 2
  );
  const averageRevisions =
    timelineEntries.reduce((sum, entry) => sum + Number(entry.revisionCount || 0), 0) /
      Math.max(timelineEntries.length, 1) || 0;

  const correctedFragments = new Map();
  changedEntries.forEach((entry) => {
    const diff = splitDiffSegments(entry.draftText, entry.finalText);
    const token = String(diff.added || "").trim();
    if (!token) {
      return;
    }
    correctedFragments.set(token, (correctedFragments.get(token) || 0) + 1);
  });

  const topCorrections = [...correctedFragments.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([token, count]) => ({ token, count }));

  return {
    changedSentences: changedEntries.length,
    pendingSentences: timelineEntries.filter((entry) => !entry.finalText).length,
    reviewSentences: reviewEntries.length,
    averageRevisions,
    topCorrections,
  };
}

export function buildSessionSummary(timelineEntries) {
  const total = timelineEntries.length;
  const finalized = timelineEntries.filter((entry) => entry.finalText).length;
  const volatile = timelineEntries.filter((entry) => entry.highVolatility).length;
  const averageDelay =
    timelineEntries
      .filter((entry) => typeof entry.settleDelayMs === "number")
      .reduce((sum, entry, _, array) => sum + entry.settleDelayMs / array.length, 0) || 0;

  return {
    total,
    finalized,
    volatile,
    averageDelay,
  };
}

export function getPipelineQueueSummary({
  pipelineState,
  pipelineMetrics,
  timelineEntries,
  draftSubtitle,
  latestTimelineEntry,
}) {
  const draftBacklog = Number(pipelineMetrics?.draftBacklog || 0);
  const finalBacklog = Number(pipelineMetrics?.finalBacklog || 0);
  const recordedCount = timelineEntries.length;
  const latestSentenceNumber = latestTimelineEntry ? latestTimelineEntry.sentenceIndex + 1 : 0;

  if (pipelineState === "paused") {
    return {
      label: "已暂停",
      detail: "当前不会继续采集新音频，恢复后才会继续记录和翻译。",
      tone: "warn",
    };
  }

  if (!recordedCount) {
    return {
      label: "等待首句",
      detail: "开始同传后，原文会先进入时间轴，再由 Draft 和 Final 在后台补齐。",
      tone: "muted",
    };
  }

  if (draftBacklog > 0 || finalBacklog > 0) {
    return {
      label: "后台追赶中",
      detail: `原文已记录到 #${latestSentenceNumber}，Draft 积压 ${draftBacklog} 句，Final 积压 ${finalBacklog} 句。`,
      tone: "info",
    };
  }

  if (draftSubtitle && !latestTimelineEntry?.finalText) {
    return {
      label: "Draft 已到达",
      detail: "当前句已经给出低延迟译文，Final 仍会继续纠错和定稿。",
      tone: "info",
    };
  }

  return {
    label: "基本跟上",
    detail: `原文已记录 ${recordedCount} 句，当前没有明显积压，最新一句可继续等待 Final。`,
    tone: "success",
  };
}

export function renderHistoryLabel(entry) {
  return entry.kind === "final" ? `F${entry.revision}` : `D${entry.revision}`;
}
