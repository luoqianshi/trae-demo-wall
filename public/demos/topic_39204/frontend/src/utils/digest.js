export function buildSessionDigest(timelineEntries, revisionStats, glossary = []) {
  const finalizedEntries = timelineEntries.filter((entry) => entry.finalText);
  const volatileEntries = timelineEntries.filter((entry) => entry.highVolatility);
  const topGlossary = (glossary || []).slice(0, 8);
  const summaryLines = finalizedEntries.slice(-5).map((entry) => entry.finalText || entry.displayText);
  const segments = [];

  if (summaryLines.length) {
    let current = [];
    summaryLines.forEach((line, index) => {
      current.push(line);
      if (current.join("").length >= 40 || index === summaryLines.length - 1) {
        segments.push(current.join(" "));
        current = [];
      }
    });
  }

  return {
    summary:
      segments.length > 0
        ? segments.slice(0, 3)
        : ["当前会话尚未形成足够的定稿内容，摘要会在 Final 结果累计后自动更稳定。"],
    todo:
      volatileEntries.length > 0
        ? volatileEntries.slice(0, 4).map((entry) => `复核句子 #${entry.sentenceIndex + 1}`)
        : ["当前没有明显高波动句子。"],
    topics:
      topGlossary.length > 0
        ? topGlossary
        : revisionStats.topCorrections.map((item) => item.token).slice(0, 5),
    reviewCount: volatileEntries.length,
  };
}

export function getArchivedRoleView(roleId, archive) {
  if (!archive) {
    return { headline: "暂无历史会话", items: [] };
  }

  const entries = archive.timelineEntries || [];
  if (roleId === "speaker") {
    return {
      headline: "主讲人关注可信结果与术语一致性",
      items: entries
        .filter((entry) => (entry.confidenceScore || 0) >= 70)
        .slice(-5)
        .reverse(),
    };
  }

  if (roleId === "recorder") {
    return {
      headline: "记录员关注完整时间轴与待复核句",
      items: entries
        .filter((entry) => entry.highVolatility || !entry.finalText || (entry.confidenceScore || 0) < 70)
        .slice(-6)
        .reverse(),
    };
  }

  if (roleId === "display") {
    return {
      headline: "展示端只保留稳定可读内容",
      items: entries
        .filter((entry) => entry.finalText && (entry.confidenceScore || 0) >= 80)
        .slice(-5)
        .reverse(),
    };
  }

  return {
    headline: "复盘者关注摘要、风险和修订过程",
    items: entries.slice(-6).reverse(),
  };
}
