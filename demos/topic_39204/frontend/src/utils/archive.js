import { LANGUAGE_LABELS } from "../config/constants.js";
import { ARCHIVE_STORAGE_KEY } from "../config/defaults.js";

export function readStoredArchives() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function createSessionArchive({
  sceneTemplate,
  controls,
  timelineEntries,
  sessionSummary,
  revisionStats,
  confidenceSummary,
  digest,
}) {
  return {
    id: `session-${Date.now()}`,
    createdAt: Date.now(),
    sceneTemplateId: sceneTemplate.id,
    sceneTemplateName: sceneTemplate.name,
    pairLabel: `${LANGUAGE_LABELS[controls.sourceLang]} -> ${LANGUAGE_LABELS[controls.targetLang]}`,
    sourceLang: controls.sourceLang,
    targetLang: controls.targetLang,
    glossary: [...controls.glossary],
    summary: sessionSummary,
    revisionStats,
    confidenceSummary,
    digest,
    timelineEntries: timelineEntries.map((entry) => ({
      ...entry,
      history: [...entry.history],
      confidenceFactors: [...(entry.confidenceFactors || [])],
    })),
  };
}
