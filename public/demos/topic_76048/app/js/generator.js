/* ============================================================
   generator.js · 生成器
   场景关键词匹配 + 配色提取 + 内容提取 + 调用模板生成
   ============================================================ */

window.Generator = (function () {

  // 场景关键词表
  const SCENE_KEYWORDS = {
    eventPoster: ['音乐节', '活动', '海报', '演出', '派对', '市集', '演唱会', '购票', '门票', '乐队', '阵容', '狂欢', '节日', '演出页'],
    productPage: ['产品', '商品', '展示', '店铺', '品牌', '介绍页', '购买', '价格', '菜单', '咖啡', '商品列表', '商品页', '电商'],
    dashboard: ['数据', '图表', '看板', '汇报', '统计', '销售', '报表', 'kpi', '分析', '可视化', 'dashboard', '数据看板'],
    invitation: ['邀请函', '婚礼', '结婚', '生日', '满月', '请柬', '回执', '邀请', '喜帖', '宴请'],
    classPage: ['班级', '课程', '老师', '课件', '课程表', '班级主页', '资料下载', '学校', '班级页', '课表'],
    clubRecruit: ['社团', '招新', '报名', '纳新', '社团介绍', '社团招新', '协会', '学生会']
  };

  // 配色表（中文 key）
  const PALETTES = {
    '蓝白': { primary: '#2563eb', secondary: '#dbeafe', accent: '#f59e0b', bg: '#ffffff', text: '#1e293b', bgSoft: '#eff6ff' },
    '暖橘': { primary: '#f97316', secondary: '#fed7aa', accent: '#dc2626', bg: '#fffbeb', text: '#7c2d12', bgSoft: '#fef3c7' },
    '粉':   { primary: '#ec4899', secondary: '#fbcfe8', accent: '#a855f7', bg: '#fdf2f8', text: '#831843', bgSoft: '#fce7f3' },
    '绿':   { primary: '#10b981', secondary: '#a7f3d0', accent: '#f59e0b', bg: '#f0fdf4', text: '#064e3b', bgSoft: '#d1fae5' },
    '黑金': { primary: '#f5b942', secondary: '#2a2a3a', accent: '#e0506e', bg: '#0b0b14', text: '#f4f1e8', bgSoft: '#1c1c2a' },
    '红':   { primary: '#dc2626', secondary: '#fecaca', accent: '#f59e0b', bg: '#fef2f2', text: '#7f1d1d', bgSoft: '#fee2e2' },
    '紫':   { primary: '#8b5cf6', secondary: '#ddd6fe', accent: '#ec4899', bg: '#faf5ff', text: '#4c1d95', bgSoft: '#ede9fe' },
    '青':   { primary: '#06b6d4', secondary: '#a5f3fc', accent: '#f59e0b', bg: '#ecfeff', text: '#164e63', bgSoft: '#cffafe' }
  };

  // 配色别名（用于匹配用户描述）
  const PALETTE_ALIASES = {
    '蓝白': ['蓝白', '蓝色', '海洋', '天空', '蓝'],
    '暖橘': ['暖橘', '橘色', '橙色', '暖色', '橘', '橙', '暖橙'],
    '粉':   ['粉', '浪漫', '少女', '桃花', '樱', '粉色'],
    '绿':   ['绿', '清新', '自然', '森林', '草', '绿色'],
    '黑金': ['黑金', '酷炫', '炫酷', '科技', '深色', '暗黑', '高级感', '黑'],
    '红':   ['红', '喜庆', '中国风', '红红火火', '红色'],
    '紫':   ['紫', '梦幻', '优雅', '高贵', '紫色'],
    '青':   ['青', '薄荷', '蒂芙尼', '青色', '蓝绿']
  };

  // 场景默认配色
  const DEFAULT_PALETTE_BY_SCENE = {
    eventPoster: '蓝白',
    productPage: '暖橘',
    dashboard: '黑金',
    invitation: '粉',
    classPage: '绿',
    clubRecruit: '黑金'
  };

  // 场景默认标题
  const DEFAULT_TITLE_BY_SCENE = {
    eventPoster: '周末魔法音乐节',
    productPage: '晨光手作咖啡',
    dashboard: '本月销售数据看板',
    invitation: '我们结婚啦',
    classPage: '三年级二班 · 阳光小筑',
    clubRecruit: '街舞社 · STREET SOUL'
  };

  function detectScene(text) {
    text = (text || '').toLowerCase();
    let best = 'eventPoster', bestScore = 0;
    Object.keys(SCENE_KEYWORDS).forEach(scene => {
      let score = 0;
      SCENE_KEYWORDS[scene].forEach(kw => {
        if (text.indexOf(kw.toLowerCase()) >= 0) score += kw.length; // 长词权重高
      });
      if (score > bestScore) { bestScore = score; best = scene; }
    });
    return best;
  }

  function detectPalette(text, scene) {
    text = text || '';
    let hit = null;
    Object.keys(PALETTE_ALIASES).forEach(name => {
      if (hit) return;
      PALETTE_ALIASES[name].forEach(alias => {
        if (hit) return;
        if (text.indexOf(alias) >= 0) hit = name;
      });
    });
    const name = hit || DEFAULT_PALETTE_BY_SCENE[scene] || '蓝白';
    return { name, palette: PALETTES[name] };
  }

  // 内容提取
  function extractContent(text, scene) {
    text = text || '';
    const result = { title: '', subtitle: '', time: '', location: '', price: '', items: [] };

    // 标题：引号内容 / "标题叫X" / "叫做X" / "名叫X"
    const quoteM = text.match(/["「『“]([^"」』”]{2,16})["」』”]/);
    const titleM = text.match(/(?:标题|主题|名字)[是为：:]\s*["「『“]?(.+?)["」』”]?(?:[，,。.])/);
    const calledM = text.match(/(?:叫做|名叫|叫)\s*["「『“]?(.+?)["」』”]?(?:[，,。.])/);
    result.title = (titleM && titleM[1]) || (calledM && calledM[1]) || (quoteM && quoteM[1]) || '';

    // 时间
    const timeM = text.match(/(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日)/) ||
                  text.match(/(\d{1,2}\s*月\s*\d{1,2}\s*日)/) ||
                  text.match(/(本周[一二三四五六日天])/) ||
                  text.match(/(?:时间|日期)[是为：:]\s*([^，,。.]{3,20})/);
    if (timeM) result.time = timeM[1].replace(/\s/g, '');

    // 地点
    const locM = text.match(/(?:地点|地址|位置)[是为：:]\s*([^，,。.]{3,20})/) ||
                 text.match(/在\s*([^，,。.]{2,20}?)\s*(?:举办|开|举行)/);
    if (locM) result.location = locM[1];

    // 价格
    const priceM = text.match(/(?:价格|票价|售价)[是为：:]?\s*¥?\s*(\d+(?:\.\d+)?)/) ||
                   text.match(/¥\s*(\d+(?:\.\d+)?)/);
    if (priceM) result.price = priceM[1];

    return result;
  }

  function generate(text, sceneKey) {
    const scene = sceneKey || detectScene(text);
    const { name: paletteName, palette } = detectPalette(text, scene);
    const extracted = extractContent(text, scene);

    // 标题兜底
    if (!extracted.title) extracted.title = DEFAULT_TITLE_BY_SCENE[scene] || '我的页面';

    const opts = Object.assign({ palette }, extracted, { rawText: text, paletteName });
    const html = window.Templates.renderers[scene](opts);

    return { html, scene, palette, paletteName, opts, extracted };
  }

  return { generate, detectScene, detectPalette, extractContent, PALETTES, PALETTE_ALIASES, SCENE_KEYWORDS, DEFAULT_PALETTE_BY_SCENE };
})();
