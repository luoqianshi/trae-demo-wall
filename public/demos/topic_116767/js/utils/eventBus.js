var EventBus = (function() {
    var events = {};
    var debugMode = false;

    var EVENTS = {
        STEP_COMPLETED: 'sop:stepCompleted',
        SOP_STAGE_CHANGED: 'sop:stageChanged',
        SOP_STAGE_COMPLETE: 'sop:stageComplete',
        BUDGET_CREATED: 'budget:created',
        BUDGET_UPDATED: 'budget:updated',
        EXPENSE_ADDED: 'budget:expenseAdded',
        LEVEL_UP: 'home:levelUp',
        ACHIEVEMENT_UNLOCKED: 'home:achievementUnlocked',
        MODE_CHANGED: 'app:modeChanged',
        VIEW_CHANGED: 'viewChanged',
        APP_INITIALIZED: 'appInitialized'
    };

    function on(event, callback) {
        if (!events[event]) {
            events[event] = [];
        }
        events[event].push(callback);
        return function() {
            off(event, callback);
        };
    }

    function off(event, callback) {
        if (!events[event]) {
            return;
        }
        var index = events[event].indexOf(callback);
        if (index > -1) {
            events[event].splice(index, 1);
        }
    }

    function emit(event, data) {
        if (debugMode) {
            console.log('[EventBus] emit:', event, data);
        }
        if (!events[event]) {
            return;
        }
        var callbacks = events[event].slice();
        for (var i = 0; i < callbacks.length; i++) {
            try {
                callbacks[i](data);
            } catch (e) {
                console.error('EventBus emit error for event "' + event + '":', e);
            }
        }
    }

    function once(event, callback) {
        var wrapper = function(data) {
            callback(data);
            off(event, wrapper);
        };
        on(event, wrapper);
    }

    function clear(event) {
        if (event) {
            delete events[event];
        } else {
            events = {};
        }
    }

    function setDebug(enabled) {
        debugMode = !!enabled;
    }

    function getListenerCount(event) {
        if (!events[event]) return 0;
        return events[event].length;
    }

    return {
        on: on,
        off: off,
        emit: emit,
        once: once,
        clear: clear,
        setDebug: setDebug,
        getListenerCount: getListenerCount,
        EVENTS: EVENTS
    };
})();
