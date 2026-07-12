const routeData = {
  primary: {
    title: '童心问礼——小学生研学路线',
    subtitle: '6-12岁 · 半日游',
    description: '专为小学生设计的研学路线，从初识孔庙到体验传统礼仪，让孩子们在玩乐中感受儒家文化的魅力。',
    stops: [
      {
        num: 1,
        name: '孔庙万仞宫墙',
        desc: '从万仞宫墙开始，讲述孔子学问高深，引导孩子对圣贤的崇敬之心。',
        relics: ['万仞宫墙', '金声玉振坊', '棂星门']
      },
      {
        num: 2,
        name: '杏坛',
        desc: '在孔子讲学的杏坛，讲述杏坛讲学的故事，鼓励孩子珍惜学习机会。',
        relics: ['杏坛', '乾隆御碑']
      },
      {
        num: 3,
        name: '大成殿',
        desc: '瞻仰孔子塑像，学习简单的揖礼，体验尊师重道。',
        relics: ['大成殿', '孔子塑像', '十二哲人']
      }
    ]
  },
  middle: {
    title: '问道齐鲁——中学生研学路线',
    subtitle: '13-15岁 · 一日游',
    description: '深入了解孔子思想和齐鲁文化，通过参观和体验，培养学生的文化自信和人文素养。',
    stops: [
      {
        num: 1,
        name: '曲阜三孔深度游',
        desc: '上午参观孔庙、孔府、孔林，了解孔子生平、儒家思想的形成与发展。',
        relics: ['孔庙', '孔府', '孔林', '大成殿', '奎文阁']
      },
      {
        num: 2,
        name: '孔子博物馆',
        desc: '下午参观孔子博物馆，通过丰富的文物和现代化展陈，深入了解孔子的一生和儒家文化。',
        relics: ['孔子博物馆', '孔府档案', '明代服饰']
      },
      {
        num: 3,
        name: '传统文化体验',
        desc: '体验传统礼仪、书法、古琴等传统文化活动，感受中华文化的博大精深。',
        relics: ['传统礼仪', '书法体验', '古琴欣赏']
      }
    ]
  },
  high: {
    title: '文脉寻根——高中生研学路线',
    subtitle: '16-18岁 · 两日游',
    description: '深入探究儒家思想的核心内涵和齐鲁文化的历史脉络，培养批判性思维和文化传承意识。',
    stops: [
      {
        num: 1,
        name: '曲阜深度研学',
        desc: '第一天：参观三孔、孔子博物馆，研读《论语》经典篇章，探讨儒家思想的现代意义。',
        relics: ['三孔', '孔子博物馆', '论语碑苑']
      },
      {
        num: 2,
        name: '泰山文化之旅',
        desc: '第二天：登泰山，参观岱庙，了解帝王祭天文化和泰山作为文化符号的象征意义。',
        relics: ['泰山', '岱庙', '碧霞祠']
      },
      {
        num: 3,
        name: '文化对话与思考',
        desc: '分组讨论儒家思想与现代社会的关系，撰写研学心得，分享学习体会。',
        relics: ['研学讨论', '心得撰写']
      }
    ]
  },
  family: {
    title: '亲子研学——全家出游路线',
    subtitle: '全年龄段 · 一日游',
    description: '适合全家一起参与的研学路线，增进亲子互动，共同感受传统文化的魅力。',
    stops: [
      {
        num: 1,
        name: '尼山圣境',
        desc: '上午前往尼山圣境，参观大学堂，体验明礼生活方式，感受儒家文化的博大精深。',
        relics: ['尼山圣境', '大学堂', '孔子诞生地']
      },
      {
        num: 2,
        name: '亲子互动体验',
        desc: '参与亲子礼仪体验、传统手工艺制作等活动，增进亲子感情。',
        relics: ['礼仪体验', '手工艺制作']
      },
      {
        num: 3,
        name: '孔府家宴',
        desc: '品尝孔府家宴，了解传统饮食文化，感受"食不厌精，脍不厌细"的饮食理念。',
        relics: ['孔府家宴', '传统美食']
      }
    ]
  },
  classic: {
    title: '经典三孔——必游路线',
    subtitle: '全年龄段 · 一日游',
    description: '最经典的三孔游览路线，涵盖孔庙、孔府、孔林三大核心景点，全面了解孔子文化。',
    stops: [
      {
        num: 1,
        name: '孔庙',
        desc: '游览孔庙，参观大成殿、杏坛、奎文阁等主要建筑，了解孔庙的历史和建筑特色。',
        relics: ['孔庙', '大成殿', '杏坛', '奎文阁']
      },
      {
        num: 2,
        name: '孔府',
        desc: '参观孔府，了解孔子嫡系后裔的生活和世袭制度，欣赏孔府的建筑和文物收藏。',
        relics: ['孔府', '大堂', '二堂', '内宅']
      },
      {
        num: 3,
        name: '孔林',
        desc: '游览孔林，参观孔子墓、子贡手植楷等景点，了解中国古代丧葬文化和宗族制度。',
        relics: ['孔林', '孔子墓', '子贡手植楷']
      }
    ]
  },
  deep: {
    title: '深度文化——文化爱好者路线',
    subtitle: '文化爱好者 · 三日游',
    description: '专为文化爱好者设计的深度路线，涵盖曲阜、邹城、泰山等多个文化地标，全面体验齐鲁文化。',
    stops: [
      {
        num: 1,
        name: '曲阜文化圈',
        desc: '第一天：深度游览三孔、孔子博物馆、颜庙、周公庙，全面了解曲阜的历史文化。',
        relics: ['三孔', '孔子博物馆', '颜庙', '周公庙']
      },
      {
        num: 2,
        name: '邹城孟庙孟府',
        desc: '第二天：前往邹城，参观孟庙孟府，了解孟子思想和邹鲁文化。',
        relics: ['孟庙', '孟府', '孟子故里']
      },
      {
        num: 3,
        name: '泰山文化深度游',
        desc: '第三天：登泰山，参观岱庙、灵岩寺，体验泰山文化和佛教文化的融合。',
        relics: ['泰山', '岱庙', '灵岩寺']
      }
    ]
  }
};

const customLocations = [
  { id: 'kongsan', name: '曲阜三孔', city: '济宁' },
  { id: 'taishan', name: '泰山', city: '泰安' },
  { id: 'kongbowuguan', name: '孔子博物馆', city: '济宁' },
  { id: 'nishan', name: '尼山圣境', city: '济宁' },
  { id: 'mengmiao', name: '孟庙孟府', city: '济宁' },
  { id: 'daimiao', name: '岱庙', city: '泰安' },
  { id: 'jixia', name: '稷下学宫', city: '淄博' },
  { id: 'yanmiao', name: '颜庙', city: '济宁' },
  { id: 'zhougongmiao', name: '周公庙', city: '济宁' },
  { id: 'zengzimiao', name: '曾子庙', city: '济宁' },
  { id: 'lingyansi', name: '灵岩寺', city: '泰安' },
  { id: 'wangxizhi', name: '王羲之故居', city: '临沂' },
  { id: 'fulaishan', name: '浮来山', city: '日照' },
  { id: 'penglaige', name: '蓬莱阁', city: '烟台' },
  { id: 'laoshan', name: '崂山', city: '青岛' },
  { id: 'guangyuelou', name: '光岳楼', city: '聊城' },
  { id: 'shihuyuan', name: '十笏园', city: '潍坊' },
  { id: 'qingzhou', name: '青州古城', city: '潍坊' },
  { id: 'sunwu', name: '孙武祠', city: '东营' },
  { id: 'liugongdao', name: '刘公岛', city: '威海' },
  { id: 'guanzhong', name: '管仲纪念馆', city: '淄博' },
  { id: 'zhengbanqiao', name: '郑板桥纪念馆', city: '潍坊' },
  { id: 'simenta', name: '四门塔', city: '济南' },
  { id: 'tieshan', name: '铁山摩崖刻经', city: '济宁' },
  { id: 'shaohaoling', name: '少昊陵', city: '济宁' },
  { id: 'culai', name: '徂徕山', city: '泰安' },
  { id: 'mudan', name: '菏泽牡丹园', city: '菏泽' },
  { id: 'liaocheng', name: '聊城古城', city: '聊城' },
  { id: 'baotuquan', name: '趵突泉', city: '济南' }
];

let selectedLocations = [];

function switchTab(tab) {
  document.querySelectorAll('.route-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.route-tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');

  if (tab === 'custom') {
    renderCustomLocations();
  }
}

function selectRoute(routeId) {
  document.querySelectorAll('.route-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-route="${routeId}"]`).classList.add('active');

  const route = routeData[routeId];
  renderRouteDetail(route);
}

function renderRouteDetail(route) {
  const detail = document.getElementById('route-detail');
  if (!detail || !route) return;

  const stopsHtml = route.stops.map(stop => {
    const relicsHtml = stop.relics.map(r => `<span><span class="relic-label">•</span>${r}</span>`).join('');
    return `
      <div class="route-stop">
        <div class="stop-num">${stop.num}</div>
        <div class="stop-info">
          <h4>${stop.name}</h4>
          <p>${stop.desc}</p>
          <div class="stop-relics">${relicsHtml}</div>
        </div>
      </div>
    `;
  }).join('');

  detail.innerHTML = `
    <h3 style="font-family:'ZCOOL XiaoWei',serif; font-size:28px; color:var(--ink); letter-spacing:4px; margin-bottom:8px;">${route.title}</h3>
    <p style="color:var(--cinnabar); font-size:14px; letter-spacing:2px; margin-bottom:16px;">${route.subtitle}</p>
    <p style="color:var(--brown); line-height:1.8; margin-bottom:24px;">${route.description}</p>
    <div class="route-stops">${stopsHtml}</div>
  `;
}

function renderCustomLocations() {
  const container = document.getElementById('custom-locations');
  if (!container) return;

  container.innerHTML = customLocations.map(loc => `
    <div class="custom-location-item ${selectedLocations.includes(loc.id) ? 'selected' : ''}" onclick="toggleLocation('${loc.id}')">
      <div class="loc-checkbox"></div>
      <div class="loc-info">
        <strong>${loc.name}</strong>
        <span>${loc.city}</span>
      </div>
    </div>
  `).join('');
}

function toggleLocation(id) {
  const index = selectedLocations.indexOf(id);
  if (index > -1) {
    selectedLocations.splice(index, 1);
  } else {
    selectedLocations.push(id);
  }
  renderCustomLocations();
}

function clearCustom() {
  selectedLocations = [];
  renderCustomLocations();
  document.getElementById('custom-route-detail').innerHTML = '';
}

async function generateCustomRoute() {
  if (selectedLocations.length < 2) {
    alert('请至少选择2个文化地标');
    return;
  }

  const detail = document.getElementById('custom-route-detail');
  if (!detail) return;

  const locations = selectedLocations.map(id => customLocations.find(l => l.id === id)).filter(Boolean);
  const locationNames = locations.map(l => l.name).join('、');

  detail.innerHTML = '<div style="text-align:center; padding:20px;"><div class="typing-indicator"><span></span><span></span><span></span></div><p style="color:var(--brown); margin-top:16px;">AI正在为您规划最优路线...</p></div>';

  try {
    const messages = [
      {
        role: 'system', content: `你是一位专业的齐鲁文化研学路线规划师。请根据用户选择的文化地标，为其规划一条最佳研学路线。要求：
1. 根据地理邻近性优化路线顺序，避免走回头路
2. 为每个地点推荐当地特色美食
3. 介绍每个地点的特色文物或亮点
4. 规划合理的每日行程安排
5. 返回纯JSON格式，不要包含markdown代码块标记，格式如下：
{
  "title": "路线标题",
  "subtitle": "推荐游览天数",
  "description": "路线简介",
  "days": [
    {
      "dayTitle": "第X天",
      "stops": [
        {
          "name": "景点名称",
          "desc": "游览介绍",
          "food": "当地美食推荐",
          "relics": ["文物1", "文物2", "文物3"]
        }
      ]
    }
  ]
}` },
      { role: 'user', content: `请为我规划一条包含以下文化地标的研学路线：${locationNames}。请优化路线顺序，并添加当地美食和特色文物介绍。` }
    ];

    const response = await callZhipuAPI(messages);

    let routeData = null;
    try {
      const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      routeData = JSON.parse(jsonStr);
    } catch (e) {
      detail.innerHTML = `
        <div class="route-result-card">
          <h3 style="font-family:'ZCOOL XiaoWei',serif; font-size:24px; color:var(--cinnabar); letter-spacing:4px; margin-bottom:16px;">📍 AI 规划结果</h3>
          <div style="color:var(--brown); line-height:2; white-space:pre-wrap;">${response}</div>
        </div>
      `;
      return;
    }

    let daysHtml = '';
    routeData.days.forEach(day => {
      const stopsHtml = day.stops.map((stop, idx) => {
        const relicsHtml = stop.relics.map(r => `<span><span class="relic-label">•</span>${r}</span>`).join('');
        return `
          <div class="route-stop">
            <div class="stop-num">${idx + 1}</div>
            <div class="stop-info">
              <h4>${stop.name}</h4>
              <p>${stop.desc}</p>
              ${stop.food ? `<p style="color:var(--cinnabar); font-size:13px; margin-top:8px;">🍽️ ${stop.food}</p>` : ''}
              <div class="stop-relics">${relicsHtml}</div>
            </div>
          </div>
        `;
      }).join('');

      daysHtml += `
        <div style="margin-bottom:32px;">
          <h4 style="font-family:'ZCOOL XiaoWei',serif; font-size:20px; color:var(--cinnabar); letter-spacing:3px; margin-bottom:16px; padding-bottom:8px; border-bottom:2px solid var(--gold);">${day.dayTitle}</h4>
          <div class="route-stops">${stopsHtml}</div>
        </div>
      `;
    });

    detail.innerHTML = `
      <div class="route-result-card">
        <h3 style="font-family:'ZCOOL XiaoWei',serif; font-size:28px; color:var(--ink); letter-spacing:4px; margin-bottom:8px;">📍 ${routeData.title}</h3>
        <p style="color:var(--cinnabar); font-size:14px; letter-spacing:2px; margin-bottom:16px;">${routeData.subtitle}</p>
        <p style="color:var(--brown); line-height:1.8; margin-bottom:24px;">${routeData.description}</p>
        ${daysHtml}
      </div>
    `;
  } catch (error) {
    detail.innerHTML = '<p style="color:var(--cinnabar); text-align:center;">路线生成失败，请稍后再试。</p>';
  }
}

function fillAiExample(text) {
  document.getElementById('ai-route-input').value = text;
}

async function generateAiRoute() {
  const input = document.getElementById('ai-route-input').value;
  if (!input.trim()) {
    alert('请输入您的研学需求');
    return;
  }

  const resultDiv = document.getElementById('ai-route-result');
  resultDiv.innerHTML = '<div style="text-align:center; padding:20px;"><div class="typing-indicator"><span></span><span></span><span></span></div><p style="color:var(--brown); margin-top:16px;">AI正在为您规划路线...</p></div>';

  try {
    const messages = [
      { role: 'system', content: '你是一位专业的研学路线规划师，擅长根据用户需求设计齐鲁文化研学路线。请根据用户的需求，设计一条详细的研学路线，包括每日行程、景点介绍和研学亮点。' },
      { role: 'user', content: `请为我规划一条齐鲁文化研学路线，我的需求是：${input}。请包含详细的每日行程安排。` }
    ];

    const response = await callZhipuAPI(messages);

    resultDiv.innerHTML = `
      <div class="route-result-card">
        <h3 style="font-family:'ZCOOL XiaoWei',serif; font-size:24px; color:var(--cinnabar); letter-spacing:4px; margin-bottom:16px;">🤖 AI 智能规划结果</h3>
        <div style="color:var(--brown); line-height:2; white-space:pre-wrap;">${response}</div>
      </div>
    `;
  } catch (error) {
    resultDiv.innerHTML = '<p style="color:var(--cinnabar); text-align:center;">路线生成失败，请稍后再试。</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  selectRoute('primary');
});

window.switchTab = switchTab;
window.selectRoute = selectRoute;
window.toggleLocation = toggleLocation;
window.clearCustom = clearCustom;
window.generateCustomRoute = generateCustomRoute;
window.fillAiExample = fillAiExample;
window.generateAiRoute = generateAiRoute;