/* ============================================================
   看见 · 分享卡片模块（阶段 6）
   - 纯 CSS 竖版卡片（适合抖音/朋友圈，零图片依赖）
   - 复制文案功能
   - 截图保存提示
   - 挂到 window.ShareService
   ============================================================ */

(function () {
  // ============ 生成分享文案 ============
  // strength: { name, insight, reflection, evidences: [{date, summary}] }
  // type: "mini" | "full"
  function buildShareText(strength, type) {
    if (!strength) return "";

    var lines = [];
    lines.push("我发现自己的一个优点倾向：" + (strength.name || ""));

    // insight（仅 full）
    if (type === "full" && strength.insight) {
      lines.push("");
      lines.push(strength.insight);
    }

    // reflection
    if (strength.reflection) {
      lines.push("");
      lines.push(strength.reflection);
    }

    // 证据
    if (strength.evidences && strength.evidences.length > 0) {
      lines.push("");
      lines.push("证据：");
      for (var i = 0; i < strength.evidences.length; i++) {
        var ev = strength.evidences[i];
        lines.push("- " + (ev.date || "") + " " + (ev.summary || ""));
      }
    }

    // 落款
    lines.push("");
    lines.push("——来自「看见」· 发现你没注意到的自己");

    return lines.join("\n");
  }

  // ============ 复制到剪贴板 ============
  // 返回 Promise<{ ok, error }>
  function copyToClipboard(text) {
    return new Promise(function (resolve) {
      if (!text) {
        resolve({ ok: false, error: "文案为空" });
        return;
      }

      // 优先用现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          resolve({ ok: true, error: null });
        }).catch(function () {
          // 降级到 execCommand
          fallbackCopy(text, resolve);
        });
      } else {
        fallbackCopy(text, resolve);
      }
    });
  }

  // execCommand 降级方案
  function fallbackCopy(text, resolve) {
    try {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        resolve({ ok: true, error: null });
      } else {
        resolve({ ok: false, error: "复制失败，请手动选择文案复制" });
      }
    } catch (e) {
      resolve({ ok: false, error: "复制失败：" + (e.message || String(e)) });
    }
  }

  // ============ 创建分享卡片 DOM ============
  // 返回一个竖版卡片 DOM 元素（纯 CSS，无图片依赖）
  function createShareCard(strength, type) {
    var card = document.createElement("div");
    card.className = "share-card";

    // 顶部：产品名 + slogan
    var header = document.createElement("div");
    header.className = "share-card-header";
    var brand = document.createElement("div");
    brand.className = "share-card-brand";
    brand.textContent = "看 见";
    header.appendChild(brand);
    var slogan = document.createElement("div");
    slogan.className = "share-card-slogan";
    slogan.textContent = "发现你没注意到的自己";
    header.appendChild(slogan);
    card.appendChild(header);

    // 分割线
    var divider = document.createElement("div");
    divider.className = "share-card-divider";
    card.appendChild(divider);

    // 优点标签
    var tagRow = document.createElement("div");
    tagRow.className = "share-card-tag-row";
    var tag = document.createElement("div");
    tag.className = "share-card-tag";
    tag.textContent = type === "mini" ? "初步发现" : "优点倾向";
    tagRow.appendChild(tag);
    if (type === "mini") {
      var tag2 = document.createElement("div");
      tag2.className = "share-card-tag share-card-tag-preliminary";
      tag2.textContent = "初步观察";
      tagRow.appendChild(tag2);
    }
    card.appendChild(tagRow);

    // 优点名（大字）
    var nameEl = document.createElement("div");
    nameEl.className = "share-card-name";
    nameEl.textContent = strength.name || "";
    card.appendChild(nameEl);

    // insight（仅 full）
    if (type === "full" && strength.insight) {
      var insightEl = document.createElement("div");
      insightEl.className = "share-card-insight";
      insightEl.textContent = strength.insight;
      card.appendChild(insightEl);
    }

    // reflection
    if (strength.reflection) {
      var refEl = document.createElement("div");
      refEl.className = "share-card-reflection";
      refEl.textContent = '"' + strength.reflection + '"';
      card.appendChild(refEl);
    }

    // 证据链
    if (strength.evidences && strength.evidences.length > 0) {
      var evSection = document.createElement("div");
      evSection.className = "share-card-evidences";
      var evTitle = document.createElement("div");
      evTitle.className = "share-card-evidence-title";
      evTitle.textContent = "证据链";
      evSection.appendChild(evTitle);

      for (var i = 0; i < strength.evidences.length; i++) {
        var ev = strength.evidences[i];
        var evItem = document.createElement("div");
        evItem.className = "share-card-evidence-item";

        var evDate = document.createElement("div");
        evDate.className = "share-card-evidence-date";
        evDate.textContent = ev.date || "";
        evItem.appendChild(evDate);

        var evSummary = document.createElement("div");
        evSummary.className = "share-card-evidence-summary";
        evSummary.textContent = ev.summary || "";
        evItem.appendChild(evSummary);

        evSection.appendChild(evItem);
      }
      card.appendChild(evSection);
    }

    // 底部：日期 + 产品名
    var footer = document.createElement("div");
    footer.className = "share-card-footer";
    var now = new Date();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    footer.textContent = now.getFullYear() + "-" + m + "-" + d + " · 来自「看见」App";
    card.appendChild(footer);

    return card;
  }

  // ============ 显示分享弹窗 ============
  // strength: 优点对象
  // type: "mini" | "full"
  // onToast: 回调函数，用于显示 toast 提示
  function showShareModal(strength, type, onToast) {
    // 移除已存在的分享弹窗
    var existing = document.getElementById("share-modal-mask");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var mask = document.createElement("div");
    mask.className = "modal-mask share-modal-mask";
    mask.id = "share-modal-mask";

    var modal = document.createElement("div");
    modal.className = "modal share-modal";

    // 标题
    var title = document.createElement("h3");
    title.textContent = "分享这个发现";
    modal.appendChild(title);

    // 说明
    var desc = document.createElement("p");
    desc.className = "share-modal-desc";
    desc.textContent = "长按卡片或截图保存，分享到朋友圈让更多人看见自己。";
    modal.appendChild(desc);

    // 卡片预览容器（可滚动）
    var previewWrap = document.createElement("div");
    previewWrap.className = "share-preview-wrap";
    var card = createShareCard(strength, type);
    previewWrap.appendChild(card);
    modal.appendChild(previewWrap);

    // 操作按钮区
    var actions = document.createElement("div");
    actions.className = "share-modal-actions";

    // 复制文案按钮
    var copyBtn = document.createElement("button");
    copyBtn.className = "btn btn-primary";
    copyBtn.textContent = "复制文案";
    copyBtn.style.flex = "1";
    actions.appendChild(copyBtn);

    // 关闭按钮
    var closeBtn = document.createElement("button");
    closeBtn.className = "btn btn-ghost";
    closeBtn.textContent = "关闭";
    closeBtn.style.flex = "1";
    actions.appendChild(closeBtn);

    modal.appendChild(actions);
    mask.appendChild(modal);
    document.body.appendChild(mask);

    // 显示动画
    setTimeout(function () { mask.classList.add("show"); }, 10);

    // 复制文案
    copyBtn.addEventListener("click", function () {
      var text = buildShareText(strength, type);
      copyToClipboard(text).then(function (result) {
        if (result.ok) {
          if (onToast) onToast("文案已复制到剪贴板", "success");
        } else {
          if (onToast) onToast(result.error || "复制失败", "error");
        }
      });
    });

    // 关闭
    function closeModal() {
      mask.classList.remove("show");
      setTimeout(function () {
        if (mask.parentNode) mask.parentNode.removeChild(mask);
      }, 200);
    }
    closeBtn.addEventListener("click", closeModal);
    mask.addEventListener("click", function (e) {
      if (e.target === mask) closeModal();
    });
  }

  // ============ 暴露 API ============
  window.ShareService = {
    buildShareText: buildShareText,
    copyToClipboard: copyToClipboard,
    createShareCard: createShareCard,
    showShareModal: showShareModal,
  };
})();
