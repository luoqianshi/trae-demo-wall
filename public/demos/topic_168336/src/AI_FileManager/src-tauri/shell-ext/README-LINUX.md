# AI FileManager - Linux Nautilus 集成

## 前提条件

1. 安装 Nautilus Python 绑定：
   ```bash
   # Debian/Ubuntu
   sudo apt install python3-nautilus

   # Fedora
   sudo dnf install nautilus-python

   # Arch Linux
   sudo pacman -S nautilus-python

   # openSUSE
   sudo zypper install nautilus-python
   ```

2. 确保 `ai_filemanager` 可执行文件在 PATH 中，或设置环境变量：
   ```bash
   export AI_FILEMANAGER_BIN=/path/to/ai_filemanager
   ```

## 安装

```bash
mkdir -p ~/.local/share/nautilus-python/extensions
cp nai_ai_filemanager.py ~/.local/share/nautilus-python/extensions/
nautilus -q
```

## 验证

右键点击任意文件或目录，应能看到：
- "AI FileManager 管理" - 打开文件/目录
- "AI FileManager 扫描目录" - 扫描目录（仅对目录有效）
- "AI FileManager 计算哈希" - 计算文件哈希（仅对文件有效）