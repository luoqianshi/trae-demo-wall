const TIANDITU_KEY = '6390e50bf0b92c9b8068de6a0226c5f6';

const mapLandmarks = [
  { name: '曲阜三孔', type: 1, location: [116.9822, 35.5917], era: '公元前478年', highlight: '世界文化遗产，孔庙、孔府、孔林' },
  { name: '泰山', type: 1, location: [117.1178, 36.2588], era: '远古', highlight: '五岳之首，帝王祭天圣地' },
  { name: '孔子博物馆', type: 2, location: [116.9785, 35.5822], era: '2019年', highlight: '馆藏文物70万件' },
  { name: '尼山圣境', type: 1, location: [117.2080, 35.4620], era: '现代重建', highlight: '孔子诞生地，大学堂' },
  { name: '孟庙孟府', type: 3, location: [116.9480, 35.3980], era: '北宋', highlight: '祭祀孟子场所' },
  { name: '岱庙', type: 1, location: [117.1245, 36.1985], era: '汉代', highlight: '泰山主庙，天贶殿' },
  { name: '稷下学宫遗址', type: 4, location: [118.3480, 36.7780], era: '战国', highlight: '百家争鸣发源地' },
  { name: '齐国故城', type: 4, location: [118.3520, 36.7820], era: '周代', highlight: '齐国都城遗址' },
  { name: '颜庙', type: 3, location: [116.9880, 35.5980], era: '元代', highlight: '祭祀颜回' },
  { name: '周公庙', type: 3, location: [116.9920, 35.6020], era: '唐代', highlight: '祭祀周公' },
  { name: '曾子庙', type: 3, location: [116.3820, 35.4820], era: '明代', highlight: '祭祀曾子' },
  { name: '灵岩寺', type: 3, location: [117.2980, 36.4980], era: '东晋', highlight: '宋代彩塑罗汉' },
  { name: '王羲之故居', type: 3, location: [118.3420, 35.0520], era: '东晋', highlight: '书圣出生地' },
  { name: '浮来山', type: 4, location: [118.8420, 35.5920], era: '远古', highlight: '四千岁银杏树' },
  { name: '蓬莱阁', type: 1, location: [120.7520, 37.8020], era: '宋代', highlight: '八仙过海传说' },
  { name: '崂山', type: 4, location: [120.6620, 36.1520], era: '远古', highlight: '道教名山' },
  { name: '光岳楼', type: 4, location: [115.9220, 36.4520], era: '明代', highlight: '天下第一楼' },
  { name: '十笏园', type: 4, location: [119.1020, 36.7220], era: '清代', highlight: '北方园林代表' },
  { name: '青州古城', type: 4, location: [118.4020, 36.4020], era: '明清', highlight: '范仲淹为官地' },
  { name: '孙武祠', type: 2, location: [118.4720, 37.0520], era: '现代', highlight: '兵圣纪念馆' },
  { name: '刘公岛', type: 4, location: [122.4420, 37.5020], era: '近代', highlight: '甲午战争纪念地' },
  { name: '管仲纪念馆', type: 2, location: [118.3520, 36.7820], era: '现代', highlight: '齐国名相纪念' },
  { name: '郑板桥纪念馆', type: 2, location: [119.1020, 36.7220], era: '现代', highlight: '潍县知县纪念' },
  { name: '四门塔', type: 4, location: [117.2920, 36.4920], era: '隋代', highlight: '中国最早石塔' },
  { name: '铁山摩崖刻经', type: 4, location: [116.9420, 35.3920], era: '北齐', highlight: '书法珍品' },
  { name: '少昊陵', type: 4, location: [117.0220, 35.6220], era: '远古', highlight: '万石山' },
  { name: '徂徕山', type: 4, location: [117.3820, 36.0820], era: '远古', highlight: '李白隐居地' },
  { name: '菏泽牡丹园', type: 4, location: [115.4820, 35.2320], era: '现代', highlight: '国花之都' },
  { name: '聊城古城', type: 4, location: [115.9220, 36.4520], era: '明清', highlight: '运河古都' },
  { name: '趵突泉', type: 4, location: [117.0020, 36.6620], era: '远古', highlight: '天下第一泉' }
];

let mapInstance = null;
let currentPoint = null;

function initMap() {
  const container = document.getElementById('map-container');
  if (!container) return;

  try {
    mapInstance = new T.Map('map-container');
    mapInstance.centerAndZoom(new T.LngLat(117.5, 36.2), 7);

    mapLandmarks.forEach(landmark => {
      const iconColor = getIconColor(landmark.type);
      const marker = new T.Marker(new T.LngLat(landmark.location[0], landmark.location[1]), {
        icon: createMarkerIcon(iconColor)
      });

      marker.addEventListener('click', () => {
        showInfoPanel(landmark);
        currentPoint = landmark;
      });

      mapInstance.addOverLay(marker);
    });

    document.getElementById('legend-count').textContent = '共 ' + mapLandmarks.length + ' 处地标';
  } catch (error) {
    console.error('Map initialization error:', error);
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#c0392b;font-size:16px;">地图加载失败，请检查网络连接或刷新页面</div>';
  }
}

function getIconColor(type) {
  const colors = ['#c0392b', '#d4af37', '#4a7c59', '#8b4513'];
  return colors[type - 1] || '#c0392b';
}

function createMarkerIcon(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#f5e6c8';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(16, 16, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#f5e6c8';
  ctx.fill();

  return new T.Icon({
    iconUrl: canvas.toDataURL('image/png'),
    iconSize: new T.Point(24, 24),
    iconAnchor: new T.Point(12, 12)
  });
}

function showInfoPanel(landmark) {
  const panel = document.getElementById('map-info-panel');
  if (!panel) return;

  document.getElementById('info-title').textContent = landmark.name;
  document.getElementById('info-location').textContent = '📍 山东省';
  document.getElementById('info-type').textContent = getTypeName(landmark.type);
  document.getElementById('info-content').textContent = getDescription(landmark.name);
  document.getElementById('stat-era').textContent = landmark.era;
  document.getElementById('stat-highlight').textContent = landmark.highlight;

  panel.style.display = 'block';
}

function getTypeName(type) {
  const names = ['世界遗产', '博物馆纪念馆', '圣贤故居祠庙', '古迹遗址书院'];
  return names[type - 1] || '文化地标';
}

function getDescription(name) {
  const descriptions = {
    '曲阜三孔': '曲阜三孔指孔庙、孔府、孔林，是纪念孔子、推崇儒学的圣地。孔庙始建于公元前478年，与北京故宫、承德避暑山庄并称为中国三大古建筑群。',
    '泰山': '泰山被誉为"五岳之首"，是历代帝王祭天的神山。泰山文化底蕴深厚，有岱庙、碧霞祠等众多古迹。孔子曾"登泰山而小天下"。',
    '孔子博物馆': '孔子博物馆2019年开放，馆藏孔子及孔府文物70万件，包括明代服饰、古籍图书、商周青铜器、历代档案等。',
    '尼山圣境': '尼山是孔子诞生地，以明礼生活方式为核心，大学堂内有仁、义、礼、智、信五大厅，展示儒家核心思想。',
    '孟庙孟府': '孟庙始建于北宋景祐四年，是祭祀孟子的场所。孟府是孟子嫡系后裔居住的府第，与孟庙毗邻。',
    '岱庙': '岱庙是泰山的主庙，始建于汉代，是历代帝王祭祀泰山的场所。以天贶殿为主体，与北京故宫太和殿、曲阜孔庙大成殿并称"中国三大宫殿式建筑"。',
    '稷下学宫遗址': '稷下学宫是战国时期齐国的最高学府，汇聚了百家学者，是中国古代思想文化的"百家争鸣"之地。',
    '齐国故城': '齐国故城位于淄博市临淄区，是周代齐国的都城遗址。故城规模宏大，有宫殿区、手工业作坊区、居民区等。',
    '颜庙': '颜庙是祭祀孔子最得意弟子颜回的庙宇。颜回以德行著称，孔子称赞他"一箪食，一瓢饮，在陋巷，人不堪其忧，回也不改其乐"。',
    '周公庙': '周公庙祀周公旦。周公是鲁国始封君，制礼作乐，奠定了鲁国的礼乐传统。',
    '曾子庙': '曾子庙位于嘉祥县，是祭祀曾子的庙宇。曾子是孔子弟子，以孝道著称，著有《大学》。',
    '灵岩寺': '灵岩寺位于泰山北麓，始建于东晋。寺内有千佛殿、辟支塔等建筑，尤以宋代彩塑罗汉像闻名。',
    '王羲之故居': '王羲之故居位于临沂市兰山区，是东晋大书法家王羲之的出生地。王羲之被誉为"书圣"。',
    '浮来山': '浮来山位于日照市莒县，山上有定林寺，寺内有"天下第一银杏树"，树龄逾四千年。刘勰曾在此撰写《文心雕龙》。',
    '蓬莱阁': '蓬莱阁位于烟台市蓬莱区，是中国四大名楼之一。以"八仙过海"的传说闻名，也是观赏海市蜃楼的最佳地点。',
    '崂山': '崂山是中国海岸线第一高峰，山海相连，风景秀丽。崂山道教文化深厚，有太清宫等著名道观。',
    '光岳楼': '光岳楼位于聊城市东昌府区，始建于明代。楼内有乾隆皇帝御笔"天下第一楼"匾额。',
    '十笏园': '十笏园位于潍坊市潍城区，是清代丁善宝的私家园林。园内建筑精巧，布局紧凑，被誉为"鲁东明珠"。',
    '青州古城': '青州古城是明清时期的青州府治所，保存了大量古建筑。范仲淹曾在此为官。',
    '孙武祠': '孙武祠位于东营市广饶县，是纪念春秋时期军事家孙武的场所。孙武著有《孙子兵法》，被誉为"兵圣"。',
    '刘公岛': '刘公岛位于威海市，是中国近代第一支海军北洋水师的诞生地。岛上有甲午战争纪念馆。',
    '管仲纪念馆': '管仲纪念馆位于临淄区，是纪念春秋时期齐国名相管仲的场所。管仲辅佐齐桓公成就霸业。',
    '郑板桥纪念馆': '郑板桥纪念馆位于潍坊市，纪念清代著名书画家郑板桥。郑板桥曾在潍县任知县，为官清廉。',
    '四门塔': '四门塔位于济南市历城区，是中国现存最早的单层石塔，建于隋代。',
    '铁山摩崖刻经': '铁山摩崖刻经位于邹城市，是北齐时期的佛教刻经，与岗山、葛山、尖山刻经并称"四山摩崖"。',
    '少昊陵': '少昊陵是祭祀远古帝王少昊的陵墓，位于曲阜市东。少昊是黄帝之子，以鸟名官。',
    '徂徕山': '徂徕山是泰山的姊妹山，历史上曾是道教、佛教圣地。唐代大诗人李白曾在此隐居。',
    '菏泽牡丹园': '菏泽是"中国牡丹之都"，牡丹园内种植了大量名贵牡丹品种。',
    '聊城古城': '聊城古城位于东昌湖中央，是中国北方少有的水城，被誉为"江北水城"。',
    '趵突泉': '趵突泉被誉为"天下第一泉"，是济南泉水的代表。李清照纪念馆位于趵突泉公园内。'
  };

  return descriptions[name] || '点击"问AI了解更多"获取详细信息。';
}

function closeInfoPanel() {
  const panel = document.getElementById('map-info-panel');
  if (panel) panel.style.display = 'none';
}

function askAboutPoint() {
  if (currentPoint) {
    window.location.href = `ai.html?question=${encodeURIComponent('请介绍一下' + currentPoint.name)}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof T !== 'undefined') {
    initMap();
  } else {
    setTimeout(initMap, 1000);
  }
});

window.closeInfoPanel = closeInfoPanel;
window.askAboutPoint = askAboutPoint;