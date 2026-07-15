const state = {
  projects: [],
  projectFilter: "",
  project: null,
  projectSave: {
    projectId: "",
    baseline: "",
    dirty: false,
    status: "idle",
    lastSavedAt: 0,
    message: "",
  },
  tasks: [],
  batchStream: null,
  settings: {
    activeProfileId: "profile_default",
    models: {
      text: { key: "", base: "https://api.nic4.ai/v1", model: "claude-sonnet-4-6", adapter: "openai_compat" },
      image: { key: "", base: "https://api.nic4.ai/v1", model: "gpt-image-2", provider: "openai_compat" },
      multimodal: { key: "", base: "https://api.openai.com/v1", model: "gpt-4.1", adapter: "openai_compat" },
      video: { key: "", base: "https://api.klingai.com", model: "kling-v2", adapter: "kling" },
    },
    videoBatch: {
      videoModel: "kling",
      videoRatio: "16:9",
      videoQuality: "720p",
      genAudio: false,
      watermark: true,
      requireVideoTest: false,
    },
    connectionTests: {},
    profiles: [],
  },
};

const listeners = new Set();

function emit() {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (_error) {
      // Keep store notifications resilient.
    }
  });
}

export const appStore = {
  getState() {
    return state;
  },
  setProjects(projects) {
    state.projects = Array.isArray(projects) ? projects : [];
    emit();
  },
  setProject(project) {
    state.project = project;
    emit();
  },
  setProjectFilter(value) {
    state.projectFilter = String(value || "");
    emit();
  },
  setProjectSave(nextProjectSave) {
    state.projectSave = {
      ...state.projectSave,
      ...(nextProjectSave || {}),
    };
    emit();
  },
  setTasks(tasks) {
    state.tasks = Array.isArray(tasks) ? tasks : [];
    emit();
  },
  patchProjectInList(project) {
    state.projects = state.projects.map((item) => (item.id === project.id ? project : item));
    emit();
  },
  replaceBatchStream(handle) {
    if (state.batchStream && typeof state.batchStream.close === "function") {
      state.batchStream.close();
    }
    state.batchStream = handle;
    emit();
  },
  updateProject(mutator) {
    if (!state.project) return;
    state.project = { ...state.project };
    mutator(state.project);
    emit();
  },
  setSettings(nextSettings) {
    state.settings = mergeSettings(state.settings, nextSettings || {});
    emit();
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

function mergeSettings(current, next) {
  const merged = {
    ...current,
    ...next,
    activeProfileId: next?.activeProfileId || current.activeProfileId,
    models: {
      ...current.models,
      ...((next && next.models) || {}),
      text: {
        ...current.models.text,
        ...(((next && next.models) || {}).text || {}),
      },
      image: {
        ...current.models.image,
        ...(((next && next.models) || {}).image || {}),
      },
      multimodal: {
        ...current.models.multimodal,
        ...(((next && next.models) || {}).multimodal || {}),
      },
      video: {
        ...current.models.video,
        ...(((next && next.models) || {}).video || {}),
      },
    },
    videoBatch: {
      ...current.videoBatch,
      ...((next && next.videoBatch) || {}),
    },
    connectionTests: {
      ...(current.connectionTests || {}),
      ...((next && next.connectionTests) || {}),
    },
    profiles: Array.isArray(next?.profiles) ? next.profiles : (current.profiles || []),
  };
  return merged;
}
