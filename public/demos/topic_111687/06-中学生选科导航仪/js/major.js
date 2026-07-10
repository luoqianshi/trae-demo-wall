/* 专业详情页逻辑 */
window.onload = function() {
  var urlParams = new URLSearchParams(window.location.search);
  var category = urlParams.get('category');

  if (!category) {
    category = '计算机类';
  }

  loadCategoryDetail(category);
};

function loadCategoryDetail(category) {
  var data = majorCategories[category];
  if (!data) {
    document.getElementById('majorTitle').textContent = '暂无该专业分类信息';
    document.getElementById('overviewText').textContent = '抱歉，我们正在努力完善这个专业分类的信息。';
    return;
  }

  document.getElementById('navTitle').textContent = category + '详情';
  document.getElementById('majorIcon').textContent = data.icon;
  document.getElementById('majorTitle').textContent = category;

  var majorNames = data.majors.join('、');
  document.getElementById('majorTag').textContent = '包含专业：' + majorNames;

  document.getElementById('overviewText').textContent = data.overview;

  renderTimeline(data.industryTrends);
  renderJobInfo(data.employment);
  renderSkills(data.skillRequirements);
  renderPath(data.developmentPath);
  document.getElementById('tipsText').textContent = data.tips;
  renderMajorList(data.majors);
}

function renderTimeline(trends) {
  var container = document.getElementById('timeline');
  var html = '';

  for (var i = 0; i < trends.length; i++) {
    var trend = trends[i];
    html += '<div class="timeline-item fade-in">';
    html += '<div class="timeline-year">' + trend.year + '</div>';
    html += '<div class="timeline-content">';
    html += '<div class="timeline-title">' + trend.title + '</div>';
    html += '<div class="timeline-desc">' + trend.content + '</div>';
    html += '</div>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function renderJobInfo(employment) {
  var sectorsContainer = document.getElementById('jobSectors');
  var positionsContainer = document.getElementById('jobPositions');

  var sectorsHtml = '';
  for (var i = 0; i < employment.sectors.length; i++) {
    sectorsHtml += '<span class="job-tag">' + employment.sectors[i] + '</span>';
  }
  sectorsContainer.innerHTML = sectorsHtml;

  var positionsHtml = '';
  for (var j = 0; j < employment.hotPositions.length; j++) {
    positionsHtml += '<span class="job-tag">' + employment.hotPositions[j] + '</span>';
  }
  positionsContainer.innerHTML = positionsHtml;

  document.getElementById('salaryRange').textContent = employment.salaryRange;
}

function renderSkills(skills) {
  var container = document.getElementById('skillList');
  var html = '';

  for (var i = 0; i < skills.length; i++) {
    html += '<div class="skill-item">';
    html += '<span class="skill-num">' + (i + 1) + '</span>';
    html += '<span class="skill-text">' + skills[i] + '</span>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function renderPath(paths) {
  var container = document.getElementById('pathList');
  var html = '';

  for (var i = 0; i < paths.length; i++) {
    html += '<div class="path-item">';
    html += '<span class="path-dot"></span>';
    html += '<span class="path-text">' + paths[i] + '</span>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function renderMajorList(majors) {
  var container = document.getElementById('majorList');
  var html = '';

  for (var i = 0; i < majors.length; i++) {
    var majorName = majors[i];
    var major = majorsData[majorName];
    if (major) {
      html += '<div class="major-item fade-in" onclick="showMajorDetail(\'' + majorName + '\')">';
      html += '<div class="major-item-icon">' + major.icon + '</div>';
      html += '<div class="major-item-info">';
      html += '<div class="major-item-name">' + majorName + '</div>';
      html += '<div class="major-item-type">' + major.type + '</div>';
      html += '</div>';
      html += '<span class="major-item-arrow">›</span>';
      html += '</div>';
    }
  }

  container.innerHTML = html;
}

function showMajorDetail(majorName) {
  var major = majorsData[majorName];
  if (!major) {
    alert('暂无该专业的详细介绍');
    return;
  }

  var html = '';
  html += '<div class="major-detail-hero">';
  html += '<div class="major-detail-icon">' + major.icon + '</div>';
  html += '<div class="major-detail-title">' + majorName + '</div>';
  html += '<div class="major-detail-type">' + major.type + '</div>';
  html += '</div>';

  html += '<div class="major-detail-section">';
  html += '<div class="major-detail-section-title">📖 专业简介</div>';
  html += '<div class="major-detail-section-text">' + major.desc + '</div>';
  html += '</div>';

  html += '<div class="major-detail-section">';
  html += '<div class="major-detail-section-title">📚 核心课程</div>';
  html += '<div class="major-detail-section-text">' + major.learn + '</div>';
  html += '</div>';

  html += '<div class="major-detail-section">';
  html += '<div class="major-detail-section-title">💼 就业方向</div>';
  html += '<div class="major-detail-section-text">' + major.career + '</div>';
  html += '</div>';

  html += '<div class="major-detail-section">';
  html += '<div class="major-detail-section-title">💰 薪资参考</div>';
  html += '<div class="major-detail-section-text">' + major.salary + '</div>';
  html += '</div>';

  html += '<div class="major-detail-section">';
  html += '<div class="major-detail-section-title">📋 选科要求</div>';
  html += '<div class="major-detail-section-text">' + major.require + '</div>';
  html += '</div>';

  html += '<div class="major-detail-section">';
  html += '<div class="major-detail-section-title">🏫 推荐院校</div>';
  html += '<div class="major-detail-section-text">' + major.schools + '</div>';
  html += '</div>';

  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('majorModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeMajorModal(event) {
  if (event && event.target && event.target.id !== 'majorModal' && event.target.className !== 'modal-close') {
    return;
  }
  document.getElementById('majorModal').classList.remove('show');
  document.body.style.overflow = '';
}