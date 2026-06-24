import { SCENE_TEMPLATES } from "./constants.js";

export const controlDefaults = {
  sourceLang: "en",
  targetLang: "zh",
  ttsEnabled: false,
  recordEnabled: true,
  glossary: [],
  sceneTemplateId: SCENE_TEMPLATES[0].id,
};

export const STORAGE_KEY = "qn-live.socket-url";
export const ARCHIVE_STORAGE_KEY = "qn-live.archived-sessions";
export const CHUNK_FLUSH_INTERVAL_MS = 220;
export const REVIEW_SENTENCE_PATTERN = /#(\d+)/;
