/**
 * StateManager — 全局状态机
 */
class StateManager {
  static currentState = null;
  static currentScene = null;
  static container = null;

  static SCENES = {
    OPENING: OpeningScene,
    WINDOW: WindowScene,
    CHOICE: ChoiceScene,
    PIER: PierScene,
    ROOM: RoomScene,
    BREATHING: BreathingScene,
    SILENCE: SilenceScene
  };

  static init() {
    this.container = document.getElementById('app');
    this.transition('OPENING');
  }

  static transition(newState) {
    // 销毁当前场景
    if (this.currentScene && this.currentScene.destroy) {
      this.currentScene.destroy();
    }

    const isFirst = (this.currentState === null);

    // 淡出
    if (!isFirst) {
      this.container.classList.add('scene-exit');
    }

    const delay = isFirst ? 0 : 2000;

    setTimeout(() => {
      // 清空
      this.container.innerHTML = '';
      this.container.className = `scene scene-${newState.toLowerCase()}`;

      // 检查是否有过渡文案（Opening 和 Choice 不显示）
      const transText = !isFirst && newState !== 'CHOICE' && TEXTS.transitions[newState];
      if (transText) {
        this.showTransitionText(transText, () => {
          this.enterScene(newState);
        });
      } else {
        this.enterScene(newState);
      }
    }, delay);
  }

  static showTransitionText(text, callback) {
    const el = document.createElement('p');
    el.className = 'text-guide transition-text';
    el.style.whiteSpace = 'pre-line';
    el.textContent = text;
    this.container.appendChild(el);

    // 文字显示 3 秒后淡出，再进入场景
    setTimeout(() => {
      el.classList.add('text-disappear');
      setTimeout(() => {
        el.remove();
        callback();
      }, 1500);
    }, 3000);
  }

  static enterScene(newState) {
    this.container.classList.add('scene-enter');
    this.currentState = newState;
    const SceneClass = this.SCENES[newState];
    if (SceneClass) {
      this.currentScene = new SceneClass(this.container);
      this.currentScene.start();
    }
  }
}
