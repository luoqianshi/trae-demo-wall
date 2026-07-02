/**
 * Choice Scene — Phase 2
 * 两个选项："想出去走走" / "想直接睡觉"
 */
class ChoiceScene {
  constructor(container) {
    this.container = container;
    this.autoAdvance = null;
  }

  start() {
    const wrapper = document.createElement('div');
    wrapper.className = 'choice-scene';

    TEXTS.choice.options.forEach((opt, i) => {
      if (i > 0) {
        const divider = document.createElement('div');
        divider.className = 'choice-divider';
        wrapper.appendChild(divider);
      }
      const el = document.createElement('p');
      el.className = 'choice-option';
      el.textContent = opt.text;
      el.addEventListener('click', () => {
        el.style.opacity = '1';
        setTimeout(() => StateManager.transition(opt.target), 500);
      });
      wrapper.appendChild(el);
    });

    this.container.appendChild(wrapper);

    // 60秒无操作默认进入"想直接睡觉"
    this.autoAdvance = setTimeout(() => {
      StateManager.transition('ROOM');
    }, 60000);
  }

  destroy() {
    clearTimeout(this.autoAdvance);
  }
}
