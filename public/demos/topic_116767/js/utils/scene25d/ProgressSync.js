var ProgressSync = (function() {
    'use strict';

    var STORAGE_KEY = 'scene_progress_state';

    function ProgressSync() {
        this.lastCompletedSteps = [];
        this.syncing = false;
        this.stepCallbacks = [];
        this.stageCallbacks = [];
        this.regionCallbacks = [];
        this.objectManager = null;
        this.scene = null;
        this.regionManager = null;
        this.pollInterval = null;
        this.pollDelay = 500;
        this.batchDelay = 150;
        this._initialized = false;
        this._lastStage = 0;
        this._regionStates = {};
        this._persistEnabled = true;
        this._timelineMode = false;
    }

    ProgressSync.prototype.init = function(options) {
        options = options || {};
        this.objectManager = options.objectManager || null;
        this.scene = options.scene || null;
        this.regionManager = options.regionManager || null;
        this.pollDelay = options.pollDelay !== undefined ? options.pollDelay : 500;
        this.batchDelay = options.batchDelay !== undefined ? options.batchDelay : 150;
        this._persistEnabled = options.persist !== false;

        this._lastStage = this.getCurrentStage();
        this.lastCompletedSteps = this._getCurrentCompletedSteps();

        if (this.objectManager && this.lastCompletedSteps.length > 0) {
            this._showObjectsForSteps(this.lastCompletedSteps, false);
        }

        this._updateRegionStates();

        this._initialized = true;

        if (options.autoPoll !== false) {
            this.startPolling();
        }

        return true;
    };

    ProgressSync.prototype.startPolling = function() {
        var self = this;
        this.stopPolling();
        this.pollInterval = setInterval(function() {
            self.sync();
        }, this.pollDelay);
    };

    ProgressSync.prototype.stopPolling = function() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    };

    ProgressSync.prototype.sync = function() {
        if (this.syncing) return;
        if (this._timelineMode) return;

        this.syncing = true;

        var currentSteps = this._getCurrentCompletedSteps();
        var newSteps = this._findNewSteps(this.lastCompletedSteps, currentSteps);
        var removedSteps = this._findRemovedSteps(this.lastCompletedSteps, currentSteps);

        if (newSteps.length > 0) {
            this._handleNewSteps(newSteps);
        }

        if (removedSteps.length > 0) {
            this._handleRemovedSteps(removedSteps);
        }

        var currentStage = this.getCurrentStage();
        if (currentStage !== this._lastStage) {
            var oldStage = this._lastStage;
            this._lastStage = currentStage;
            this._fireStageChange(currentStage, oldStage);
        }

        if (newSteps.length > 0 || removedSteps.length > 0) {
            this._updateRegionStates();
            this._persistState();
        }

        this.lastCompletedSteps = currentSteps;
        this.syncing = false;
    };

    ProgressSync.prototype._getCurrentCompletedSteps = function() {
        if (typeof App === 'undefined' || !App.state || !App.state.sopProgress) {
            return [];
        }

        var mode = this._getMode();
        var modeProgress = App.state.sopProgress[mode];

        if (!modeProgress || !modeProgress.completedSteps) {
            return [];
        }

        return modeProgress.completedSteps.slice();
    };

    ProgressSync.prototype._getMode = function() {
        if (typeof App !== 'undefined' && typeof App.getDecorationMode === 'function') {
            return App.getDecorationMode();
        }
        return 'full';
    };

    ProgressSync.prototype._findNewSteps = function(oldSteps, newSteps) {
        var oldSet = {};
        for (var i = 0; i < oldSteps.length; i++) {
            oldSet[oldSteps[i]] = true;
        }

        var result = [];
        for (var j = 0; j < newSteps.length; j++) {
            if (!oldSet[newSteps[j]]) {
                result.push(newSteps[j]);
            }
        }

        return result;
    };

    ProgressSync.prototype._findRemovedSteps = function(oldSteps, newSteps) {
        var newSet = {};
        for (var i = 0; i < newSteps.length; i++) {
            newSet[newSteps[i]] = true;
        }

        var result = [];
        for (var j = 0; j < oldSteps.length; j++) {
            if (!newSet[oldSteps[j]]) {
                result.push(oldSteps[j]);
            }
        }

        return result;
    };

    ProgressSync.prototype._handleNewSteps = function(newSteps) {
        var sortedSteps = this._sortSteps(newSteps);

        for (var i = 0; i < sortedSteps.length; i++) {
            this._fireStepCompleted(sortedSteps[i]);
        }

        if (this.objectManager) {
            this._showObjectsForSteps(sortedSteps, true);
        }
    };

    ProgressSync.prototype._handleRemovedSteps = function(removedSteps) {
        var sortedSteps = this._sortSteps(removedSteps).reverse();

        for (var i = 0; i < sortedSteps.length; i++) {
            this._fireStepUndone(sortedSteps[i]);
        }

        if (this.objectManager) {
            this._hideObjectsForSteps(sortedSteps, true);
        }
    };

    ProgressSync.prototype._sortSteps = function(steps) {
        return steps.slice().sort(function(a, b) {
            var aNorm = StepObjectMapping ? StepObjectMapping.normalizeStepId(a) : a;
            var bNorm = StepObjectMapping ? StepObjectMapping.normalizeStepId(b) : b;

            if (!aNorm || !bNorm) return 0;

            var aParts = aNorm.split('-');
            var bParts = bNorm.split('-');
            var aStage = parseInt(aParts[0]);
            var bStage = parseInt(bParts[0]);

            if (aStage !== bStage) return aStage - bStage;
            return parseInt(aParts[1]) - parseInt(bParts[1]);
        });
    };

    ProgressSync.prototype._showObjectsForSteps = function(stepIds, animate) {
        if (!StepObjectMapping || !this.objectManager) return;

        var allObjectIds = [];
        var stepObjectPairs = [];

        for (var i = 0; i < stepIds.length; i++) {
            var objectIds = StepObjectMapping.getObjectIdsForStep(stepIds[i]);
            for (var j = 0; j < objectIds.length; j++) {
                var objId = objectIds[j];
                var existingObj = this.objectManager.getObject(objId);
                if (!existingObj) {
                    this.objectManager.addObject(objId);
                }
                stepObjectPairs.push({
                    stepId: stepIds[i],
                    objectId: objId
                });
                if (allObjectIds.indexOf(objId) === -1) {
                    allObjectIds.push(objId);
                }
            }
        }

        if (animate && stepObjectPairs.length > 0) {
            this._animateStepObjects(stepObjectPairs);
        } else {
            for (var k = 0; k < allObjectIds.length; k++) {
                this.objectManager.showObject(allObjectIds[k], false);
            }
        }
    };

    ProgressSync.prototype._animateStepObjects = function(stepObjectPairs) {
        var self = this;
        var delay = this.batchDelay;

        for (var i = 0; i < stepObjectPairs.length; i++) {
            (function(index) {
                setTimeout(function() {
                    if (self.objectManager) {
                        self.objectManager.showObject(stepObjectPairs[index].objectId, true);
                    }
                }, index * delay);
            })(i);
        }
    };

    ProgressSync.prototype._hideObjectsForSteps = function(stepIds, animate) {
        if (!StepObjectMapping || !this.objectManager) return;

        var allObjectIds = [];
        var stepObjectPairs = [];

        for (var i = 0; i < stepIds.length; i++) {
            var objectIds = StepObjectMapping.getObjectIdsForStep(stepIds[i]);
            for (var j = 0; j < objectIds.length; j++) {
                var objId = objectIds[j];
                var obj = this.objectManager.getObject(objId);
                if (obj && obj.visible) {
                    var stillNeeded = this._isObjectNeededByOtherSteps(objId, stepIds);
                    if (!stillNeeded) {
                        stepObjectPairs.push({
                            stepId: stepIds[i],
                            objectId: objId
                        });
                        if (allObjectIds.indexOf(objId) === -1) {
                            allObjectIds.push(objId);
                        }
                    }
                }
            }
        }

        if (animate && stepObjectPairs.length > 0) {
            this._animateHideStepObjects(stepObjectPairs);
        } else {
            for (var k = 0; k < allObjectIds.length; k++) {
                this.objectManager.hideObject(allObjectIds[k], false);
            }
        }
    };

    ProgressSync.prototype._isObjectNeededByOtherSteps = function(objectId, excludingStepIds) {
        if (!StepObjectMapping) return false;

        var allCompletedSteps = this._getCurrentCompletedSteps();
        var excludingSet = {};
        for (var i = 0; i < excludingStepIds.length; i++) {
            excludingSet[excludingStepIds[i]] = true;
        }

        for (var j = 0; j < allCompletedSteps.length; j++) {
            if (!excludingSet[allCompletedSteps[j]]) {
                var objects = StepObjectMapping.getObjectIdsForStep(allCompletedSteps[j]);
                if (objects.indexOf(objectId) !== -1) {
                    return true;
                }
            }
        }

        return false;
    };

    ProgressSync.prototype._animateHideStepObjects = function(stepObjectPairs) {
        var self = this;
        var delay = this.batchDelay;

        for (var i = 0; i < stepObjectPairs.length; i++) {
            (function(index) {
                setTimeout(function() {
                    if (self.objectManager) {
                        self.objectManager.hideObject(stepObjectPairs[index].objectId, true);
                    }
                }, index * delay);
            })(i);
        }
    };

    ProgressSync.prototype.getCompletedStepIds = function() {
        return this._getCurrentCompletedSteps();
    };

    ProgressSync.prototype.getCurrentStage = function() {
        var steps = this._getCurrentCompletedSteps();

        if (steps.length === 0) {
            return 0;
        }

        var maxStage = 0;
        for (var i = 0; i < steps.length; i++) {
            var normalized = StepObjectMapping ? StepObjectMapping.normalizeStepId(steps[i]) : null;
            if (normalized) {
                var stageNum = parseInt(normalized.split('-')[0]);
                if (stageNum >= 1 && stageNum <= 6 && stageNum > maxStage) {
                    maxStage = stageNum;
                }
            }
        }

        return maxStage;
    };

    ProgressSync.prototype.getStepToObjectMap = function() {
        if (!StepObjectMapping) {
            return {};
        }
        var mode = this._getMode();
        return StepObjectMapping.getStepObjectMap(mode);
    };

    ProgressSync.prototype.onStepCompleted = function(callback) {
        if (typeof callback === 'function') {
            this.stepCallbacks.push(callback);
        }
    };

    ProgressSync.prototype.onStageChange = function(callback) {
        if (typeof callback === 'function') {
            this.stageCallbacks.push(callback);
        }
    };

    ProgressSync.prototype.onRegionChange = function(callback) {
        if (typeof callback === 'function') {
            this.regionCallbacks.push(callback);
        }
    };

    ProgressSync.prototype.onStepUndone = function(callback) {
        if (typeof callback === 'function') {
            this.stepUndoCallbacks = this.stepUndoCallbacks || [];
            this.stepUndoCallbacks.push(callback);
        }
    };

    ProgressSync.prototype._fireStepCompleted = function(stepId) {
        for (var i = 0; i < this.stepCallbacks.length; i++) {
            try {
                this.stepCallbacks[i](stepId);
            } catch (e) {
                console.error('ProgressSync step callback error:', e);
            }
        }
    };

    ProgressSync.prototype._fireStageChange = function(newStage, oldStage) {
        for (var i = 0; i < this.stageCallbacks.length; i++) {
            try {
                this.stageCallbacks[i](newStage, oldStage);
            } catch (e) {
                console.error('ProgressSync stage callback error:', e);
            }
        }
    };

    ProgressSync.prototype._fireStepUndone = function(stepId) {
        if (this.stepUndoCallbacks) {
            for (var i = 0; i < this.stepUndoCallbacks.length; i++) {
                try {
                    this.stepUndoCallbacks[i](stepId);
                } catch (e) {
                    console.error('ProgressSync step undo callback error:', e);
                }
            }
        }
    };

    ProgressSync.prototype._fireRegionChange = function(regionStates) {
        for (var i = 0; i < this.regionCallbacks.length; i++) {
            try {
                this.regionCallbacks[i](regionStates);
            } catch (e) {
                console.error('ProgressSync region callback error:', e);
            }
        }
    };

    ProgressSync.prototype._updateRegionStates = function() {
        if (!StepObjectMapping) return;

        var completedSteps = this._getCurrentCompletedSteps();
        var regionMappings = StepObjectMapping.getAllRegionMappings();
        var newStates = {};

        for (var i = 0; i < regionMappings.length; i++) {
            var region = regionMappings[i];
            var progress = StepObjectMapping.getRegionProgress(region.id, completedSteps);
            var currentStage = 0;

            for (var s = region.stages.length - 1; s >= 0; s--) {
                var stageNum = region.stages[s];
                var stageSteps = StepObjectMapping.getStageSteps(stageNum);
                var allCompleted = true;

                for (var j = 0; j < stageSteps.length; j++) {
                    var stepNorm = StepObjectMapping.normalizeStepId(stageSteps[j]);
                    var found = false;
                    for (var k = 0; k < completedSteps.length; k++) {
                        var completedNorm = StepObjectMapping.normalizeStepId(completedSteps[k]);
                        if (completedNorm === stepNorm) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        allCompleted = false;
                        break;
                    }
                }

                if (allCompleted) {
                    currentStage = stageNum;
                    break;
                }
            }

            newStates[region.id] = {
                progress: progress,
                currentStage: currentStage,
                name: region.name,
                description: region.description
            };
        }

        this._regionStates = newStates;
        this._fireRegionChange(newStates);
    };

    ProgressSync.prototype.getRegionStates = function() {
        return this._regionStates;
    };

    ProgressSync.prototype.getRegionState = function(regionId) {
        return this._regionStates[regionId] || null;
    };

    ProgressSync.prototype._persistState = function() {
        if (!this._persistEnabled) return;

        var state = {
            completedSteps: this.lastCompletedSteps,
            currentStage: this._lastStage,
            regionStates: this._regionStates,
            timestamp: Date.now()
        };
        Storage.save(STORAGE_KEY, state);
    };

    ProgressSync.prototype._loadPersistedState = function() {
        if (!this._persistEnabled) return null;

        var saved = Storage.load(STORAGE_KEY);
        if (saved) {
            return saved;
        }
        return null;
    };

    ProgressSync.prototype.clearPersistedState = function() {
        Storage.remove(STORAGE_KEY);
    };

    ProgressSync.prototype.setTimelineMode = function(enabled) {
        this._timelineMode = enabled;
        if (enabled) {
            this.stopPolling();
        } else {
            this.startPolling();
            this.sync();
        }
    };

    ProgressSync.prototype.isTimelineMode = function() {
        return this._timelineMode;
    };

    ProgressSync.prototype.showStage = function(stage, animate) {
        if (!this.objectManager || !StepObjectMapping) return;

        var targetStage = parseInt(stage);
        var objectsToShow = StepObjectMapping.getObjectsUpToStage(targetStage);
        var allObjects = StepObjectMapping.getAllSteps ? [] : [];

        var allObjectIds = [];
        for (var s = 1; s <= 6; s++) {
            var stageObjects = StepObjectMapping.getObjectsForStage(s);
            for (var i = 0; i < stageObjects.length; i++) {
                if (allObjectIds.indexOf(stageObjects[i]) === -1) {
                    allObjectIds.push(stageObjects[i]);
                }
            }
        }

        var objectsToHide = [];
        for (var j = 0; j < allObjectIds.length; j++) {
            if (objectsToShow.indexOf(allObjectIds[j]) === -1) {
                objectsToHide.push(allObjectIds[j]);
            }
        }

        if (animate) {
            this._animateToStage(objectsToShow, objectsToHide, targetStage);
        } else {
            for (var k = 0; k < objectsToHide.length; k++) {
                var obj = this.objectManager.getObject(objectsToHide[k]);
                if (obj && obj.visible) {
                    this.objectManager.hideObject(objectsToHide[k], false);
                }
            }
            for (var m = 0; m < objectsToShow.length; m++) {
                var showObj = this.objectManager.getObject(objectsToShow[m]);
                if (!showObj) {
                    this.objectManager.addObject(objectsToShow[m]);
                }
                this.objectManager.showObject(objectsToShow[m], false);
            }
        }
    };

    ProgressSync.prototype._animateToStage = function(objectsToShow, objectsToHide, targetStage) {
        var self = this;
        var delay = 80;

        for (var i = 0; i < objectsToHide.length; i++) {
            (function(index) {
                setTimeout(function() {
                    if (self.objectManager) {
                        var obj = self.objectManager.getObject(objectsToHide[index]);
                        if (obj && obj.visible) {
                            self.objectManager.hideObject(objectsToHide[index], true);
                        }
                    }
                }, index * delay * 0.5);
            })(i);
        }

        var showDelay = objectsToHide.length * delay * 0.5 + 200;

        for (var j = 0; j < objectsToShow.length; j++) {
            (function(index) {
                setTimeout(function() {
                    if (self.objectManager) {
                        var obj = self.objectManager.getObject(objectsToShow[index]);
                        if (!obj) {
                            self.objectManager.addObject(objectsToShow[index]);
                        }
                        self.objectManager.showObject(objectsToShow[index], true);
                    }
                }, showDelay + index * delay);
            })(j);
        }
    };

    ProgressSync.prototype.reset = function() {
        this.stopPolling();
        this.lastCompletedSteps = [];
        this._lastStage = 0;
        this._regionStates = {};

        if (this.objectManager) {
            this.objectManager.clear();
        }

        this.clearPersistedState();
    };

    ProgressSync.prototype.destroy = function() {
        this.stopPolling();
        this.stepCallbacks = [];
        this.stageCallbacks = [];
        this.regionCallbacks = [];
        this.stepUndoCallbacks = [];
        this.objectManager = null;
        this.scene = null;
        this.regionManager = null;
        this.lastCompletedSteps = [];
        this._regionStates = {};
        this._initialized = false;
        this._lastStage = 0;
        this._timelineMode = false;
    };

    ProgressSync.prototype.getTotalProgress = function() {
        if (!StepObjectMapping) return 0;
        var totalSteps = StepObjectMapping.getTotalStepCount();
        var completed = this.lastCompletedSteps.length;
        return totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;
    };

    ProgressSync.prototype.getStageInfo = function(stage) {
        if (!StepObjectMapping) return null;
        return {
            stage: stage,
            name: StepObjectMapping.getStageName(stage),
            description: StepObjectMapping.getStageDescription(stage),
            stepCount: StepObjectMapping.getStageStepCount(stage)
        };
    };

    ProgressSync.prototype.getAllStageInfo = function() {
        if (!StepObjectMapping) return [];
        return StepObjectMapping.getAllStageNames();
    };

    return {
        ProgressSync: ProgressSync,
        create: function(options) {
            var sync = new ProgressSync();
            if (options) {
                sync.init(options);
            }
            return sync;
        },
        createSync: function(options) {
            var sync = new ProgressSync();
            if (options) {
                sync.init(options);
            }
            return sync;
        }
    };
})();
