window.AppUtils = (function() {
  'use strict';

  function createElement(tag, attrs, children) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    children = children || [];

    Object.keys(attrs).forEach(function(key) {
      if (key === 'className') {
        el.className = attrs[key];
      } else if (key === 'innerHTML') {
        el.innerHTML = attrs[key];
      } else if (key === 'textContent') {
        el.textContent = attrs[key];
      } else if (key.startsWith('on') && typeof attrs[key] === 'function') {
        var eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, attrs[key]);
      } else if (key.startsWith('data-')) {
        el.setAttribute(key, attrs[key]);
      } else {
        el.setAttribute(key, attrs[key]);
      }
    });

    children.forEach(function(child) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        el.appendChild(child);
      }
    });

    return el;
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function delay(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }

  function typeWriter(el, text, speed, callback) {
    speed = speed || 30;
    var i = 0;
    el.textContent = '';

    function tick() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(tick, speed);
      } else if (typeof callback === 'function') {
        callback();
      }
    }
    tick();
  }

  function animateNumber(el, start, end, duration, decimals) {
    duration = duration || 1000;
    decimals = decimals || 0;
    var startTime = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(now) {
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOutCubic(progress);
      var current = start + (end - start) * eased;
      el.textContent = current.toFixed(decimals);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  function scrollTo(targetId, offset) {
    offset = offset || 80;
    var target = document.getElementById(targetId);
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  return {
    createElement: createElement,
    $: $,
    $$: $$,
    delay: delay,
    typeWriter: typeWriter,
    animateNumber: animateNumber,
    scrollTo: scrollTo
  };

})();