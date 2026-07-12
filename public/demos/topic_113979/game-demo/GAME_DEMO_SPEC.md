# Game-Like HTML Demo Spec

## Objective

Create an offline, browser-openable HTML Demo that lets a judge immediately understand the core Workspace Switcher action:

`multiple active desktops -> workspace management -> enter resource release mode -> record each workspace -> close each workspace -> clean desktop -> restore saved workspaces`

The Demo should feel like watching and controlling one display. The display automatically cycles through several simulated desktops, each with different windows. The evaluator then opens workspace management, triggers the mode transition, and later restores the saved workspaces. Restore is a first-class act, not a short afterthought.

## Audience

TRAE AI Creativity Competition judges. They may not be able to run Windows automation scripts on their machines, so the HTML Demo must communicate the product value safely and quickly.

## Core UX

Use a single-page experience with one dominant central display.

Required layout:

- Top: a short safety statement and product name.
- Center: a large `Display Simulator` that automatically switches between desktops.
- Bottom or side: a compact workspace-management control panel.
- Optional small area: concise status messages. Do not make logs the primary experience.

Recommended mission name:

`Workspace Release Demo`

Recommended Chinese display name:

`工作区释放演示`

## Required Demonstration States

### State 0: Auto Preview

Purpose: Show the problem before asking the evaluator to act.

Required content:

- This is a simulated HTML Demo.
- It does not operate real windows, virtual desktops, PowerToys, browsers, or PowerShell.
- The large display automatically cycles through four simulated desktops.
- Each desktop shows 3-5 representative windows, such as browser windows, notes, editor, terminal, documents, and chat/reference tools.
- Do not reproduce all 28 historical windows in the main display.

Primary visual:

- A monitor frame that cycles `Desktop 1 -> Desktop 2 -> Desktop 3 -> Desktop 4`.
- Window cards should be spatially placed inside the monitor, not listed as a dense inventory.
- A small desktop indicator should show which desktop is currently visible.

Primary action:

- `打开工作区管理`

### State 1: Workspace Management

Purpose: Make the product action clear.

Required content:

- A compact management panel appears over or beside the monitor.
- The panel lists four workspaces/desktops with short labels.
- The primary button is `进入游戏 / 重任务模式` or `释放资源`.
- The label can mention both use cases: game session or AI/heavy task.

Do not lead this state with metrics. The evaluator should understand the action from the four saved workspace labels and the monitor animation.

Primary action:

- `进入游戏 / 重任务模式`

### State 2: Record Workspaces

Purpose: Show that the current workspace is recorded before anything is closed.

Visual requirements:

- The display cycles through each desktop once.
- Each desktop gets a `已记录` / `Saved` stamp.
- Browser URL windows can briefly show a small `URL saved` label.
- Minimized/pollution details should be optional small annotations, not the main event.

Do not interrupt this animation with historical metrics. Technical details such as minimized snapshot exclusions belong in the final evidence layer.

Automatic transition:

- After all desktops are recorded, proceed to closing workspaces.

### State 3: Close Workspaces

Purpose: Show the release moment.

Visual requirements:

- Workspaces close one by one.
- Each desktop briefly appears, its windows shrink/fade, then the desktop tile is marked `已收起`.
- End with a clean desktop on the display.
- The effect should be obvious even without reading text.

Do not show exit codes or residual counts during the close animation. The main result is the clean desktop.

Final visual:

- A clean single desktop.
- A simple target card, selected from the release target:
  - `AI 重任务准备就绪`
  - `游戏会话准备就绪`

### State 4: Restore Workspace

Purpose: Show the second half of the product promise.

Visual requirements:

- A `恢复工作区` button brings the four desktops back.
- Desktop windows reappear in their saved positions.
- Browser URL cards restore until 8/8.

Keep restore visual-first. Technical metrics appear only after the workspaces have visibly returned.

Primary action:

- `恢复工作区`

### State 5: Verification Report

Purpose: Provide evidence after the evaluator has understood the product.

Required sections:

- Final metrics table.
- Screenshot placeholders.
- Video link placeholder.
- TRAE Session ID placeholders.
- Optional debug cards collapsed by default.

Required final metrics:

- Desktops before: 4
- Screens: 2
- Baseline visible windows: 28
- Game mode exit code: 0
- Desktops after game mode: 1
- Residual configured and managed close targets: 0
- Minimized snapshot entries excluded: 2
- Restore exit code: 0
- Desktops after restore: 4
- Browser args using `--new-window`: 8/8
- PowerToys duplicate app entries: 0
- Hard Failures: None

Primary action:

- `查看验证报告`
- Optional: `重新开始`

## Debug Mission Cards

The report screen may include these five debug cards, but they must be collapsed by default and secondary to the visual flow:

1. Minimized window pollution
   - Problem: minimized windows can pollute snapshots and restore to the wrong workspace.
   - Fix: exclude minimized snapshot entries.
   - Metric: Minimized snapshot entries excluded: 2

2. Edge/Chrome URL mismatch
   - Problem: restored browser URLs can land in the wrong window.
   - Fix: restore browser entries using `--new-window`.
   - Metric: Browser args using `--new-window`: 8/8

3. OneNote/Edge residual windows
   - Problem: managed work windows can remain after entering game mode.
   - Fix: close configured and managed workspace targets, then verify residual count.
   - Metric: Residual configured and managed close targets: 0

4. Dual-screen coordinate drift
   - Problem: layouts can drift across two displays.
   - Fix: treat screen layout and window placement as verification targets.
   - Metric: Screens: 2 and Restore exit code: 0

5. Edge delayed old-tab restore
   - Problem: Edge can restore old tabs late and interfere with expected URLs.
   - Fix: isolate restoration with new-window browser args and browser placement checks.
   - Metric: Browser args using `--new-window`: 8/8

Each card should be clickable/expandable.

## Required File Structure

Create:

```text
contest/game-demo/
  index.html
  README.md
  package-note.md
  assets/
    css/style.css
    js/app.js
    js/demo-data.js
    js/scenes.js
    img/.gitkeep
  docs/
    acceptance-checklist.md
    post-materials-template.md
    session-notes-template.md
```

## Implementation Constraints

- Use plain HTML/CSS/JavaScript.
- No npm.
- No CDN.
- No external images.
- Use relative local paths only.
- The page must work by double-clicking `index.html`.
- If JavaScript fails, the page should still show a clear static description.
- Every simulated log line must be marked as simulated, for example `[SIMULATED]`.
- The page must visibly state: `本页面是安全的前端模拟，不会操作真实窗口、虚拟桌面、PowerToys 或 PowerShell。`

## Restore Act Override

The restore act is first-class. Do not shorten it into a quick final metric update.

Required restore experience:

1. The evaluator clicks a restore control from the clean desktop state.
2. Desktop 1, Desktop 2, Desktop 3, and Desktop 4 return in sequence.
3. Each returning desktop visibly brings back its previously recorded windows.
4. Browser URL entries restore until the display reaches `8/8`.
5. The final restored display should clearly match the original multi-desktop workspace concept.
6. Only after this visual restore should the Demo reveal compact evidence metrics.

The point is to show reversible resource release. If the Demo only closes windows, it looks like a close-all script.

## Visual Direction

Use a practical, soft desktop demonstration interface:

- Light or neutral background with enough contrast for the simulated monitor.
- One large monitor/display area.
- Rounded window cards that look like actual windows rather than tiny data rows.
- Friendly, slightly cartoon-like shapes so the evaluator understands this is a simulation.
- Strong before/after contrast.
- Clear mode transition animation.
- Clear metric cards only after the main flow.
- Compact buttons.
- No marketing hero page.
- No decorative gradient blobs/orbs.
- Keep typography readable and professional.

This is a productivity tool Demo, not a game site. The "game-like" aspect should come from watching the workspace transform and controlling the mode transition.
