const cultureData = [
  {
    city: '济宁市',
    citySeal: '济',
    count: 9,
    landmarks: [
      {
        name: '曲阜三孔',
        seal: '孔',
        tags: ['世界文化遗产', '全国重点文物保护单位'],
        description: '曲阜三孔指孔庙、孔府、孔林，是纪念孔子、推崇儒学的圣地。曲阜三孔孔庙、孔府、孔林，是纪念孔子、推崇儒学的圣地。孔庙始建于公元前478年，与北京故宫、承德避暑山庄并称为中国三大古建筑群。孔府是孔子嫡系长房居住的府第，孔林延续使用2400余年，是世界上延时最久、面积最大的氏族墓地。',
        metaTags: ['曲阜', '三孔', '孔庙', '孔府', '孔林', '世界遗产']
      },
      {
        name: '孔子博物馆',
        seal: '博',
        tags: ['国家一级博物馆'],
        description: '孔子博物馆2019年开放，馆藏孔子及孔府文物70万件，包括明代服饰、古籍图书、商周青铜器、历代档案等。以孔子的"一生"和孔子的思想为主线，通过现代展陈技术展示孔子的思想与文化遗产。',
        metaTags: ['孔子博物馆', '曲阜', '文物', '展览']
      },
      {
        name: '尼山圣境',
        seal: '圣',
        tags: ['文化旅游区'],
        description: '尼山是孔子诞生地，以明礼生活方式为核心，大学堂内有仁、义、礼、智、信五大厅，展示儒家核心思想，是体验儒家文化的重要场所。',
        metaTags: ['尼山', '孔子诞生地', '大学堂', '仁义礼智信']
      },
      {
        name: '邹城孟庙孟府',
        seal: '孟',
        tags: ['全国重点文物保护单位'],
        description: '孟庙始建于北宋景祐四年，是祭祀孟子的场所。孟府是孟子嫡系后裔居住的府第，与孟庙毗邻。孟庙以七进院落组成，有亚圣殿等主要建筑，是研究孟子思想和宋代建筑的重要实物。',
        metaTags: ['邹城', '孟庙', '孟府', '孟子']
      },
      {
        name: '颜庙（复圣庙）',
        seal: '颜',
        tags: ['全国重点文物保护单位'],
        description: '颜庙是祭祀孔子最得意弟子颜回的庙宇。颜回以德行著称，孔子称赞他"一箪食，一瓢饮，在陋巷，人不堪其忧，回也不改其乐"。',
        metaTags: ['颜庙', '颜回', '复圣']
      },
      {
        name: '周公庙（元圣庙）',
        seal: '周',
        tags: ['全国重点文物保护单位'],
        description: '周公庙祀周公旦。周公是鲁国始封君，制礼作乐，奠定了鲁国的礼乐传统。周公庙以"德配天地"、"道冠古今"为匾额，体现了周公在儒家文化中的崇高地位。',
        metaTags: ['周公庙', '周公', '元圣']
      },
      {
        name: '少昊陵',
        seal: '昊',
        tags: ['全国重点文物保护单位'],
        description: '少昊陵是祭祀远古帝王少昊的陵墓，位于曲阜市东。少昊是黄帝之子，以鸟名官，是东夷文化的重要代表。陵台呈金字塔形，俗称"万石山"。',
        metaTags: ['少昊陵', '远古帝王', '东夷文化']
      },
      {
        name: '铁山摩崖刻经',
        seal: '铁',
        tags: ['全国重点文物保护单位'],
        description: '铁山摩崖刻经位于邹城市，是北齐时期的佛教刻经，与岗山、葛山、尖山刻经并称"四山摩崖"。刻经字体雄浑，是书法艺术的珍品。',
        metaTags: ['铁山', '摩崖刻经', '北齐', '书法']
      },
      {
        name: '曾子庙',
        seal: '曾',
        tags: ['全国重点文物保护单位'],
        description: '曾子庙位于嘉祥县，是祭祀曾子的庙宇。曾子是孔子弟子，以孝道著称，著有《大学》。曾子庙规模宏大，是研究曾子思想和明清建筑的重要场所。',
        metaTags: ['曾子庙', '曾子', '孝道', '大学']
      }
    ]
  },
  {
    city: '泰安市',
    citySeal: '泰',
    count: 4,
    landmarks: [
      {
        name: '泰山',
        seal: '山',
        tags: ['世界文化与自然双重遗产', '国家5A级景区'],
        description: '泰山被誉为"五岳之首"，是历代帝王祭天的神山。泰山文化底蕴深厚，有岱庙、碧霞祠、普照寺等众多古迹。孔子曾"登泰山而小天下"，泰山也是儒家文化的重要象征。',
        metaTags: ['泰山', '五岳', '岱庙', '祭天']
      },
      {
        name: '岱庙',
        seal: '岱',
        tags: ['全国重点文物保护单位'],
        description: '岱庙是泰山的主庙，始建于汉代，是历代帝王祭祀泰山的场所。岱庙以天贶殿为主体，与北京故宫太和殿、曲阜孔庙大成殿并称"中国三大宫殿式建筑"。',
        metaTags: ['岱庙', '天贶殿', '帝王祭天']
      },
      {
        name: '灵岩寺',
        seal: '灵',
        tags: ['全国重点文物保护单位'],
        description: '灵岩寺位于泰山北麓，始建于东晋。寺内有千佛殿、辟支塔等建筑，尤以宋代彩塑罗汉像闻名，被誉为"海内第一名塑"。',
        metaTags: ['灵岩寺', '彩塑', '罗汉']
      },
      {
        name: '徂徕山',
        seal: '徂',
        tags: ['国家森林公园'],
        description: '徂徕山是泰山的姊妹山，历史上曾是道教、佛教圣地。唐代大诗人李白曾在此隐居，留有"竹溪六逸"的佳话。徂徕山也是山东人民抗日武装起义的发源地。',
        metaTags: ['徂徕山', '李白', '抗日起义']
      }
    ]
  },
  {
    city: '淄博市',
    citySeal: '淄',
    count: 3,
    landmarks: [
      {
        name: '稷下学宫遗址',
        seal: '稷',
        tags: ['古遗址'],
        description: '稷下学宫是战国时期齐国的最高学府，位于临淄。这里汇聚了百家学者，是中国古代思想文化的"百家争鸣"之地。荀子曾三任稷下学宫祭酒，对儒学发展产生了重要影响。',
        metaTags: ['稷下学宫', '百家争鸣', '荀子', '临淄']
      },
      {
        name: '齐国故城遗址',
        seal: '齐',
        tags: ['全国重点文物保护单位'],
        description: '齐国故城位于淄博市临淄区，是周代齐国的都城遗址。故城规模宏大，有宫殿区、手工业作坊区、居民区等。出土了大量文物，是研究齐国历史文化的重要遗址。',
        metaTags: ['齐国故城', '临淄', '周代']
      },
      {
        name: '管仲纪念馆',
        seal: '管',
        tags: ['纪念馆'],
        description: '管仲纪念馆位于临淄区，是纪念春秋时期齐国名相管仲的场所。管仲辅佐齐桓公成就霸业，提出"仓廪实而知礼节，衣食足而知荣辱"的思想，对后世影响深远。',
        metaTags: ['管仲', '齐桓公', '霸业']
      }
    ]
  },
  {
    city: '济南市',
    citySeal: '济',
    count: 3,
    landmarks: [
      {
        name: '趵突泉',
        seal: '泉',
        tags: ['国家5A级景区'],
        description: '趵突泉被誉为"天下第一泉"，是济南泉水的代表。李清照纪念馆位于趵突泉公园内，展示了宋代女词人李清照的生平与作品。',
        metaTags: ['趵突泉', '天下第一泉', '李清照']
      },
      {
        name: '曲阜孔庙',
        seal: '曲',
        tags: ['世界文化遗产'],
        description: '孔庙是祭祀孔子的本庙，始建于公元前478年。庙内有大成殿、奎文阁、杏坛等建筑，保存了大量历代碑刻，是中国古代建筑艺术的瑰宝。',
        metaTags: ['孔庙', '大成殿', '杏坛']
      },
      {
        name: '四门塔',
        seal: '塔',
        tags: ['全国重点文物保护单位'],
        description: '四门塔位于济南市历城区，是中国现存最早的单层石塔，建于隋代。塔内有四尊佛像，造型古朴，是佛教艺术的珍品。',
        metaTags: ['四门塔', '隋代', '石塔']
      }
    ]
  },
  {
    city: '潍坊市',
    citySeal: '潍',
    count: 3,
    landmarks: [
      {
        name: '青州古城',
        seal: '青',
        tags: ['国家5A级景区'],
        description: '青州古城是明清时期的青州府治所，保存了大量古建筑。青州是历史上的军事重镇，也是文人墨客聚集之地。范仲淹曾在此为官，留下了"先天下之忧而忧"的名句。',
        metaTags: ['青州', '古城', '范仲淹']
      },
      {
        name: '十笏园',
        seal: '笏',
        tags: ['全国重点文物保护单位'],
        description: '十笏园位于潍坊市潍城区，是清代丁善宝的私家园林。园内建筑精巧，布局紧凑，被誉为"鲁东明珠"，是北方园林的代表作品。',
        metaTags: ['十笏园', '园林', '清代']
      },
      {
        name: '郑板桥纪念馆',
        seal: '郑',
        tags: ['纪念馆'],
        description: '郑板桥纪念馆位于潍坊市，纪念清代著名书画家郑板桥。郑板桥曾在潍县任知县，为官清廉，关心民生，其"难得糊涂"的名言流传甚广。',
        metaTags: ['郑板桥', '潍县', '书画']
      }
    ]
  },
  {
    city: '其他地市',
    citySeal: '鲁',
    count: 8,
    landmarks: [
      {
        name: '临沂王羲之故居',
        seal: '书',
        tags: ['全国重点文物保护单位'],
        description: '王羲之故居位于临沂市兰山区，是东晋大书法家王羲之的出生地。王羲之被誉为"书圣"，其书法作品《兰亭序》被称为"天下第一行书"。',
        metaTags: ['王羲之', '书圣', '兰亭序']
      },
      {
        name: '日照浮来山',
        seal: '浮',
        tags: ['国家4A级景区'],
        description: '浮来山位于日照市莒县，山上有定林寺，寺内有"天下第一银杏树"，树龄逾四千年。刘勰曾在此撰写《文心雕龙》。',
        metaTags: ['浮来山', '银杏树', '刘勰', '文心雕龙']
      },
      {
        name: '烟台蓬莱阁',
        seal: '蓬',
        tags: ['全国重点文物保护单位'],
        description: '蓬莱阁位于烟台市蓬莱区，是中国四大名楼之一。蓬莱阁以"八仙过海"的传说闻名，也是观赏海市蜃楼的最佳地点。',
        metaTags: ['蓬莱阁', '八仙过海', '海市蜃楼']
      },
      {
        name: '青岛崂山',
        seal: '崂',
        tags: ['国家5A级景区'],
        description: '崂山是中国海岸线第一高峰，山海相连，风景秀丽。崂山道教文化深厚，有太清宫等著名道观，也是"崂山道士"传说的发源地。',
        metaTags: ['崂山', '道教', '太清宫']
      },
      {
        name: '聊城光岳楼',
        seal: '光',
        tags: ['全国重点文物保护单位'],
        description: '光岳楼位于聊城市东昌府区，始建于明代。楼内有乾隆皇帝御笔"天下第一楼"匾额，是中国古代楼阁建筑的代表。',
        metaTags: ['光岳楼', '天下第一楼', '明代']
      },
      {
        name: '菏泽牡丹园',
        seal: '丹',
        tags: ['国家4A级景区'],
        description: '菏泽是"中国牡丹之都"，牡丹园内种植了大量名贵牡丹品种。牡丹被誉为"国花"，在中国文化中象征着富贵吉祥。',
        metaTags: ['菏泽', '牡丹', '国花']
      },
      {
        name: '威海刘公岛',
        seal: '刘',
        tags: ['全国重点文物保护单位'],
        description: '刘公岛位于威海市，是中国近代第一支海军北洋水师的诞生地。岛上有甲午战争纪念馆，是爱国主义教育基地。',
        metaTags: ['刘公岛', '北洋水师', '甲午战争']
      },
      {
        name: '东营孙武祠',
        seal: '武',
        tags: ['纪念馆'],
        description: '孙武祠位于东营市广饶县，是纪念春秋时期军事家孙武的场所。孙武著有《孙子兵法》，被誉为"兵圣"，其思想对后世军事学产生了深远影响。',
        metaTags: ['孙武', '孙子兵法', '兵圣']
      }
    ]
  }
];

function renderCultureGrid() {
  const grid = document.getElementById('culture-grid');
  if (!grid) return;

  cultureData.forEach(city => {
    const citySection = document.createElement('div');
    citySection.className = 'city-section';

    citySection.innerHTML = `
      <div class="city-header">
        <div class="city-seal">${city.citySeal}</div>
        <h3>${city.city}</h3>
        <span class="city-count">${city.count}处</span>
      </div>
      <div class="city-cards"></div>
    `;

    const cardsContainer = citySection.querySelector('.city-cards');

    city.landmarks.forEach(landmark => {
      const card = document.createElement('div');
      card.className = 'culture-card';

      const tagsHtml = landmark.tags.map(tag => `<span>${tag}</span>`).join('');
      const metaTagsHtml = landmark.metaTags.map(tag => `<span class="culture-tag meta-tag">${tag}</span>`).join('');

      card.innerHTML = `
        <div class="seal-mark">${landmark.seal}</div>
        <h3>${landmark.name}</h3>
        <div class="culture-meta">${tagsHtml}</div>
        <p>${landmark.description}</p>
        <div class="culture-tags">${metaTagsHtml}</div>
      `;

      cardsContainer.appendChild(card);
    });

    grid.appendChild(citySection);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCultureGrid();
});