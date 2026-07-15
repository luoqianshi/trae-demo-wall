// theme.js - 三套主题切换
// 通过 <html> 上的 data-theme 属性 + CSS 变量切换
// v1.4: 加入 SVG 背景图,3 套主题 = 3 张山水画

const Theme = (() => {
  const THEMES = [
    {
      id: 'qianqing',
      name: '乾清宫',
      label: '勤政',
      desc: '朱红明黄,龙纹金边,庄严肃穆',
      bg: 'linear-gradient(135deg, #3a0814 0%, #6b1422 30%, #a4243b 70%, #d4a24c 100%)',
      surface: 'rgba(244, 232, 208, 0.95)',
      accent: '#A4243B',
      secondary: '#D4A24C',
      icon: '🏯',
      bgImage: 'assets/images/bg-qianqing.svg'
    },
    {
      id: 'yuhuayuan',
      name: '御花园',
      label: '休闲',
      desc: '玉绿青瓦,曲水流觞,清雅闲适',
      bg: 'linear-gradient(135deg, #1d3320 0%, #3d5a3a 30%, #7ba67d 70%, #c8a45c 100%)',
      surface: 'rgba(245, 245, 230, 0.95)',
      accent: '#7BA67D',
      secondary: '#C8A45C',
      icon: '🌿',
      bgImage: 'assets/images/bg-yuhuayuan.svg'
    },
    {
      id: 'yuanmingyuan',
      name: '圆明园',
      label: '雅致',
      desc: '湖蓝象牙,中西合璧,温润如玉',
      bg: 'linear-gradient(135deg, #1a2a3a 0%, #2c4a6b 30%, #5c6e7a 70%, #d4a24c 100%)',
      surface: 'rgba(248, 245, 235, 0.95)',
      accent: '#5C6E7A',
      secondary: '#D4A24C',
      icon: '🏛️',
      bgImage: 'assets/images/bg-yuanmingyuan.svg'
    }
  ];

  function getCurrent() {
    return Storage.get(Storage.KEYS.SETTINGS)?.theme || 'qianqing';
  }

  function set(themeId) {
    const settings = Storage.get(Storage.KEYS.SETTINGS, {});
    settings.theme = themeId;
    Storage.set(Storage.KEYS.SETTINGS, settings);
    apply(themeId);
  }

  function apply(themeId) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    const root = document.documentElement;
    root.setAttribute('data-theme', theme.id);
    root.style.setProperty('--theme-bg', theme.bg);
    root.style.setProperty('--theme-surface', theme.surface);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-bg-image', `url('${theme.bgImage}')`);
    // 同步更新 body 的 background-image
    document.body.style.backgroundImage = `url('${theme.bgImage}')`;
  }

  function list() { return THEMES; }

  function init() {
    apply(getCurrent());
  }

  return { list, getCurrent, set, apply, init };
})();
