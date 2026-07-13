(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  function CanvasState() {
    Emitter.call(this);
    this._state = {
      mode: 'view',
      selectedNodeId: null,
      selectedNodeEl: null,
      activeTimelineIds: [],
      focusChain: null,
      zoom: 1.0,
      connectMode: null
    };
  }

  CanvasState.prototype = Object.create(Emitter.prototype);
  CanvasState.prototype.constructor = CanvasState;

  CanvasState._instance = null;
  CanvasState.getInstance = function () {
    if (!CanvasState._instance) {
      CanvasState._instance = new CanvasState();
    }
    return CanvasState._instance;
  };

  CanvasState.prototype.subscribe = function (callback) {
    return this.on('*', callback);
  };

  CanvasState.prototype.setMode = function (mode) {
    if (['view', 'edit', 'focus'].indexOf(mode) === -1) return;
    var prev = this._state.mode;
    this._state.mode = mode;

    if (prev === 'focus' && mode !== 'focus') {
      this._state.focusChain = null;
    }
    if (mode !== 'edit') {
      this.deselectNode();
    }
    if (prev === 'edit' && mode !== 'edit') {
      this.exitConnectMode();
    }

    this.emit('modeChanged', { mode: mode, prevMode: prev });
  };

  CanvasState.prototype.getMode = function () {
    return this._state.mode;
  };

  CanvasState.prototype.selectNode = function (nodeId, nodeEl) {
    if (this._state.mode !== 'edit') return;
    this._state.selectedNodeId = nodeId;
    this._state.selectedNodeEl = nodeEl;
    this.emit('nodeSelected', { nodeId: nodeId, nodeEl: nodeEl });
  };

  CanvasState.prototype.deselectNode = function () {
    if (!this._state.selectedNodeId) return;
    this._state.selectedNodeId = null;
    this._state.selectedNodeEl = null;
    this.emit('nodeDeselected', {});
  };

  CanvasState.prototype.getSelectedNode = function () {
    if (!this._state.selectedNodeId) return null;
    return { nodeId: this._state.selectedNodeId, nodeEl: this._state.selectedNodeEl };
  };

  CanvasState.prototype.addTimelineColumn = function (timelineId) {
    if (this._state.activeTimelineIds.indexOf(timelineId) !== -1) return;
    if (this._state.activeTimelineIds.length >= 9) {
      console.warn('CanvasState: max 9 columns');
      return;
    }
    this._state.activeTimelineIds.push(timelineId);
    this.emit('columnAdded', { timelineId: timelineId });
  };

  CanvasState.prototype.removeTimelineColumn = function (timelineId) {
    var idx = this._state.activeTimelineIds.indexOf(timelineId);
    if (idx < 0) return;
    this._state.activeTimelineIds.splice(idx, 1);
    this.emit('columnRemoved', { timelineId: timelineId });
  };

  CanvasState.prototype.getActiveTimelineIds = function () {
    return this._state.activeTimelineIds.slice();
  };

  CanvasState.prototype.enterFocusMode = function (nodeId) {
    var index = global.TT.RelationIndex.getInstance();
    index.rebuild();
    var focusChain = index.getFocusChain(nodeId);
    this._state.focusChain = Object.assign({}, focusChain, { centerNodeId: nodeId });
    this.setMode('focus');
    this.emit('focusEntered', { centerNodeId: nodeId, focusChain: this._state.focusChain });
  };

  CanvasState.prototype.exitFocusMode = function () {
    if (this._state.mode !== 'focus') return;
    this._state.focusChain = null;
    this.setMode('view');
    this.emit('focusExited', {});
  };

  CanvasState.prototype.getFocusChain = function () {
    return this._state.focusChain;
  };

  CanvasState.prototype.setZoom = function (zoom) {
    zoom = Math.max(0.3, Math.min(3.0, zoom));
    if (this._state.zoom === zoom) return;
    this._state.zoom = zoom;
    this.emit('zoomChanged', { zoom: zoom });
  };

  CanvasState.prototype.getZoom = function () {
    return this._state.zoom;
  };

  CanvasState.prototype.enterConnectMode = function (fromNodeId, fromTimelineId) {
    this._state.connectMode = { fromNodeId: fromNodeId, fromTimelineId: fromTimelineId };
    this.emit('connectEntered', { fromNodeId: fromNodeId });
  };

  CanvasState.prototype.exitConnectMode = function () {
    if (!this._state.connectMode) return;
    this._state.connectMode = null;
    this.emit('connectExited', {});
  };

  CanvasState.prototype.getConnectMode = function () {
    return this._state.connectMode;
  };

  CanvasState.prototype.destroy = function () {
    this._state = null;
    Emitter.prototype.destroy.call(this);
  };

  global.TT.CanvasState = CanvasState;

})(window);
