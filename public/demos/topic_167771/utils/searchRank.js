import { highlightSegments } from "./highlight.js";

function normalize(str) {
  return String(str || "").trim().toLowerCase();
}

function formatDistance(km) {
  const n = Number(km);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1) return `${Math.round(n * 1000)}m`;
  return `${n.toFixed(1)}km`;
}

function formatMinutes(min) {
  const n = Math.round(Number(min));
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 60) return `${n}分钟`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}小时${m}分钟` : `${h}小时`;
}

function fieldMatchScore(fieldValue, queryNorm) {
  const v = normalize(fieldValue);
  if (!v || !queryNorm) return { score: 0, hitType: null };
  if (v === queryNorm) return { score: 100, hitType: "exact" };
  if (v.startsWith(queryNorm)) return { score: 60, hitType: "prefix" };
  if (v.includes(queryNorm)) return { score: 30, hitType: "include" };
  return { score: 0, hitType: null };
}

function buildSnippet(entity) {
  const d = entity.detail || {};
  if (entity.type === "worker") {
    const area = d.serviceArea ? `服务区域：${d.serviceArea}` : "";
    const years = typeof d.years === "number" ? `${d.years}年经验` : "";
    return [area, years].filter(Boolean).join(" · ");
  }
  if (entity.type === "enterprise") {
    const city = d.city ? d.city : "";
    const scope = d.scope ? `主营：${d.scope}` : "";
    return [city, scope].filter(Boolean).join(" · ");
  }
  return "";
}

function buildSearchResult(entity, query = "", score = 0) {
  const ratingAvg = typeof entity.ratingAvg === "number" ? entity.ratingAvg : 0;
  const ratingCount = typeof entity.ratingCount === "number" ? entity.ratingCount : 0;
  const ratingPercent = Math.max(0, Math.min(5, ratingAvg)) / 5 * 100;
  const ratingText = ratingAvg ? ratingAvg.toFixed(1) : "0.0";
  const distanceKm = typeof entity.distanceKm === "number" ? entity.distanceKm : 0;
  const avgArrivalMin = typeof entity.avgArrivalMin === "number" ? entity.avgArrivalMin : 0;
  const avgServiceMin = typeof entity.avgServiceMin === "number" ? entity.avgServiceMin : 0;
  const distanceText = formatDistance(distanceKm);
  const arrivalText = avgArrivalMin ? `平均到达${formatMinutes(avgArrivalMin)}` : "";
  const serviceText = avgServiceMin ? `平均服务${formatMinutes(avgServiceMin)}` : "";
  const serviceMetaText = [distanceText, arrivalText, serviceText].filter(Boolean).join(" · ");

  return {
    ...entity,
    score,
    matchedSnippet: buildSnippet(entity),
    highlightedTitleSegments: highlightSegments(entity.title || "", query),
    ratingAvg,
    ratingCount,
    ratingPercent,
    ratingText,
    distanceText,
    arrivalText,
    serviceText,
    serviceMetaText
  };
}

function rankEntity(entity, query) {
  const queryNorm = normalize(query);
  if (!queryNorm) return null;

  const title = entity.title || "";
  const aliasArr = Array.isArray(entity.alias) ? entity.alias : [];
  const keywords = Array.isArray(entity.keywords) ? entity.keywords : [];

  const titleHit = fieldMatchScore(title, queryNorm);

  let aliasBest = { score: 0, hitType: null };
  for (const a of aliasArr) {
    const r = fieldMatchScore(a, queryNorm);
    if (r.score > aliasBest.score) aliasBest = r;
  }

  let keywordHits = 0;
  for (const k of keywords) {
    if (normalize(k).includes(queryNorm)) keywordHits += 1;
  }
  const keywordScore = Math.min(keywordHits, 3) * 20;

  const baseFieldScore = Math.max(titleHit.score, aliasBest.score);
  let score = baseFieldScore + keywordScore;

  const hasTitleOrAliasHit = baseFieldScore > 0;
  const hasKeywordHit = keywordScore > 0;
  if (hasTitleOrAliasHit && hasKeywordHit) score += 10;
  if (titleHit.score > 0 && aliasBest.score > 0) score += 5;

  if (score <= 0) return null;

  return buildSearchResult(entity, query, score);
}

function searchEntities(query, entities) {
  const q = String(query || "").trim();
  if (!q) return [];

  const ranked = [];
  for (const e of entities) {
    const r = rankEntity(e, q);
    if (r) ranked.push(r);
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((b.hotScore || 0) !== (a.hotScore || 0)) return (b.hotScore || 0) - (a.hotScore || 0);
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  return ranked;
}

function getFeaturedEntities(entities, limit = 20) {
  return (entities || [])
    .slice()
    .sort((a, b) => {
      if ((b.ratingAvg || 0) !== (a.ratingAvg || 0)) return (b.ratingAvg || 0) - (a.ratingAvg || 0);
      if ((b.hotScore || 0) !== (a.hotScore || 0)) return (b.hotScore || 0) - (a.hotScore || 0);
      return (a.distanceKm || 99) - (b.distanceKm || 99);
    })
    .slice(0, limit)
    .map((item) => buildSearchResult(item, "", item.hotScore || 0));
}

export {
  normalize,
  searchEntities,
  getFeaturedEntities
};
