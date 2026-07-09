const STORAGE_KEY = 'keytalk_data';

const defaultData = {
  history: [],
  stats: {
    totalTaps: 0,
    totalSaved: 0,
    todayTaps: 0,
    todayDate: new Date().toDateString()
  },
  settings: {
    sensitivity: 2.5,
    soundEnabled: true,
    hapticEnabled: true
  },
  onboardingCompleted: false,
  trainingScores: {
    single: 0,
    double: 0,
    triple: 0,
    longShort: 0
  }
};

function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const data = JSON.parse(raw);
    // Check if today changed
    const today = new Date().toDateString();
    if (data.stats?.todayDate !== today) {
      data.stats.todayTaps = 0;
      data.stats.todayDate = today;
    }
    return { ...defaultData, ...data };
  } catch (e) {
    return { ...defaultData };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function addHistory(action, pattern, savedSeconds) {
  const data = getData();
  const entry = {
    id: Date.now(),
    action,
    pattern,
    savedSeconds,
    timestamp: Date.now()
  };
  data.history.unshift(entry);
  if (data.history.length > 50) data.history.pop();

  data.stats.totalTaps++;
  data.stats.totalSaved += savedSeconds;
  data.stats.todayTaps++;

  saveData(data);
  return data;
}

function updateSettings(key, value) {
  const data = getData();
  data.settings[key] = value;
  saveData(data);
}

function completeOnboarding() {
  const data = getData();
  data.onboardingCompleted = true;
  saveData(data);
}

function updateTrainingScore(type, score) {
  const data = getData();
  data.trainingScores[type] = Math.max(data.trainingScores[type], score);
  saveData(data);
}

function resetData() {
  localStorage.removeItem(STORAGE_KEY);
}

const Storage = {
  getData,
  saveData,
  addHistory,
  updateSettings,
  completeOnboarding,
  updateTrainingScore,
  resetData
};

export default Storage;
