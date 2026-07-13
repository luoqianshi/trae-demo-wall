(function (global) {
  'use strict';

  function EventEmitter() {
    this._events = {};
  }

  EventEmitter.prototype.on = function (event, handler) {
    if (!this._events[event]) {
      this._events[event] = new Set();
    }
    this._events[event].add(handler);
    return this.off.bind(this, event, handler);
  };

  EventEmitter.prototype.off = function (event, handler) {
    var set = this._events[event];
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        delete this._events[event];
      }
    }
  };

  EventEmitter.prototype.emit = function (event, data) {
    var set = this._events[event];
    if (set) {
      set.forEach(function (handler) {
        handler(data);
      });
    }
    var wildcard = this._events['*'];
    if (wildcard && event !== '*') {
      wildcard.forEach(function (handler) {
        handler({ type: event, data: data });
      });
    }
  };

  EventEmitter.prototype.destroy = function () {
    this._events = {};
  };

  global.TT = global.TT || {};
  global.TT.EventEmitter = EventEmitter;

})(window);
