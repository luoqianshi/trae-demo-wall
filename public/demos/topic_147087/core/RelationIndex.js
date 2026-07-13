(function (global) {
  'use strict';

  function RelationIndex() {
    this._index = new Map();
  }

  RelationIndex._instance = null;
  RelationIndex.getInstance = function () {
    if (!RelationIndex._instance) {
      RelationIndex._instance = new RelationIndex();
    }
    return RelationIndex._instance;
  };

  RelationIndex.prototype.rebuild = function () {
    var store = global.TT.DataStore.getInstance();
    var relations = store._relations || [];
    this._index.clear();

    relations.forEach(function (rel) {
      var entry = {
        fromNodeId: rel.fromNodeId,
        toNodeId: rel.toNodeId,
        fromTimelineId: rel.fromTimelineId || store._findPreferredTimeline(rel.fromNodeId, null),
        toTimelineId: rel.targetTimelineId || store._findPreferredTimeline(rel.toNodeId, null),
        label: rel.label,
        direction: '→'
      };

      var reversed = {
        fromNodeId: rel.toNodeId,
        toNodeId: rel.fromNodeId,
        fromTimelineId: entry.toTimelineId,
        toTimelineId: entry.fromTimelineId,
        label: rel.label,
        direction: '←'
      };

      if (!this._index.has(rel.fromNodeId)) this._index.set(rel.fromNodeId, []);
      this._index.get(rel.fromNodeId).push(entry);

      if (!this._index.has(rel.toNodeId)) this._index.set(rel.toNodeId, []);
      this._index.get(rel.toNodeId).push(reversed);
    }, this);
  };

  RelationIndex.prototype.getRelationsOf = function (nodeId) {
    return this._index.get(nodeId) || [];
  };

  RelationIndex.prototype.getFocusChain = function (nodeId) {
    var relations = this.getRelationsOf(nodeId);
    var nodeIds = new Set([nodeId]);
    var relationIds = new Set();

    relations.forEach(function (rel) {
      nodeIds.add(rel.toNodeId);
      relationIds.add(rel.fromNodeId + '-' + rel.toNodeId);
    });

    return { nodeIds: nodeIds, relationIds: relationIds };
  };

  RelationIndex.prototype.destroy = function () {
    this._index.clear();
  };

  global.TT.RelationIndex = RelationIndex;

})(window);
