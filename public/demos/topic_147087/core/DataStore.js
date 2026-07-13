(function (global) {
  'use strict';

  var Emitter = global.TT.EventEmitter;

  function DataStore() {
    Emitter.call(this);
    this._nodes = new Map();
    this._timelines = new Map();
    this._relations = [];
    this._modifiedNodes = new Set();
    this._modifiedTimelines = new Set();
  }

  DataStore.prototype = Object.create(Emitter.prototype);
  DataStore.prototype.constructor = DataStore;

  DataStore._instance = null;
  DataStore.getInstance = function () {
    if (!DataStore._instance) {
      DataStore._instance = new DataStore();
    }
    return DataStore._instance;
  };

  DataStore.prototype.getNode = function (nodeId) {
    var node = this._nodes.get(nodeId);
    if (!node) return null;
    return Object.freeze(Object.assign({}, node));
  };

  DataStore.prototype.getAllNodes = function () {
    var self = this;
    return Array.from(this._nodes.values()).map(function (n) {
      return Object.freeze(Object.assign({}, n));
    });
  };

  DataStore.prototype.getTimeline = function (timelineId) {
    var tl = this._timelines.get(timelineId);
    if (!tl) return null;
    var self = this;
    var copy = Object.assign({}, tl);
    copy.nodes = (tl.nodes || []).map(function (tn) {
      var tnCopy = Object.assign({}, tn);
      tnCopy.relations = self._getRelationsForTimelineNode(tn.nodeId, timelineId).map(function (r) {
        return Object.assign({}, r);
      });
      return Object.freeze(tnCopy);
    });
    return Object.freeze(copy);
  };

  DataStore.prototype.getAllTimelines = function () {
    var self = this;
    return Array.from(this._timelines.values()).map(function (tl) {
      return self.getTimeline(tl.id);
    });
  };

  DataStore.prototype._getRelationsForTimelineNode = function (nodeId, timelineId) {
    var self = this;
    var result = [];
    this._relations.forEach(function (rel) {
      if (rel.fromNodeId === nodeId) {
        result.push({
          targetNodeId: rel.toNodeId,
          targetTimelineId: rel.targetTimelineId || self._findPreferredTimeline(rel.toNodeId, timelineId),
          direction: 'out',
          label: rel.label
        });
      } else if (rel.toNodeId === nodeId) {
        result.push({
          targetNodeId: rel.fromNodeId,
          targetTimelineId: self._findPreferredTimeline(rel.fromNodeId, timelineId),
          direction: 'in',
          label: rel.label
        });
      }
    });
    return result;
  };

  DataStore.prototype._findPreferredTimeline = function (targetNodeId, currentTimelineId) {
    var node = this._nodes.get(targetNodeId);
    if (!node || !node._timelines || node._timelines.length === 0) return currentTimelineId;
    for (var i = 0; i < node._timelines.length; i++) {
      if (node._timelines[i] !== currentTimelineId) return node._timelines[i];
    }
    return node._timelines[0];
  };

  DataStore.prototype.getRelationsOf = function (nodeId) {
    var self = this;
    var result = [];
    var seen = new Set();
    this._relations.forEach(function (rel) {
      var isOutgoing = rel.fromNodeId === nodeId;
      var isIncoming = rel.toNodeId === nodeId;
      if (!isOutgoing && !isIncoming) return;

      var fromId = isOutgoing ? rel.fromNodeId : rel.toNodeId;
      var toId = isOutgoing ? rel.toNodeId : rel.fromNodeId;
      var relKey = fromId + '||' + toId + '||' + (rel.label || '');
      if (seen.has(relKey)) return;
      seen.add(relKey);

      result.push({
        fromNodeId: fromId,
        toNodeId: toId,
        fromTimelineId: self._findPreferredTimeline(fromId, null),
        toTimelineId: isOutgoing
          ? (rel.targetTimelineId || self._findPreferredTimeline(toId, null))
          : self._findPreferredTimeline(toId, null),
        label: rel.label,
        direction: isOutgoing ? 'out' : 'in'
      });
    });
    return result;
  };

  DataStore.prototype.loadNodes = function (nodesMap) {
    var self = this;
    Object.keys(nodesMap).forEach(function (id) {
      var node = Object.assign({}, nodesMap[id]);
      node._timelines = [];
      self._nodes.set(id, node);
    });
    this.emit('data:loaded', {});
  };

  DataStore.prototype.loadTimelines = function (timelinesMap) {
    var self = this;
    Object.keys(timelinesMap).forEach(function (id) {
      var tl = Object.assign({}, timelinesMap[id]);
      tl.id = id;
      (tl.nodes || []).forEach(function (tn) {
        var node = self._nodes.get(tn.nodeId);
        if (node && node._timelines.indexOf(id) < 0) {
          node._timelines.push(id);
        }
      });
      self._timelines.set(id, tl);
    });
  };

  DataStore.prototype.loadRelations = function (relations) {
    this._relations = (relations || []).map(function (r) {
      return Object.assign({}, r);
    });
  };

  DataStore.prototype.updateNode = function (nodeId, changes) {
    var node = this._nodes.get(nodeId);
    if (!node) { console.warn('DataStore: node not found', nodeId); return false; }
    Object.keys(changes).forEach(function (key) {
      if (key === '_timelines') return;
      node[key] = changes[key];
    });
    node.updatedAt = new Date().toISOString();
    this.emit('node:changed', { nodeId: nodeId, node: this.getNode(nodeId) });
    return true;
  };

  DataStore.prototype.createNode = function (nodeData) {
    var id = nodeData.id || 'node-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    var now = new Date().toISOString();
    var node = Object.assign({
      type: 'event',
      summary: '',
      note: '',
      tags: {},
      source: '',
      aliases: [],
      versionNumber: null,
      versionTag: null,
      changelog: [],
      status: 'pending',
      createdBy: 'curator'
    }, nodeData, { id: id, createdAt: now, updatedAt: now, _timelines: [] });
    this._nodes.set(id, node);
    this._modifiedNodes.add(id);
    this.emit('node:created', { nodeId: id, node: this.getNode(id) });
    return id;
  };

  DataStore.prototype.deleteNode = function (nodeId) {
    if (!this._nodes.has(nodeId)) { console.warn('DataStore: node not found', nodeId); return false; }
    var self = this;
    this._timelines.forEach(function (tl, tlId) {
      var idx = -1;
      for (var i = 0; i < tl.nodes.length; i++) {
        if (tl.nodes[i].nodeId === nodeId) { idx = i; break; }
      }
      if (idx >= 0) {
        tl.nodes.splice(idx, 1);
        self._modifiedTimelines.add(tlId);
      }
    });
    this._relations = this._relations.filter(function (r) {
      return r.fromNodeId !== nodeId && r.toNodeId !== nodeId;
    });
    this._nodes.delete(nodeId);
    this.emit('node:deleted', { nodeId: nodeId });
    return true;
  };

  DataStore.prototype.addNodeToTimeline = function (nodeId, timelineId, index) {
    var tl = this._timelines.get(timelineId);
    var node = this._nodes.get(nodeId);
    if (!tl || !node) { console.warn('DataStore: timeline or node not found'); return false; }
    var entry = { time: node.startTime, title: node.title, nodeId: node.id, importance: node.importance };
    if (index === undefined || index < 0 || index >= tl.nodes.length) {
      tl.nodes.push(entry);
    } else {
      tl.nodes.splice(index, 0, entry);
    }
    if (node._timelines.indexOf(timelineId) < 0) {
      node._timelines.push(timelineId);
    }
    tl.updatedAt = new Date().toISOString();
    this._modifiedTimelines.add(timelineId);
    this.emit('timeline:changed', { timelineId: timelineId, timeline: this.getTimeline(timelineId) });
    return true;
  };

  DataStore.prototype.removeNodeFromTimeline = function (nodeId, timelineId) {
    var tl = this._timelines.get(timelineId);
    if (!tl) { console.warn('DataStore: timeline not found', timelineId); return false; }
    for (var i = 0; i < tl.nodes.length; i++) {
      if (tl.nodes[i].nodeId === nodeId) {
        tl.nodes.splice(i, 1);
        tl.updatedAt = new Date().toISOString();
        this._modifiedTimelines.add(timelineId);
        var node = this._nodes.get(nodeId);
        if (node) {
          var idx = node._timelines.indexOf(timelineId);
          if (idx >= 0) node._timelines.splice(idx, 1);
        }
        this.emit('timeline:changed', { timelineId: timelineId, timeline: this.getTimeline(timelineId) });
        return true;
      }
    }
    return false;
  };

  DataStore.prototype.reorderNodeInTimeline = function (timelineId, nodeId, newIndex) {
    var tl = this._timelines.get(timelineId);
    if (!tl) { console.warn('DataStore: timeline not found', timelineId); return false; }
    var oldIndex = -1;
    for (var i = 0; i < tl.nodes.length; i++) {
      if (tl.nodes[i].nodeId === nodeId) { oldIndex = i; break; }
    }
    if (oldIndex < 0 || oldIndex === newIndex) return false;
    var entry = tl.nodes.splice(oldIndex, 1)[0];
    tl.nodes.splice(newIndex, 0, entry);
    tl.updatedAt = new Date().toISOString();
    this._modifiedTimelines.add(timelineId);
    this.emit('timeline:changed', { timelineId: timelineId, timeline: this.getTimeline(timelineId) });
    return true;
  };

  DataStore.prototype.moveNodeToTimeline = function (nodeId, fromTlId, toTlId, newIndex) {
    if (!this.removeNodeFromTimeline(nodeId, fromTlId)) return false;
    return this.addNodeToTimeline(nodeId, toTlId, newIndex);
  };

  DataStore.prototype.addRelation = function (relation) {
    var r = Object.assign({ label: '关联' }, relation);
    if (!r.fromNodeId || !r.toNodeId) {
      console.warn('DataStore: relation requires fromNodeId and toNodeId');
      return false;
    }
    this._relations.push(r);
    this.emit('relation:changed', { fromNodeId: r.fromNodeId, toNodeId: r.toNodeId });
    return true;
  };

  DataStore.prototype.removeRelation = function (fromNodeId, toNodeId) {
    var removed = false;
    this._relations = this._relations.filter(function (r) {
      if (r.fromNodeId === fromNodeId && r.toNodeId === toNodeId) {
        removed = true;
        return false;
      }
      return true;
    });
    if (removed) {
      this.emit('relation:changed', { fromNodeId: fromNodeId, toNodeId: toNodeId });
    }
    return removed;
  };

  DataStore.prototype.updateRelation = function (fromNodeId, toNodeId, changes) {
    var updated = false;
    this._relations.forEach(function (r) {
      if (r.fromNodeId === fromNodeId && r.toNodeId === toNodeId) {
        Object.keys(changes).forEach(function (k) { r[k] = changes[k]; });
        updated = true;
      }
    });
    if (updated) {
      this.emit('relation:changed', { fromNodeId: fromNodeId, toNodeId: toNodeId });
    }
    return updated;
  };

  DataStore.prototype.getModifiedNodes = function () {
    var self = this;
    return Array.from(this._modifiedNodes).map(function (id) { return self.getNode(id); }).filter(Boolean);
  };

  DataStore.prototype.getModifiedTimelines = function () {
    var self = this;
    return Array.from(this._modifiedTimelines).map(function (id) { return self.getTimeline(id); }).filter(Boolean);
  };

  DataStore.prototype.markModifiedNode = function (nodeId) {
    this._modifiedNodes.add(nodeId);
  };

  DataStore.prototype.markModifiedTimeline = function (tlId) {
    this._modifiedTimelines.add(tlId);
  };

  DataStore.prototype.clearModified = function () {
    this._modifiedNodes.clear();
    this._modifiedTimelines.clear();
  };

  DataStore.prototype.destroy = function () {
    this._nodes.clear();
    this._timelines.clear();
    this._relations = [];
    this._modifiedNodes.clear();
    this._modifiedTimelines.clear();
    Emitter.prototype.destroy.call(this);
  };

  global.TT.DataStore = DataStore;

})(window);
