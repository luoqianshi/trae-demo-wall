(function () {
  const TryDialogue = {
    init() {
      const btn = document.querySelector('[data-try-dialogue]');
      if (!btn) return;
      btn.addEventListener('click', () => {
        window.location.href = 'reading.html';
      });
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    TryDialogue.init();
  });
})();
