export function getConfidenceState(entry) {
  if (!entry) {
    return {
      label: "等待数据",
      tone: "pending",
      detail: "开始同传后，这里会判断当前句子的稳定程度。",
    };
  }

  if (!entry.finalText) {
    return {
      label: "待确认",
      tone: "pending",
      detail: "当前仍是 Draft 或句子仍在修订中，不建议直接引用。",
    };
  }

  if (entry.highVolatility) {
    return {
      label: "建议复核",
      tone: "risk",
      detail: "该句多次修订或定稿较慢，适合进入会后复核列表。",
    };
  }

  if ((entry.settleDelayMs || 0) >= 2500 || entry.revisionCount >= 2) {
    return {
      label: "轻度波动",
      tone: "watch",
      detail: "已定稿，但经历过明显修正，引用前建议快速确认。",
    };
  }

  return {
    label: "可信",
    tone: "safe",
    detail: "句子已稳定定稿，可直接展示或纳入导出结果。",
  };
}

export function calculateConfidenceScore(entry, glossary = []) {
  if (typeof entry?.confidenceScore === "number" && entry.confidenceLevel) {
    return {
      score: entry.confidenceScore,
      level: entry.confidenceLevel,
      factors: Array.isArray(entry.confidenceFactors) ? entry.confidenceFactors : [],
    };
  }

  if (!entry) {
    return { score: 0, level: "待评估", factors: [] };
  }

  let score = 100;
  const factors = [];

  if (!entry.finalText) {
    score -= 38;
    factors.push("未完成定稿");
  }

  if ((entry.revisionCount || 0) >= 3) {
    score -= 18;
    factors.push("翻译修订较多");
  } else if ((entry.revisionCount || 0) >= 2) {
    score -= 10;
    factors.push("发生过明显修订");
  }

  if ((entry.sourceRevisionCount || 0) >= 4) {
    score -= 14;
    factors.push("源语波动明显");
  }

  if ((entry.settleDelayMs || 0) >= 6000) {
    score -= 18;
    factors.push("定稿时延较长");
  } else if ((entry.settleDelayMs || 0) >= 3000) {
    score -= 10;
    factors.push("定稿时延偏长");
  }

  if (entry.highVolatility) {
    score -= 12;
    factors.push("命中高波动规则");
  }

  const glossaryHits = (glossary || []).filter(
    (term) => term && `${entry.sourceText} ${entry.finalText} ${entry.displayText}`.includes(term)
  ).length;
  if (glossaryHits > 0) {
    score += Math.min(8, glossaryHits * 2);
    factors.push(`术语命中 ${glossaryHits}`);
  }

  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  const level =
    normalized >= 85 ? "高可信" : normalized >= 70 ? "可引用" : normalized >= 50 ? "需确认" : "高风险";

  return { score: normalized, level, factors };
}
