import { navigateBack, navigateTo } from '../router.js';

class NavigationBar {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      title: '',
      back: true,
      homeButton: false,
      color: '#172033',
      background: '#ffffff',
      ...options
    };
    this.render();
  }

  render() {
    const { title, back, homeButton, color, background } = this.options;
    
    this.container.innerHTML = `
      <div class="weui-navigation-bar">
        <div class="weui-navigation-bar__inner" style="color: ${color}; background: ${background};">
          <div class='weui-navigation-bar__left'>
            ${back || homeButton ? `
              ${back ? `
                <div class="weui-navigation-bar__buttons weui-navigation-bar__buttons_goback">
                  <button class="weui-navigation-bar__btn_goback_wrapper" onclick="window.navigateBack(1)">
                    <div class="weui-navigation-bar__button weui-navigation-bar__btn_goback"></div>
                  </button>
                </div>
              ` : ''}
              ${homeButton ? `
                <div class="weui-navigation-bar__buttons weui-navigation-bar__buttons_home">
                  <button class="weui-navigation-bar__btn_home_wrapper" onclick="window.navigateTo('/')">
                    <div class="weui-navigation-bar__button weui-navigation-bar__btn_home"></div>
                  </button>
                </div>
              ` : ''}
            ` : ''}
          </div>
          <div class='weui-navigation-bar__center'>
            ${title ? `<span>${title}</span>` : ''}
          </div>
          <div class='weui-navigation-bar__right'></div>
        </div>
      </div>
    `;
  }

  setTitle(title) {
    this.options.title = title;
    this.render();
  }
}

export { NavigationBar };