/**
 * 知行合一盈亏记录系统 - Hash路由控制器
 */
var Router = (function() {
  'use strict';

  var routes = {};
  var currentRoute = null;
  var beforeHooks = [];

  function register(pattern, handler) {
    routes[pattern] = handler;
  }

  function navigate(hash) {
    if (!hash || hash === '#') hash = '#landing';
    window.location.hash = hash;
  }

  function getCurrentRoute() {
    return currentRoute;
  }

  function _parseRoute(hash) {
    hash = hash || window.location.hash || '#landing';
    if (hash.indexOf('#') === 0) hash = hash.slice(1);

    var parts = hash.split('/').filter(function(p) { return p; });
    var result = {
      raw: hash,
      mode: parts[0] || 'landing',  // 'landing' or 'app'
      path: parts.slice(1),
      full: hash
    };

    // Build route key
    if (result.mode === 'app' && result.path.length > 0) {
      result.key = 'app/' + result.path[0];
      if (result.path.length > 1) {
        result.param = result.path.slice(1).join('/');
      }
    } else if (result.mode === 'app') {
      result.key = 'app/dashboard';
      result.path = ['dashboard'];
    } else {
      result.key = 'landing';
    }

    return result;
  }

  function _handleRoute() {
    var route = _parseRoute();
    currentRoute = route;

    // Before hooks
    var proceed = true;
    for (var i = 0; i < beforeHooks.length; i++) {
      if (beforeHooks[i](route) === false) {
        proceed = false;
        break;
      }
    }

    if (!proceed) return;

    // Execute route handler
    var handler = routes[route.key];
    if (handler) {
      handler(route);
    } else {
      // For landing page anchor links (e.g. #problem, #solution), just show landing
      if (route.mode !== 'app') {
        var landingHandler = routes['landing'];
        if (landingHandler) landingHandler(route);
        // Scroll to anchor if it exists
        var anchor = route.raw;
        if (anchor && anchor !== 'landing') {
          setTimeout(function() {
            var target = document.getElementById(anchor);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      } else if (routes['app/dashboard']) {
        // Default fallback for app routes
        routes['app/dashboard'](route);
      }
    }
  }

  function beforeEach(hook) {
    beforeHooks.push(hook);
  }

  function init() {
    window.addEventListener('hashchange', _handleRoute);
    // Handle initial route
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = '#landing';
    }
    _handleRoute();
  }

  return {
    register: register,
    navigate: navigate,
    getCurrentRoute: getCurrentRoute,
    beforeEach: beforeEach,
    init: init,
    _parseRoute: _parseRoute
  };
})();
