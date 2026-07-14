(function() {
  'use strict';

  var utils;
  var data;

  var categoryColors = {
    '敏感数据': 'tag-error',
    '术语矛盾': 'tag-warning',
    '低置信QA': 'tag-warning',
    '内容冲突': 'tag-error',
    '人工补全': 'tag-primary',
    '拆分异常': 'tag-muted'
  };

  var severityColors = {
    'high': 'tag-error',
    'medium': 'tag-warning',
    'low': 'tag-muted'
  };

  var severityLabels = {
    'high': '高',
    'medium': '中',
    'low': '低'
  };

  document.addEventListener('DOMContentLoaded', function() {
    utils = window.AppUtils;
    data = window.SAMPLE_DATA;
    if (!utils || !data) {
      console.error('依赖加载失败');
      return;
    }
    renderReviewList();
    updateStats();
  });

  function renderReviewList() {
    var list = utils.$('#review-list');
    var checklist = data.review_checklist || [];

    checklist.forEach(function(item, index) {
      var card = createReviewCard(item, index + 1);
      list.appendChild(card);
    });
  }

  function createReviewCard(item, index) {
    var card = utils.createElement('div', { className: 'review-card' });

    var cardHeader = utils.createElement('div', { className: 'review-card-header' });

    var number = utils.createElement('span', { className: 'review-number', textContent: index });
    cardHeader.appendChild(number);

    var categoryTag = utils.createElement('span', { className: 'tag ' + (categoryColors[item.category] || 'tag-muted'), textContent: item.category });
    cardHeader.appendChild(categoryTag);

    var severityTag = utils.createElement('span', { className: 'tag ' + (severityColors[item.severity] || 'tag-muted'), textContent: '严重程度：' + severityLabels[item.severity] });
    cardHeader.appendChild(severityTag);

    var toggleBtn = utils.createElement('button', { className: 'review-toggle', onclick: 'toggleReviewCard(this)' });
    toggleBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    cardHeader.appendChild(toggleBtn);

    card.appendChild(cardHeader);

    var cardBody = utils.createElement('div', { className: 'review-card-body' });

    var description = utils.createElement('div', { className: 'review-description', textContent: item.description });
    cardBody.appendChild(description);

    if (item.chunk_id) {
      var chunkId = utils.createElement('div', { className: 'review-chunk-id' });
      chunkId.innerHTML = '<span class="chunk-label">关联 chunk_id：</span><span class="chunk-value">' + item.chunk_id + '</span>';
      cardBody.appendChild(chunkId);
    }

    var suggestion = utils.createElement('div', { className: 'review-suggestion' });
    suggestion.innerHTML = '<span class="suggestion-label">建议：</span><span class="suggestion-text">' + item.suggestion + '</span>';
    cardBody.appendChild(suggestion);

    var cardActions = utils.createElement('div', { className: 'review-card-actions' });
    var resolveBtn = utils.createElement('button', { className: 'btn btn-success btn-sm', textContent: '确认处理', onclick: 'resolveReviewItem(this)' });
    var skipBtn = utils.createElement('button', { className: 'btn btn-warning btn-sm', textContent: '忽略', onclick: 'skipReviewItem(this)' });
    cardActions.appendChild(resolveBtn);
    cardActions.appendChild(skipBtn);

    cardBody.appendChild(cardActions);
    card.appendChild(cardBody);

    return card;
  }

  window.toggleReviewCard = function(btn) {
    var card = btn.closest('.review-card');
    var body = card.querySelector('.review-card-body');
    body.classList.toggle('expanded');
    btn.classList.toggle('rotated');
  };

  window.resolveReviewItem = function(btn) {
    var card = btn.closest('.review-card');
    card.classList.add('resolved');
    card.classList.remove('skipped');
    card.querySelector('.review-card-body').classList.add('expanded');
    card.querySelector('.review-toggle').classList.add('rotated');
    updateStats();
  };

  window.skipReviewItem = function(btn) {
    var card = btn.closest('.review-card');
    card.classList.add('skipped');
    card.classList.remove('resolved');
    card.querySelector('.review-card-body').classList.add('expanded');
    card.querySelector('.review-toggle').classList.add('rotated');
    updateStats();
  };

  function updateStats() {
    var cards = document.querySelectorAll('.review-card');
    var total = cards.length;
    var pending = 0;
    var resolved = 0;
    var skipped = 0;

    cards.forEach(function(card) {
      if (card.classList.contains('resolved')) {
        resolved++;
      } else if (card.classList.contains('skipped')) {
        skipped++;
      } else {
        pending++;
      }
    });

    if (utils.$('#review-stat-total')) {
      utils.$('#review-stat-total').textContent = total;
    }
    if (utils.$('#review-stat-pending')) {
      utils.$('#review-stat-pending').textContent = pending;
    }
    if (utils.$('#review-stat-resolved')) {
      utils.$('#review-stat-resolved').textContent = resolved;
    }
    if (utils.$('#review-stat-skipped')) {
      utils.$('#review-stat-skipped').textContent = skipped;
    }
  }

})();