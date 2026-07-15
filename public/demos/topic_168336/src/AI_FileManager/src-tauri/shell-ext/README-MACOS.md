# AI FileManager - macOS Finder 集成

## 方法一：Automator 快速操作（推荐）

1. 打开 Automator（应用程序 → Automator）
2. 选择"快速操作"
3. 配置：
   - 工作流程收到当前：`文件或文件夹`
   - 位于：`Finder`
4. 添加"运行 Shell 脚本"操作：
   - Shell：`/bin/bash`
   - 传递输入：`作为自变量`
   - 脚本：
     ```bash
     AI_FILEMANAGER="/Applications/AI FileManager.app/Contents/MacOS/ai_filemanager"
     for f in "$@"; do
         "$AI_FILEMANAGER" "$f" &
     done
     ```
5. 保存为"AI FileManager 管理"

## 方法二：AppleScript 脚本

创建 `ai_filemanager_finder.applescript`：

```applescript
on run {input, parameters}
    set appPath to (POSIX path of (path to application "AI FileManager") & "Contents/MacOS/ai_filemanager")
    repeat with itemPath in input
        set posixPath to POSIX path of itemPath
        do shell script appPath & " " & quoted form of posixPath & " &> /dev/null &"
    end repeat
end run
```

编译为应用程序：
```bash
osacompile -o "AI FileManager Helper.app" ai_filemanager_finder.applescript
```

## 方法三：Swift Finder Extension（高级）

完整的 Finder Sync Extension 需要 Xcode 项目。参考 Apple 官方文档：
https://developer.apple.com/documentation/findersync/finder_sync_extension

## 卸载

删除 Automator 快速操作或 Finder Extension 即可。