(function (global) {
  'use strict';

  var _theme = 'default';
  var _config = {};

  _config['default'] = {
    node: {
      baseClass: 'tt-node',
      importance: {
        breakthrough: 'tt-node--breakthrough',
        important: 'tt-node--important',
        minor: 'tt-node--minor'
      },
      state: {
        selected: 'is-selected',
        edited: 'is-edited',
        focus: 'is-focus',
        blur: 'is-blur'
      }
    },
    toolbar: {
      baseClass: 'tt-toolbar',
      visible: 'is-visible'
    },
    column: {
      baseClass: 'tt-column',
      main: 'tt-column--main',
      extra: 'tt-column--extra',
      branch: 'tt-column--branch'
    }
  };

  var ThemeAdapter = {};

  ThemeAdapter.setTheme = function (name) {
    if (_config[name]) _theme = name;
  };

  ThemeAdapter.getTheme = function () {
    return _theme;
  };

  ThemeAdapter.applyNodeTheme = function (el, node, state) {
    if (!el) return;
    var cfg = _config[_theme];
    if (!cfg) return;
    var nc = cfg.node;
    var cls = [nc.baseClass];

    if (node && node.importance && nc.importance[node.importance]) {
      cls.push(nc.importance[node.importance]);
    }

    if (state) {
      if (state.selected && nc.state.selected) cls.push(nc.state.selected);
      if (state.edited && nc.state.edited) cls.push(nc.state.edited);
      if (state.mode === 'focus') {
        if (state.inFocusChain && nc.state.focus) {
          cls.push(nc.state.focus);
        } else if (!state.inFocusChain && nc.state.blur) {
          cls.push(nc.state.blur);
        }
      }
    }

    el.className = cls.join(' ');
  };

  ThemeAdapter.applyToolbarTheme = function (el, visible) {
    if (!el) return;
    var cfg = _config[_theme];
    if (!cfg) return;
    var tc = cfg.toolbar;
    var cls = [tc.baseClass];
    if (visible) cls.push(tc.visible);
    el.className = cls.join(' ');
  };

  ThemeAdapter.applyColumnTheme = function (el, type) {
    if (!el) return;
    var cfg = _config[_theme];
    if (!cfg) return;
    var cc = cfg.column;
    var cls = [cc.baseClass];
    if (cc[type]) cls.push(cc[type]);
    el.className = cls.join(' ');
  };

  global.TT.ThemeAdapter = ThemeAdapter;

})(window);
