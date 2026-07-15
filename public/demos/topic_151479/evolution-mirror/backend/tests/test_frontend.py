"""
前端静态检查脚本
在不启动后端的情况下，检查 webapp.html 的代码完整性
用法: python tests/test_frontend.py
"""

import re
import sys
from pathlib import Path

# 颜色输出
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RESET = "\033[0m"

WEBAPP_PATH = Path(__file__).parent.parent.parent / "webapp.html"


def log_pass(msg):
    print(f"  {GREEN}PASS{RESET} {msg}")


def log_fail(msg):
    print(f"  {RED}FAIL{RESET} {msg}")


def log_warn(msg):
    print(f"  {YELLOW}WARN{RESET} {msg}")


def check_exists(content, pattern, name):
    """检查代码片段是否存在"""
    matches = list(re.finditer(pattern, content, re.MULTILINE))
    if len(matches) == 1:
        log_pass(f"{name} 存在")
        return True
    elif len(matches) == 0:
        log_fail(f"{name} 缺失！可能代码被意外删除")
        return False
    else:
        log_warn(f"{name} 出现 {len(matches)} 次（可能有重复定义）")
        return True


def run_checks():
    print("=" * 60)
    print("进化镜 前端静态检查 (Frontend Static Check)")
    print("=" * 60)

    if not WEBAPP_PATH.exists():
        log_fail(f"webapp.html 未找到: {WEBAPP_PATH}")
        return False

    content = WEBAPP_PATH.read_text(encoding="utf-8")
    all_passed = True

    print("\n[1/4] CDN 资源引入检查")
    all_passed &= check_exists(content, r"unpkg\.com/easymde", "EasyMDE CDN")
    all_passed &= check_exists(content, r"<script src=\"https://unpkg\.com/easymde", "EasyMDE JS 引入")
    all_passed &= check_exists(content, r"<link rel=\"stylesheet\" href=\"https://unpkg\.com/easymde", "EasyMDE CSS 引入")

    print("\n[2/4] 核心函数定义检查")
    critical_functions = [
        (r"function initEasyMDE\(content\)", "initEasyMDE()"),
        (r"function getEditorContent\(\)", "getEditorContent()"),
        (r"function setEditorContent\(content\)", "setEditorContent()"),
        (r"function focusEditor\(\)", "focusEditor()"),
        (r"function destroyEasyMDE\(\)", "destroyEasyMDE()"),
        (r"async function openNote\(id\)", "openNote()"),
        (r"function closeEditor\(\)", "closeEditor()"),
        (r"function onEditorChange\(\)", "onEditorChange()"),
        (r"function debounce\(", "debounce()"),
        (r"function updatePinButton\(isPinned\)", "updatePinButton()"),
        (r"async function togglePin\(\)", "togglePin()"),
        (r"function showEditorView\(\)", "showEditorView()"),
        (r"function showListView\(\)", "showListView()"),
        (r"function quickCreateNote\(\)", "quickCreateNote()"),
        (r"function showLoading\(\)", "showLoading()"),
        (r"function hideLoading\(\)", "hideLoading()"),
        (r"function showToast\(", "showToast()"),
        (r"function showError\(", "showError()"),
        (r"async function loadNotes\(\)", "loadNotes()"),
        (r"async function loadFolders\(\)", "loadFolders()"),
        (r"async function loadTags\(\)", "loadTags()"),
        (r"async function aiAnalyze\(\)", "aiAnalyze()"),
        (r"async function aiGenerateTags\(\)", "aiGenerateTags()"),
        (r"async function deleteCurrentNote\(\)", "deleteCurrentNote()"),
        (r"async function emptyTrash\(\)", "emptyTrash()"),
        (r"function toggleTagSelector\(\)", "toggleTagSelector()"),
        (r"function toggleNoteTag\(", "toggleNoteTag()"),
        (r"function startRecording\(\)", "startRecording()"),
        (r"function stopRecording\(\)", "stopRecording()"),
        (r"function showImportModal\(\)", "showImportModal()"),
        (r"function switchImportTab\(", "switchImportTab()"),
        (r"async function importConfirm\(\)", "importConfirm()"),
        (r"async function loadAll\(\)", "loadAll()"),
    ]
    for pattern, name in critical_functions:
        if not check_exists(content, pattern, name):
            all_passed = False

    print("\n[3/4] 重复定义检查")
    duplicate_functions = [
        (r"function initEasyMDE\(", "initEasyMDE"),
        (r"function getEditorContent\(\)", "getEditorContent"),
        (r"function destroyEasyMDE\(\)", "destroyEasyMDE"),
        (r"async function openNote\(", "openNote"),
        (r"function closeEditor\(\)", "closeEditor"),
        (r"function onEditorChange\(\)", "onEditorChange"),
        (r"async function togglePin\(\)", "togglePin"),
    ]
    dup_ok = True
    for pattern, name in duplicate_functions:
        count = len(re.findall(pattern, content))
        if count > 1:
            log_fail(f"{name} 重复定义 {count} 次！上次编辑可能破坏了代码结构")
            dup_ok = False
    if dup_ok:
        log_pass("所有关键函数均无重复定义")

    print("\n[4/4] 语法完整性检查")
    # 检查 script 标签是否成对
    script_open = len(re.findall(r"<script[>\s]", content, re.IGNORECASE))
    script_close = len(re.findall(r"</script>", content, re.IGNORECASE))
    if script_open == script_close:
        log_pass(f"<script> 标签成对 ({script_open} 对)")
    else:
        log_fail(f"<script> 标签不成对！open={script_open}, close={script_close}")
        all_passed = False

    # 检查 IIFE 是否完整
    iife_open = content.count("(function()")
    iife_close = content.count("})();")
    if iife_open == iife_close:
        log_pass(f"IIFE 函数成对 ({iife_open} 对)")
    else:
        log_warn(f"IIFE 函数可能不完整: open={iife_open}, close={iife_close}")

    # 检查括号平衡（粗略）
    open_braces = content.count("{")
    close_braces = content.count("}")
    if open_braces == close_braces:
        log_pass(f"花括号平衡 ({{{open_braces}}})")
    else:
        diff = open_braces - close_braces
        if diff < 0:
            log_warn(f"花括号不平衡: 多 {abs(diff)} 个 '}}' 需要检查")
        else:
            log_warn(f"花括号不平衡: 多 {diff} 个 '{{' 需要检查")

    # 检查未闭合的字符串（简单检测）
    odd_quotes = content.count("'") % 2
    if odd_quotes == 0:
        log_pass("单引号数量成对")
    else:
        log_warn("单引号数量不成对，可能存在未闭合的字符串")

    print("\n" + "=" * 60)
    if all_passed:
        print(f"{GREEN}全部通过，前端代码结构完整{RESET}")
    else:
        print(f"{RED}存在异常，请检查上述 FAIL 项{RESET}")
    print("=" * 60)
    return all_passed


if __name__ == "__main__":
    ok = run_checks()
    sys.exit(0 if ok else 1)
