#!/usr/bin/env python3
"""
AI FileManager - Nautilus (GNOME Files) 右键菜单插件

为 Linux GNOME 文件管理器（Nautilus）提供右键菜单集成。
功能：
- 文件右键："AI FileManager 管理"
- 目录右键："AI FileManager 扫描目录"

安装：
1. 将本脚本复制到 ~/.local/share/nautilus-python/extensions/
2. 确保已安装 python3-nautilus 包：
   sudo apt install python3-nautilus  # Debian/Ubuntu
   sudo dnf install nautilus-python    # Fedora
3. 重启 Nautilus：nautilus -q
4. 在 Nautilus 中右键文件即可看到菜单项

注意：需要设置 AI_FILEMANAGER_BIN 环境变量指向 AI FileManager 可执行文件路径，
或者将 ai_filemanager 命令添加到 PATH 中。
"""

import os
import subprocess
from typing import List

try:
    from gi import require_version
    require_version("Nautilus", "3.0")
    from gi.repository import Nautilus, GObject
except ImportError:
    # Fallback for older Nautilus
    import gi
    gi.require_version("Nautilus", "3.0")
    from gi.repository import Nautilus, GObject


class AIFileManagerExtension(GObject.GObject, Nautilus.MenuProvider):
    """AI FileManager Nautilus Extension"""

    def __init__(self):
        super().__init__()
        self._app_bin = self._get_app_path()

    def _get_app_path(self) -> str:
        """获取 AI FileManager 可执行文件路径"""
        env_path = os.environ.get("AI_FILEMANAGER_BIN")
        if env_path and os.path.isfile(env_path):
            return env_path

        # 搜索 PATH
        for path_dir in os.environ.get("PATH", "").split(os.pathsep):
            candidate = os.path.join(path_dir, "ai_filemanager")
            if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
                return candidate

        # 默认路径
        default_paths = [
            "/usr/local/bin/ai_filemanager",
            "/usr/bin/ai_filemanager",
            os.path.expanduser("~/.local/bin/ai_filemanager"),
        ]
        for path in default_paths:
            if os.path.isfile(path):
                return path

        return "ai_filemanager"

    def _get_file_paths(self, files: List[Nautilus.FileInfo]) -> List[str]:
        """提取文件路径列表"""
        paths = []
        for file_info in files:
            location = file_info.get_location()
            if location:
                path = location.get_path()
                if path:
                    paths.append(path)
        return paths

    def _run_app(self, args: List[str]) -> None:
        """启动 AI FileManager"""
        try:
            subprocess.Popen(
                [self._app_bin] + args,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception as e:
            print(f"AI FileManager: Failed to launch: {e}")

    def _on_menu_manage(self, menu: Nautilus.MenuItem, files: List[Nautilus.FileInfo]) -> None:
        """管理文件"""
        paths = self._get_file_paths(files)
        if paths:
            self._run_app(paths)

    def _on_menu_scan(self, menu: Nautilus.MenuItem, files: List[Nautilus.FileInfo]) -> None:
        """扫描目录"""
        paths = self._get_file_paths(files)
        if paths:
            self._run_app(["--scan"] + paths)

    def _on_menu_hash(self, menu: Nautilus.MenuItem, files: List[Nautilus.FileInfo]) -> None:
        """计算哈希"""
        paths = self._get_file_paths(files)
        if paths:
            self._run_app(["--hash"] + paths)

    def get_file_items(self, files: List[Nautilus.FileInfo]) -> List[Nautilus.MenuItem]:
        """为文件创建菜单项"""
        if len(files) == 0:
            return []

        # 检查是否所有选中项都是目录
        all_dirs = all(f.is_directory() for f in files if not f.is_gone())

        items = []

        # 管理菜单项（对所有文件/目录）
        item_manage = Nautilus.MenuItem(
            name="AIFileManager::Manage",
            label="AI FileManager 管理",
            tip="使用 AI FileManager 打开选中文件",
            icon="applications-system",
        )
        item_manage.connect("activate", self._on_menu_manage, files)
        items.append(item_manage)

        if all_dirs:
            # 扫描目录菜单项
            item_scan = Nautilus.MenuItem(
                name="AIFileManager::Scan",
                label="AI FileManager 扫描目录",
                tip="使用 AI FileManager 扫描选中目录",
                icon="folder-scan",
            )
            item_scan.connect("activate", self._on_menu_scan, files)
            items.append(item_scan)

        # 哈希菜单项（仅对文件）
        has_files = any(not f.is_directory() for f in files if not f.is_gone())
        if has_files or not all_dirs:
            item_hash = Nautilus.MenuItem(
                name="AIFileManager::Hash",
                label="AI FileManager 计算哈希",
                tip="计算选中文件的哈希值",
                icon="dialog-password",
            )
            item_hash.connect("activate", self._on_menu_hash, files)
            items.append(item_hash)

        return items

    def get_background_items(self, folder: Nautilus.FileInfo) -> List[Nautilus.MenuItem]:
        """为文件夹背景创建菜单项"""
        item_open = Nautilus.MenuItem(
            name="AIFileManager::OpenFolder",
            label="AI FileManager 打开此目录",
            tip="使用 AI FileManager 打开当前目录",
            icon="applications-system",
        )
        item_open.connect("activate", self._on_menu_manage, [folder])
        return [item_open]