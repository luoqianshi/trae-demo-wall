/**
 * 应用入口
 * 注册所有路由，初始化应用
 */

const App = {
  init() {
    // 初始化数据层
    Store.init();
    // 初始化音效与语音
    AudioEngine.init();
    Speech.init();

    // 应用夜间模式
    const settings = Store.getSettings();
    if (settings.darkMode) {
      document.body.classList.add('dark-mode');
    }

    // 注册路由
    Router.register('/splash', () => Pages.Splash.render());
    Router.register('/home', () => Pages.Home.render());
    Router.register('/lesson/:id', (params) => Pages.Lesson.render(params.id));
    Router.register('/lesson-result', () => Pages.LessonResult.render());
    Router.register('/profile', () => Pages.Profile.render());
    Router.register('/wordbook', () => Pages.Wordbook.render());
    Router.register('/shop', () => Pages.Shop.render());
    Router.register('/leaderboard', () => Pages.Leaderboard.render());

    // 启动路由
    Router.init();

    // 首次用户交互后激活音频
    const activateAudio = () => {
      AudioEngine.init();
      document.removeEventListener('click', activateAudio);
      document.removeEventListener('keydown', activateAudio);
    };
    document.addEventListener('click', activateAudio);
    document.addEventListener('keydown', activateAudio);
  }
};

// 页面模块容器已在 components.js 中提前初始化

document.addEventListener('DOMContentLoaded', () => App.init());
