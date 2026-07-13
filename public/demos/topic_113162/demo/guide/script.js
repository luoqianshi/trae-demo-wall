/* ── Demo Guide JavaScript ── */

(function () {
  'use strict';

  // ── 1. Copy to Clipboard ──
  var copyBtns = document.querySelectorAll('.dg-copy-btn');

  copyBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var prompt = btn.getAttribute('data-prompt');
      if (!prompt) return;

      // Decode HTML entities in case they were used
      var decoded = prompt
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      navigator.clipboard.writeText(decoded).then(function () {
        // Button feedback
        var originalText = btn.textContent;
        btn.textContent = '✅ 已复制';
        btn.classList.add('copied');

        // Toast
        showToast();

        // Revert button after 2s
        setTimeout(function () {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 2000);
      }).catch(function () {
        // Fallback for older browsers
        var textarea = document.createElement('textarea');
        textarea.value = decoded;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          var originalText = btn.textContent;
          btn.textContent = '✅ 已复制';
          btn.classList.add('copied');
          showToast();
          setTimeout(function () {
            btn.textContent = originalText;
            btn.classList.remove('copied');
          }, 2000);
        } catch (e) {
          // Silent fail
        }
        document.body.removeChild(textarea);
      });
    });
  });

  // ── Toast ──
  var toastEl = document.getElementById('dg-toast');
  var toastTimer = null;

  function showToast() {
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.classList.add('show');
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
      toastTimer = null;
    }, 3000);
  }

  // ── 2. Smooth Scroll for Anchor Links ──
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      if (targetId.length <= 1) return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── 3. Section Visibility Animation (IntersectionObserver) ──
  var sections = document.querySelectorAll('.dg-section');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  } else {
    // Fallback: show all sections immediately
    sections.forEach(function (section) {
      section.classList.add('visible');
    });
  }

})();
