/* ========================================
   记一笔 · Day 1 MVP
   解析器 + 本地存储 + UI 渲染
   ======================================== */

(function () {
  "use strict";

  // ===== 分类关键词映射 =====
  var CATEGORY_KEYWORDS = {
    "餐饮": ["午饭", "晚饭", "早饭", "早餐", "午餐", "晚餐", "饭", "吃", "餐", "面", "粉",
      "星巴克", "咖啡", "奶茶", "茶", "果汁", "饮料", "外卖", "美团", "饿了么",
      "麦当劳", "肯德基", "火锅", "烧烤", "串", "小吃", "零食", "甜品", "蛋糕",
      "啤酒", "水果", "菜", "饺", "包", "饼", "米", "粥", "汤"],
    "交通": ["打车", "滴滴", "地铁", "公交", "出租车", "高铁", "火车", "飞机", "机票",
      "停车", "加油", "油费", "充电", "骑行", "单车", "共享", "车费", "过路"],
    "购物": ["买", "衣服", "鞋", "裤", "衫", "包", "书", "笔", "用品", "超市",
      "京东", "淘宝", "天猫", "拼多多", "电器", "手机", "电脑", "数码", "配件"],
    "娱乐": ["电影", "游戏", "KTV", "唱歌", "演唱会", "旅游", "景点", "门票",
      "剧本", "密室", "酒吧", "按摩", "健身", "瑜伽"],
    "居家": ["房租", "水费", "电费", "燃气", "物业", "网费", "宽带", "保洁",
      "纸巾", "洗衣", "洗发", "沐浴", "牙膏"],
    "医疗": ["药", "医院", "看病", "体检", "挂号", "诊所", "牙科", "眼科"]
  };

  var CATEGORY_ICONS = {
    "餐饮": "🍜", "交通": "🚗", "购物": "🛍", "娱乐": "🎮",
    "居家": "🏠", "医疗": "💊", "其他": "📝"
  };

  // ===== 解析器 =====
  function parseInput(text) {
    text = (text || "").trim();
    if (!text) return null;

    // 提取金额：支持 25 / 25.5 / 25元 / 25块钱 / ¥25 / 花25 / 花了25
    var amountMatch = text.match(/(?:¥|￥|花(?:了)?|花了)?(\d+(?:\.\d{1,2})?)\s*(?:元|块钱|块)?/);
    if (!amountMatch) return null;

    var amount = parseFloat(amountMatch[1]);
    if (isNaN(amount) || amount <= 0) return null;

    // 提取描述：去掉金额部分，去掉花/花了/元/块等修饰词
    var desc = text
      .replace(/¥|￥/g, "")
      .replace(/花(?:了)?/g, "")
      .replace(/\d+(?:\.\d{1,2})?\s*(?:元|块钱|块)?/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!desc) desc = "支出";

    // 分类：关键词匹配
    var category = matchCategory(desc);

    return {
      description: desc,
      amount: amount,
      category: category,
      date: new Date().toISOString()
    };
  }

  function matchCategory(desc) {
    for (var cat in CATEGORY_KEYWORDS) {
      var keywords = CATEGORY_KEYWORDS[cat];
      for (var i = 0; i < keywords.length; i++) {
        if (desc.indexOf(keywords[i]) !== -1) {
          return cat;
        }
      }
    }
    return "其他";
  }

  // ===== 存储 =====
  var STORAGE_KEY = "jiyibi_records";

  function loadRecords() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function addRecord(record) {
    var records = loadRecords();
    records.push(record);
    saveRecords(records);
  }

  function deleteRecord(index) {
    var records = loadRecords();
    records.splice(index, 1);
    saveRecords(records);
  }

  function clearRecords() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ===== UI =====
  var pendingRecord = null;

  var els = {
    input: document.getElementById("recordInput"),
    parseBtn: document.getElementById("parseBtn"),
    preview: document.getElementById("parsePreview"),
    previewDesc: document.getElementById("previewDesc"),
    previewAmount: document.getElementById("previewAmount"),
    previewCategory: document.getElementById("previewCategory"),
    previewDate: document.getElementById("previewDate"),
    confirmBtn: document.getElementById("confirmBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
    parseError: document.getElementById("parseError"),
    todayTotal: document.getElementById("todayTotal"),
    todayCount: document.getElementById("todayCount"),
    monthTotal: document.getElementById("monthTotal"),
    recordsList: document.getElementById("recordsList"),
    clearBtn: document.getElementById("clearBtn"),
    insightContent: document.getElementById("insightContent"),
    insightPeriod: document.getElementById("insightPeriod")
  };

  function handleParse() {
    var text = els.input.value.trim();
    if (!text) return;

    var record = parseInput(text);
    hideError();

    if (!record) {
      showError();
      return;
    }

    pendingRecord = record;
    showPreview(record);
  }

  function showPreview(record) {
    els.previewDesc.textContent = record.description;
    els.previewAmount.textContent = "¥" + record.amount.toFixed(2);
    els.previewCategory.textContent = record.category;
    els.previewDate.textContent = formatDate(record.date);
    els.preview.style.display = "block";
  }

  function hidePreview() {
    els.preview.style.display = "none";
    pendingRecord = null;
  }

  function showError() {
    els.parseError.style.display = "block";
    setTimeout(hideError, 3000);
  }

  function hideError() {
    els.parseError.style.display = "none";
  }

  function handleConfirm() {
    if (!pendingRecord) return;
    addRecord(pendingRecord);
    hidePreview();
    els.input.value = "";
    els.input.focus();
    render();
    showToast("记好了");
  }

  function handleCancel() {
    hidePreview();
    els.input.value = "";
    els.input.focus();
  }

  function handleDelete(index) {
    deleteRecord(index);
    render();
    showToast("已删除");
  }

  function handleClear() {
    if (loadRecords().length === 0) return;
    if (confirm("确定清空所有记录吗？")) {
      clearRecords();
      render();
      showToast("已清空");
    }
  }

  // ===== 洞察生成 =====

  // 获取本周记录
  function getWeekRecords(records) {
    var now = new Date();
    var dayOfWeek = now.getDay() || 7; // 周日=7
    var monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);

    return records.filter(function (r) {
      return new Date(r.date) >= monday;
    });
  }

  // 按分类聚合
  function aggregateByCategory(records) {
    var map = {};
    var total = 0;
    for (var i = 0; i < records.length; i++) {
      var cat = records[i].category;
      var amt = records[i].amount;
      if (!map[cat]) map[cat] = { amount: 0, count: 0 };
      map[cat].amount += amt;
      map[cat].count++;
      total += amt;
    }
    // 转为数组并排序
    var arr = [];
    for (var c in map) {
      arr.push({
        category: c,
        amount: map[c].amount,
        count: map[c].count,
        percent: total > 0 ? (map[c].amount / total * 100) : 0
      });
    }
    arr.sort(function (a, b) { return b.amount - a.amount; });
    return { categories: arr, total: total };
  }

  // 生成 AI 点评（规则引擎模拟）
  function generateCommentary(weekRecords, agg) {
    if (weekRecords.length === 0) return null;

    var top = agg.categories[0];
    var parts = [];
    var tags = [];

    // 主类别分析
    if (top.category === "餐饮" && top.percent > 40) {
      // 检查是否有奶茶/咖啡/外卖
      var teaCount = 0, coffeeCount = 0, takeoutCount = 0;
      for (var i = 0; i < weekRecords.length; i++) {
        var desc = weekRecords[i].description;
        if (desc.indexOf("奶茶") !== -1) teaCount++;
        if (desc.indexOf("咖啡") !== -1 || desc.indexOf("星巴克") !== -1) coffeeCount++;
        if (desc.indexOf("外卖") !== -1 || desc.indexOf("美团") !== -1 || desc.indexOf("饿了么") !== -1) takeoutCount++;
      }
      var teaTotal = teaCount + coffeeCount;
      var teaRatio = top.count > 0 ? Math.round(teaTotal / top.count * 100) : 0;
      if (teaTotal > 0) {
        parts.push("餐饮占比偏高，<strong>饮品浓度 " + teaRatio + "%</strong>");
        if (coffeeCount > 0) parts.push("拿铁因子贡献了 " + coffeeCount + " 笔");
        if (teaCount > 0) tags.push("奶茶爱好者");
        if (coffeeCount > 0) tags.push("咖啡续命");
      } else {
        parts.push("餐饮占比 <strong>" + Math.round(top.percent) + "%</strong>，是本周最大开支");
      }
      if (takeoutCount >= 2) {
        parts.push("外卖 " + takeoutCount + " 次，要不要试试自己做饭？");
        tags.push("外卖达人");
      }
    } else if (top.category === "交通" && top.percent > 30) {
      var taxiCount = 0;
      for (var i = 0; i < weekRecords.length; i++) {
        var desc = weekRecords[i].description;
        if (desc.indexOf("打车") !== -1 || desc.indexOf("滴滴") !== -1) taxiCount++;
      }
      if (taxiCount > 0) {
        parts.push("交通占比 <strong>" + Math.round(top.percent) + "%</strong>，打车 " + taxiCount + " 次");
        tags.push("打车星人");
      } else {
        parts.push("交通支出 <strong>¥" + top.amount.toFixed(0) + "</strong>，通勤成本不低");
      }
    } else if (top.category === "购物" && top.percent > 30) {
      parts.push("购物花了 <strong>¥" + top.amount.toFixed(0) + "</strong>，占比 " + Math.round(top.percent) + "%");
      tags.push("剁手党");
    } else {
      parts.push(top.category + "是本周最大开支，花了 <strong>¥" + top.amount.toFixed(0) + "</strong>");
    }

    // 第二类别对比
    if (agg.categories.length >= 2) {
      var second = agg.categories[1];
      if (second.percent > 20) {
        parts.push(second.category + "紧随其后占 " + Math.round(second.percent) + "%");
      }
    }

    // 笔数评价
    if (weekRecords.length >= 10) {
      parts.push("本周记了 " + weekRecords.length + " 笔，数据越来越有看头了");
      tags.push("记账勤快人");
    } else if (weekRecords.length >= 5) {
      tags.push("稳步记录中");
    }

    // 通用标签
    if (tags.length === 0) {
      tags.push("理性消费者");
    }

    return {
      comment: parts.join("，") + "。",
      tags: tags
    };
  }

  // 获取上周记录
  function getLastWeekRecords(records) {
    var now = new Date();
    var dayOfWeek = now.getDay() || 7;
    var thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - dayOfWeek + 1);
    thisMonday.setHours(0, 0, 0, 0);

    var lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    var lastSunday = new Date(thisMonday);
    lastSunday.setDate(thisMonday.getDate() - 1);
    lastSunday.setHours(23, 59, 59, 999);

    return records.filter(function (r) {
      var d = new Date(r.date);
      return d >= lastMonday && d <= lastSunday;
    });
  }

  // 按日聚合（周一到周日）
  function aggregateByDay(records) {
    var days = [0, 0, 0, 0, 0, 0, 0]; // 周一到周日
    for (var i = 0; i < records.length; i++) {
      var d = new Date(records[i].date);
      var dow = d.getDay() || 7; // 周日=7
      days[dow - 1] += records[i].amount;
    }
    return days;
  }

  // 生成周对比
  function generateWeekComparison(thisTotal, lastTotal) {
    if (lastTotal === 0) return null;
    var diff = thisTotal - lastTotal;
    var pct = lastTotal > 0 ? Math.round(diff / lastTotal * 100) : 0;
    return { diff: diff, pct: pct };
  }

  // 渲染洞察
  function renderInsight(records) {
    var weekRecords = getWeekRecords(records);

    if (weekRecords.length === 0) {
      els.insightContent.innerHTML = '<div class="empty-state">记几笔账，AI 就能帮你分析消费规律</div>';
      els.insightPeriod.textContent = "本周";
      return;
    }

    var agg = aggregateByCategory(weekRecords);
    var insight = generateCommentary(weekRecords, agg);

    // 周对比数据
    var lastWeekRecords = getLastWeekRecords(records);
    var lastAgg = aggregateByCategory(lastWeekRecords);
    var comparison = generateWeekComparison(agg.total, lastAgg.total);

    // 每日趋势
    var dailyData = aggregateByDay(weekRecords);
    var maxDaily = Math.max.apply(null, dailyData);
    var dayLabels = ["一", "二", "三", "四", "五", "六", "日"];
    var todayDow = (new Date().getDay() || 7) - 1;

    var dailyAvg = agg.total / (todayDow + 1);

    var html = "";

    // KPI 概览
    html += '<div class="week-kpi">';
    html += '<div class="week-kpi-item"><div class="week-kpi-value accent">¥' + agg.total.toFixed(0) + '</div><div class="week-kpi-label">本周支出</div></div>';
    html += '<div class="week-kpi-item"><div class="week-kpi-value">' + weekRecords.length + '</div><div class="week-kpi-label">记账笔数</div></div>';
    html += '<div class="week-kpi-item"><div class="week-kpi-value">¥' + dailyAvg.toFixed(0) + '</div><div class="week-kpi-label">日均支出</div></div>';
    html += '</div>';

    // 每日趋势图
    html += '<div class="insight-card">';
    html += '<div class="cat-bars" style="margin-bottom:4px;"><div style="font-size:0.8rem;font-weight:600;color:var(--ink);padding:4px 0;">每日趋势</div></div>';
    html += '<div class="daily-trend">';
    for (var d = 0; d < 7; d++) {
      var isToday = d === todayDow;
      var barHeight = maxDaily > 0 ? (dailyData[d] / maxDaily * 60) : 0;
      var fillClass = isToday ? "today" : (dailyData[d] > 0 ? "" : "empty");
      html += '<div class="daily-bar-col">';
      if (dailyData[d] > 0) {
        html += '<div class="daily-bar-fill ' + fillClass + '" style="height:' + barHeight + 'px"></div>';
      } else {
        html += '<div class="daily-bar-fill empty" style="height:2px"></div>';
      }
      html += '<span class="daily-bar-label' + (isToday ? " today" : "") + '">' + dayLabels[d] + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    // 分类条形图
    html += '<div class="insight-card">';
    html += '<div class="cat-bars">';
    for (var i = 0; i < agg.categories.length; i++) {
      var cat = agg.categories[i];
      var icon = CATEGORY_ICONS[cat.category] || "📝";
      var fillClass = i === 0 ? "top" : "normal";
      var barWidth = Math.max(cat.percent, 2); // 最小显示 2%
      html += '<div class="cat-bar-row">';
      html += '<span class="cat-bar-icon">' + icon + '</span>';
      html += '<span class="cat-bar-name">' + cat.category + '</span>';
      html += '<div class="cat-bar-track">';
      html += '<div class="cat-bar-fill ' + fillClass + '" style="width:' + barWidth + '%"></div>';
      html += "</div>";
      html += '<span class="cat-bar-amount">¥' + cat.amount.toFixed(0) + "</span>";
      html += "</div>";
    }
    html += "</div>";
    html += "</div>";

    // AI 点评
    if (insight) {
      html += '<div class="ai-comment-box">';
      html += '<div class="ai-comment-badge">AI 点评</div>';
      html += '<div class="ai-comment-text">' + insight.comment + "</div>";
      html += "</div>";

      // 本周 vs 上周对比
      if (comparison) {
        var cmpClass = comparison.diff > 0 ? "up" : (comparison.diff < 0 ? "down" : "flat");
        var cmpArrow = comparison.diff > 0 ? "↑" : (comparison.diff < 0 ? "↓" : "→");
        var cmpText = comparison.pct === 0 ? "持平" : (Math.abs(comparison.pct) + "%");
        html += '<div class="week-compare">';
        html += '<div class="week-compare-item"><span class="week-compare-label">上周</span><span class="week-compare-value flat">¥' + lastAgg.total.toFixed(0) + '</span></div>';
        html += '<div class="week-compare-item"><span class="week-compare-label">本周</span><span class="week-compare-value ' + cmpClass + '">' + cmpArrow + ' ' + cmpText + '</span></div>';
        html += '</div>';
      }

      // 趣味标签
      if (insight.tags.length > 0) {
        html += '<div class="insight-tags">';
        for (var j = 0; j < insight.tags.length; j++) {
          html += '<span class="insight-tag">' + insight.tags[j] + "</span>";
        }
        html += "</div>";
      }
    }

    els.insightContent.innerHTML = html;

    // 更新周期标签
    var now = new Date();
    var dayOfWeek = now.getDay() || 7;
    var monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    els.insightPeriod.textContent = "本周 · " + weekRecords.length + "笔 ¥" + agg.total.toFixed(0);
  }

  // ===== 渲染 =====
  function render() {
    var records = loadRecords();
    renderSummary(records);
    renderInsight(records);
    renderRecords(records);
  }

  function renderSummary(records) {
    var now = new Date();
    var todayStr = formatDateStr(now);
    var monthStr = now.getFullYear() + "-" + pad(now.getMonth() + 1);

    var todayTotal = 0, todayCount = 0, monthTotal = 0;

    for (var i = 0; i < records.length; i++) {
      var rDate = new Date(records[i].date);
      var rDateStr = formatDateStr(rDate);
      var rMonthStr = rDate.getFullYear() + "-" + pad(rDate.getMonth() + 1);

      if (rDateStr === todayStr) {
        todayTotal += records[i].amount;
        todayCount++;
      }
      if (rMonthStr === monthStr) {
        monthTotal += records[i].amount;
      }
    }

    els.todayTotal.textContent = "¥" + todayTotal.toFixed(2);
    els.todayCount.textContent = todayCount;
    els.monthTotal.textContent = "¥" + monthTotal.toFixed(2);
  }

  // 记录展开状态
  var recordsExpanded = false;
  var COLLAPSE_LIMIT = 5;

  function renderRecords(records) {
    if (records.length === 0) {
      els.recordsList.innerHTML = '<div class="empty-state">还没记过账，试试输入"午饭25"</div>';
      return;
    }

    // 按日期分组（倒序，最新日期在前）
    var groups = {};
    var groupKeys = [];
    for (var i = records.length - 1; i >= 0; i--) {
      var r = records[i];
      var dateKey = formatDateStr(new Date(r.date));
      if (!groups[dateKey]) {
        groups[dateKey] = [];
        groupKeys.push(dateKey);
      }
      groups[dateKey].push({ record: r, originalIndex: i });
    }

    var todayStr = formatDateStr(new Date());
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = formatDateStr(yesterday);

    // 折叠模式下只显示最近 COLLAPSE_LIMIT 条
    var visibleCount = recordsExpanded ? records.length : Math.min(records.length, COLLAPSE_LIMIT);
    var rendered = 0;
    var html = "";

    for (var g = 0; g < groupKeys.length && rendered < visibleCount; g++) {
      var key = groupKeys[g];
      var label = key;
      if (key === todayStr) label = "今天";
      else if (key === yesterdayStr) label = "昨天";
      else {
        var d = new Date(key);
        label = (d.getMonth() + 1) + "月" + d.getDate() + "日";
      }

      // 分组小计（仅展开时显示完整小计，折叠时显示已渲染的小计）
      var groupTotal = 0;
      for (var k = 0; k < groups[key].length; k++) {
        groupTotal += groups[key][k].record.amount;
      }

      html += '<div class="date-group-header">' + label + ' · ' + groups[key].length + '笔 · ¥' + groupTotal.toFixed(2) + '</div>';

      for (var j = 0; j < groups[key].length && rendered < visibleCount; j++) {
        var item = groups[key][j];
        var r = item.record;
        var icon = CATEGORY_ICONS[r.category] || CATEGORY_ICONS["其他"];
        html += '<div class="record-item">' +
          '<div class="record-cat cat-' + r.category + '">' + icon + '</div>' +
          '<div class="record-info">' +
            '<div class="record-desc">' + escapeHtml(r.description) + '</div>' +
            '<div class="record-meta">' + r.category + ' · ' + formatTime(r.date) + '</div>' +
          '</div>' +
          '<div class="record-amount">¥' + r.amount.toFixed(2) + '</div>' +
          '<button class="record-delete" data-index="' + item.originalIndex + '">×</button>' +
        '</div>';
        rendered++;
      }
    }

    // 展开按钮
    if (records.length > COLLAPSE_LIMIT) {
      if (!recordsExpanded) {
        html += '<button id="expandBtn" class="expand-btn">查看全部 ' + records.length + ' 条记录</button>';
      } else {
        html += '<button id="expandBtn" class="expand-btn">收起</button>';
      }
    }

    els.recordsList.innerHTML = html;

    // 绑定删除按钮
    var deleteBtns = els.recordsList.querySelectorAll(".record-delete");
    deleteBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        handleDelete(parseInt(this.getAttribute("data-index")));
      });
    });

    // 绑定展开按钮
    var expandBtn = document.getElementById("expandBtn");
    if (expandBtn) {
      expandBtn.addEventListener("click", function () {
        recordsExpanded = !recordsExpanded;
        render();
      });
    }
  }

  // ===== 工具函数 =====
  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function formatDateStr(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function formatDate(isoStr) {
    var d = new Date(isoStr);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function formatTime(isoStr) {
    var d = new Date(isoStr);
    return pad(d.getMonth() + 1) + "/" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(msg) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 1800);
  }

  // ===== 事件绑定 =====
  els.parseBtn.addEventListener("click", handleParse);
  els.confirmBtn.addEventListener("click", handleConfirm);
  els.cancelBtn.addEventListener("click", handleCancel);
  els.clearBtn.addEventListener("click", handleClear);

  // 快捷示例 chips
  var chips = document.querySelectorAll(".chip");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      els.input.value = this.getAttribute("data-text");
      els.input.focus();
      handleParse();
    });
  });

  els.input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      if (pendingRecord) {
        handleConfirm();
      } else {
        handleParse();
      }
    }
  });

  // ===== 初始化 =====
  render();
})();
