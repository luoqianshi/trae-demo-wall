/**
 * 知行合一盈亏记录系统 - 交易记录表单模块
 */
var TradeForm = (function() {
  'use strict';

  var selectedEmotion = 'calm';
  var selectedDirection = 'sell';
  var editId = null;

  function render(container, options) {
    options = options || {};
    editId = options.editId || null;
    selectedDirection = 'sell';
    selectedEmotion = 'calm';

    var trade = null;
    if (options.mode === 'edit' && editId) {
      trade = Store.getTradeById(editId);
      if (trade) {
        selectedDirection = trade.direction;
        selectedEmotion = trade.emotion;
      }
    }

    container.innerHTML =
      '<div class="page-header"><h2>' + (trade ? '编辑交易记录' : '记录新交易') + '</h2></div>' +
      '<div class="trade-form">' +

      '<div class="form-group"><label>交易日期 <span class="required">*</span></label>' +
      '<input type="date" id="tf-date" class="form-input" value="' + (trade ? trade.date : Utils.formatDate(new Date())) + '">' +
      '<div class="form-error">请选择交易日期</div></div>' +

      '<div class="form-row">' +
      '<div class="form-group"><label>股票代码 <span class="required">*</span></label>' +
      '<div class="stock-suggest-wrap">' +
      '<input type="text" id="tf-stockcode" class="form-input" placeholder="输入代码或名称搜索" value="' + (trade ? trade.stockCode : '') + '">' +
      '<div class="stock-suggest-dropdown" id="tf-stock-suggest"></div>' +
      '</div>' +
      '<div class="form-error">请输入6位股票代码</div></div>' +
      '<div class="form-group"><label>股票名称</label>' +
      '<input type="text" id="tf-stockname" class="form-input" placeholder="输入代码自动填充，可手动修改" value="' + (trade ? trade.stockName : '') + '"></div>' +
      '</div>' +

      '<div class="form-group"><label>操作方向 <span class="required">*</span></label>' +
      '<div class="direction-group">' +
      '<button class="direction-btn' + (selectedDirection === 'buy' ? ' active-buy' : '') + '" data-dir="buy">📈 买入</button>' +
      '<button class="direction-btn' + (selectedDirection === 'sell' ? ' active-sell' : '') + '" data-dir="sell">📉 卖出</button>' +
      '</div></div>' +

      '<div class="form-row">' +
      '<div class="form-group"><label>盈亏金额 (¥) <span class="required">*</span></label>' +
      '<input type="number" id="tf-pnl" class="form-input" placeholder="正数为盈利，负数为亏损" step="0.01" value="' + (trade ? trade.pnlAmount : '') + '">' +
      '<div class="form-error">请输入盈亏金额</div></div>' +
      '<div class="form-group"><label>盈亏比例 (%)</label>' +
      '<input type="number" id="tf-pnlpct" class="form-input" placeholder="如 +5.2 或 -2.1" step="0.1" value="' + (trade ? trade.pnlPercent : '') + '"></div>' +
      '</div>' +

      '<div class="form-group"><label>交易理由</label>' +
      '<select id="tf-reason" class="form-input">' +
      '<option value="">请选择交易理由</option>' +
      Utils.REASONS.map(function(r) { return '<option value="' + r + '"' + (trade && trade.reason === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
      '<option value="__custom__">自定义输入...</option>' +
      '</select></div>' +
      '<div class="form-group" id="tf-custom-reason-wrap" style="display:none">' +
      '<input type="text" id="tf-custom-reason" class="form-input" placeholder="输入自定义交易理由"></div>' +

      '<div class="form-group"><label>此刻情绪 <span class="required">*</span></label>' +
      '<div class="emotion-selector" id="tf-emotions">' +
      Utils.EMOTIONS.map(function(em) {
        return '<button class="emotion-btn' + (selectedEmotion === em.key ? ' selected' : '') + '" data-emotion="' + em.key + '" style="' + (selectedEmotion === em.key ? 'border-color:' + em.color + ';color:' + em.color + ';background:' + em.color + '15' : '') + '">' + em.icon + ' ' + em.label + '</button>';
      }).join('') +
      '</div></div>' +

      '<div class="form-group"><label>交易心得</label>' +
      '<textarea id="tf-notes" class="form-input" rows="3" placeholder="写下你此刻的想法和感受...">' + (trade && trade.notes ? trade.notes : '') + '</textarea></div>' +

      '<div class="form-risk-warning" id="tf-risk-warning"></div>' +

      '<div class="form-actions">' +
      '<button class="btn btn-secondary" onclick="Router.navigate(\'#app/trades\')">取消</button>' +
      '<button class="btn btn-primary" id="tf-submit">' + (trade ? '保存修改' : '确认记录盈亏') + '</button>' +
      '</div></div>';

    // === Event Bindings ===

    // Stock code auto-suggest with intelligent search dropdown
    var codeInput = container.querySelector('#tf-stockcode');
    var nameInput = container.querySelector('#tf-stockname');
    var suggestDropdown = container.querySelector('#tf-stock-suggest');
    var activeSuggestIdx = -1;
    var currentSuggestions = [];

    // Debounced search function
    var debouncedSearch = Utils.debounce(function(query) {
      if (!query || query.length < 1) {
        hideSuggestDropdown();
        return;
      }
      var results = Utils.searchStocks(query, 8);
      currentSuggestions = results;
      activeSuggestIdx = -1;
      if (results.length === 0) {
        suggestDropdown.innerHTML = '<div class="stock-suggest-empty">未找到匹配股票，可直接输入</div>';
        suggestDropdown.classList.add('visible');
      } else {
        var html = '';
        for (var i = 0; i < results.length; i++) {
          html += '<div class="stock-suggest-item" data-idx="' + i + '">' +
            '<span class="stock-suggest-code">' + results[i].code + '</span>' +
            '<span class="stock-suggest-name">' + results[i].name + '</span>' +
            '</div>';
        }
        suggestDropdown.innerHTML = html;
        suggestDropdown.classList.add('visible');

        // Click handler for suggestion items
        suggestDropdown.querySelectorAll('.stock-suggest-item').forEach(function(item) {
          item.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Prevent blur from firing before click
            var idx = parseInt(this.getAttribute('data-idx'), 10);
            selectSuggestion(idx);
          });
        });
      }
    }, 150);

    function selectSuggestion(idx) {
      if (idx < 0 || idx >= currentSuggestions.length) return;
      var selected = currentSuggestions[idx];
      codeInput.value = selected.code;
      nameInput.value = selected.name;
      hideSuggestDropdown();
    }

    function hideSuggestDropdown() {
      suggestDropdown.classList.remove('visible');
      suggestDropdown.innerHTML = '';
      currentSuggestions = [];
      activeSuggestIdx = -1;
    }

    function highlightSuggestion(idx) {
      var items = suggestDropdown.querySelectorAll('.stock-suggest-item');
      items.forEach(function(item) { item.classList.remove('active'); });
      if (idx >= 0 && idx < items.length) {
        items[idx].classList.add('active');
        items[idx].scrollIntoView({ block: 'nearest' });
      }
    }

    codeInput.addEventListener('input', function() {
      var raw = this.value.trim();
      // If input is all digits, enforce 6-digit limit
      var isDigitsOnly = /^\d+$/.test(raw);
      if (isDigitsOnly && raw.length > 6) {
        raw = raw.slice(0, 6);
        this.value = raw;
      }

      if (isDigitsOnly && raw.length === 6) {
        // Full 6-digit code entered - auto-fill name
        var name = Utils.getStockName(raw);
        if (name) {
          nameInput.value = name;
          hideSuggestDropdown();
        } else {
          nameInput.value = '';
          hideSuggestDropdown();
        }
      } else if (raw.length >= 1) {
        // Partial code or name search - show suggestions
        if (isDigitsOnly) {
          nameInput.value = '';
        }
        debouncedSearch(raw);
      } else {
        nameInput.value = '';
        hideSuggestDropdown();
      }
    });

    // Keyboard navigation for suggestions
    codeInput.addEventListener('keydown', function(e) {
      if (!suggestDropdown.classList.contains('visible')) return;
      var items = suggestDropdown.querySelectorAll('.stock-suggest-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestIdx = Math.min(activeSuggestIdx + 1, items.length - 1);
        highlightSuggestion(activeSuggestIdx);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestIdx = Math.max(activeSuggestIdx - 1, 0);
        highlightSuggestion(activeSuggestIdx);
      } else if (e.key === 'Enter') {
        if (activeSuggestIdx >= 0) {
          e.preventDefault();
          selectSuggestion(activeSuggestIdx);
        }
      } else if (e.key === 'Escape') {
        hideSuggestDropdown();
      }
    });

    // Hide dropdown on blur (with small delay to allow click on items)
    codeInput.addEventListener('blur', function() {
      setTimeout(hideSuggestDropdown, 200);
    });

    // Direction toggle
    container.querySelectorAll('.direction-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        selectedDirection = this.getAttribute('data-dir');
        container.querySelectorAll('.direction-btn').forEach(function(b) {
          b.classList.remove('active-buy', 'active-sell');
        });
        this.classList.add(selectedDirection === 'buy' ? 'active-buy' : 'active-sell');
      });
    });

    // PnL amount color change
    var pnlInput = container.querySelector('#tf-pnl');
    pnlInput.addEventListener('input', function() {
      var val = parseFloat(this.value);
      this.classList.remove('profit-border', 'loss-border');
      if (!isNaN(val)) {
        this.classList.add(val >= 0 ? 'profit-border' : 'loss-border');
      }
      updateRiskWarning(container);
    });

    // Reason dropdown
    var reasonSelect = container.querySelector('#tf-reason');
    var customWrap = container.querySelector('#tf-custom-reason-wrap');
    reasonSelect.addEventListener('change', function() {
      customWrap.style.display = this.value === '__custom__' ? 'block' : 'none';
    });

    // Emotion selector
    container.querySelectorAll('.emotion-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key = this.getAttribute('data-emotion');
        selectedEmotion = key;
        var emInfo = Utils.getEmotionInfo(key);
        container.querySelectorAll('.emotion-btn').forEach(function(b) {
          b.classList.remove('selected');
          b.style.borderColor = '';
          b.style.color = '';
          b.style.background = '';
        });
        this.classList.add('selected');
        this.style.borderColor = emInfo.color;
        this.style.color = emInfo.color;
        this.style.background = emInfo.color + '15';
      });
    });

    // Submit
    container.querySelector('#tf-submit').addEventListener('click', function() {
      handleSubmit(container);
    });

    // Initial risk check
    updateRiskWarning(container);
  }

  function updateRiskWarning(container) {
    var warningEl = container.querySelector('#tf-risk-warning');
    var alerts = Store.checkRiskAlerts();
    if (alerts.length > 0) {
      var worst = alerts[0];
      warningEl.style.display = 'block';
      warningEl.textContent = '⚠️ ' + worst.message;
    } else {
      warningEl.style.display = 'none';
    }
  }

  function handleSubmit(container) {
    // Validate
    var date = container.querySelector('#tf-date').value;
    var stockCode = container.querySelector('#tf-stockcode').value.replace(/\D/g, ''); // Extract digits only
    var pnlAmount = parseFloat(container.querySelector('#tf-pnl').value);
    var pnlPercent = parseFloat(container.querySelector('#tf-pnlpct').value) || 0;
    var reason = container.querySelector('#tf-reason').value;
    var notes = container.querySelector('#tf-notes').value;
    var stockName = container.querySelector('#tf-stockname').value || Utils.getStockName(stockCode) || '';

    // Custom reason
    if (reason === '__custom__') {
      reason = container.querySelector('#tf-custom-reason').value || '其他';
    }

    // Validation
    var valid = true;
    if (!date) {
      showFieldError(container, 'tf-date', '请选择交易日期');
      valid = false;
    }
    if (!Utils.isValidStockCode(stockCode)) {
      showFieldError(container, 'tf-stockcode', '请输入6位股票代码');
      valid = false;
    }
    if (isNaN(pnlAmount)) {
      showFieldError(container, 'tf-pnl', '请输入盈亏金额');
      valid = false;
    }

    if (!valid) return;

    var tradeData = {
      date: date,
      stockCode: stockCode,
      stockName: stockName,
      direction: selectedDirection,
      pnlAmount: pnlAmount,
      pnlPercent: pnlPercent,
      reason: reason,
      emotion: selectedEmotion,
      notes: notes
    };

    // Confirmation modal
    var dirLabel = selectedDirection === 'buy' ? '买入' : '卖出';
    var pnlLabel = pnlAmount >= 0 ? '盈利' : '亏损';
    var summary = '你确定要' + (editId ? '保存对' : '记录') + ' ' + stockName + '(' + stockCode + ') ' + dirLabel + '操作的' + pnlLabel + ' ' + Utils.formatMoney(Math.abs(pnlAmount)) + (pnlPercent ? '(' + Utils.formatPercent(pnlPercent, true) + ')' : '') + ' 吗？';

    App.showModal(
      editId ? '确认修改' : '确认记录',
      summary,
      function() {
        // Save user-defined stock name to cache
        if (stockCode && stockName && !Utils.STOCK_MAP[stockCode]) {
          Utils.saveUserStockName(stockCode, stockName);
        }
        if (editId) {
          Store.updateTrade(editId, tradeData);
          App.showToast('交易记录已更新', 'success');
        } else {
          Store.addTrade(tradeData);
          App.showToast('交易记录已保存', 'success');
        }
        App.showSuccessAnimation(pnlAmount >= 0);
        setTimeout(function() {
          Router.navigate('#app/trades');
        }, 800);
      }
    );
  }

  function showFieldError(container, fieldId, message) {
    var field = container.querySelector('#' + fieldId);
    var group = field ? field.closest('.form-group') : null;
    if (group) {
      group.classList.add('has-error');
      var errorEl = group.querySelector('.form-error');
      if (errorEl) errorEl.textContent = message;
    }
  }

  return { render: render };
})();
