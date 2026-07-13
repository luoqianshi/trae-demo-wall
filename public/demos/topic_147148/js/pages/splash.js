/**
 * 启动页 - 猫头鹰 Logo + 应用名称，2 秒后自动进入首页
 */

window.Pages.Splash = {
  render() {
    const settings = Store.getSettings();
    document.getElementById('app').innerHTML = `
      <div class="splash">
        <div class="splash__logo">
          ${Components.owl('celebrate', settings.darkMode)}
        </div>
        <h1 class="splash__title">LingoWord</h1>
        <h2 class="splash__name">灵词</h2>
        <p class="splash__subtitle">轻松学英语，每日进步一点点</p>
        <div class="splash__loader"></div>
      </div>
    `;
    // 2 秒后跳转首页
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      window.location.hash = '/home';
    }, 2000);
  }
};
