/**
 * 文件上传交互脚本
 * 支持拖拽上传和文件预览
 */
(function() {
    "use strict";

    const uploadZone = document.getElementById("uploadZone");
    const fileInput = document.getElementById("fileInput");
    const uploadPreview = document.getElementById("uploadPreview");
    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");
    const uploadLabel = document.querySelector(".upload-label");

    if (!fileInput) return;

    // 文件选择
    fileInput.addEventListener("change", function(e) {
        if (e.target.files.length > 0) {
            showFile(e.target.files[0]);
        }
    });

    // 拖拽
    if (uploadZone) {
        uploadZone.addEventListener("dragover", function(e) {
            e.preventDefault();
            uploadZone.classList.add("dragover");
        });

        uploadZone.addEventListener("dragleave", function(e) {
            e.preventDefault();
            uploadZone.classList.remove("dragover");
        });

        uploadZone.addEventListener("drop", function(e) {
            e.preventDefault();
            uploadZone.classList.remove("dragover");

            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                showFile(e.dataTransfer.files[0]);
            }
        });
    }

    function showFile(file) {
        if (uploadLabel) uploadLabel.style.display = "none";
        if (uploadPreview) uploadPreview.style.display = "flex";
        if (fileName) fileName.textContent = file.name;
        if (fileSize) {
            fileSize.textContent = formatSize(file.size);
        }
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }

    // AI 模式切换时显示/隐藏 AI 配置
    const aiModeSelect = document.getElementById("aiMode");
    const aiConfigRow = document.getElementById("aiConfigRow");

    if (aiModeSelect && aiConfigRow) {
        function toggleAiConfig() {
            const mode = aiModeSelect.value;
            if (mode === "manual") {
                aiConfigRow.style.display = "none";
            } else {
                aiConfigRow.style.display = "";
            }
        }
        aiModeSelect.addEventListener("change", toggleAiConfig);
        toggleAiConfig(); // 初始化
    }
})();
