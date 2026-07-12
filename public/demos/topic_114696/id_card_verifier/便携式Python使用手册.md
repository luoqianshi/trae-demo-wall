# 便携式 Python 完整使用手册

## 概述

本方案使用**嵌入式 Python**（Portable Python），使程序在没有安装 Python 的电脑上也能运行。

---

## 📦 方案优势

- ✅ **不需要安装 Python** - 整个文件夹可复制
- ✅ **不需要管理员权限**
- ✅ **完全离线** - 首次下载后无需网络

---

## 🚀 使用步骤

### 1. 准备 zip 文件

确保项目文件夹中有：
```
python-3.10.11-embed-amd64.zip
```

如果没有，请从这里下载：
https://www.python.org/ftp/python/3.10.11/python-3.10.11-embed-amd64.zip

### 2. 运行设置脚本

双击运行：
```
setup_portable_complete.bat
```

### 3. 等待安装完成

约需 10-20 分钟。

### 4. 下载 OCR 模型

双击运行：
```
download_models.bat
```

### 5. 启动程序

双击运行：
```
start.bat
```

---

## 📂 最终文件夹结构

设置完成后，您的文件夹应该是这样的：

```
id_card_verifier/
├── start.bat                         ← 日常启动用这个
├── setup_portable_complete.bat       ← 仅首次设置用
├── download_models.bat
├── main_v2.5.py
├── requirements.txt
├── python-3.10.11-embed-amd64.zip    ← 保留备份（可选）
│
├── python/                           ← 便携式 Python（重要）
│   ├── python.exe
│   ├── python310.zip
│   ├── python310._pth
│   ├── get-pip.py
│   ├── Scripts/
│   │   └── pip.exe
│   ├── Lib/
│   │   └── site-packages/
│   └── ...
│
└── models/                           ← OCR 模型（重要）
    ├── det/
    ├── rec/
    └── cls/
```

---

## 🔧 故障排除

### 问题 1：setup_portable_complete.bat 闪退

**解决方法**：
1. 右键点击脚本
2. 选择“打开方式” → “命令提示符”
3. 查看错误信息

### 问题 2：Python 找不到 encodings 模块

**原因**：`python310._pth` 配置错误

**解决方法**：
检查 `python\python310._pth` 文件内容，确保是：
```
python310.zip
.
Lib
Lib\site-packages

import site
```

### 问题 3：pip 安装失败

**解决方法**：
1. 删除 `python` 文件夹
2. 重新运行 `setup_portable_complete.bat`
3. 如果仍然失败，尝试直接用系统 Python（见下文）

---

## 🛟 备用方案：系统 Python

如果便携式方案遇到问题，也可以直接用系统 Python：

### 使用系统 Python 的步骤：

1. 安装 Python 3.10 或 3.11
   - 下载：https://www.python.org/downloads/
   - 安装时 **勾选 "Add Python to PATH"**

2. 运行：
   ```
   install.bat
   ```

3. 运行：
   ```
   download_models.bat
   ```

4. 运行程序：
   ```
   python main_v2.5.py
   ```

---

## 📦 分发到其他电脑

设置完成后，整个文件夹可以复制到任何 Windows 电脑：

1. 确保包含：
   - `python/` 文件夹（全部）
   - `models/` 文件夹（全部）
   - `main_v2.5.py`
   - `start.bat`
   - `requirements.txt`

2. 在目标电脑上：
   - 复制整个文件夹
   - 双击 `start.bat`
   - 无需安装任何东西

---

## ⚡ 常见问题

### Q: 为什么不打包成 exe？
A: PaddleOCR 与 PyInstaller 兼容性问题复杂，便携式方案更稳定。

### Q: 文件夹会不会很大？
A: 大约 200-500MB，现代存储完全不是问题。

### Q: 需要管理员权限吗？
A: 完全不需要，放在任何文件夹都能用。

---

## 📞 需要帮助？

查看日志：`%USERPROFILE%\id_verifier_error.log`
