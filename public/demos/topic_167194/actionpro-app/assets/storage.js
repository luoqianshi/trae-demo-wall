const KEY_EXERCISES = 'actionpro_exercises';
const KEY_COMBOS = 'actionpro_combos';

const Storage = {
  saveExercise(id) {
    const exercises = this.getSavedExercises();
    if (!exercises.find(e => e.id === id)) {
      exercises.push({ id, savedAt: Date.now() });
      localStorage.setItem(KEY_EXERCISES, JSON.stringify(exercises));
    }
  },
  removeExercise(id) {
    const exercises = this.getSavedExercises().filter(e => e.id !== id);
    localStorage.setItem(KEY_EXERCISES, JSON.stringify(exercises));
  },
  getSavedExercises() {
    const data = localStorage.getItem(KEY_EXERCISES);
    return data ? JSON.parse(data) : [];
  },
  isExerciseSaved(id) {
    return this.getSavedExercises().some(e => e.id === id);
  },
  saveCombo(name, primaryTag, exerciseIds) {
    const combos = this.getCombos();
    const newCombo = {
      id: 'combo_' + Date.now(),
      name,
      primaryTag,
      exerciseIds,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    combos.push(newCombo);
    localStorage.setItem(KEY_COMBOS, JSON.stringify(combos));
    return newCombo;
  },
  updateCombo(id, exerciseIds, name) {
    const combos = this.getCombos();
    const index = combos.findIndex(c => c.id === id);
    if (index >= 0) {
      const updated = { ...combos[index], exerciseIds, updatedAt: Date.now() };
      if (name) updated.name = name;
      combos[index] = updated;
      localStorage.setItem(KEY_COMBOS, JSON.stringify(combos));
      return combos[index];
    }
    return null;
  },
  cloneCombo(id, name) {
    const combo = this.getCombo(id);
    if (!combo) return null;
    const newCombo = {
      id: 'combo_' + Date.now(),
      name,
      primaryTag: combo.primaryTag,
      exerciseIds: [...combo.exerciseIds],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const combos = this.getCombos();
    combos.push(newCombo);
    localStorage.setItem(KEY_COMBOS, JSON.stringify(combos));
    return newCombo;
  },
  removeCombo(id) {
    const combos = this.getCombos().filter(c => c.id !== id);
    localStorage.setItem(KEY_COMBOS, JSON.stringify(combos));
  },
  getCombos() {
    const data = localStorage.getItem(KEY_COMBOS);
    return data ? JSON.parse(data) : [];
  },
  getCombo(id) {
    return this.getCombos().find(c => c.id === id);
  }
};