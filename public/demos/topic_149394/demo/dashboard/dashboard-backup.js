/**
 * VidBuddy 管理中心 - 数据备份模块
 * 负责数据的导出和导入功能
 */
(function () {
  const VT_DASHBOARD_BACKUP = {};

  /**
   * 初始化备份模块
   */
  VT_DASHBOARD_BACKUP.init = function () {
    const btnBackupData = document.getElementById("btn-backup-data");
    const btnImportData = document.getElementById("btn-import-data");
    const backupFileInput = document.getElementById("backup-file-input");

    if (btnBackupData) {
      btnBackupData.addEventListener("click", () => {
        VT_DASHBOARD_BACKUP.exportData();
      });
    }

    if (btnImportData && backupFileInput) {
      btnImportData.addEventListener("click", () => {
        backupFileInput.value = "";
        backupFileInput.click();
      });

      backupFileInput.addEventListener("change", (e) => {
        VT_DASHBOARD_BACKUP.importData(e);
      });
    }
  };

  /**
   * 导出数据到本地文件
   * 导出流程：
   * 1. 从 chrome.storage.local 读取所有数据
   * 2. 序列化为格式化的 JSON 字符串（2空格缩进）
   * 3. 创建 Blob 对象并生成下载链接
   * 4. 自动触发下载，文件名包含时间戳
   * 5. 释放 URL 对象，避免内存泄漏
   * @returns {void}
   */
  VT_DASHBOARD_BACKUP.exportData = function () {
    chrome.storage.local.get(null, (allData) => {
      try {
        // 序列化为格式化的 JSON 字符串，便于人工阅读和编辑
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        const now = new Date();
        // 生成时间戳：YYYYMMDD_HHmm 格式，确保文件名唯一且有序
        const timeStamp =
          now.getFullYear() +
          String(now.getMonth() + 1).padStart(2, "0") +
          String(now.getDate()).padStart(2, "0") +
          "_" +
          String(now.getHours()).padStart(2, "0") +
          String(now.getMinutes()).padStart(2, "0");
        a.download = `video_tools_backup_${timeStamp}.json`;
        a.href = url;
        a.click();
        // 释放临时 URL 对象，避免内存泄漏
        URL.revokeObjectURL(url);

        if (window.VT_MODAL && window.VT_MODAL.showToast) {
          window.VT_MODAL.showToast("📥 数据导出成功，文件已开始下载！", "success");
        }
      } catch (e) {
        if (window.VT_MODAL && window.VT_MODAL.showToast) {
          window.VT_MODAL.showToast("❌ 数据导出失败，请重试！", "error");
        }
      }
    });
  };

  /**
   * 从本地文件导入数据
   * 导入流程：
   * 1. 获取用户选择的文件
   * 2. 使用 FileReader 读取文件内容
   * 3. 解析 JSON 并验证数据格式（必须包含 progressHistory/markers/prefAutoHideDelay 之一）
   * 4. 显示确认对话框（提醒用户将覆盖所有现有数据）
   * 5. 用户确认后：先清空现有数据，再导入新数据，最后刷新页面
   * @param {Event} e - 文件选择事件
   */
  VT_DASHBOARD_BACKUP.importData = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);

        // 数据格式验证：检查是否包含本插件特有的数据结构
        // 有效备份必须包含 progressHistory、markers 或 prefAutoHideDelay 中的至少一项
        const hasHistory = Array.isArray(importedData.progressHistory);
        const hasMarkers = Array.isArray(importedData.markers);

        // 验证失败：不是本插件的有效备份文件
        if (!hasHistory && !hasMarkers && !importedData.prefAutoHideDelay) {
          if (window.VT_MODAL && window.VT_MODAL.showToast) {
            window.VT_MODAL.showToast("❌ 导入失败：该 JSON 文件不属于本插件的有效备份！", "error");
          }
          return;
        }

        // 显示确认对话框：导入会覆盖所有现有数据，必须用户确认
        if (window.VT_MODAL && window.VT_MODAL.showConfirm) {
          window.VT_MODAL.showConfirm({
            title: "导入数据",
            message: "⚠️ 注意：导入此文件将彻底覆盖你本机的全部播放历史和标记数据，是否继续？",
            icon: "warning",
          }).then((confirmed) => {
            if (confirmed) {
              // 先清空现有数据，再导入新数据
              chrome.storage.local.clear(() => {
                chrome.storage.local.set(importedData, () => {
                  if (window.VT_MODAL && window.VT_MODAL.showToast) {
                    window.VT_MODAL.showToast("⚡ 数据已成功载入！正在刷新控制台...", "success");
                  }
                  // 延迟刷新页面，让用户看到成功提示
                  setTimeout(() => {
                    location.reload();
                  }, 1200);
                });
              });
            }
          });
        }
      } catch (err) {
        // JSON 解析失败：文件格式错误
        if (window.VT_MODAL && window.VT_MODAL.showToast) {
          window.VT_MODAL.showToast("❌ 导入失败：JSON 文件格式错误！", "error");
        }
      }
    };
    reader.readAsText(file);
  };

  if (typeof window !== "undefined") {
    window.VT_DASHBOARD_BACKUP = VT_DASHBOARD_BACKUP;
  }
})();