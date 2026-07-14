// ============================================
// Smart Ledger - Main App Logic
// ============================================
(function() {
  'use strict';

  // ============================================
  // Data Store
  // ============================================
  var STORAGE_KEY = 'smart_ledger_data_v1';

  var expenseCategories = [
    { id: 'food', name: '餐饮', icon: '🍜' },
    { id: 'transport', name: '交通', icon: '🚗' },
    { id: 'shopping', name: '购物', icon: '🛍️' },
    { id: 'entertainment', name: '娱乐', icon: '🎮' },
    { id: 'housing', name: '居住', icon: '🏠' },
    { id: 'medical', name: '医疗', icon: '💊' },
    { id: 'education', name: '教育', icon: '📚' },
    { id: 'travel', name: '旅行', icon: '✈️' },
    { id: 'communication', name: '通讯', icon: '📱' },
    { id: 'clothing', name: '服饰', icon: '👕' },
    { id: 'beauty', name: '美容', icon: '💄' },
    { id: 'other_expense', name: '其他', icon: '📦' }
  ];

  var incomeCategories = [
    { id: 'salary', name: '工资', icon: '💰' },
    { id: 'bonus', name: '奖金', icon: '🎁' },
    { id: 'investment', name: '理财', icon: '📈' },
    { id: 'parttime', name: '兼职', icon: '💼' },
    { id: 'refund', name: '退款', icon: '↩️' },
    { id: 'other_income', name: '其他', icon: '💵' }
  ];

  var defaultAccounts = [
    { id: 'cash', name: '现金', type: 'cash', balance: 1500, number: '' },
    { id: 'bank1', name: '工商银行', type: 'bank', balance: 28500, number: '****8866' },
    { id: 'credit1', name: '招商银行信用卡', type: 'credit', balance: -3200, number: '****5588' },
    { id: 'alipay', name: '支付宝', type: 'alipay', balance: 6800, number: '' },
    { id: 'wechat', name: '微信钱包', type: 'wechat', balance: 2300, number: '' }
  ];

  var defaultBudgets = [
    { id: 'b1', category: 'food', amount: 2000, period: 'month', alert: 80 },
    { id: 'b2', category: 'transport', amount: 500, period: 'month', alert: 80 },
    { id: 'b3', category: 'shopping', amount: 1500, period: 'month', alert: 80 },
    { id: 'b4', category: 'entertainment', amount: 800, period: 'month', alert: 90 }
  ];

  // Generate sample transactions for the past 30 days
  function generateSampleTransactions() {
    var txs = [];
    var now = new Date();
    var categories = expenseCategories;
    var accounts = defaultAccounts;

    // Income - salary
    var salaryDate = new Date(now.getFullYear(), now.getMonth(), 5);
    txs.push({
      id: genId(),
      type: 'income',
      category: 'salary',
      amount: 12000,
      account: 'bank1',
      date: formatDate(salaryDate),
      note: '月度工资',
      createdAt: salaryDate.getTime()
    });

    // Generate daily expenses for last 30 days
    for (var d = 29; d >= 0; d--) {
      var date = new Date(now);
      date.setDate(date.getDate() - d);
      var dayOfWeek = date.getDay();

      // Skip some days for variety
      if (Math.random() < 0.1) continue;

      // 2-4 transactions per day
      var txCount = 2 + Math.floor(Math.random() * 3);
      for (var i = 0; i < txCount; i++) {
        var cat = categories[Math.floor(Math.random() * 8)];
        var amt;
        switch (cat.id) {
          case 'food': amt = 15 + Math.random() * 80; break;
          case 'transport': amt = 5 + Math.random() * 30; break;
          case 'shopping': amt = 50 + Math.random() * 300; break;
          case 'entertainment': amt = 30 + Math.random() * 150; break;
          case 'housing': amt = 0; continue;
          case 'medical': amt = 20 + Math.random() * 100; break;
          case 'education': amt = 50 + Math.random() * 200; break;
          case 'travel': if (dayOfWeek !== 0 && dayOfWeek !== 6) continue; amt = 100 + Math.random() * 500; break;
          default: amt = 10 + Math.random() * 50;
        }

        if (amt === 0) continue;

        var accIdx = Math.floor(Math.random() * accounts.length);
        var notes = ['', '日常消费', '便利店', '外卖', '网购', '通勤', '聚餐'];
        txs.push({
          id: genId(),
          type: 'expense',
          category: cat.id,
          amount: Math.round(amt * 100) / 100,
          account: accounts[accIdx].id,
          date: formatDate(date),
          note: notes[Math.floor(Math.random() * notes.length)],
          createdAt: date.getTime() + Math.random() * 86400000
        });
      }
    }

    // Add a bonus income
    var bonusDate = new Date(now.getFullYear(), now.getMonth(), 15);
    txs.push({
      id: genId(),
      type: 'income',
      category: 'bonus',
      amount: 3000,
      account: 'bank1',
      date: formatDate(bonusDate),
      note: '季度奖金',
      createdAt: bonusDate.getTime()
    });

    // Sort by date desc
    txs.sort(function(a, b) { return b.createdAt - a.createdAt; });
    return txs;
  }

  function genId() {
    return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function formatDate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  var state = {
    transactions: [],
    accounts: [],
    budgets: [],
    currentTxType: 'expense',
    selectedCategory: null,
    currentTrendPeriod: 'week',
    currentStatPeriod: 'day',
    exportFormat: 'excel',
    filterAccount: 'all',
    searchQuery: ''
  };

  // ============================================
  // Storage
  // ============================================
  function loadData() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var data = JSON.parse(saved);
        state.transactions = data.transactions || [];
        state.accounts = data.accounts || defaultAccounts.slice();
        state.budgets = data.budgets || defaultBudgets.slice();
      } else {
        // Initialize with sample data
        state.transactions = generateSampleTransactions();
        state.accounts = defaultAccounts.slice();
        state.budgets = defaultBudgets.slice();
        saveData();
      }
    } catch (e) {
      state.transactions = generateSampleTransactions();
      state.accounts = defaultAccounts.slice();
      state.budgets = defaultBudgets.slice();
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        transactions: state.transactions,
        accounts: state.accounts,
        budgets: state.budgets
      }));
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  // ============================================
  // Data Queries
  // ============================================
  function getCategoryInfo(catId, type) {
    var cats = type === 'income' ? incomeCategories : expenseCategories;
    return cats.find(function(c) { return c.id === catId; }) || { name: '未知', icon: '❓' };
  }

  function getAccountInfo(accId) {
    return state.accounts.find(function(a) { return a.id === accId; }) || { name: '未知账户', type: 'cash' };
  }

  function getTotalBalance() {
    return state.accounts.reduce(function(sum, acc) { return sum + acc.balance; }, 0);
  }

  function getMonthStats() {
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    var income = 0, expense = 0;
    state.transactions.forEach(function(tx) {
      var d = new Date(tx.date);
      if (d >= monthStart && d <= monthEnd) {
        if (tx.type === 'income') income += tx.amount;
        else expense += tx.amount;
      }
    });
    return { income: income, expense: expense };
  }

  function getTrendData(period) {
    var labels = [];
    var incomeData = [];
    var expenseData = [];
    var now = new Date();

    if (period === 'day') {
      // Today by hour - simplified, show last 24h
      for (var h = 23; h >= 0; h--) {
        var d = new Date(now);
        d.setHours(d.getHours() - h);
        labels.push(String(d.getHours()).padStart(2, '0') + ':00');
        var dayStr = formatDate(d);
        var inc = 0, exp = 0;
        state.transactions.forEach(function(tx) {
          if (tx.date === dayStr) {
            if (tx.type === 'income') inc += tx.amount;
            else exp += tx.amount;
          }
        });
        incomeData.push(inc);
        expenseData.push(exp);
      }
    } else if (period === 'week') {
      for (var d = 6; d >= 0; d--) {
        var date = new Date(now);
        date.setDate(date.getDate() - d);
        var dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        labels.push(dayNames[date.getDay()]);
        var dayStr = formatDate(date);
        var inc = 0, exp = 0;
        state.transactions.forEach(function(tx) {
          if (tx.date === dayStr) {
            if (tx.type === 'income') inc += tx.amount;
            else exp += tx.amount;
          }
        });
        incomeData.push(inc);
        expenseData.push(exp);
      }
    } else if (period === 'month') {
      var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= daysInMonth; d++) {
        labels.push(d + '日');
        var dayStr = formatDate(new Date(now.getFullYear(), now.getMonth(), d));
        var inc = 0, exp = 0;
        state.transactions.forEach(function(tx) {
          if (tx.date === dayStr) {
            if (tx.type === 'income') inc += tx.amount;
            else exp += tx.amount;
          }
        });
        incomeData.push(inc);
        expenseData.push(exp);
      }
    } else if (period === 'year') {
      for (var m = 0; m < 12; m++) {
        labels.push((m + 1) + '月');
        var inc = 0, exp = 0;
        state.transactions.forEach(function(tx) {
          var td = new Date(tx.date);
          if (td.getFullYear() === now.getFullYear() && td.getMonth() === m) {
            if (tx.type === 'income') inc += tx.amount;
            else exp += tx.amount;
          }
        });
        incomeData.push(inc);
        expenseData.push(exp);
      }
    }

    return { labels: labels, income: incomeData, expense: expenseData };
  }

  function getExpenseByCategory() {
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var catMap = {};

    state.transactions.forEach(function(tx) {
      if (tx.type !== 'expense') return;
      var d = new Date(tx.date);
      if (d < monthStart) return;
      if (!catMap[tx.category]) catMap[tx.category] = 0;
      catMap[tx.category] += tx.amount;
    });

    var result = [];
    expenseCategories.forEach(function(cat) {
      if (catMap[cat.id]) {
        result.push({ id: cat.id, name: cat.name, icon: cat.icon, amount: catMap[cat.id] });
      }
    });
    result.sort(function(a, b) { return b.amount - a.amount; });
    return result;
  }

  function getBudgetSpent(budget) {
    var now = new Date();
    var startDate;
    if (budget.period === 'week') {
      startDate = new Date(now);
      var day = now.getDay() || 7;
      startDate.setDate(now.getDate() - day + 1);
    } else if (budget.period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    var spent = 0;
    state.transactions.forEach(function(tx) {
      if (tx.type !== 'expense') return;
      if (tx.category !== budget.category) return;
      var d = new Date(tx.date);
      if (d >= startDate && d <= now) {
        spent += tx.amount;
      }
    });
    return spent;
  }

  function getFilteredTransactions() {
    var filtered = state.transactions.slice();

    if (state.searchQuery) {
      var q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(function(tx) {
        var cat = getCategoryInfo(tx.category, tx.type);
        return (tx.note && tx.note.toLowerCase().indexOf(q) > -1) ||
               cat.name.toLowerCase().indexOf(q) > -1 ||
               String(tx.amount).indexOf(q) > -1;
      });
    }

    if (state.filterAccount !== 'all') {
      filtered = filtered.filter(function(tx) {
        var acc = getAccountInfo(tx.account);
        return acc.type === state.filterAccount;
      });
    }

    return filtered.sort(function(a, b) { return b.createdAt - a.createdAt; });
  }

  // ============================================
  // UI Updates
  // ============================================
  function formatMoney(amount) {
    return '¥' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function updateDashboardStats() {
    var balance = getTotalBalance();
    var stats = getMonthStats();

    document.getElementById('totalBalance').textContent = formatMoney(balance);
    document.getElementById('monthIncome').textContent = formatMoney(stats.income);
    document.getElementById('monthExpense').textContent = formatMoney(stats.expense);

    // Budget usage
    var totalBudget = state.budgets.reduce(function(sum, b) { return sum + b.amount; }, 0);
    var totalSpent = state.budgets.reduce(function(sum, b) { return sum + getBudgetSpent(b); }, 0);
    var pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    document.getElementById('budgetUsage').textContent = pct + '%';

    var statusEl = document.getElementById('budgetStatus');
    if (pct >= 100) {
      statusEl.textContent = '已超支！';
      statusEl.style.color = 'var(--danger)';
    } else if (pct >= 80) {
      statusEl.textContent = '预算紧张';
      statusEl.style.color = 'var(--warning)';
    } else {
      statusEl.textContent = '预算充足';
      statusEl.style.color = 'var(--success)';
    }
  }

  function renderTransactionList(containerId, transactions, limit) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var txs = limit ? transactions.slice(0, limit) : transactions;

    if (txs.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">暂无账单记录</div></div>';
      return;
    }

    var html = '';
    txs.forEach(function(tx) {
      var cat = getCategoryInfo(tx.category, tx.type);
      var acc = getAccountInfo(tx.account);
      html += '<div class="tx-item" data-id="' + tx.id + '">' +
        '<div class="tx-icon ' + tx.type + '">' + cat.icon + '</div>' +
        '<div class="tx-info">' +
        '<div class="tx-category">' + cat.name + '</div>' +
        '<div class="tx-note">' + (tx.note || acc.name) + '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
        '<div class="tx-amount ' + tx.type + '">' + (tx.type === 'income' ? '+' : '-') + formatMoney(tx.amount).replace('¥', '¥') + '</div>' +
        '<div class="tx-date">' + tx.date + '</div>' +
        '</div>' +
        '<button class="tx-delete" onclick="event.stopPropagation();deleteTransaction(\'' + tx.id + '\')" title="删除">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        '</button>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  function renderCategoryGrid() {
    var container = document.getElementById('categoryGrid');
    if (!container) return;

    var cats = state.currentTxType === 'income' ? incomeCategories : expenseCategories;
    var html = '';
    cats.forEach(function(cat, i) {
      html += '<div class="category-item' + (state.selectedCategory === cat.id ? ' selected' : '') + '"' +
        ' onclick="selectCategory(\'' + cat.id + '\')">' +
        '<div class="category-icon">' + cat.icon + '</div>' +
        '<div class="category-name">' + cat.name + '</div>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  function renderAccountSelect() {
    var sel = document.getElementById('txAccount');
    var exportCat = document.getElementById('exportCategory');
    var budgetCat = document.getElementById('budgetCategory');

    if (sel) {
      sel.innerHTML = state.accounts.map(function(a) {
        return '<option value="' + a.id + '">' + a.name + ' (' + formatMoney(a.balance) + ')</option>';
      }).join('');
    }

    if (exportCat) {
      var allCats = expenseCategories.concat(incomeCategories);
      exportCat.innerHTML = '<option value="all">全部分类</option>' +
        allCats.map(function(c) { return '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>'; }).join('');
    }

    if (budgetCat) {
      budgetCat.innerHTML = expenseCategories.map(function(c) {
        return '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>';
      }).join('');
    }
  }

  function renderAccountsGrid() {
    var container = document.getElementById('accountsGrid');
    if (!container) return;

    var html = '';
    state.accounts.forEach(function(acc) {
      html += '<div class="account-card ' + acc.type + '">' +
        '<button class="account-delete-btn" onclick="deleteAccount(\'' + acc.id + '\')" title="删除账户">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        '</button>' +
        '<div class="account-type">' +
        '<span class="account-type-badge">' + getAccountTypeIcon(acc.type) + ' ' + getAccountTypeName(acc.type) + '</span>' +
        '</div>' +
        '<div>' +
        '<div class="account-balance-label">余额</div>' +
        '<div class="account-balance">' + formatMoney(acc.balance) + '</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div class="account-number">' + (acc.number || '•••• •••• •••• ••••') + '</div>' +
        '<div style="font-size:14px;font-weight:600;">' + acc.name + '</div>' +
        '</div>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  function deleteAccount(id) {
    var acc = state.accounts.find(function(a) { return a.id === id; });
    if (!acc) return;

    var txCount = state.transactions.filter(function(tx) { return tx.account === id; }).length;
    var msg = '确定要删除账户【' + acc.name + '】吗？';
    if (txCount > 0) {
      msg += '\n\n⚠️ 该账户下有 ' + txCount + ' 条交易记录，删除后这些记录将变为"未知账户"。';
    }
    if (acc.balance !== 0) {
      msg += '\n\n⚠️ 该账户当前余额为 ' + formatMoney(acc.balance) + '，删除后余额数据将丢失。';
    }
    if (!confirm(msg)) return;

    // Remove account
    state.accounts = state.accounts.filter(function(a) { return a.id !== id; });

    // Update transactions that used this account
    if (txCount > 0) {
      state.transactions.forEach(function(tx) {
        if (tx.account === id) {
          tx.account = 'deleted_' + id;
        }
      });
    }

    saveData();
    refreshAll();
    showToast('账户【' + acc.name + '】已删除', 'success');
  }

  function getAccountTypeIcon(type) {
    var icons = { cash: '💵', bank: '🏦', credit: '💳', alipay: '💙', wechat: '💚' };
    return icons[type] || '💰';
  }

  function getAccountTypeName(type) {
    var names = { cash: '现金', bank: '储蓄卡', credit: '信用卡', alipay: '支付宝', wechat: '微信钱包' };
    return names[type] || '账户';
  }

  function renderBudgetList() {
    var container = document.getElementById('budgetList');
    if (!container) return;

    if (state.budgets.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🎯</div><div class="empty-state-text">暂无预算，点击"新增预算"开始设置</div></div>';
      return;
    }

    var html = '';
    state.budgets.forEach(function(budget) {
      var cat = getCategoryInfo(budget.category, 'expense');
      var spent = getBudgetSpent(budget);
      var pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      var remaining = budget.amount - spent;
      var status = pct >= 100 ? 'danger' : (pct >= 80 ? 'warning' : 'safe');
      var periodName = budget.period === 'week' ? '每周' : (budget.period === 'year' ? '每年' : '每月');

      html += '<div class="budget-card">' +
        '<div class="budget-card-header">' +
        '<div class="budget-category">' +
        '<div class="budget-category-icon">' + cat.icon + '</div>' +
        '<div>' +
        '<div class="budget-category-name">' + cat.name + '</div>' +
        '<div style="font-size:12px;color:var(--muted);">' + periodName + '预算</div>' +
        '</div>' +
        '</div>' +
        '<button class="btn-icon" onclick="deleteBudget(\'' + budget.id + '\')" title="删除">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        '</button>' +
        '</div>' +
        '<div class="budget-amounts">' +
        '<span class="budget-spent">' + formatMoney(spent) + '</span>' +
        '<span class="budget-total">/ ' + formatMoney(budget.amount) + '</span>' +
        '</div>' +
        '<div class="budget-progress">' +
        '<div class="budget-progress-fill ' + status + '" style="width:' + Math.min(pct, 100) + '%"></div>' +
        '</div>' +
        '<div class="budget-remaining">' +
        (remaining >= 0 ? '剩余 ' + formatMoney(remaining) : '超支 ' + formatMoney(Math.abs(remaining))) +
        ' · ' + Math.round(pct) + '%' +
        '</div>' +
        (pct >= budget.alert ? '<div class="budget-alert">⚠️ 已使用 ' + Math.round(pct) + '%，注意控制支出</div>' : '') +
        '</div>';
    });
    container.innerHTML = html;
  }

  function updateStatsPage() {
    var period = state.currentStatPeriod;
    var data = getTrendData(period);

    var totalIncome = data.income.reduce(function(a, b) { return a + b; }, 0);
    var totalExpense = data.expense.reduce(function(a, b) { return a + b; }, 0);
    var count = state.transactions.filter(function(tx) {
      // rough count
      return true;
    }).length;

    document.getElementById('statTotalIncome').textContent = formatMoney(totalIncome);
    document.getElementById('statTotalExpense').textContent = formatMoney(totalExpense);
    document.getElementById('statBalance').textContent = formatMoney(totalIncome - totalExpense);
    document.getElementById('statCount').textContent = getFilteredTransactions().length;
  }

  function updateExportDates() {
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var startEl = document.getElementById('exportStartDate');
    var endEl = document.getElementById('exportEndDate');
    if (startEl) startEl.value = formatDate(monthStart);
    if (endEl) endEl.value = formatDate(now);
  }

  // ============================================
  // Actions
  // ============================================
  function addTransaction(tx) {
    // Update account balance
    var acc = state.accounts.find(function(a) { return a.id === tx.account; });
    if (acc) {
      if (tx.type === 'income') {
        acc.balance += tx.amount;
      } else {
        acc.balance -= tx.amount;
      }
    }

    state.transactions.unshift(tx);
    saveData();
    refreshAll();

    // Check budget alerts
    checkBudgetAlerts(tx);
  }

  function deleteTransaction(id) {
    if (!confirm('确定要删除这条账单吗？')) return;

    var idx = state.transactions.findIndex(function(tx) { return tx.id === id; });
    if (idx === -1) return;

    var tx = state.transactions[idx];

    // Revert account balance
    var acc = state.accounts.find(function(a) { return a.id === tx.account; });
    if (acc) {
      if (tx.type === 'income') {
        acc.balance -= tx.amount;
      } else {
        acc.balance += tx.amount;
      }
    }

    state.transactions.splice(idx, 1);
    saveData();
    refreshAll();
    showToast('账单已删除', 'success');
  }

  function checkBudgetAlerts(tx) {
    if (tx.type !== 'expense') return;

    state.budgets.forEach(function(budget) {
      if (budget.category !== tx.category) return;
      var spent = getBudgetSpent(budget);
      var pct = (spent / budget.amount) * 100;
      if (pct >= budget.alert && pct - (spent - tx.amount) / budget.amount * 100 < budget.alert) {
        var cat = getCategoryInfo(budget.category, 'expense');
        showToast('⚠️ ' + cat.name + '预算已使用 ' + Math.round(pct) + '%', 'warning');
      }
    });
  }

  function addAccount(account) {
    account.id = 'acc_' + Date.now();
    state.accounts.push(account);
    saveData();
    refreshAll();
    showToast('账户添加成功', 'success');
  }

  function addBudget(budget) {
    // Check if exists
    var existing = state.budgets.find(function(b) {
      return b.category === budget.category && b.period === budget.period;
    });
    if (existing) {
      existing.amount = budget.amount;
      existing.alert = budget.alert;
    } else {
      budget.id = 'b_' + Date.now();
      state.budgets.push(budget);
    }
    saveData();
    refreshAll();
    showToast('预算设置成功', 'success');
  }

  function deleteBudget(id) {
    if (!confirm('确定要删除这个预算吗？')) return;
    state.budgets = state.budgets.filter(function(b) { return b.id !== id; });
    saveData();
    refreshAll();
    showToast('预算已删除', 'success');
  }

  // ============================================
  // Export
  // ============================================
  function getFilteredForExport() {
    var startDate = document.getElementById('exportStartDate').value;
    var endDate = document.getElementById('exportEndDate').value;
    var typeFilter = document.getElementById('exportType').value;
    var catFilter = document.getElementById('exportCategory').value;

    return state.transactions.filter(function(tx) {
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (catFilter !== 'all' && tx.category !== catFilter) return false;
      return true;
    }).sort(function(a, b) { return a.date.localeCompare(b.date); });
  }

  function buildExportRows(filtered) {
    return filtered.map(function(tx) {
      var cat = getCategoryInfo(tx.category, tx.type);
      var acc = getAccountInfo(tx.account);
      return {
        date: tx.date,
        type: tx.type === 'income' ? '收入' : '支出',
        category: cat.icon + ' ' + cat.name,
        amount: tx.amount,
        account: acc.name,
        note: tx.note || ''
      };
    });
  }

  function exportToExcel() {
    var filtered = getFilteredForExport();
    if (filtered.length === 0) {
      showToast('没有符合条件的账单数据', 'warning');
      return;
    }

    var rows = buildExportRows(filtered);
    var stats = getMonthStats();
    var now = new Date();
    var startDate = document.getElementById('exportStartDate').value;
    var endDate = document.getElementById('exportEndDate').value;

    // Build Excel-compatible HTML with formatting
    var totalIncome = rows.filter(function(r) { return r.type === '收入'; }).reduce(function(s, r) { return s + r.amount; }, 0);
    var totalExpense = rows.filter(function(r) { return r.type === '支出'; }).reduce(function(s, r) { return s + r.amount; }, 0);

    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>账单明细</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    html += '<body>';

    // Title section
    html += '<table border="0" cellpadding="6" cellspacing="0" style="font-family:微软雅黑,sans-serif;">';
    html += '<tr><td colspan="6" style="font-size:20px;font-weight:bold;color:#1a1d23;">📊 智记账 - 账单导出报表</td></tr>';
    html += '<tr><td colspan="6" style="font-size:12px;color:#8b93a7;">导出周期：' + startDate + ' 至 ' + endDate + ' · 生成时间：' + now.toLocaleString('zh-CN') + '</td></tr>';
    html += '<tr><td colspan="6" style="height:10px;"></td></tr>';
    html += '<tr>';
    html += '<td style="background:#e6f8ee;padding:8px 16px;font-weight:bold;color:#15803d;">总收入</td>';
    html += '<td style="background:#e6f8ee;padding:8px 16px;color:#15803d;font-size:14px;">¥' + totalIncome.toFixed(2) + '</td>';
    html += '<td style="background:#fde8e8;padding:8px 16px;font-weight:bold;color:#dc2626;">总支出</td>';
    html += '<td style="background:#fde8e8;padding:8px 16px;color:#dc2626;font-size:14px;">¥' + totalExpense.toFixed(2) + '</td>';
    html += '<td style="background:#eef3ff;padding:8px 16px;font-weight:bold;color:#4f7cff;">结余</td>';
    html += '<td style="background:#eef3ff;padding:8px 16px;color:#4f7cff;font-size:14px;">¥' + (totalIncome - totalExpense).toFixed(2) + '</td>';
    html += '</tr>';
    html += '<tr><td colspan="6" style="height:16px;"></td></tr>';
    html += '</table>';

    // Data table
    html += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:微软雅黑,sans-serif;font-size:12px;width:100%;">';
    // Header row
    html += '<tr style="background:#4f7cff;color:#ffffff;font-weight:bold;">';
    html += '<th style="text-align:center;">日期</th>';
    html += '<th style="text-align:center;">类型</th>';
    html += '<th style="text-align:center;">分类</th>';
    html += '<th style="text-align:right;">金额</th>';
    html += '<th style="text-align:center;">账户</th>';
    html += '<th style="text-align:left;">备注</th>';
    html += '</tr>';

    // Data rows
    rows.forEach(function(r) {
      var typeColor = r.type === '收入' ? '#15803d' : '#dc2626';
      var amtPrefix = r.type === '收入' ? '+' : '-';
      html += '<tr>';
      html += '<td style="text-align:center;">' + r.date + '</td>';
      html += '<td style="text-align:center;color:' + typeColor + ';">' + r.type + '</td>';
      html += '<td style="text-align:center;">' + r.category + '</td>';
      html += '<td style="text-align:right;color:' + typeColor + ';font-weight:bold;">' + amtPrefix + '¥' + r.amount.toFixed(2) + '</td>';
      html += '<td style="text-align:center;">' + r.account + '</td>';
      html += '<td style="text-align:left;">' + (r.note || '-') + '</td>';
      html += '</tr>';
    });

    // Footer row
    html += '<tr style="background:#f0f2f5;font-weight:bold;">';
    html += '<td colspan="3" style="text-align:right;">合计 (' + rows.length + ' 笔)</td>';
    html += '<td colspan="3" style="text-align:left;">收入 ¥' + totalIncome.toFixed(2) + ' · 支出 ¥' + totalExpense.toFixed(2) + ' · 结余 ¥' + (totalIncome - totalExpense).toFixed(2) + '</td>';
    html += '</tr>';

    html += '</table>';
    html += '<p style="font-family:微软雅黑,sans-serif;font-size:11px;color:#8b93a7;margin-top:20px;text-align:center;">—— 由智记账 (Smart Ledger) 生成 ——</p>';
    html += '</body></html>';

    var blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '账单_' + formatDate(new Date()) + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 100);

    showToast('Excel 导出成功（共 ' + rows.length + ' 条记录）', 'success');
  }

  function exportToJSON() {
    var data = {
      exportDate: new Date().toISOString(),
      transactions: state.transactions,
      accounts: state.accounts,
      budgets: state.budgets
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '智能记账_备份_' + formatDate(new Date()) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function doExport() {
    if (state.exportFormat === 'excel') {
      exportToExcel();
    } else {
      generatePDFReport();
    }
  }

  function buildPDFReportHtml() {
    var filtered = getFilteredForExport();
    var rows = buildExportRows(filtered);
    var catData = getExpenseByCategory();
    var now = new Date();
    var startDate = document.getElementById('exportStartDate').value;
    var endDate = document.getElementById('exportEndDate').value;

    var totalIncome = rows.filter(function(r) { return r.type === '收入'; }).reduce(function(s, r) { return s + r.amount; }, 0);
    var totalExpense = rows.filter(function(r) { return r.type === '支出'; }).reduce(function(s, r) { return s + r.amount; }, 0);
    var totalExp = catData.reduce(function(s, c) { return s + c.amount; }, 0);

    var html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    html += '<title>智记账 - 账单报表</title>';
    html += '<style>';
    html += '*{margin:0;padding:0;box-sizing:border-box;}';
    html += 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;padding:40px;color:#1a1d23;background:#fff;}';
    html += '.report-header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #4f7cff;}';
    html += '.report-header h1{font-size:26px;margin-bottom:8px;color:#1a1d23;}';
    html += '.report-header .subtitle{color:#8b93a7;font-size:13px;}';
    html += '.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:30px;}';
    html += '.stat{background:#f7f8fa;padding:20px;border-radius:8px;text-align:center;}';
    html += '.stat-label{font-size:13px;color:#8b93a7;margin-bottom:8px;}';
    html += '.stat-value{font-size:24px;font-weight:700;}';
    html += '.stat.income .stat-value{color:#22c55e;}';
    html += '.stat.expense .stat-value{color:#ef4444;}';
    html += '.stat.balance .stat-value{color:#4f7cff;}';
    html += 'h2{font-size:18px;margin:30px 0 12px;padding-bottom:8px;border-bottom:2px solid #4f7cff;display:inline-block;color:#1a1d23;}';
    html += 'table{width:100%;border-collapse:collapse;margin-top:12px;}';
    html += 'th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e5e8ef;font-size:13px;}';
    html += 'th{background:#f0f2f5;font-weight:600;color:#1a1d23;}';
    html += 'tr:hover{background:#f7f8fa;}';
    html += '.amt-income{color:#22c55e;font-weight:600;}';
    html += '.amt-expense{color:#ef4444;font-weight:600;}';
    html += '.bar-container{width:100%;height:24px;background:#f0f2f5;border-radius:4px;overflow:hidden;position:relative;}';
    html += '.bar-fill{height:100%;border-radius:4px;display:flex;align-items:center;padding-left:8px;color:white;font-size:11px;font-weight:600;}';
    html += '.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e5e8ef;color:#8b93a7;font-size:12px;}';
    html += '.actions{position:fixed;top:20px;right:20px;display:flex;gap:10px;}';
    html += '.btn{padding:10px 20px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.15s;}';
    html += '.btn-print{background:#4f7cff;color:white;}';
    html += '.btn-print:hover{background:#3d6bf0;}';
    html += '.btn-download{background:#22c55e;color:white;}';
    html += '.btn-download:hover{background:#16a34a;}';
    html += '@media print{.actions{display:none;}body{padding:20px;}}';
    html += '</style></head><body>';

    // Action buttons
    html += '<div class="actions">';
    html += '<button class="btn btn-download" onclick="downloadHTML()">下载HTML</button>';
    html += '<button class="btn btn-print" onclick="window.print()">打印 / 保存PDF</button>';
    html += '</div>';

    // Header
    html += '<div class="report-header">';
    html += '<h1>📊 智记账 - 账单报表</h1>';
    html += '<p class="subtitle">报表周期：' + startDate + ' 至 ' + endDate + ' · 生成时间：' + now.toLocaleString('zh-CN') + ' · 共 ' + rows.length + ' 条记录</p>';
    html += '</div>';

    // Stats
    html += '<div class="stats">';
    html += '<div class="stat income"><div class="stat-label">总收入</div><div class="stat-value">¥' + totalIncome.toFixed(2) + '</div></div>';
    html += '<div class="stat expense"><div class="stat-label">总支出</div><div class="stat-value">¥' + totalExpense.toFixed(2) + '</div></div>';
    html += '<div class="stat balance"><div class="stat-label">结余</div><div class="stat-value">¥' + (totalIncome - totalExpense).toFixed(2) + '</div></div>';
    html += '</div>';

    // Category breakdown
    if (catData.length > 0) {
      html += '<h2>📋 支出分类明细</h2>';
      html += '<table><thead><tr><th>分类</th><th>金额</th><th>占比</th><th style="width:30%;">可视化</th></tr></thead><tbody>';
      catData.forEach(function(cat) {
        var pct = totalExp > 0 ? ((cat.amount / totalExp) * 100) : 0;
        var colors = ['#4f7cff','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1','#14b8a6','#a855f7'];
        var colorIdx = expenseCategories.findIndex(function(c) { return c.id === cat.id; });
        var color = colors[colorIdx % colors.length];
        html += '<tr>';
        html += '<td>' + cat.icon + ' ' + cat.name + '</td>';
        html += '<td>¥' + cat.amount.toFixed(2) + '</td>';
        html += '<td>' + pct.toFixed(1) + '%</td>';
        html += '<td><div class="bar-container"><div class="bar-fill" style="width:' + Math.max(pct, 3) + '%;background:' + color + ';">' + pct.toFixed(0) + '%</div></div></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }

    // Transaction details
    html += '<h2>📝 账单明细</h2>';
    html += '<table><thead><tr><th>日期</th><th>类型</th><th>分类</th><th style="text-align:right;">金额</th><th>账户</th><th>备注</th></tr></thead><tbody>';
    rows.forEach(function(r) {
      var amtClass = r.type === '收入' ? 'amt-income' : 'amt-expense';
      var amtPrefix = r.type === '收入' ? '+' : '-';
      html += '<tr>';
      html += '<td>' + r.date + '</td>';
      html += '<td>' + r.type + '</td>';
      html += '<td>' + r.category + '</td>';
      html += '<td style="text-align:right;" class="' + amtClass + '">' + amtPrefix + '¥' + r.amount.toFixed(2) + '</td>';
      html += '<td>' + r.account + '</td>';
      html += '<td>' + (r.note || '-') + '</td>';
      html += '</tr>';
    });
    // Footer row
    html += '<tr style="background:#f0f2f5;font-weight:700;">';
    html += '<td colspan="3">合计 (' + rows.length + ' 笔)</td>';
    html += '<td style="text-align:right;">收入 ¥' + totalIncome.toFixed(2) + ' / 支出 ¥' + totalExpense.toFixed(2) + '</td>';
    html += '<td colspan="2">结余 ¥' + (totalIncome - totalExpense).toFixed(2) + '</td>';
    html += '</tr>';
    html += '</tbody></table>';

    html += '<div class="footer">—— 由智记账 (Smart Ledger) 生成 · ' + now.toLocaleString('zh-CN') + ' ——</div>';

    // Download script
    html += '<script>';
    html += 'function downloadHTML(){';
    html += 'var html=document.documentElement.outerHTML;';
    html += 'var blob=new Blob([html],{type:"text/html;charset=utf-8;"});';
    html += 'var url=URL.createObjectURL(blob);';
    html += 'var a=document.createElement("a");a.href=url;a.download="智记账_报表_' + formatDate(now) + '.html";';
    html += 'document.body.appendChild(a);a.click();document.body.removeChild(a);';
    html += 'setTimeout(function(){URL.revokeObjectURL(url);},100);';
    html += '}<\/script>';

    html += '</body></html>';

    return html;
  }

  function generatePDFReport() {
    var filtered = getFilteredForExport();
    if (filtered.length === 0) {
      showToast('没有符合条件的账单数据', 'warning');
      return;
    }

    var html = buildPDFReportHtml();

    // Use Blob URL to avoid popup blocker
    var blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    var url = URL.createObjectURL(blob);

    var w = window.open(url, '_blank');
    if (!w) {
      // Fallback: if popup blocked, download the HTML file
      var a = document.createElement('a');
      a.href = url;
      a.download = '智记账_报表_' + formatDate(new Date()) + '.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('弹窗被拦截，已下载 HTML 报表文件', 'warning');
    } else {
      showToast('PDF 报表已生成，点击"打印/保存PDF"导出', 'success');
    }

    // Revoke URL after delay to allow page to load
    setTimeout(function() { URL.revokeObjectURL(url); }, 10000);
  }

  // ============================================
  // Backup & Restore
  // ============================================
  function backupData() {
    exportToJSON();
    showToast('数据备份成功', 'success');
  }

  function restoreData() {
    document.getElementById('restoreFileInput').click();
  }

  function handleRestoreFile(event) {
    var file = event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        if (data.transactions && data.accounts) {
          if (!confirm('恢复备份将覆盖现有数据，确定继续吗？')) return;
          state.transactions = data.transactions;
          state.accounts = data.accounts;
          state.budgets = data.budgets || [];
          saveData();
          refreshAll();
          showToast('数据恢复成功', 'success');
        } else {
          showToast('备份文件格式不正确', 'error');
        }
      } catch (err) {
        showToast('文件解析失败', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function clearAllData() {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return;
    if (!confirm('再次确认：所有账单、账户、预算数据都将被清除！')) return;

    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  // ============================================
  // Toast
  // ============================================
  function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    var icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : (type === 'warning' ? '⚠' : 'ℹ'));
    toast.innerHTML = '<span style="font-weight:bold;">' + icon + '</span> ' + message;
    container.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
  }

  // ============================================
  // Page Navigation
  // ============================================
  function switchPage(pageName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(function(item) {
      item.classList.remove('active');
      if (item.dataset.page === pageName) item.classList.add('active');
    });

    // Update page
    document.querySelectorAll('.page').forEach(function(p) {
      p.classList.remove('active');
    });
    var page = document.getElementById('page-' + pageName);
    if (page) page.classList.add('active');

    // Update title
    var titles = {
      dashboard: '仪表盘',
      statistics: '统计报表',
      budget: '预算管理',
      accounts: '账户管理',
      export: '账单导出',
      settings: '设置'
    };
    document.getElementById('pageTitle').textContent = titles[pageName] || '';

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');

    // Refresh charts if needed
    if (pageName === 'statistics') {
      setTimeout(function() {
        if (window.LedgerCharts) {
          // Resize first since charts were init when container was hidden
          window.LedgerCharts.resizeStats();
          window.LedgerCharts.updateCompare(state.currentStatPeriod);
          window.LedgerCharts.refreshCategory();
        }
        updateStatsPage();
        renderTransactionList('statTxList', getFilteredTransactions());
      }, 100);
    } else if (pageName === 'accounts') {
      renderTransactionList('accountTxList', getFilteredTransactions());
    }
  }

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
  }

  // ============================================
  // Modal Handlers
  // ============================================
  function openQuickAdd() {
    state.currentTxType = 'expense';
    state.selectedCategory = null;
    document.getElementById('txAmount').value = '';
    document.getElementById('txNote').value = '';
    document.getElementById('txDate').value = formatDate(new Date());

    // Set default category
    var defaultCat = expenseCategories[0];
    state.selectedCategory = defaultCat.id;

    renderCategoryGrid();
    renderAccountSelect();

    document.getElementById('quickAddModal').classList.add('show');
    setTimeout(function() { document.getElementById('txAmount').focus(); }, 100);
  }

  function closeQuickAdd() {
    document.getElementById('quickAddModal').classList.remove('show');
  }

  function setTxType(type, btn) {
    state.currentTxType = type;
    state.selectedCategory = null;

    // Update toggle
    var toggle = btn.parentElement;
    toggle.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');

    // Set default category
    var cats = type === 'income' ? incomeCategories : expenseCategories;
    state.selectedCategory = cats[0].id;

    renderCategoryGrid();
  }

  function selectCategory(catId) {
    state.selectedCategory = catId;
    renderCategoryGrid();
  }

  function saveTransaction() {
    var amount = parseFloat(document.getElementById('txAmount').value);
    if (!amount || amount <= 0) {
      showToast('请输入有效金额', 'error');
      return;
    }
    if (!state.selectedCategory) {
      showToast('请选择分类', 'error');
      return;
    }

    var tx = {
      id: genId(),
      type: state.currentTxType,
      category: state.selectedCategory,
      amount: amount,
      account: document.getElementById('txAccount').value,
      date: document.getElementById('txDate').value,
      note: document.getElementById('txNote').value.trim(),
      createdAt: Date.now()
    };

    addTransaction(tx);
    closeQuickAdd();
    showToast('记账成功', 'success');
  }

  function openBudgetModal() {
    document.getElementById('budgetModalTitle').textContent = '新增预算';
    document.getElementById('budgetAmount').value = '';
    document.getElementById('budgetCategory').value = expenseCategories[0].id;
    document.getElementById('budgetPeriod').value = 'month';
    document.getElementById('budgetAlert').value = '80';
    document.getElementById('budgetModal').classList.add('show');
  }

  function closeBudgetModal() {
    document.getElementById('budgetModal').classList.remove('show');
  }

  function saveBudget() {
    var amount = parseFloat(document.getElementById('budgetAmount').value);
    if (!amount || amount <= 0) {
      showToast('请输入有效预算金额', 'error');
      return;
    }

    var budget = {
      category: document.getElementById('budgetCategory').value,
      amount: amount,
      period: document.getElementById('budgetPeriod').value,
      alert: parseInt(document.getElementById('budgetAlert').value)
    };

    addBudget(budget);
    closeBudgetModal();
  }

  function openAccountModal() {
    document.getElementById('accountModalTitle').textContent = '新增账户';
    document.getElementById('accountName').value = '';
    document.getElementById('accountType').value = 'bank';
    document.getElementById('accountBalance').value = '';
    document.getElementById('accountNumber').value = '';
    document.getElementById('accountModal').classList.add('show');
  }

  function closeAccountModal() {
    document.getElementById('accountModal').classList.remove('show');
  }

  function saveAccount() {
    var name = document.getElementById('accountName').value.trim();
    if (!name) {
      showToast('请输入账户名称', 'error');
      return;
    }

    var account = {
      name: name,
      type: document.getElementById('accountType').value,
      balance: parseFloat(document.getElementById('accountBalance').value) || 0,
      number: document.getElementById('accountNumber').value.trim()
    };

    addAccount(account);
    closeAccountModal();
  }

  // ============================================
  // Other Handlers
  // ============================================
  function setTrendPeriod(period, btn) {
    state.currentTrendPeriod = period;
    window.currentTrendPeriod = period;
    var group = btn.parentElement;
    group.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');

    if (window.LedgerCharts) {
      window.LedgerCharts.updateTrend(period);
    }
  }

  function setStatPeriod(period, btn) {
    state.currentStatPeriod = period;
    window.currentStatPeriod = period;
    var group = btn.parentElement;
    group.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');

    if (window.LedgerCharts) {
      window.LedgerCharts.updateCompare(period);
    }
    updateStatsPage();
  }

  function selectExportFormat(format, el) {
    state.exportFormat = format;
    document.querySelectorAll('.export-option').forEach(function(o) { o.classList.remove('selected'); });
    el.classList.add('selected');
  }

  function filterByAccount(type, btn) {
    state.filterAccount = type;
    var group = btn.parentElement;
    group.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');

    renderTransactionList('accountTxList', getFilteredTransactions());
  }

  function filterTransactions(query) {
    state.searchQuery = query;
    renderTransactionList('recentTxList', getFilteredTransactions(), 10);
    renderTransactionList('statTxList', getFilteredTransactions());
    renderTransactionList('accountTxList', getFilteredTransactions());
  }

  function updateSyncStatus() {
    var statusEl = document.getElementById('syncStatus');
    if (!statusEl) return;
    var toggles = document.querySelectorAll('.toggle');
    var firstToggle = toggles[0];
    if (firstToggle && firstToggle.classList.contains('on')) {
      statusEl.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>云同步已开启 · 上次同步: 刚刚</span>';
      statusEl.style.background = 'var(--success-light)';
      statusEl.style.color = '#15803d';
    } else {
      statusEl.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>云同步已关闭</span>';
      statusEl.style.background = 'var(--bg3)';
      statusEl.style.color = 'var(--muted)';
    }
  }

  function previewExport() {
    var filtered = getFilteredForExport();
    if (filtered.length === 0) {
      showToast('没有符合条件的账单数据', 'warning');
      return;
    }

    var rows = buildExportRows(filtered);
    var totalIncome = rows.filter(function(r) { return r.type === '收入'; }).reduce(function(s, r) { return s + r.amount; }, 0);
    var totalExpense = rows.filter(function(r) { return r.type === '支出'; }).reduce(function(s, r) { return s + r.amount; }, 0);
    var formatName = state.exportFormat === 'excel' ? 'Excel' : 'PDF';
    var startDate = document.getElementById('exportStartDate').value;
    var endDate = document.getElementById('exportEndDate').value;

    var html = '<div class="modal-overlay show" id="previewModal" style="align-items:flex-start;padding-top:40px;overflow-y:auto;">' +
      '<div class="modal" style="width:800px;max-width:95vw;">' +
      '<div class="modal-header">' +
      '<h3 class="modal-title">导出预览 (' + formatName + ')</h3>' +
      '<button class="modal-close" onclick="closePreview()">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      '</div>' +
      '<div class="modal-body">';

    // Summary
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">';
    html += '<div style="background:#e6f8ee;padding:14px;border-radius:8px;text-align:center;">';
    html += '<div style="font-size:12px;color:#8b93a7;">总收入</div>';
    html += '<div style="font-size:18px;font-weight:700;color:#22c55e;font-family:JetBrainsMono,monospace;">¥' + totalIncome.toFixed(2) + '</div></div>';
    html += '<div style="background:#fde8e8;padding:14px;border-radius:8px;text-align:center;">';
    html += '<div style="font-size:12px;color:#8b93a7;">总支出</div>';
    html += '<div style="font-size:18px;font-weight:700;color:#ef4444;font-family:JetBrainsMono,monospace;">¥' + totalExpense.toFixed(2) + '</div></div>';
    html += '<div style="background:#eef3ff;padding:14px;border-radius:8px;text-align:center;">';
    html += '<div style="font-size:12px;color:#8b93a7;">结余</div>';
    html += '<div style="font-size:18px;font-weight:700;color:#4f7cff;font-family:JetBrainsMono,monospace;">¥' + (totalIncome - totalExpense).toFixed(2) + '</div></div>';
    html += '</div>';

    // Period info
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;font-size:13px;color:#8b93a7;">';
    html += '<span>周期：' + startDate + ' 至 ' + endDate + '</span>';
    html += '<span>共 ' + rows.length + ' 条记录</span>';
    html += '</div>';

    // Preview table (show first 20 rows)
    var previewRows = rows.slice(0, 20);
    html += '<div style="border:1px solid var(--rule);border-radius:8px;overflow:hidden;max-height:400px;overflow-y:auto;">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
    html += '<thead><tr style="background:#f0f2f5;position:sticky;top:0;">';
    html += '<th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--rule);">日期</th>';
    html += '<th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--rule);">类型</th>';
    html += '<th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--rule);">分类</th>';
    html += '<th style="padding:10px 12px;text-align:right;border-bottom:1px solid var(--rule);">金额</th>';
    html += '<th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--rule);">账户</th>';
    html += '<th style="padding:10px 12px;text-align:left;border-bottom:1px solid var(--rule);">备注</th>';
    html += '</tr></thead><tbody>';

    previewRows.forEach(function(r) {
      var typeColor = r.type === '收入' ? 'var(--success)' : 'var(--danger)';
      var amtPrefix = r.type === '收入' ? '+' : '-';
      html += '<tr>';
      html += '<td style="padding:8px 12px;border-bottom:1px solid var(--rule);">' + r.date + '</td>';
      html += '<td style="padding:8px 12px;border-bottom:1px solid var(--rule);color:' + typeColor + ';">' + r.type + '</td>';
      html += '<td style="padding:8px 12px;border-bottom:1px solid var(--rule);">' + r.category + '</td>';
      html += '<td style="padding:8px 12px;border-bottom:1px solid var(--rule);text-align:right;color:' + typeColor + ';font-weight:600;font-family:JetBrainsMono,monospace;">' + amtPrefix + '¥' + r.amount.toFixed(2) + '</td>';
      html += '<td style="padding:8px 12px;border-bottom:1px solid var(--rule);">' + r.account + '</td>';
      html += '<td style="padding:8px 12px;border-bottom:1px solid var(--rule);color:var(--muted);">' + (r.note || '-') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';

    if (rows.length > 20) {
      html += '<p style="text-align:center;color:var(--muted);font-size:12px;margin-top:12px;">仅显示前 20 条，共 ' + rows.length + ' 条记录</p>';
    }

    html += '</div>';
    html += '<div class="modal-footer">';
    html += '<button class="btn btn-secondary" onclick="closePreview()">关闭</button>';
    html += '<button class="btn btn-primary" onclick="closePreview();doExport();">确认导出</button>';
    html += '</div>';
    html += '</div></div>';

    // Remove existing preview modal if any
    var existing = document.getElementById('previewModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', html);

    // Close on overlay click
    var modal = document.getElementById('previewModal');
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closePreview();
    });
  }

  function closePreview() {
    var modal = document.getElementById('previewModal');
    if (modal) modal.remove();
  }

  function updateStats() {
    updateStatsPage();
    if (window.LedgerCharts) {
      window.LedgerCharts.refreshAll();
    }
  }

  // ============================================
  // Refresh Everything
  // ============================================
  function refreshAll() {
    updateDashboardStats();
    renderTransactionList('recentTxList', getFilteredTransactions(), 10);
    renderAccountsGrid();
    renderBudgetList();
    renderAccountSelect();
    updateExportDates();

    if (window.LedgerCharts) {
      window.LedgerCharts.refreshAll();
    }
  }

  // ============================================
  // Public API
  // ============================================
  window.LedgerData = {
    getTrendData: getTrendData,
    getExpenseByCategory: getExpenseByCategory,
    getCategoryInfo: getCategoryInfo,
    getAccountInfo: getAccountInfo,
    getFilteredTransactions: getFilteredTransactions,
    transactions: function() { return state.transactions; }
  };

  // Expose functions globally for inline handlers
  window.switchPage = switchPage;
  window.toggleSidebar = toggleSidebar;
  window.openQuickAdd = openQuickAdd;
  window.closeQuickAdd = closeQuickAdd;
  window.setTxType = setTxType;
  window.selectCategory = selectCategory;
  window.saveTransaction = saveTransaction;
  window.deleteTransaction = deleteTransaction;
  window.openBudgetModal = openBudgetModal;
  window.closeBudgetModal = closeBudgetModal;
  window.saveBudget = saveBudget;
  window.deleteBudget = deleteBudget;
  window.openAccountModal = openAccountModal;
  window.closeAccountModal = closeAccountModal;
  window.saveAccount = saveAccount;
  window.deleteAccount = deleteAccount;
  window.setTrendPeriod = setTrendPeriod;
  window.setStatPeriod = setStatPeriod;
  window.selectExportFormat = selectExportFormat;
  window.doExport = doExport;
  window.previewExport = previewExport;
  window.closePreview = closePreview;
  window.filterByAccount = filterByAccount;
  window.filterTransactions = filterTransactions;
  window.backupData = backupData;
  window.restoreData = restoreData;
  window.handleRestoreFile = handleRestoreFile;
  window.clearAllData = clearAllData;
  window.updateSyncStatus = updateSyncStatus;
  window.updateStats = updateStats;
  window.showToast = showToast;

  // ============================================
  // Init
  // ============================================
  document.addEventListener('DOMContentLoaded', function() {
    loadData();

    // Set default date
    var txDate = document.getElementById('txDate');
    if (txDate) txDate.value = formatDate(new Date());

    var statDate = document.getElementById('statDate');
    if (statDate) statDate.value = formatDate(new Date());

    // Init charts
    if (window.LedgerCharts) {
      window.LedgerCharts.init();
    }

    refreshAll();

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          overlay.classList.remove('show');
        }
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.show').forEach(function(m) {
          m.classList.remove('show');
        });
      }
      // N to quick add
      if (e.key === 'n' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        openQuickAdd();
      }
    });
  });

})();
