# Game Demo Acceptance Checklist

## File Scope

- [ ] All new Demo files are under `contest/game-demo`.
- [ ] No file in `E:\learning\新建文件夹\workspace-control` was modified.
- [ ] No original automation script was changed unless explicitly requested later.

## Offline Runtime

- [ ] `contest/game-demo/index.html` opens by double-clicking.
- [ ] The Demo works without internet.
- [ ] No CDN, external images, npm, build step, or network request is required.
- [ ] All CSS and JS use relative local paths.

## Safety

- [ ] The page clearly says it is a simulation.
- [ ] No PowerShell execution is present.
- [ ] No real window-closing logic is present.
- [ ] No virtual desktop API calls are present.
- [ ] No PowerToys configuration modification is present.
- [ ] No browser URL reading from the user's real browser is present.

## User Flow

- [ ] The evaluator can complete the full path:
  `briefing -> diagnose -> snapshot -> game/focus mode -> restore -> report`.
- [ ] There is a visible mission progress indicator.
- [ ] Disabled buttons prevent out-of-order flow.
- [ ] Event logs are marked `[SIMULATED]`.
- [ ] The final screen includes a restart option.

## Visual Simulation

- [ ] Diagnose state shows 4 virtual desktops.
- [ ] Diagnose state shows 2 screens.
- [ ] Diagnose state represents 28 visible windows.
- [ ] Game/focus mode visually shrinks to 1 desktop.
- [ ] Restore state visually restores 4 desktops.
- [ ] Browser restore panel shows 8/8 restored entries.

## Metrics

- [ ] Desktops before: 4
- [ ] Screens: 2
- [ ] Baseline visible windows: 28
- [ ] Game mode exit code: 0
- [ ] Desktops after game mode: 1
- [ ] Residual configured and managed close targets: 0
- [ ] Minimized snapshot entries excluded: 2
- [ ] Restore exit code: 0
- [ ] Desktops after restore: 4
- [ ] Browser args using `--new-window`: 8/8
- [ ] PowerToys duplicate app entries: 0
- [ ] Hard Failures: None

## Debug Story

- [ ] Minimized window pollution card exists.
- [ ] Edge/Chrome URL mismatch card exists.
- [ ] OneNote/Edge residual close card exists.
- [ ] Dual-screen coordinate drift card exists.
- [ ] Edge delayed old-tab restore card exists.
- [ ] Each card explains problem, fix, and metric.

## Competition Materials

- [ ] `docs/post-materials-template.md` exists.
- [ ] It includes at least 3 screenshot placeholders.
- [ ] It includes at least 3 TRAE Session ID placeholders.
- [ ] It explicitly says not to fabricate screenshots or Session IDs.
- [ ] `docs/session-notes-template.md` exists.
- [ ] `package-note.md` explains how to zip the Demo.

