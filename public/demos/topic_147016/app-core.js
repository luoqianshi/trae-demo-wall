(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OutfitCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var BANDS = {
    cold: { label: '保暖模式', range: '8–16°C', material: '保暖外套与柔软内层', tip: '低温优先保证保暖，再用清晰配色避免厚重感。' },
    mild: { label: '层搭模式', range: '17–24°C', material: '轻外套与透气内搭', tip: '温差适中，适合利用薄层次兼顾造型与舒适。' },
    warm: { label: '轻薄模式', range: '25–34°C', material: '轻薄面料与宽松剪裁', tip: '高温减少叠穿，用面料、颜色和轮廓建立风格。' }
  };

  var SCENES = {
    class: { label: '上课通勤', icon: '🎒', copy: '适合校园、通勤与长时间日常活动', item: '耐走鞋履与轻便通勤包' },
    dating: { label: '约会见面', icon: '💗', copy: '自然亲近，同时保留一点精致完成度', item: '有细节感的鞋包与小配饰' },
    travel: { label: '出游逛街', icon: '🧭', copy: '适合步行、拍照和室内外场景切换', item: '耐走鞋履与容量适中的随身包' },
    interview: { label: '展示面试', icon: '💼', copy: '适合汇报、答辩、面试与正式表达', item: '结构清楚的鞋包与低干扰配饰' }
  };

  var STYLES = {
    clean: { label: '清爽简约', icon: '✦', keywords: ['干净', '耐看', '低负担'], palette: '雾白、浅灰、低饱和蓝', shape: '上身简洁，下装保持直线感' },
    sport: { label: '轻机能运动', icon: '⚡', keywords: ['轻快', '耐走', '有活力'], palette: '冰蓝、石板灰、机能黑', shape: '保留活动空间，用收口制造利落感' },
    soft: { label: '温柔松弛', icon: '☁', keywords: ['柔和', '亲近', '松弛'], palette: '奶白、浅杏、燕麦色', shape: '柔软上装搭配垂顺下装' },
    sharp: { label: '利落都市', icon: '◇', keywords: ['清醒', '结构感', '完成度'], palette: '冷灰、石墨、冷白', shape: '突出肩线与腰线，控制多余装饰' }
  };

  var GENDERS = {
    female: { label: '女生款', subject: '女生' },
    male: { label: '男生款', subject: '男生' }
  };

  function clampTemperature(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 22;
    return Math.min(34, Math.max(8, Math.round(number)));
  }

  function getTempBand(temperature) {
    var value = clampTemperature(temperature);
    if (value <= 16) return 'cold';
    if (value <= 24) return 'mild';
    return 'warm';
  }

  function normalizeSelection(selection) {
    var source = selection || {};
    return {
      temperature: clampTemperature(source.temperature),
      scene: SCENES[source.scene] ? source.scene : 'class',
      style: STYLES[source.style] ? source.style : 'clean',
      gender: GENDERS[source.gender] ? source.gender : 'female'
    };
  }

  function buildImagePath(selection) {
    var value = normalizeSelection(selection);
    var band = getTempBand(value.temperature);
    var parts = [band];
    if (value.scene !== 'class') parts.push(value.scene);
    if (!(value.scene === 'dating' && value.style === 'clean')) parts.push(value.style);
    parts.push(value.gender);
    return 'assets/' + parts.join('-') + '.jpg';
  }

  function createOutfit(selection) {
    var value = normalizeSelection(selection);
    var bandKey = getTempBand(value.temperature);
    var band = BANDS[bandKey];
    var scene = SCENES[value.scene];
    var style = STYLES[value.style];
    var gender = GENDERS[value.gender];
    return {
      id: [bandKey, value.scene, value.style, value.gender].join('-'),
      band: bandKey,
      temperature: value.temperature,
      scene: value.scene,
      style: value.style,
      gender: value.gender,
      image: buildImagePath(value),
      title: gender.label + ' · ' + style.label + scene.label + '方案',
      eyebrow: band.label + ' · ' + band.range,
      summary: '为' + gender.subject + '准备的' + style.label + '方案，' + scene.copy + '。',
      keywords: style.keywords,
      palette: style.palette,
      shape: style.shape,
      items: [band.material, style.shape, scene.item],
      temperatureTip: band.tip,
      sceneLabel: scene.label,
      styleLabel: style.label,
      genderLabel: gender.label
    };
  }

  function parseOutfitId(id) {
    var match = String(id || '').match(/^(cold|mild|warm)-(class|dating|travel|interview)-(clean|sport|soft|sharp)-(female|male)$/);
    if (!match) return null;
    return { band: match[1], scene: match[2], style: match[3], gender: match[4] };
  }

  function selectionFromOutfitId(id, fallbackTemperature) {
    var parsed = parseOutfitId(id);
    if (!parsed) return null;
    var defaults = { cold: 12, mild: 22, warm: 30 };
    return {
      temperature: fallbackTemperature == null ? defaults[parsed.band] : clampTemperature(fallbackTemperature),
      scene: parsed.scene,
      style: parsed.style,
      gender: parsed.gender
    };
  }

  function parseRoute(hash) {
    var clean = String(hash || '#/home').replace(/^#\/?/, '').replace(/^\//, '');
    var parts = clean.split('/').filter(Boolean);
    var page = parts[0] || 'home';
    if (!['home', 'select', 'result', 'detail', 'favorites'].includes(page)) page = 'home';
    return { page: page, param: parts.slice(1).join('/') };
  }

  function getAlternativeStyles(currentStyle) {
    return Object.keys(STYLES).filter(function (style) { return style !== currentStyle; });
  }

  return {
    BANDS: BANDS,
    SCENES: SCENES,
    STYLES: STYLES,
    GENDERS: GENDERS,
    clampTemperature: clampTemperature,
    getTempBand: getTempBand,
    normalizeSelection: normalizeSelection,
    buildImagePath: buildImagePath,
    createOutfit: createOutfit,
    parseOutfitId: parseOutfitId,
    selectionFromOutfitId: selectionFromOutfitId,
    parseRoute: parseRoute,
    getAlternativeStyles: getAlternativeStyles
  };
});
