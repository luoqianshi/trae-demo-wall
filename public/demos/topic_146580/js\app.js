/* ============================================================
   看见 · 主应用（阶段 1）
   - hash 路由：#today / #history / #insight / #settings
   - 视图渲染
   - 事件绑定
   ============================================================ */

(function () {
  var view = document.getElementById("view");

  // ============ 工具 ============
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // Toast 提示
  var toastTimer = null;
  function toast(msg, type) {
    var t = $(".toast");
    if (!t) {
      t = el("div", "toast");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = "toast show" + (type ? " " + type : "");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.className = "toast" + (type ? " " + type : "");
    }, 2200);
  }

  // 确认弹窗
  function confirmDialog(title, message, onConfirm) {
    var mask = el("div", "modal-mask");
    var modal = el("div", "modal");
    modal.appendChild(el("h3", null, title));
    modal.appendChild(el("p", null, message));
    var actions = el("div", "modal-actions");
    var cancelBtn = el("button", "btn btn-ghost btn-sm", "取消");
    var okBtn = el("button", "btn btn-danger btn-sm", "确认清除");
    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    modal.appendChild(actions);
    mask.appendChild(modal);
    document.body.appendChild(mask);
    setTimeout(function () { mask.classList.add("show"); }, 10);

    function close() {
      mask.classList.remove("show");
      setTimeout(function () {
        if (mask.parentNode) mask.parentNode.removeChild(mask);
      }, 200);
    }
    cancelBtn.addEventListener("click", close);
    okBtn.addEventListener("click", function () {
      close();
      if (onConfirm) onConfirm();
    });
    mask.addEventListener("click", function (e) {
      if (e.target === mask) close();
    });
  }

  // ============ 路由 ============
  var routes = {
    today: renderToday,
    history: renderHistory,
    insight: renderInsight,
    settings: renderSettings,
  };

  function getRoute() {
    var hash = (location.hash || "").replace(/^#\/?/, "");
    if (!hash || !routes[hash]) return "today";
    return hash;
  }

  function navigate(route) {
    location.hash = route;
  }

  function render() {
    var route = getRoute();
    // 更新导航高亮
    var links = $(".nav-links").children;
    for (var i = 0; i < links.length; i++) {
      var r = links[i].getAttribute("data-route");
      if (r === route) links[i].classList.add("active");
      else links[i].classList.remove("active");
    }
    // 渲染视图
    view.innerHTML = "";
    routes[route]();
    window.scrollTo(0, 0);
    // 更新演示模式提示条
    updateDemoBanner();
  }

  // ============ 演示模式提示条 ============
  function updateDemoBanner() {
    var banner = document.getElementById("demo-banner");
    if (!banner) return;
    if (window.DemoService && window.DemoService.isDemoMode()) {
      banner.style.display = "flex";
      var exitBtn = document.getElementById("demo-banner-exit");
      if (exitBtn) {
        // cloneNode 避免重复绑定事件
        var newBtn = exitBtn.cloneNode(true);
        exitBtn.parentNode.replaceChild(newBtn, exitBtn);
        newBtn.addEventListener("click", function () {
          var result = window.DemoService.exitDemo();
          if (result.ok) {
            toast("已退出演示模式，数据已恢复", "success");
            render();
            updateDemoBanner();
          } else {
            toast(result.error || "退出失败", "error");
          }
        });
      }
    } else {
      banner.style.display = "none";
    }
  }

  window.addEventListener("hashchange", render);

  // ============ 今日页 ============
  function renderToday() {
    // Hero
    var hero = el("div", "hero");
    hero.appendChild(el("div", "name", "看 见"));
    hero.appendChild(el("div", "slogan", window.Config.slogan));
    hero.appendChild(el("div", "tagline", "一个帮你发现自己优点的 AI 日记"));
    view.appendChild(hero);

    var todayRecord = window.StorageService.getTodayRecord();
    var todayDate = window.StorageService.todayStr();

    // 问题卡容器（先渲染，文本稍后填充）
    var qCard = el("div", "question-card");
    qCard.appendChild(el("div", "question-label", "今日问题"));
    var qText = el("div", "question-text", "");
    qCard.appendChild(qText);
    qCard.appendChild(el("div", "question-date", todayDate));
    view.appendChild(qCard);

    if (todayRecord) {
      // 已有今天的记录，直接显示问题 + 渲染输入区
      qText.textContent = todayRecord.question;
      renderTodayForm(todayRecord.question, todayRecord);
    } else {
      // 无记录，异步取问题（AI 优先 + 静态兜底）
      qText.textContent = "正在为你准备今天的问题……";
      qText.style.color = "var(--ink-soft)";
      qText.style.fontStyle = "italic";

      window.Questions.getTodayQuestionAsync().then(function (result) {
        qText.textContent = result.text;
        qText.style.color = "";
        qText.style.fontStyle = "";
        renderTodayForm(result.text, null);
      });
    }
  }

  // ============ 今日页输入区 + 保存事件 ============
  function renderTodayForm(question, todayRecord) {
    // 输入卡
    var card = el("div", "card");
    var formGroup = el("div", "form-group");
    var textarea = document.createElement("textarea");
    textarea.className = "answer-textarea";
    textarea.placeholder = "写下今天这个瞬间发生的故事……（30 秒就好）";
    textarea.value = todayRecord ? todayRecord.answer : "";
    formGroup.appendChild(textarea);
    card.appendChild(formGroup);

    var btnRow = el("div");
    btnRow.style.display = "flex";
    btnRow.style.gap = "12px";
    var saveBtn = el("button", "btn btn-primary", todayRecord ? "更新今天的记录" : "记录今天");
    saveBtn.style.flex = "1";
    btnRow.appendChild(saveBtn);
    card.appendChild(btnRow);

    view.appendChild(card);

    // 已记录提示
    if (todayRecord) {
      var tip = el("div", "card");
      tip.style.background = "var(--accent-bg-soft)";
      tip.style.border = "1px dashed var(--accent)";
      tip.appendChild(el("div", null, "今天已记录。你可以随时修改今天的回答。"));
      view.appendChild(tip);
    }

    // AI 回应展示区（如果有）
    if (todayRecord && todayRecord.aiReply) {
      var replyCard = el("div", "card ai-reply-card");
      replyCard.appendChild(el("div", "ai-reply-title", "今天被看见的瞬间"));
      var replyText = el("div", "ai-reply-text", todayRecord.aiReply);
      replyCard.appendChild(replyText);
      view.appendChild(replyCard);
    }

    // 保存事件
    saveBtn.addEventListener("click", function () {
      var answer = textarea.value.trim();
      if (!answer) {
        toast("先写点什么再记录吧", "error");
        textarea.focus();
        return;
      }
      try {
        // 保存回答（saveRecord 会清空旧 aiReply）
        window.StorageService.saveRecord(question, answer);
        toast("已记录今天", "success");

        // 检查是否配置了 AI
        var settings = window.StorageService.getSettings();
        var eff = window.AIService._getEffectiveConfig(settings);
        var valid = window.AIService._validateConfig(eff);

        if (!valid.ok) {
          // 未配置 AI，给出友好提示
          setTimeout(function () {
            toast("已记录。若想体验真 AI 回应，可在设置页的「高级设置 / 本地 AI 测试」中填写 API Key", "info");
            render();
          }, 800);
          return;
        }

        // 配置齐全，调用 AI 生成即时回应
        // 先显示 loading 态
        var loadingCard = el("div", "card ai-reply-card");
        loadingCard.appendChild(el("div", "ai-reply-title", "正在生成今天的回应……"));
        loadingCard.appendChild(el("div", "ai-reply-loading", "正在认真读你写下的这个瞬间……"));
        view.appendChild(loadingCard);
        saveBtn.disabled = true;
        saveBtn.textContent = "生成中…";

        // 标记 loading 状态
        window.StorageService.updateRecordAIReply(window.StorageService.todayStr(), {
          aiReplyStatus: "loading",
          aiReplyError: "",
        });

        window.AIService.generateInstantReply({
          question: question,
          answer: answer,
          nickname: settings.nickname || "",
          settings: settings,
        }).then(function (result) {
          saveBtn.disabled = false;
          saveBtn.textContent = todayRecord ? "更新今天的记录" : "记录今天";
          if (result.ok) {
            window.StorageService.updateRecordAIReply(window.StorageService.todayStr(), {
              aiReply: result.text,
              aiReplyAt: Date.now(),
              aiReplyStatus: "success",
              aiReplyError: "",
            });
            toast("AI 已给你今天的回应", "success");
          } else {
            window.StorageService.updateRecordAIReply(window.StorageService.todayStr(), {
              aiReplyStatus: "error",
              aiReplyError: result.error || "生成失败",
            });
            toast("回应生成失败：" + result.error, "error");
          }
          // 重新渲染
          setTimeout(render, 600);
        });
      } catch (e) {
        console.error(e);
        toast("保存失败，请重试", "error");
      }
    });
  }

  // ============ 历史页 ============
  function renderHistory() {
    var records = window.StorageService.getAllRecords().slice().reverse(); // 倒序

    var head = el("div", "card");
    head.appendChild(el("div", "card-title", "历史记录"));
    head.appendChild(el("p", null, "你写下的每一句话，都会在这里安静地等你回来。"));
    view.appendChild(head);

    if (records.length === 0) {
      var empty = el("div", "empty-state");
      empty.appendChild(el("div", "icon", "·"));
      empty.appendChild(el("div", "text", "还没有记录。等你写下第一句话，这里会慢慢长出属于你的证据。"));
      view.appendChild(empty);
      return;
    }

    var list = el("ul", "history-list");
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var item = el("li", "history-item");

      // 日期 + 删除按钮行
      var dateRow = el("div", "h-date-row");
      dateRow.appendChild(el("div", "h-date", r.date));
      var delBtn = el("button", "h-del-btn", "删除");
      delBtn.setAttribute("data-id", r.id);
      dateRow.appendChild(delBtn);
      item.appendChild(dateRow);

      item.appendChild(el("div", "h-question", r.question));
      item.appendChild(el("div", "h-answer", r.answer));

      // AI 回应（如果有）
      if (r.aiReply) {
        var replyEl = el("div", "h-ai-reply");
        replyEl.appendChild(el("div", "h-ai-reply-title", "被看见的瞬间"));
        replyEl.appendChild(el("div", "h-ai-reply-text", r.aiReply));
        item.appendChild(replyEl);
      }

      list.appendChild(item);

      // 删除事件（闭包捕获 id）
      (function (recordId) {
        delBtn.addEventListener("click", function () {
          confirmDialog(
            "删除这条记录",
            "删除后无法恢复。确定删除 " + r.date + " 的记录吗？",
            function () {
              window.StorageService.deleteRecord(recordId);
              toast("已删除", "success");
              render();
            }
          );
        });
      })(r.id);
    }
    view.appendChild(list);
  }

  // ============ 洞察页 ============
  function renderInsight() {
    var count = window.StorageService.getRecordCount();
    var thresholds = window.Config.unlockThresholds;

    var head = el("div", "card");
    head.appendChild(el("div", "card-title", "洞察进度"));
    view.appendChild(head);

    // 进度圈
    var prog = el("div", "insight-progress");
    var circle = el("div", "progress-circle");
    circle.appendChild(el("div", "num", String(count)));
    prog.appendChild(circle);

    var nextThreshold = count < thresholds.miniInsight ? thresholds.miniInsight : thresholds.fullInsight;
    var remaining = nextThreshold - count;
    var progressText;
    if (count < thresholds.miniInsight) {
      progressText = "再记录 " + remaining + " 条，解锁迷你洞察";
    } else if (count < thresholds.fullInsight) {
      progressText = "再记录 " + remaining + " 条，解锁完整洞察报告";
    } else {
      progressText = "已满足完整洞察报告门槛";
    }
    prog.appendChild(el("div", "progress-text", progressText));
    prog.appendChild(el("div", "progress-sub", "把缺数据变成坚持的动力，像游戏开宝箱。"));
    view.appendChild(prog);

    // 解锁清单
    var list = el("div", "unlock-list");

    // 迷你洞察
    var miniDone = count >= thresholds.miniInsight;
    var miniItem = el("div", "unlock-item" + (miniDone ? " done" : ""));
    var miniCheck = el("div", "check", miniDone ? "✓" : "");
    miniItem.appendChild(miniCheck);
    miniItem.appendChild(el("div", "label", "7 条 · 迷你洞察（初步发现）"));
    miniItem.appendChild(el("div", "status", miniDone ? "已解锁" : "差 " + (thresholds.miniInsight - count) + " 条"));
    list.appendChild(miniItem);

    // 完整洞察
    var fullDone = count >= thresholds.fullInsight;
    var fullItem = el("div", "unlock-item" + (fullDone ? " done" : ""));
    var fullCheck = el("div", "check", fullDone ? "✓" : "");
    fullItem.appendChild(fullCheck);
    fullItem.appendChild(el("div", "label", "15 条 · 完整洞察报告（证据链）"));
    fullItem.appendChild(el("div", "status", fullDone ? "已解锁" : "差 " + (thresholds.fullInsight - count) + " 条"));
    list.appendChild(fullItem);

    view.appendChild(list);

    // 生成洞察按钮区
    if (miniDone) {
      var actionCard = el("div", "card");
      actionCard.style.background = "var(--accent-bg-soft)";
      actionCard.style.border = "1px dashed var(--accent)";

      // 检查 AI 配置
      var settings = window.StorageService.getSettings();
      var eff = window.AIService._getEffectiveConfig(settings);
      var valid = window.AIService._validateConfig(eff);

      if (!valid.ok) {
        actionCard.appendChild(el("p", null, "生成洞察需要配置 AI。请到设置页填写 API Key 和模型 ID。"));
      } else {
        actionCard.appendChild(el("p", null, "基于你写下的记录，AI 会帮你发现自己都没注意到的优点倾向。"));

        var btnRow = el("div");
        btnRow.style.display = "flex";
        btnRow.style.gap = "12px";
        btnRow.style.marginTop = "12px";

        if (miniDone) {
          var miniBtn = el("button", "btn btn-ghost", "生成迷你洞察");
          miniBtn.style.flex = "1";
          btnRow.appendChild(miniBtn);
          miniBtn.addEventListener("click", function () {
            generateAndRenderInsight("mini", miniBtn);
          });
        }
        if (fullDone) {
          var fullBtn = el("button", "btn btn-primary", "生成完整洞察报告");
          fullBtn.style.flex = "1";
          btnRow.appendChild(fullBtn);
          fullBtn.addEventListener("click", function () {
            generateAndRenderInsight("full", fullBtn);
          });
        }

        actionCard.appendChild(btnRow);
      }
      view.appendChild(actionCard);
    } else {
      var note = el("div", "card");
      note.style.background = "var(--accent-bg-soft)";
      note.style.border = "1px dashed var(--accent)";
      note.appendChild(el("p", null, "继续每天记录，让证据慢慢积累。达到 7 条后即可解锁迷你洞察。"));
      view.appendChild(note);
    }
  }

  // ============ 生成洞察并渲染 ============
  function generateAndRenderInsight(type, btn) {
    var records = window.StorageService.getAllRecords();
    var loadingId = "insight-loading-" + Date.now();
    var originalText = btn.textContent;

    // 显示 loading 卡
    var loadingCard = el("div", "card insight-loading-card");
    loadingCard.id = loadingId;
    loadingCard.appendChild(el("div", "ai-reply-title", type === "full" ? "正在生成完整洞察报告……" : "正在生成迷你洞察……"));
    loadingCard.appendChild(el("div", "ai-reply-loading", "正在翻看你这些天的记录……"));
    view.appendChild(loadingCard);

    btn.disabled = true;
    btn.textContent = "生成中…";

    // 滚动到 loading
    setTimeout(function () {
      loadingCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);

    var promise = type === "full"
      ? window.InsightService.generateFull(records)
      : window.InsightService.generateMini(records);

    promise.then(function (result) {
      btn.disabled = false;
      btn.textContent = originalText;

      // 移除 loading
      var loadingEl = document.getElementById(loadingId);
      if (loadingEl && loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);

      if (result.ok && result.data) {
        renderInsightResult(result.data, type);
      } else {
        renderInsightError(result.error, result.rawText, type);
      }
    });
  }

  // ============ 渲染洞察结果 ============
  function renderInsightResult(data, type) {
    var resultCard = el("div", "card insight-result-card");

    // 标题
    var titleText = type === "full" ? "完整洞察报告" : "迷你洞察 · 初步发现";
    resultCard.appendChild(el("div", "card-title", titleText));

    // 空优点（证据不足）
    if (!data.strengths || data.strengths.length === 0) {
      var empty = el("div", "insight-empty");
      empty.appendChild(el("p", null, data.summary || "证据不足，暂时无法发现明确的优点线索。"));
      empty.appendChild(el("p", null, "继续记录，规律会自己浮现。"));
      resultCard.appendChild(empty);
      view.appendChild(resultCard);
      return;
    }

    // 优点列表
    for (var i = 0; i < data.strengths.length; i++) {
      var s = data.strengths[i];
      var sCard = el("div", "strength-item");

      // 优点名称 + 初步标记
      var nameRow = el("div", "strength-name-row");
      nameRow.appendChild(el("div", "strength-name", s.name));
      if (s.isPreliminary) {
        nameRow.appendChild(el("div", "strength-tag", "初步发现"));
      }
      sCard.appendChild(nameRow);

      // insight（仅 full）
      if (type === "full" && s.insight) {
        sCard.appendChild(el("div", "strength-insight", s.insight));
      }

      // 证据链
      if (s.evidences && s.evidences.length > 0) {
        var evTitle = el("div", "evidence-title", "证据链");
        sCard.appendChild(evTitle);
        var evList = el("div", "evidence-list");
        for (var j = 0; j < s.evidences.length; j++) {
          var ev = s.evidences[j];
          var evItem = el("div", "evidence-item");
          evItem.appendChild(el("div", "evidence-date", ev.date || ""));
          evItem.appendChild(el("div", "evidence-summary", ev.summary || ""));
          evList.appendChild(evItem);
        }
        sCard.appendChild(evList);
      }

      // reflection
      if (s.reflection) {
        var ref = el("div", "strength-reflection", s.reflection);
        sCard.appendChild(ref);
      }

      // 分享按钮
      var shareBtn = el("button", "btn btn-ghost btn-sm strength-share-btn", "分享这个发现");
      shareBtn.style.marginTop = "12px";
      sCard.appendChild(shareBtn);

      // 闭包捕获当前 strength 和 type
      (function (currentStrength, currentType) {
        shareBtn.addEventListener("click", function () {
          window.ShareService.showShareModal(currentStrength, currentType, toast);
        });
      })(s, type);

      resultCard.appendChild(sCard);
    }

    // 总结
    if (data.summary) {
      resultCard.appendChild(el("div", "insight-summary", data.summary));
    }

    view.appendChild(resultCard);

    // 滚动到结果
    setTimeout(function () {
      resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  // ============ 渲染洞察错误 ============
  function renderInsightError(error, rawText, type) {
    var errCard = el("div", "card insight-error-card");
    errCard.appendChild(el("div", "card-title", "洞察生成失败"));
    errCard.appendChild(el("p", null, error || "生成失败，请重试"));

    // 如果有原始文本，显示出来便于调试
    if (rawText) {
      var rawTitle = el("div", "raw-title", "AI 原始返回（用于排查）：");
      errCard.appendChild(rawTitle);
      var rawPre = el("pre", "raw-text");
      rawPre.textContent = rawText;
      errCard.appendChild(rawPre);
    }

    view.appendChild(errCard);
  }

  // ============ 设置页 ============
  function renderSettings() {
    var settings = window.StorageService.getSettings();

    // 隐私说明（顶部）
    var privacySec = el("div", "settings-section");
    privacySec.style.background = "var(--accent-bg-soft)";
    privacySec.style.border = "1px dashed var(--accent)";
    var privacyTitle = el("div", "card-title", "隐私说明");
    privacySec.appendChild(privacyTitle);
    var privacyText = el("p");
    privacyText.style.fontSize = "13px";
    privacyText.style.color = "var(--ink-soft)";
    privacyText.style.lineHeight = "1.9";
    privacyText.innerHTML =
      "<strong>你的数据只属于你。</strong><br>" +
      "所有记录默认保存在你的浏览器本地（localStorage），不上传到任何服务器。<br>" +
      "你可以在浏览器按 F12 打开开发者工具 → Application → Local Storage，亲眼验证没有数据外发。<br>" +
      "只有当你主动请求 AI 回应或洞察时，对应的那条记录才会发送给你配置的 AI 接口。<br>" +
      "你可以随时导出、导入或清除全部数据。";
    privacySec.appendChild(privacyText);
    view.appendChild(privacySec);

    // 基本设置（普通用户区）
    var basic = el("div", "settings-section");
    basic.appendChild(el("h3", null, "基本设置"));

    var nickGroup = el("div", "form-group");
    nickGroup.appendChild(el("label", "form-label", "昵称"));
    var nickInput = el("input");
    nickInput.className = "form-input";
    nickInput.type = "text";
    nickInput.value = settings.nickname || "";
    nickInput.placeholder = "你想被怎么称呼";
    nickGroup.appendChild(nickInput);
    basic.appendChild(nickGroup);

    var saveBtn = el("button", "btn btn-primary", "保存昵称");
    basic.appendChild(saveBtn);
    view.appendChild(basic);

    saveBtn.addEventListener("click", function () {
      window.StorageService.saveSettings({
        nickname: nickInput.value.trim(),
      });
      toast("设置已保存", "success");
    });

    // 数据管理
    var dataSec = el("div", "settings-section");
    dataSec.appendChild(el("h3", null, "数据管理"));

    var exportBtn = el("button", "btn btn-ghost btn-block", "导出数据（JSON）");
    exportBtn.style.marginBottom = "10px";
    dataSec.appendChild(exportBtn);

    var importLabel = el("label", "btn btn-ghost btn-block", "导入数据（JSON）");
    importLabel.style.cursor = "pointer";
    importLabel.style.marginBottom = "0";
    var fileInput = el("input");
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.style.display = "none";
    importLabel.appendChild(fileInput);
    dataSec.appendChild(importLabel);
    view.appendChild(dataSec);

    exportBtn.addEventListener("click", function () {
      try {
        window.StorageService.exportAndDownload();
        toast("已导出数据（不含 API Key）", "success");
      } catch (e) {
        console.error(e);
        toast("导出失败", "error");
      }
    });

    fileInput.addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        var result = window.StorageService.importData(ev.target.result);
        if (result.ok) {
          toast("导入成功：" + result.data.records + " 条记录", "success");
          setTimeout(render, 800);
        } else {
          toast(result.error || "导入失败", "error");
        }
      };
      reader.onerror = function () {
        toast("读取文件失败", "error");
      };
      reader.readAsText(file);
      // 清空 input，允许重复选同一文件
      fileInput.value = "";
    });

    // 演示模式
    var demoSec = el("div", "settings-section");
    demoSec.appendChild(el("h3", null, "演示模式"));
    var demoDesc = el("p", "demo-desc");
    demoDesc.style.fontSize = "13px";
    demoDesc.style.color = "var(--ink-soft)";
    demoDesc.style.lineHeight = "1.8";
    demoDesc.style.marginBottom = "14px";

    if (window.DemoService.isDemoMode()) {
      // 当前处于演示模式
      demoDesc.textContent = "当前处于演示模式，数据为预置的 18 条演示记录。退出后将恢复你原来的数据。";
      demoSec.appendChild(demoDesc);
      demoSec.style.background = "var(--accent-bg-soft)";
      demoSec.style.border = "1px dashed var(--accent)";

      var exitDemoBtn = el("button", "btn btn-danger btn-block", "退出演示模式");
      demoSec.appendChild(exitDemoBtn);

      exitDemoBtn.addEventListener("click", function () {
        confirmDialog(
          "退出演示模式",
          "退出后，演示数据将被清除，你原来的记录和设置会恢复。确定退出吗？",
          function () {
            var result = window.DemoService.exitDemo();
            if (result.ok) {
              toast("已退出演示模式，数据已恢复", "success");
              setTimeout(render, 800);
              updateDemoBanner();
            } else {
              toast(result.error || "退出失败", "error");
            }
          }
        );
      });
    } else {
      demoDesc.textContent = "载入 18 条预置演示记录，可直接体验洞察报告功能。你当前的数据会自动备份，退出演示后可恢复。";
      demoSec.appendChild(demoDesc);

      var loadDemoBtn = el("button", "btn btn-ghost btn-block", "载入演示数据（18 条）");
      demoSec.appendChild(loadDemoBtn);

      loadDemoBtn.addEventListener("click", function () {
        confirmDialog(
          "载入演示数据",
          "将用 18 条预置演示记录替换当前记录。你当前的数据会自动备份，可随时通过「退出演示模式」恢复。确定载入吗？",
          function () {
            var result = window.DemoService.loadDemo();
            if (result.ok) {
              toast("已载入演示数据，可前往洞察页体验", "success");
              setTimeout(function () {
                render();
                updateDemoBanner();
              }, 800);
            } else {
              toast(result.error || "载入失败", "error");
            }
          }
        );
      });
    }
    view.appendChild(demoSec);

    // 高级设置 / 本地 AI 测试（默认折叠）
    var advSec = el("div", "settings-section");
    advSec.appendChild(el("h3", null, "高级设置 / 本地 AI 测试"));

    // 折叠头
    var advToggle = el("div", "advanced-toggle");
    var advToggleText = el("span", "advanced-toggle-text", "本地 AI 测试（可选）");
    var advToggleHint = el("span", "advanced-toggle-hint", "展开");
    advToggle.appendChild(advToggleText);
    advToggle.appendChild(advToggleHint);
    advSec.appendChild(advToggle);

    // 折叠内容（默认隐藏）
    var advBody = el("div", "advanced-body");
    advBody.style.display = "none";

    var keyGroup = el("div", "form-group");
    keyGroup.appendChild(el("label", "form-label", "API Key（仅本地测试真 AI 时填写）"));

    // 输入框 + 显示切换按钮（同一行）
    var keyRow = el("div", "key-row");
    var keyInput = el("input");
    keyInput.className = "form-input";
    keyInput.type = "password";
    keyInput.value = settings.apiKey || "";
    keyInput.placeholder = "豆包 / DeepSeek API Key";
    keyRow.appendChild(keyInput);

    var eyeBtn = el("button", "eye-btn", "显示");
    eyeBtn.type = "button";
    keyRow.appendChild(eyeBtn);
    keyGroup.appendChild(keyRow);
    advBody.appendChild(keyGroup);

    // 显示/隐藏切换
    eyeBtn.addEventListener("click", function () {
      if (keyInput.type === "password") {
        keyInput.type = "text";
        eyeBtn.textContent = "隐藏";
      } else {
        keyInput.type = "password";
        eyeBtn.textContent = "显示";
      }
    });

    // 模型服务商选择（保留现有 vendor 配置能力）
    var vendorGroup = el("div", "form-group");
    vendorGroup.appendChild(el("label", "form-label", "模型服务商"));
    var vendorSelect = el("select");
    vendorSelect.className = "form-input";
    var opt1 = el("option");
    opt1.value = "doubao";
    opt1.textContent = "豆包（火山方舟，推荐）";
    var opt2 = el("option");
    opt2.value = "deepseek";
    opt2.textContent = "DeepSeek（备用）";
    vendorSelect.appendChild(opt1);
    vendorSelect.appendChild(opt2);
    vendorSelect.value = settings.vendor || window.Config.ai.vendor || "doubao";
    vendorGroup.appendChild(vendorSelect);
    advBody.appendChild(vendorGroup);

    // Base URL 输入框
    var baseUrlGroup = el("div", "form-group");
    baseUrlGroup.appendChild(el("label", "form-label", "Base URL"));
    var baseUrlInput = el("input");
    baseUrlInput.className = "form-input";
    baseUrlInput.type = "text";
    baseUrlInput.value = settings.baseUrl || window.Config.ai.baseUrls[vendorSelect.value] || "";
    baseUrlInput.placeholder = "留空则按服务商自动填入";
    baseUrlGroup.appendChild(baseUrlInput);
    advBody.appendChild(baseUrlGroup);

    // 切换服务商时自动更新 baseUrl placeholder
    vendorSelect.addEventListener("change", function () {
      var v = vendorSelect.value;
      baseUrlInput.placeholder = window.Config.ai.baseUrls[v] || "留空则按服务商自动填入";
      if (!baseUrlInput.value.trim()) {
        baseUrlInput.placeholder = window.Config.ai.baseUrls[v] || "";
      }
    });

    // 即时回应模型 ID 输入框
    var modelChatGroup = el("div", "form-group");
    modelChatGroup.appendChild(el("label", "form-label", "即时回应模型 ID"));
    var modelChatInput = el("input");
    modelChatInput.className = "form-input";
    modelChatInput.type = "text";
    modelChatInput.value = settings.modelChat || "";
    modelChatInput.placeholder = "豆包填火山方舟 endpoint ID；DeepSeek 填 deepseek-chat";
    modelChatGroup.appendChild(modelChatInput);
    advBody.appendChild(modelChatGroup);

    var advSaveBtn = el("button", "btn btn-primary", "保存本地 AI 配置");
    advBody.appendChild(advSaveBtn);

    // 说明文案
    var advNote = el("div", "advanced-note");
    advNote.innerHTML =
      "这是为本地测试真 AI 准备的可选入口。<br>" +
      "普通体验和演示模式不需要填写 API Key。<br>" +
      "你的 Key 只会保存在当前浏览器本地，不会上传。<br>" +
      "后续在线版本会通过安全的后端转发服务调用 AI，普通用户无需提供 API Key。";
    advBody.appendChild(advNote);

    advSec.appendChild(advBody);
    view.appendChild(advSec);

    // 折叠交互
    advToggle.addEventListener("click", function () {
      var isOpen = advBody.style.display !== "none";
      if (isOpen) {
        advBody.style.display = "none";
        advToggleHint.textContent = "展开";
        advToggle.classList.remove("open");
      } else {
        advBody.style.display = "block";
        advToggleHint.textContent = "收起";
        advToggle.classList.add("open");
      }
    });

    advSaveBtn.addEventListener("click", function () {
      window.StorageService.saveSettings({
        apiKey: keyInput.value.trim(),
        vendor: vendorSelect.value,
        baseUrl: baseUrlInput.value.trim(),
        modelChat: modelChatInput.value.trim(),
        aiMode: "local",  // 当前阶段固定 local，复赛切换为 backend
      });
      toast("本地 AI 配置已保存", "success");
    });

    // 危险区
    var danger = el("div", "settings-section danger-zone");
    danger.appendChild(el("h3", null, "危险区"));
    var clearBtn = el("button", "btn btn-danger btn-block", "清除全部数据");
    danger.appendChild(clearBtn);
    view.appendChild(danger);

    clearBtn.addEventListener("click", function () {
      confirmDialog("确认清除全部数据？", "这将删除你所有的记录和设置，且无法恢复。请确保已导出备份。", function () {
        window.StorageService.clearAll();
        toast("已清除全部数据", "success");
        setTimeout(render, 800);
      });
    });
  }

  // ============ 启动 ============
  // 导航点击
  var navLinks = $(".nav-links").children;
  for (var i = 0; i < navLinks.length; i++) {
    (function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        navigate(link.getAttribute("data-route"));
      });
    })(navLinks[i]);
  }

  // 初始渲染
  if (!location.hash) location.hash = "today";
  render();

  // ============ 备份提醒（每 7 天检查一次）============
  function checkBackupReminder() {
    try {
      var BACKUP_REMIND_KEY = "kanjian_last_backup_remind";
      var SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      var now = Date.now();

      // 没有记录就不提醒
      var count = window.StorageService.getRecordCount();
      if (count < 3) return;

      // 检查上次提醒时间
      var lastRemind = 0;
      try {
        lastRemind = parseInt(localStorage.getItem(BACKUP_REMIND_KEY) || "0", 10);
      } catch (e) {}

      if (now - lastRemind < SEVEN_DAYS) return;

      // 满足条件，弹窗提醒
      setTimeout(function () {
        confirmDialog(
          "该备份一下了",
          "你已经记录了 " + count + " 条，这些数据对你来说可能很重要。\n建议现在导出一份备份，保存到安全的地方。\n（此提醒每 7 天最多出现一次）",
          function () {
            try {
              window.StorageService.exportAndDownload();
              toast("已导出备份（不含 API Key）", "success");
            } catch (e) {
              toast("导出失败", "error");
            }
          }
        );
        // 记录本次提醒时间
        try {
          localStorage.setItem(BACKUP_REMIND_KEY, String(now));
        } catch (e) {}
      }, 1500);
    } catch (e) {
      // 提醒失败不影响主功能
    }
  }

  // 延迟检查备份提醒（等页面渲染完）
  setTimeout(checkBackupReminder, 2000);
})();
