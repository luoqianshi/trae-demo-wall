/**
 * VidBuddy 管理中心 - 设置模块
 * 负责插件配置的加载、保存、重置以及快捷键设置等功能
 */
(function () {
  const VT_DASHBOARD_SETTINGS = {};

  /** 快捷键选择器映射 */
  const keyPickers = {};
  /** 当前正在编辑的笔记ID */
  let currentEditingMarkerId = null;

  /**
   * 初始化设置模块
   * 初始化流程：
   * 1. 初始化导航系统（侧边栏切换）
   * 2. 初始化快捷键选择器（绑定点击事件）
   * 3. 设置当前版本号显示
   * 4. 绑定更新检查按钮事件
   * 5. 绑定设置保存/重置按钮事件
   * 6. 绑定修改器键复选框事件（实时保存）
   * 7. 绑定单个快捷键重置按钮事件
   * 8. 绑定笔记编辑和设置输入事件
   */
  VT_DASHBOARD_SETTINGS.init = function () {
    VT_DASHBOARD_SETTINGS.initNavigation();
    VT_DASHBOARD_SETTINGS.initKeyPickers();

    const versionEl = document.getElementById("current-version");
    if (versionEl) {
      versionEl.textContent = chrome.runtime.getManifest().version;
    }

    const btnCheckUpdate = document.getElementById("btn-check-update");
    if (btnCheckUpdate) {
      btnCheckUpdate.addEventListener("click", () => {
        const statusEl = document.getElementById("update-status");
        if (statusEl) {
          statusEl.innerHTML = '<span class="update-checking">正在检查更新...</span>';
        }
        VT_DASHBOARD_SETTINGS.checkUpdate();
      });
    }

    const navItems = document.querySelectorAll(".settings-nav-item");
    navItems.forEach(item => {
      item.addEventListener("click", () => {
        const sectionId = item.getAttribute("data-section");
        if (sectionId === "about") {
          VT_DASHBOARD_SETTINGS.checkUpdate();
        }
      });
    });

    const btnSaveSettings = document.getElementById("btn-save-settings");
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener("click", () => {
        VT_DASHBOARD_SETTINGS.saveSettings();
      });
    }

    const btnResetSettings = document.getElementById("btn-reset-settings");
    if (btnResetSettings) {
      btnResetSettings.addEventListener("click", () => {
        VT_DASHBOARD_SETTINGS.resetSettings();
      });
    }

    const btnResetShortcuts = document.getElementById("btn-reset-shortcuts");
    if (btnResetShortcuts) {
      btnResetShortcuts.addEventListener("click", () => {
        VT_DASHBOARD_SETTINGS.resetShortcuts();
      });
    }

    const modifierCheckboxes = document.querySelectorAll('input[data-modifier^="danmaku-focus-"], input[data-modifier^="quick-screenshot-"]');
    modifierCheckboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        VT_DASHBOARD_SETTINGS.saveSettings();
      });
    });

    const keyResetBtns = document.querySelectorAll(".key-reset-btn");
    keyResetBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const resetKey = btn.getAttribute("data-reset-key");
        VT_DASHBOARD_SETTINGS.resetSingleKey(resetKey);
      });
    });

    VT_DASHBOARD_SETTINGS.bindEditNoteEvents();
    VT_DASHBOARD_SETTINGS.bindSettingInputEvents();
  };

  function formatKeyDisplay(key) {
    if (!key) return "";
    const map = {
      KeyA: "A", KeyB: "B", KeyC: "C", KeyD: "D", KeyE: "E", KeyF: "F",
      KeyG: "G", KeyH: "H", KeyI: "I", KeyJ: "J", KeyK: "K", KeyL: "L",
      KeyM: "M", KeyN: "N", KeyO: "O", KeyP: "P", KeyQ: "Q", KeyR: "R",
      KeyS: "S", KeyT: "T", KeyU: "U", KeyV: "V", KeyW: "W", KeyX: "X",
      KeyY: "Y", KeyZ: "Z",
      Digit0: "0", Digit1: "1", Digit2: "2", Digit3: "3", Digit4: "4",
      Digit5: "5", Digit6: "6", Digit7: "7", Digit8: "8", Digit9: "9",
      Minus: "-", Equal: "=", Backquote: "`",
      BracketLeft: "[", BracketRight: "]", Backslash: "\\",
      Semicolon: ";", Quote: "'", Comma: ",", Period: ".", Slash: "/",
      ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
      Space: "空格", Enter: "回车", Escape: "ESC",
      F1: "F1", F2: "F2", F3: "F3", F4: "F4", F5: "F5",
      F6: "F6", F7: "F7", F8: "F8", F9: "F9", F10: "F10",
      F11: "F11", F12: "F12",
    };
    return map[key] || key.toUpperCase();
  }

  VT_DASHBOARD_SETTINGS.initKeyPickers = function () {
    const pickerConfigs = [
      { id: "fullscreen-close", defaultKey: "KeyQ" },
      { id: "speed-decrease", defaultKey: "KeyA" },
      { id: "speed-increase", defaultKey: "KeyD" },
      { id: "speed-reset", defaultKey: "KeyS" },
      { id: "danmaku-focus", defaultKey: "KeyM" },
      { id: "quick-screenshot", defaultKey: "KeyS" },
    ];

    pickerConfigs.forEach((config) => {
      const el = document.querySelector(`[data-key-picker="${config.id}"]`);
      if (el) {
        keyPickers[config.id] = { el, key: config.defaultKey };
        el.addEventListener("click", () => {
          VT_DASHBOARD_SETTINGS.startKeyCapture(config.id);
        });
      }
    });
  };

  VT_DASHBOARD_SETTINGS.initNavigation = function () {
    const navItems = document.querySelectorAll(".settings-nav-item");
    const sections = document.querySelectorAll(".settings-section");

    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const sectionId = item.getAttribute("data-section");
        
        navItems.forEach((nav) => nav.classList.remove("active"));
        item.classList.add("active");

        sections.forEach((section) => section.classList.remove("active"));
        const targetSection = document.getElementById(`section-${sectionId}`);
        if (targetSection) {
          targetSection.classList.add("active");
        }
      });
    });

    const hash = window.location.hash.substring(1);
    let navItem = null;
    if (hash) {
      navItem = document.querySelector(`.settings-nav-item[data-section="${hash}"]`);
    }
    if (navItem) {
      navItem.click();
    } else {
      const activeNav = document.querySelector(".settings-nav-item.active");
      if (activeNav) {
        activeNav.click();
      } else if (navItems.length > 0) {
        navItems[0].click();
      }
    }
  };

  VT_DASHBOARD_SETTINGS.checkUpdate = async function () {
    const statusEl = document.getElementById("update-status");
    if (!statusEl) return;

    const currentVersion = chrome.runtime.getManifest().version;
    const releaseUrl = "https://github.com/Dhgaj/VidBuddy/releases/latest";
    const publicPagesUrl = "https://dhgaj.github.io/Display-The-Work";

    try {
      const response = await fetch("https://api.github.com/repos/Dhgaj/VidBuddy/releases/latest");
      if (response.ok) {
        const data = await response.json();
        const latestVersion = data.tag_name || data.name || "0.0.0";
        if (compareVersions(latestVersion, currentVersion) > 0) {
          statusEl.innerHTML = `
            <div class="update-info-row">
              <span class="update-available">发现新版本 ${latestVersion}</span>
              <a href="${data.html_url || releaseUrl}" target="_blank" class="update-download-btn">前往下载</a>
            </div>
          `;
        } else {
          statusEl.innerHTML = '<span class="update-latest">当前已是最新版本</span>';
        }
        return;
      }
      throw new Error("API rate limited");
    } catch (e) {
      try {
        const cdnResponse = await fetch("https://cdn.jsdelivr.net/gh/Dhgaj/VidBuddy@main/manifest.json");
        if (cdnResponse.ok) {
          const cdnData = await cdnResponse.json();
          const latestVersion = "v" + (cdnData.version || "0.0.0");
          if (compareVersions(latestVersion, currentVersion) > 0) {
            statusEl.innerHTML = `
              <div class="update-info-row">
                <span class="update-available">发现新版本 ${latestVersion}</span>
                <a href="${releaseUrl}" target="_blank" class="update-download-btn">前往下载</a>
              </div>
            `;
          } else {
            statusEl.innerHTML = '<span class="update-latest">当前已是最新版本</span>';
          }
          return;
        }
        throw new Error("CDN unavailable");
      } catch (cdnErr) {
        try {
          const pagesResponse = await fetch(`${publicPagesUrl}/data/releases.json`);
          if (!pagesResponse.ok) throw new Error("Pages unavailable");
          const releases = await pagesResponse.json();
          if (releases.length > 0) {
            const latest = releases[0];
            const latestVersion = latest.tag_name || latest.name || "0.0.0";
            const downloadUrl = latest.assets && latest.assets.length > 0 
              ? `${publicPagesUrl}/${latest.assets[0].download_url}` 
              : releaseUrl;
            if (compareVersions(latestVersion, currentVersion) > 0) {
              statusEl.innerHTML = `
                <div class="update-info-row">
                  <span class="update-available">发现新版本 ${latestVersion}</span>
                  <a href="${downloadUrl}" target="_blank" class="update-download-btn">前往下载</a>
                </div>
              `;
            } else {
              statusEl.innerHTML = '<span class="update-latest">当前已是最新版本</span>';
            }
          } else {
            throw new Error("No releases found");
          }
        } catch (pagesErr) {
          statusEl.innerHTML = '<span class="update-error">检查更新失败：网络错误</span>';
        }
      }
    }
  };

  function compareVersions(v1, v2) {
    const parts1 = v1.replace(/^v/, "").split(".");
    const parts2 = v2.replace(/^v/, "").split(".");
    const length = Math.max(parts1.length, parts2.length);
    
    for (let i = 0; i < length; i++) {
      const p1 = parseInt(parts1[i] || 0);
      const p2 = parseInt(parts2[i] || 0);
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  VT_DASHBOARD_SETTINGS.startKeyCapture = function (pickerId) {
    const picker = keyPickers[pickerId];
    if (!picker) return;

    const originalText = picker.el.textContent;

    picker.el.textContent = "按任意键...";
    picker.el.classList.add("recording");

    const cleanup = function () {
      picker.el.classList.remove("recording");
      picker.el.textContent = formatKeyDisplay(picker.key);
      document.removeEventListener("keydown", onKeyDown);
      picker.el.removeEventListener("blur", onBlur);
    };

    const onKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const validKeys = [
        "KeyA", "KeyB", "KeyC", "KeyD", "KeyE", "KeyF", "KeyG", "KeyH",
        "KeyI", "KeyJ", "KeyK", "KeyL", "KeyM", "KeyN", "KeyO", "KeyP",
        "KeyQ", "KeyR", "KeyS", "KeyT", "KeyU", "KeyV", "KeyW", "KeyX",
        "KeyY", "KeyZ",
        "Digit0", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5",
        "Digit6", "Digit7", "Digit8", "Digit9",
        "Minus", "Equal", "Backquote", "BracketLeft", "BracketRight",
        "Backslash", "Semicolon", "Quote", "Comma", "Period", "Slash",
        "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
        "Space", "Enter", "Escape",
        "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10",
        "F11", "F12",
      ];

      if (validKeys.includes(e.code)) {
        picker.key = e.code;
        picker.el.textContent = formatKeyDisplay(e.code);
        const settingKey = pickerId.replace("key-picker-", "pref");
        chrome.storage.local.set({ [settingKey]: e.code });
      } else {
        picker.el.textContent = formatKeyDisplay(picker.key);
      }

      cleanup();
    };

    const onBlur = function () {
      cleanup();
    };

    document.addEventListener("keydown", onKeyDown);
    picker.el.addEventListener("blur", onBlur);
  };

  /**
   * 加载所有设置项并填充到表单控件中
   * 加载流程：
   * 1. 从存储读取所有配置（带默认值）
   * 2. 将配置映射到对应的表单控件（输入框、复选框、下拉框）
   * 3. 更新滑块值的显示文本
   * 4. 设置颜色选择器的选中状态和自定义颜色预览
   * 5. 更新快捷键选择器的显示
   * 6. 设置修改器键复选框的选中状态
   * 7. 切换到设置面板
   */
  VT_DASHBOARD_SETTINGS.loadSettings = function () {
    chrome.storage.local.get(
      {
        prefAutoHideDelay: 3000,
        prefHoverFocus: true,
        prefHoverVideoExpand: true,
        prefShowStats: true,
        prefDanmakuSpeed: 7.5,
        prefJumpMode: "newTab",
        prefEnableShortcuts: true,
        prefShowDanmakuOnJump: true,
        prefBlacklist: "",
        prefFullscreenCloseKey: "q",
        prefSpeedDecreaseKey: "KeyA",
        prefSpeedIncreaseKey: "KeyD",
        prefSpeedResetKey: "KeyS",
        prefScreenshotQuality: 0.9,
        prefAutoScreenshot: true,
        prefMaxScreenshots: 500,
        prefPanelOpacity: 85,
        prefDanmakuColor: "white",
        prefDanmakuSize: 14,
        prefMarkerColor: "#6366f1",
        prefMarkerSize: 8,
        prefMinSpeed: 0.5,
        prefMaxSpeed: 2.0,
        prefSpeedStep: 0.1,
        prefAutoSaveInterval: 5000,
        prefAutoCleanDays: 0,
        prefTheme: "dark",
        prefPanelRadius: 21,
        prefDanmakuCustomColor: "#f472b6",
        prefMarkerCustomColor: "#6366f1",
        prefSpeedShortcut: true,
        prefTimeDisplayType: "positive",
      },
      (result) => {
        const inputs = {
          "setting-auto-hide-delay": "prefAutoHideDelay",
          "setting-danmaku-speed": "prefDanmakuSpeed",
          "setting-screenshot-quality": "prefScreenshotQuality",
          "setting-max-screenshots": "prefMaxScreenshots",
          "setting-panel-opacity": "prefPanelOpacity",
          "setting-danmaku-size": "prefDanmakuSize",
          "setting-marker-size": "prefMarkerSize",
          "setting-min-speed": "prefMinSpeed",
          "setting-max-speed": "prefMaxSpeed",
          "setting-speed-step": "prefSpeedStep",
          "setting-auto-save-interval": "prefAutoSaveInterval",
          "setting-panel-radius": "prefPanelRadius",
          "setting-danmaku-custom-color": "prefDanmakuCustomColor",
          "setting-marker-custom-color": "prefMarkerCustomColor",
          "setting-min-speed-input": "prefMinSpeed",
          "setting-max-speed-input": "prefMaxSpeed",
          "setting-auto-hide-delay-input": "prefAutoHideDelay",
          "setting-danmaku-speed-input": "prefDanmakuSpeed",
          "setting-speed-step-input": "prefSpeedStep",
          "setting-auto-save-interval-input": "prefAutoSaveInterval",
          "setting-screenshot-quality-input": "prefScreenshotQuality",
          "setting-hover-focus": "prefHoverFocus",
          "setting-hover-video-expand": "prefHoverVideoExpand",
          "setting-show-stats": "prefShowStats",
          "setting-jump-mode": "prefJumpMode",
          "setting-enable-shortcuts": "prefEnableShortcuts",
          "setting-show-danmaku-on-jump": "prefShowDanmakuOnJump",
          "setting-auto-screenshot": "prefAutoScreenshot",
          "setting-auto-clean-days": "prefAutoCleanDays",
          "setting-theme": "prefTheme",
          "setting-speed-shortcut": "prefSpeedShortcut",
          "setting-blacklist": "prefBlacklist",
          "setting-time-display-type": "prefTimeDisplayType",
        };

        Object.entries(inputs).forEach(([id, key]) => {
          const el = document.getElementById(id);
          if (el) {
            if (el.type === "checkbox") {
              el.checked = result[key];
            } else {
              el.value = String(result[key] !== undefined ? result[key] : "");
            }
          }
        });

        document.getElementById("setting-auto-hide-delay-value").textContent =
          result.prefAutoHideDelay == 0 ? "永不隐藏" : (result.prefAutoHideDelay / 1000) + "秒";
        document.getElementById("setting-danmaku-speed-value").textContent =
          result.prefDanmakuSpeed + "s";
        document.getElementById("setting-screenshot-quality-value").textContent =
          Math.round(result.prefScreenshotQuality * 100) + "%";
        document.getElementById("setting-max-screenshots-value").textContent =
          result.prefMaxScreenshots;
        document.getElementById("setting-opacity-value").textContent =
          result.prefPanelOpacity + "%";
        document.getElementById("setting-danmaku-size-value").textContent =
          result.prefDanmakuSize + "px";
        document.getElementById("setting-marker-size-value").textContent =
          result.prefMarkerSize + "px";
        document.getElementById("setting-min-speed-value").textContent =
          result.prefMinSpeed + "x";
        document.getElementById("setting-max-speed-value").textContent =
          result.prefMaxSpeed + "x";
        const stepVal = result.prefSpeedStep || 0.1;
        document.getElementById("setting-speed-step-value").textContent =
          stepVal + "x";
        const shortcutStepDesc = document.getElementById("setting-shortcut-speed-step-desc");
        if (shortcutStepDesc) {
          shortcutStepDesc.textContent = "步长 " + stepVal;
        }
        document.getElementById("setting-auto-save-interval-value").textContent =
          (result.prefAutoSaveInterval / 1000) + "秒";
        document.getElementById("setting-panel-radius-value").textContent =
          result.prefPanelRadius + "px";

        const danmakuColorRadios = document.querySelectorAll('input[name="danmaku-color"]');
        danmakuColorRadios.forEach(r => r.checked = r.value === result.prefDanmakuColor);
        const markerColorRadios = document.querySelectorAll('input[name="marker-color"]');
        markerColorRadios.forEach(r => r.checked = r.value === result.prefMarkerColor);

        const danmakuCustomDot = document.getElementById("setting-danmaku-color-custom-dot");
        if (danmakuCustomDot && result.prefDanmakuCustomColor) {
          danmakuCustomDot.style.background = result.prefDanmakuCustomColor;
        }
        const markerCustomDot = document.getElementById("setting-marker-color-custom-dot");
        if (markerCustomDot && result.prefMarkerCustomColor) {
          markerCustomDot.style.background = result.prefMarkerCustomColor;
        }

        if (keyPickers["fullscreen-close"]) keyPickers["fullscreen-close"].key = result.prefFullscreenCloseKey || "q";
        if (keyPickers["speed-decrease"]) keyPickers["speed-decrease"].key = result.prefSpeedDecreaseKey || "KeyA";
        if (keyPickers["speed-increase"]) keyPickers["speed-increase"].key = result.prefSpeedIncreaseKey || "KeyD";
        if (keyPickers["speed-reset"]) keyPickers["speed-reset"].key = result.prefSpeedResetKey || "KeyS";
        if (keyPickers["danmaku-focus"]) keyPickers["danmaku-focus"].key = result.prefDanmakuFocusKey || "KeyM";
        if (keyPickers["quick-screenshot"]) keyPickers["quick-screenshot"].key = result.prefQuickScreenshotKey || "KeyS";

        Object.values(keyPickers).forEach(p => {
          if (p.el) p.el.textContent = formatKeyDisplay(p.key);
        });

        const danmakuFocusModifiers = result.prefDanmakuFocusModifiers || ["alt"];
        document.querySelectorAll('input[data-modifier^="danmaku-focus-"]').forEach(cb => {
          const mod = cb.dataset.modifier.replace("danmaku-focus-", "");
          const normalizedMod = mod === "ctrl" ? "control" : mod;
          cb.checked = danmakuFocusModifiers.includes(normalizedMod);
        });

        const quickScreenshotModifiers = result.prefQuickScreenshotModifiers || ["alt"];
        document.querySelectorAll('input[data-modifier^="quick-screenshot-"]').forEach(cb => {
          const mod = cb.dataset.modifier.replace("quick-screenshot-", "");
          const normalizedMod = mod === "ctrl" ? "control" : mod;
          cb.checked = quickScreenshotModifiers.includes(normalizedMod);
        });

        if (typeof window.switchPanel === "function") {
          window.switchPanel("panel-settings");
        }
      },
    );
  };

  /**
   * 保存所有设置项到存储
   * 保存流程：
   * 1. 收集修改器键配置（弹幕焦点、快速截图）
   * 2. 收集所有表单控件的值（输入框、复选框、下拉框、滑块）
   * 3. 收集颜色选择器的选中值
   * 4. 将所有配置保存到 chrome.storage.local
   * 5. 显示保存成功提示
   */
  VT_DASHBOARD_SETTINGS.saveSettings = function () {
    // 收集弹幕焦点快捷键的修改器键（Ctrl/Alt/Shift/Win）
    const danmakuFocusModifiers = [];
    const danmakuFocusModifierCheckboxes = document.querySelectorAll('input[data-modifier^="danmaku-focus-"]');
    danmakuFocusModifierCheckboxes.forEach(cb => {
      if (cb.checked) {
        const mod = cb.dataset.modifier.replace("danmaku-focus-", "");
        if (mod === "ctrl") danmakuFocusModifiers.push("control");
        else danmakuFocusModifiers.push(mod);
      }
    });

    const quickScreenshotModifiers = [];
    const quickScreenshotModifierCheckboxes = document.querySelectorAll('input[data-modifier^="quick-screenshot-"]');
    quickScreenshotModifierCheckboxes.forEach(cb => {
      if (cb.checked) {
        const mod = cb.dataset.modifier.replace("quick-screenshot-", "");
        if (mod === "ctrl") quickScreenshotModifiers.push("control");
        else quickScreenshotModifiers.push(mod);
      }
    });

    const settings = {
      prefAutoHideDelay: parseInt(document.getElementById("setting-auto-hide-delay").value) || 3000,
      prefHoverFocus: document.getElementById("setting-hover-focus").checked,
      prefHoverVideoExpand: document.getElementById("setting-hover-video-expand").checked,
      prefShowStats: document.getElementById("setting-show-stats").checked,
      prefDanmakuSpeed: parseFloat(document.getElementById("setting-danmaku-speed").value) || 7.5,
      prefJumpMode: document.getElementById("setting-jump-mode").value || "newTab",
      prefEnableShortcuts: document.getElementById("setting-enable-shortcuts").checked,
      prefShowDanmakuOnJump: document.getElementById("setting-show-danmaku-on-jump").checked,
      prefBlacklist: document.getElementById("setting-blacklist").value || "",
      prefFullscreenCloseKey: keyPickers["fullscreen-close"]?.key || "q",
      prefSpeedDecreaseKey: keyPickers["speed-decrease"]?.key || "KeyA",
      prefSpeedIncreaseKey: keyPickers["speed-increase"]?.key || "KeyD",
      prefSpeedResetKey: keyPickers["speed-reset"]?.key || "KeyS",
      prefDanmakuFocusKey: keyPickers["danmaku-focus"]?.key || "KeyM",
      prefDanmakuFocusModifiers: danmakuFocusModifiers,
      prefQuickScreenshotKey: keyPickers["quick-screenshot"]?.key || "KeyS",
      prefQuickScreenshotModifiers: quickScreenshotModifiers,
      prefScreenshotQuality: parseFloat(document.getElementById("setting-screenshot-quality").value) || 0.9,
      prefAutoScreenshot: document.getElementById("setting-auto-screenshot").checked,
      prefMaxScreenshots: parseInt(document.getElementById("setting-max-screenshots").value) || 500,
      prefPanelOpacity: parseInt(document.getElementById("setting-panel-opacity").value) || 85,
      prefDanmakuSize: parseInt(document.getElementById("setting-danmaku-size").value) || 14,
      prefMarkerSize: parseInt(document.getElementById("setting-marker-size").value) || 8,
      prefMinSpeed: parseFloat(document.getElementById("setting-min-speed").value) || 0.5,
      prefMaxSpeed: parseFloat(document.getElementById("setting-max-speed").value) || 2.0,
      prefSpeedStep: parseFloat(document.getElementById("setting-speed-step").value) || 0.1,
      prefAutoSaveInterval: parseInt(document.getElementById("setting-auto-save-interval").value) || 5000,
      prefAutoCleanDays: parseInt(document.getElementById("setting-auto-clean-days").value) || 0,
      prefTheme: document.getElementById("setting-theme").value || "dark",
      prefPanelRadius: parseInt(document.getElementById("setting-panel-radius").value) || 21,
      prefDanmakuCustomColor: document.getElementById("setting-danmaku-custom-color").value || "#f472b6",
      prefMarkerCustomColor: document.getElementById("setting-marker-custom-color").value || "#6366f1",
      prefSpeedShortcut: document.getElementById("setting-speed-shortcut").checked,
      prefTimeDisplayType: document.getElementById("setting-time-display-type").value || "positive",
    };

    const danmakuColorRadios = document.querySelectorAll('input[name="danmaku-color"]');
    danmakuColorRadios.forEach(r => {
      if (r.checked) settings.prefDanmakuColor = r.value;
    });
    const markerColorRadios = document.querySelectorAll('input[name="marker-color"]');
    markerColorRadios.forEach(r => {
      if (r.checked) settings.prefMarkerColor = r.value;
    });

    chrome.storage.local.set(settings, () => {
      if (window.VT_MODAL && window.VT_MODAL.showToast) {
        window.VT_MODAL.showToast("✅ 配置已保存！", "success");
      }
    });
  };

  VT_DASHBOARD_SETTINGS.resetSettings = function () {
    const defaults = {
      prefAutoHideDelay: 3000,
      prefHoverFocus: true,
      prefHoverVideoExpand: true,
      prefShowStats: true,
      prefDanmakuSpeed: 7.5,
      prefJumpMode: "newTab",
      prefEnableShortcuts: true,
      prefShowDanmakuOnJump: true,
      prefBlacklist: "",
      prefFullscreenCloseKey: "q",
      prefSpeedDecreaseKey: "KeyA",
      prefSpeedIncreaseKey: "KeyD",
      prefSpeedResetKey: "KeyS",
      prefScreenshotQuality: 0.9,
      prefAutoScreenshot: true,
      prefMaxScreenshots: 500,
      prefPanelOpacity: 85,
      prefDanmakuColor: "white",
      prefDanmakuSize: 14,
      prefMarkerColor: "#6366f1",
      prefMarkerSize: 8,
      prefMinSpeed: 0.5,
      prefMaxSpeed: 2.0,
      prefSpeedStep: 0.1,
      prefAutoSaveInterval: 5000,
      prefAutoCleanDays: 0,
      prefTheme: "dark",
      prefPanelRadius: 21,
      prefDanmakuCustomColor: "#f472b6",
      prefMarkerCustomColor: "#6366f1",
      prefSpeedShortcut: true,
      prefTimeDisplayType: "positive",
    };

    chrome.storage.local.set(defaults, () => {
      VT_DASHBOARD_SETTINGS.loadSettings();
      if (window.VT_MODAL && window.VT_MODAL.showToast) {
        window.VT_MODAL.showToast("🔄 配置已重置为默认值！", "info");
      }
    });
  };

  VT_DASHBOARD_SETTINGS.resetShortcuts = function () {
    const defaultKeys = {
      prefFullscreenCloseKey: "q",
      prefSpeedDecreaseKey: "KeyA",
      prefSpeedIncreaseKey: "KeyD",
      prefSpeedResetKey: "KeyS",
      prefDanmakuFocusKey: "KeyM",
      prefQuickScreenshotKey: "KeyS",
    };

    chrome.storage.local.get(null, (allData) => {
      const updatedData = { ...allData, ...defaultKeys };
      chrome.storage.local.set(updatedData, () => {
        VT_DASHBOARD_SETTINGS.loadSettings();
        if (window.VT_MODAL && window.VT_MODAL.showToast) {
          window.VT_MODAL.showToast("🔄 快捷键已重置为默认值！", "info");
        }
      });
    });
  };

  VT_DASHBOARD_SETTINGS.resetSingleKey = function (keyId) {
    const defaults = {
      "fullscreen-close": "q",
      "speed-decrease": "KeyA",
      "speed-increase": "KeyD",
      "speed-reset": "KeyS",
      "danmaku-focus": "KeyM",
      "quick-screenshot": "KeyS",
    };

    if (keyId && defaults[keyId]) {
      keyPickers[keyId].key = defaults[keyId];
      if (keyPickers[keyId].el) {
        keyPickers[keyId].el.textContent = formatKeyDisplay(defaults[keyId]);
      }
      const settingKey = `pref${keyId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("")}Key`;
      chrome.storage.local.set({ [settingKey]: defaults[keyId] });
    }
  };

  VT_DASHBOARD_SETTINGS.bindEditNoteEvents = function () {
    const editNoteModal = document.getElementById("edit-note-modal");
    const btnCancelEditNote = document.getElementById("btn-cancel-edit-note");
    const btnSaveEditNote = document.getElementById("btn-save-edit-note");

    if (btnCancelEditNote) {
      btnCancelEditNote.addEventListener("click", () => {
        editNoteModal.classList.remove("show");
        currentEditingMarkerId = null;
      });
    }

    if (btnSaveEditNote) {
      btnSaveEditNote.addEventListener("click", () => {
        const noteInput = document.getElementById("edit-note-textarea");
        if (noteInput && currentEditingMarkerId) {
          const newNote = noteInput.value.trim();
          chrome.storage.local.get({ markers: [] }, (res) => {
            const markers = res.markers || [];
            const index = markers.findIndex((m) => m.id === currentEditingMarkerId);
            if (index !== -1) {
              markers[index].note = newNote;
              chrome.storage.local.set({ markers }, () => {
                editNoteModal.classList.remove("show");
                currentEditingMarkerId = null;
                if (window.VT_MODAL && window.VT_MODAL.showToast) {
                  window.VT_MODAL.showToast("✅ 笔记已更新！", "success");
                }
                if (window.VT_DASHBOARD_HISTORY && window.VT_DASHBOARD_HISTORY.loadAndRender) {
                  window.VT_DASHBOARD_HISTORY.loadAndRender();
                }
              });
            }
          });
        }
      });
    }

    if (editNoteModal) {
      editNoteModal.addEventListener("click", (e) => {
        if (e.target === editNoteModal) {
          editNoteModal.classList.remove("show");
          currentEditingMarkerId = null;
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && editNoteModal.classList.contains("show")) {
          e.preventDefault();
          editNoteModal.classList.remove("show");
          currentEditingMarkerId = null;
        }
      });
    }

    document.addEventListener("click", (e) => {
      if (e.target.closest(".marker-dash-edit")) {
        const markerId = e.target.closest(".marker-dash-edit").getAttribute("data-id");
        chrome.storage.local.get({ markers: [] }, (res) => {
          const marker = res.markers.find((m) => m.id === markerId);
          if (marker) {
            const noteInput = document.getElementById("edit-note-textarea");
            if (noteInput) {
              noteInput.value = marker.note || "";
            }
            currentEditingMarkerId = markerId;
            editNoteModal.classList.add("show");
            if (noteInput) {
              requestAnimationFrame(() => {
                noteInput.focus();
                noteInput.select();
              });
            }
          }
        });
      }
    });
  };

  VT_DASHBOARD_SETTINGS.bindSettingInputEvents = function () {
    const bindSliderInputSync = function (sliderId, valueId, formatter, parser) {
      const slider = document.getElementById(sliderId);
      const valueDisplay = document.getElementById(valueId);

      if (slider) {
        slider.addEventListener("input", (e) => {
          const val = e.target.value;
          if (valueDisplay) valueDisplay.textContent = formatter(val);
        });
      }

      if (valueDisplay) {
        valueDisplay.style.cursor = "pointer";
        valueDisplay.addEventListener("click", () => {
          const currentValue = slider ? slider.value : "";
          const editInput = document.createElement("input");
          editInput.type = "number";
          editInput.value = currentValue;
          editInput.style.width = "80px";
          editInput.style.padding = "4px 8px";
          editInput.style.border = "1px solid #8b5cf6";
          editInput.style.borderRadius = "6px";
          editInput.style.background = "#1a1a2e";
          editInput.style.color = "#fff";
          editInput.style.fontSize = "14px";
          editInput.style.textAlign = "right";

          valueDisplay.parentNode.replaceChild(editInput, valueDisplay);
          editInput.focus();
          editInput.select();

          let isFinished = false;
          const finishEdit = () => {
            if (isFinished) return;
            isFinished = true;
            let newValue = editInput.value;
            if (newValue !== "") {
              newValue = parser ? parser(newValue) : newValue;
              if (slider) {
                const min = parseFloat(slider.min);
                const max = parseFloat(slider.max);
                const step = parseFloat(slider.step);
                newValue = Math.max(min, Math.min(max, newValue));
                if (step > 0) {
                  newValue = Math.round(newValue / step) * step;
                }
                slider.value = newValue;
              }
            }
            valueDisplay.textContent = formatter(slider ? slider.value : "");
            try {
              editInput.parentNode.replaceChild(valueDisplay, editInput);
            } catch (e) {}
            if (window.VT_DASHBOARD_SETTINGS && window.VT_DASHBOARD_SETTINGS.saveSettings) {
              window.VT_DASHBOARD_SETTINGS.saveSettings();
            }
          };

          editInput.addEventListener("blur", finishEdit);
          editInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              finishEdit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              if (!isFinished) {
                isFinished = true;
                try {
                  editInput.parentNode.replaceChild(valueDisplay, editInput);
                } catch (e) {}
              }
            }
          });
        });
      }
    };

    bindSliderInputSync("setting-auto-hide-delay", "setting-auto-hide-delay-value", (val) => {
      const v = parseInt(val);
      return v == 0 ? "永不隐藏" : (v / 1000) + "秒";
    }, (val) => parseInt(val) * 1000);

    bindSliderInputSync("setting-danmaku-speed", "setting-danmaku-speed-value", (val) => val + "s");

    bindSliderInputSync("setting-screenshot-quality", "setting-screenshot-quality-value", (val) => Math.round(val * 100) + "%", (val) => Math.min(1, Math.max(0.1, parseFloat(val) / 100)));

    bindSliderInputSync("setting-max-screenshots", "setting-max-screenshots-value", (val) => val, (val) => parseInt(val));

    bindSliderInputSync("setting-panel-opacity", "setting-opacity-value", (val) => val + "%", (val) => parseInt(val));

    bindSliderInputSync("setting-danmaku-size", "setting-danmaku-size-value", (val) => val + "px", (val) => parseInt(val));

    bindSliderInputSync("setting-marker-size", "setting-marker-size-value", (val) => val + "px", (val) => parseInt(val));

    bindSliderInputSync("setting-min-speed", "setting-min-speed-value", (val) => val + "x");

    bindSliderInputSync("setting-max-speed", "setting-max-speed-value", (val) => val + "x");

    bindSliderInputSync("setting-speed-step", "setting-speed-step-value", (val) => val + "x");
    const speedStepSlider = document.getElementById("setting-speed-step");
    if (speedStepSlider) {
      speedStepSlider.addEventListener("input", (e) => {
        const desc = document.getElementById("setting-shortcut-speed-step-desc");
        if (desc) desc.textContent = "步长 " + e.target.value;
      });
    }

    bindSliderInputSync("setting-auto-save-interval", "setting-auto-save-interval-value", (val) => (val / 1000) + "秒", (val) => parseInt(val) * 1000);

    bindSliderInputSync("setting-panel-radius", "setting-panel-radius-value", (val) => val + "px", (val) => parseInt(val));

    const inputDanmakuCustomColor = document.getElementById("setting-danmaku-custom-color");
    if (inputDanmakuCustomColor) {
      inputDanmakuCustomColor.addEventListener("input", (e) => {
        const dot = document.getElementById("setting-danmaku-color-custom-dot");
        if (dot) dot.style.background = e.target.value;
        const customRadio = document.getElementById("danmaku-color-custom-radio");
        if (customRadio) {
          customRadio.checked = true;
          customRadio.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
      inputDanmakuCustomColor.addEventListener("change", () => {
        VT_DASHBOARD_SETTINGS.saveSettings();
      });
    }

    const danmakuCustomDot = document.getElementById("setting-danmaku-color-custom-dot");
    if (danmakuCustomDot) {
      danmakuCustomDot.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const customRadio = document.getElementById("danmaku-color-custom-radio");
        if (customRadio) {
          customRadio.checked = true;
          customRadio.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (inputDanmakuCustomColor) {
          inputDanmakuCustomColor.click();
        }
      });
    }

    const inputMarkerCustomColor = document.getElementById("setting-marker-custom-color");
    if (inputMarkerCustomColor) {
      inputMarkerCustomColor.addEventListener("input", (e) => {
        const dot = document.getElementById("setting-marker-color-custom-dot");
        if (dot) dot.style.background = e.target.value;
        const customRadio = document.getElementById("marker-color-custom-radio");
        if (customRadio) {
          customRadio.checked = true;
          customRadio.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
      inputMarkerCustomColor.addEventListener("change", () => {
        VT_DASHBOARD_SETTINGS.saveSettings();
      });
    }

    const markerCustomDot = document.getElementById("setting-marker-color-custom-dot");
    if (markerCustomDot) {
      markerCustomDot.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const customRadio = document.getElementById("marker-color-custom-radio");
        if (customRadio) {
          customRadio.checked = true;
          customRadio.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (inputMarkerCustomColor) {
          inputMarkerCustomColor.click();
        }
      });
    }

    const autoSaveCheckbox = document.getElementById("setting-auto-save");
    let autoSaveTimeout = null;

    const settingInputs = document.querySelectorAll(".settings-page-container input, .settings-page-container select, .settings-page-container textarea");
    settingInputs.forEach(input => {
      if (input.id === "setting-auto-save") return;
      input.addEventListener("change", () => {
        if (autoSaveCheckbox && autoSaveCheckbox.checked) {
          if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
          autoSaveTimeout = setTimeout(() => {
            VT_DASHBOARD_SETTINGS.saveSettings();
          }, 500);
        }
      });
    });
  };

  if (typeof window !== "undefined") {
    window.VT_DASHBOARD_SETTINGS = VT_DASHBOARD_SETTINGS;
  }
})();