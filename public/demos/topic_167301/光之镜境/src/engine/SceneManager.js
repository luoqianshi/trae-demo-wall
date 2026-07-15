export class SceneManager {
    constructor(lightEngine) {
        this.lightEngine = lightEngine;
        this.elements = [];
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
    }

    addElement(element) {
        this.elements.push(element);
        this.lightEngine.addElement(element);
        this.saveHistory();
        return element;
    }

    removeElement(element) {
        const index = this.elements.indexOf(element);
        if (index > -1) {
            this.elements.splice(index, 1);
            this.lightEngine.removeElement(element);
            this.saveHistory();
        }
    }

    clearElements() {
        this.elements = [];
        this.lightEngine.clearElements();
        this.saveHistory();
    }

    updateElement(element, updates) {
        Object.assign(element, updates);
        this.saveHistory();
    }

    saveHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(this.serialize());
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.deserialize(this.history[this.historyIndex]);
            return true;
        }
        return false;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.deserialize(this.history[this.historyIndex]);
            return true;
        }
        return false;
    }

    serialize() {
        return JSON.stringify(this.elements);
    }

    deserialize(data) {
        this.elements = JSON.parse(data);
        this.lightEngine.clearElements();
        for (const element of this.elements) {
            this.lightEngine.addElement(element);
        }
    }

    generateSceneCode() {
        const data = this.serialize();
        return btoa(encodeURIComponent(data));
    }

    loadFromSceneCode(code) {
        try {
            const data = decodeURIComponent(atob(code));
            this.deserialize(data);
            return true;
        } catch (e) {
            return false;
        }
    }

    saveToLocalStorage(name) {
        const saveData = {
            id: Date.now().toString(),
            name,
            code: this.generateSceneCode(),
            createdAt: Date.now(),
            elements: this.elements
        };
        
        const saves = this.getSaves();
        saves.push(saveData);
        localStorage.setItem('lightlab_saves', JSON.stringify(saves));
        return saveData;
    }

    getSaves() {
        const saves = localStorage.getItem('lightlab_saves');
        return saves ? JSON.parse(saves) : [];
    }

    loadFromSave(saveData) {
        if (saveData.code) {
            return this.loadFromSceneCode(saveData.code);
        } else if (saveData.elements) {
            this.elements = JSON.parse(JSON.stringify(saveData.elements));
            this.lightEngine.clearElements();
            for (const element of this.elements) {
                this.lightEngine.addElement(element);
            }
            return true;
        }
        return false;
    }

    deleteSave(id) {
        const saves = this.getSaves();
        const filtered = saves.filter(s => s.id !== id);
        localStorage.setItem('lightlab_saves', JSON.stringify(filtered));
    }

    createLaser(x, y, rotation = 0, color = '#fbbf24') {
        return {
            type: 'laser',
            x,
            y,
            rotation,
            color,
            width: 30,
            height: 20
        };
    }

    createMirror(x, y, rotation = 0) {
        return {
            type: 'mirror',
            x,
            y,
            rotation,
            width: 80,
            height: 12
        };
    }

    createConcaveMirror(x, y, rotation = 0) {
        return {
            type: 'concave',
            x,
            y,
            rotation,
            width: 80,
            height: 30
        };
    }

    createConvexMirror(x, y, rotation = 0) {
        return {
            type: 'convex',
            x,
            y,
            rotation,
            width: 80,
            height: 30
        };
    }

    createScreen(x, y) {
        return {
            type: 'screen',
            x,
            y,
            rotation: 0,
            width: 100,
            height: 8,
            hit: false,
            hitPos: null
        };
    }

    createTarget(x, y) {
        return {
            type: 'target',
            x,
            y,
            rotation: 0,
            radius: 25,
            hit: false,
            hitTime: null
        };
    }

    createObstacle(x, y) {
        return {
            type: 'obstacle',
            x,
            y,
            rotation: 0,
            width: 60,
            height: 40
        };
    }

    createProtractor(x, y) {
        return {
            type: 'protractor',
            x,
            y,
            rotation: 0
        };
    }

    createSensor(x, y) {
        return {
            type: 'sensor',
            x,
            y,
            rotation: 0,
            active: false
        };
    }

    createLightCanvas(x, y) {
        return {
            type: 'canvas',
            x,
            y,
            rotation: 0,
            width: 200,
            height: 150,
            trails: []
        };
    }

    loadPreset(preset) {
        this.clearElements();
        
        for (const elementData of preset.elements) {
            const element = { ...elementData };
            this.addElement(element);
        }
    }

    hasTargetHit() {
        return this.elements.some(e => e.type === 'target' && e.hit);
    }

    getTarget() {
        return this.elements.find(e => e.type === 'target');
    }

    getLasers() {
        return this.elements.filter(e => e.type === 'laser');
    }

    getMirrors() {
        return this.elements.filter(e => 
            e.type === 'mirror' || e.type === 'concave' || e.type === 'convex'
        );
    }
}

export class LevelManager {
    constructor() {
        this.levels = [];
        this.currentLevel = 0;
        this.progress = this.loadProgress();
    }

    loadLevels(levels) {
        this.levels = levels;
    }

    getLevel(index) {
        return this.levels[index];
    }

    getCurrentLevel() {
        return this.levels[this.currentLevel];
    }

    nextLevel() {
        if (this.currentLevel < this.levels.length - 1) {
            this.currentLevel++;
            return this.levels[this.currentLevel];
        }
        return null;
    }

    setLevel(index) {
        if (index >= 0 && index < this.levels.length) {
            this.currentLevel = index;
            return this.levels[index];
        }
        return null;
    }

    setStars(levelId, stars) {
        if (!this.progress[levelId]) {
            this.progress[levelId] = { stars: 0, unlocked: true };
        }
        if (stars > this.progress[levelId].stars) {
            this.progress[levelId].stars = stars;
        }
        this.saveProgress();
        
        const nextLevelId = levelId + 1;
        if (!this.progress[nextLevelId]) {
            this.progress[nextLevelId] = { stars: 0, unlocked: true };
            this.saveProgress();
        }
    }

    getStars(levelId) {
        return this.progress[levelId]?.stars || 0;
    }

    isUnlocked(levelId) {
        return this.progress[levelId]?.unlocked || levelId === 1;
    }

    loadProgress() {
        const saved = localStorage.getItem('lightlab_level_progress');
        return saved ? JSON.parse(saved) : { 1: { stars: 0, unlocked: true } };
    }

    saveProgress() {
        localStorage.setItem('lightlab_level_progress', JSON.stringify(this.progress));
    }

    resetProgress() {
        this.progress = { 1: { stars: 0, unlocked: true } };
        this.saveProgress();
    }
}
