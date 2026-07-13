(function (global) {
  'use strict';

  global.TT = global.TT || {};

  global.TT.Events = Object.freeze({
    DATA_LOADED: 'data:loaded',
    NODE_CHANGED: 'node:changed',
    NODE_CREATED: 'node:created',
    NODE_DELETED: 'node:deleted',
    TIMELINE_CHANGED: 'timeline:changed',
    TIMELINE_CREATED: 'timeline:created',
    RELATION_CHANGED: 'relation:changed',

    MODE_CHANGED: 'modeChanged',
    NODE_SELECTED: 'nodeSelected',
    NODE_DESELECTED: 'nodeDeselected',
    FOCUS_ENTERED: 'focusEntered',
    FOCUS_EXITED: 'focusExited',
    COLUMN_ADDED: 'columnAdded',
    COLUMN_REMOVED: 'columnRemoved',
    ZOOM_CHANGED: 'zoomChanged',
    CONNECT_ENTERED: 'connectEntered',
    CONNECT_EXITED: 'connectExited',
  });

})(window);
