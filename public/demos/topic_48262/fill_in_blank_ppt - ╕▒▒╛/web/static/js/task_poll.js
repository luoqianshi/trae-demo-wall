/**
 * 任务轮询脚本
 * 自动轮询任务状态并更新 UI
 */
(function() {
    "use strict";

    const POLL_INTERVAL = 1000; // 1 秒
    const MAX_POLLS = 600;     // 最多轮询 10 分钟

    let pollCount = 0;
    let polling = true;

    function updateUI(data) {
        // 更新进度条
        const progressBar = document.getElementById("progressBar");
        if (progressBar) {
            progressBar.style.width = data.progress + "%";
        }

        // 更新进度文字
        const progressText = document.getElementById("taskProgressText");
        if (progressText) {
            progressText.textContent = data.progress + "%";
        }

        // 更新状态标签
        const statusBadge = document.getElementById("taskStatus");
        if (statusBadge) {
            statusBadge.textContent = data.message || data.status;
            statusBadge.className = "task-status-badge status-" + data.status;
        }

        // 更新日志
        const logContainer = document.getElementById("logContainer");
        if (logContainer && data.log_lines) {
            // 只追加新行
            const existingCount = logContainer.children.length;
            if (data.log_lines.length > existingCount) {
                for (let i = existingCount; i < data.log_lines.length; i++) {
                    const line = document.createElement("div");
                    line.className = "log-line";
                    line.textContent = data.log_lines[i];
                    logContainer.appendChild(line);
                }
                // 自动滚动到底部
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        }

        // 任务完成或失败时停止轮询
        if (data.status === "success" || data.status === "failed" || data.status === "timeout") {
            polling = false;

            // 显示操作按钮
            const actionsDiv = document.getElementById("taskActions");
            if (actionsDiv) {
                actionsDiv.style.display = "flex";
            }

            // 成功时自动刷新页面以加载下载按钮
            if (data.status === "success") {
                setTimeout(function() {
                    window.location.reload();
                }, 1500);
            }

            // 失败时显示错误
            if (data.status === "failed" && data.error) {
                const existingAlert = document.querySelector(".alert-error");
                if (!existingAlert) {
                    const alert = document.createElement("div");
                    alert.className = "alert alert-error";
                    alert.innerHTML = "<strong>任务失败</strong><pre class=\"error-detail\">" +
                        data.error + "</pre>";
                    const taskPage = document.querySelector(".task-page");
                    if (taskPage) {
                        taskPage.insertBefore(alert, document.querySelector(".task-log-section"));
                    }
                }
            }
        }
    }

    function poll() {
        if (!polling || pollCount >= MAX_POLLS) return;

        pollCount++;

        fetch(STATUS_URL)
            .then(function(response) {
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.json();
            })
            .then(function(data) {
                updateUI(data);
                if (polling) {
                    setTimeout(poll, POLL_INTERVAL);
                }
            })
            .catch(function(err) {
                console.error("Poll error:", err);
                if (polling) {
                    setTimeout(poll, POLL_INTERVAL * 2);
                }
            });
    }

    // 启动轮询
    if (typeof STATUS_URL !== "undefined") {
        setTimeout(poll, POLL_INTERVAL);
    }
})();
