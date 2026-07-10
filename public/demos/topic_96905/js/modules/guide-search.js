/**
 * 攻略搜索模块
 * 从预抓取的马蜂窝游记数据展示游记卡片。
 * 每张卡片含缩略图、标题、摘要、浏览数，点击跳转马蜂窝原始页面。
 * 整个区域明确标注"马蜂窝"来源。
 */
const GuideSearch = (function () {

  /**
   * 获取城市攻略信息
   * @param {string} cityName - 城市名
   * @param {number} cityId - 城市ID
   * @returns {object} { description, keywords, guides, sourceLabel, sourceUrl }
   */
  function loadCityGuides(cityName, cityId) {
    var description = '';
    var keywords = [];
    var guides = [];

    // 本地标签数据
    if (cityId && typeof DataLoader !== 'undefined') {
      var tags = DataLoader.getCityTags(cityId);
      if (tags) {
        description = tags.description || '';
        keywords = tags.keywords || [];
      }

      // 马蜂窝游记数据
      var guideData = DataLoader.getCityGuides(cityId);
      if (guideData && guideData.guides) {
        guides = guideData.guides;
      }
    }

    return {
      cityName: cityName,
      description: description,
      keywords: keywords,
      guides: guides,
      sourceLabel: '马蜂窝',
      sourceUrl: 'https://www.mafengwo.cn/search/q.php?q=' + encodeURIComponent(cityName + '旅游攻略')
    };
  }

  /**
   * 渲染攻略区域到结果页
   * @param {object} data - loadCityGuides 返回的数据
   */
  function renderGuideSection(data) {
    var container = document.getElementById('guide-content');
    if (!container) return;

    var html = '';

    // 城市简介（本地数据）
    if (data.description) {
      html += '<div class="guide-wiki">';
      html += '<p class="guide-summary">' + data.description + '</p>';
      html += '</div>';
    }

    // 关键词
    if (data.keywords && data.keywords.length > 0) {
      html += '<div class="guide-keywords">';
      html += '<span class="guide-keywords-title">特色关键词：</span>';
      data.keywords.forEach(function (kw) {
        html += '<span class="guide-keyword">' + kw + '</span>';
      });
      html += '</div>';
    }

    // 马蜂窝游记卡片
    if (data.guides && data.guides.length > 0) {
      html += '<div class="guide-mfw-section">';

      // 来源标注
      html += '<div class="guide-source-bar">';
      html += '<span class="guide-source-label">🐝 来源：马蜂窝</span>';
      html += '<a href="' + data.sourceUrl + '" target="_blank" rel="noopener" class="guide-source-more">查看更多 ></a>';
      html += '</div>';

      // 游记卡片列表
      html += '<div class="guide-cards">';
      data.guides.forEach(function (guide, idx) {
        html += '<a href="' + guide.url + '" target="_blank" rel="noopener" class="guide-card">';
        // 缩略图
        if (guide.thumbnail) {
          html += '<div class="guide-card__thumb">';
          html += '<img src="' + guide.thumbnail + '" alt="' + guide.title + '" loading="lazy" onerror="this.parentElement.style.display=\'none\'">';
          html += '</div>';
        }
        // 内容
        html += '<div class="guide-card__body">';
        html += '<h4 class="guide-card__title">' + guide.title + '</h4>';
        if (guide.summary) {
          html += '<p class="guide-card__summary">' + guide.summary + '</p>';
        }
        html += '<div class="guide-card__meta">';
        if (guide.views > 0) {
          html += '<span class="guide-card__views">👁 ' + guide.views + '浏览</span>';
        }
        if (guide.date) {
          html += '<span class="guide-card__date">' + guide.date + '</span>';
        }
        html += '</div>';
        html += '</div>';
        html += '</a>';
      });
      html += '</div>';

      html += '</div>';
    }

    // 其他平台搜索链接
    html += '<div class="guide-links">';
    html += '<span class="guide-links-title">🔍 更多平台搜索：</span>';
    var links = generateSearchLinks(data.cityName || '');
    links.forEach(function (link) {
      html += '<a href="' + link.searchUrl + '" target="_blank" rel="noopener" class="guide-link">' +
        (link.icon || '') + ' ' + link.platform + '</a>';
    });
    html += '</div>';

    container.innerHTML = html;
    container.classList.remove('hidden');
  }

  /**
   * 生成各平台搜索链接
   */
  function generateSearchLinks(cityName) {
    var guideKw = encodeURIComponent(cityName + '旅游攻略');
    var cityKw = encodeURIComponent(cityName);
    var travelKw = encodeURIComponent(cityName + '旅游');

    return [
      { platform: '百度', searchUrl: 'https://www.baidu.com/s?wd=' + guideKw, icon: '🔍' },
      { platform: '马蜂窝', searchUrl: 'https://www.mafengwo.cn/search/q.php?q=' + cityKw, icon: '🐝' },
      { platform: '携程', searchUrl: 'https://www.ctrip.com/web/search/?keyword=' + travelKw, icon: '🚄' },
      { platform: '小红书', searchUrl: 'https://www.baidu.com/s?wd=' + encodeURIComponent('site:xiaohongshu.com ' + cityName + ' 旅游攻略'), icon: '📕' },
      { platform: '知乎', searchUrl: 'https://www.baidu.com/s?wd=' + encodeURIComponent('site:zhihu.com ' + cityName + ' 旅游攻略'), icon: '💡' }
    ];
  }

  return {
    loadCityGuides: loadCityGuides,
    renderGuideSection: renderGuideSection,
    generateSearchLinks: generateSearchLinks
  };
})();
