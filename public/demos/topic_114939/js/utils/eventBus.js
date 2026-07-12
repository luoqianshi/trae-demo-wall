window.eventBus = {
  _events: {},
  on: function(event, callback) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(callback);
    var self = this;
    return function() { self.off(event, callback); };
  },
  off: function(event, callback) {
    if (!this._events[event]) return;
    var idx = this._events[event].indexOf(callback);
    if (idx > -1) this._events[event].splice(idx, 1);
  },
  emit: function(event, data) {
    if (!this._events[event]) return;
    this._events[event].forEach(function(cb) {
      try { cb(data); } catch(e) { console.error('[eventBus]', e); }
    });
  },
  once: function(event, callback) {
    var self = this;
    var off = this.on(event, function(data) {
      off();
      callback(data);
    });
    return off;
  }
};
