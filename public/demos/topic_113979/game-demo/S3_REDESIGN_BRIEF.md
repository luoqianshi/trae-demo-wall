# S3 Redesign Brief

The current S3 result is not acceptable as the final direction.

It looks like an internal verification dashboard: dense cards, log panel, metric-first layout, and a report state. This does not help a judge understand the product quickly.

## New Core Principle

The Demo only needs to show the core visual transformation:

1. A large simulated display automatically switches across multiple desktops.
2. Each desktop contains different windows.
3. The evaluator opens workspace management.
4. The evaluator clicks `进入游戏 / 重任务模式` or `释放资源`.
5. The display records each workspace.
6. The workspaces are closed one by one.
7. The Demo reaches a clean desktop for the release target.
8. The evaluator restores the saved workspaces.
9. The same desktops and windows return in a clear sequence.

Everything else is secondary.

The Demo does not need to reproduce exact historical experiment counts such as 28 windows. The real project will be published for download and hands-on use. The HTML Demo's job is to communicate the workflow and value clearly.

## What To Remove Or De-Emphasize

- Do not make the event log a primary panel.
- Do not start from a verification report.
- Do not lead with `Hard Failures: None`.
- Do not show 28 windows as a dense spreadsheet/grid.
- Do not make resource bars, CPU/GPU numbers, or performance claims.
- Do not make debug cards visible before the evaluator understands the core workflow.

## New First-Screen Experience

The first screen should be dominated by a simulated monitor.

Resolved desktop count:

- Use 4 simulated desktops.
- Each desktop should show 3-5 representative rounded windows.
- Do not reproduce all 28 historical windows in the main display.

The monitor automatically cycles:

- Desktop 1: development/editor/windows
- Desktop 2: browser research/resources
- Desktop 3: notes/documents
- Desktop 4: chat/reference/tasks

Each desktop should feel like a real workspace, with windows placed in the monitor area.

## Visual Style

Use a soft desktop simulation style.

The display should be recognizable as a desktop environment:

- monitor frame
- desktop name
- small taskbar or dock
- rounded application windows
- window title bars
- app icons
- browser URL labels

But it should not be a pixel-perfect Windows clone. Make it rounded, friendly, and slightly cartoon-like so the evaluator subconsciously understands this is a simulation. Avoid the current hard dashboard/report look.

Good direction:

- large rounded monitor
- colorful but restrained app icons
- soft shadows
- clear window placement
- simple animated window movement

Avoid:

- dense data grids
- tiny table-like window cards
- heavy log panel
- sharp enterprise dashboard cards
- pure abstract blocks with no desktop meaning

After a few seconds, the evaluator should understand:

> This user has many active workspaces open, not just one messy screen.

## Main Interaction

The primary action is:

`打开工作区管理`

After opening it, show a compact management panel:

- Desktop 1: development workspace
- Desktop 2: browser/research workspace
- Desktop 3: notes/documents workspace
- Desktop 4: communication/reference workspace

Then show one primary action:

`进入游戏 / 重任务模式`

The mode copy can mention both release targets:

- AI heavy task
- Game session

## Interaction Model

Use one-click sequences, not tutorial-style micro steps.

The evaluator should click only the major product actions:

1. `打开工作区管理`
2. `进入游戏 / 重任务模式`
3. `恢复工作区`

After each click, the Demo should automatically animate the full sequence. Do not add pause controls, next-step controls, or per-desktop confirmation buttons. This product is easy to understand; the Demo should feel like a tool doing work, not like a lesson.

## Save And Close Animation

After clicking the primary action:

1. The display switches to Desktop 1.
2. Desktop 1 windows get a `已记录` stamp.
3. Desktop 1 windows fade/slide away.
4. Desktop 1 is marked `已收起`.
5. Repeat for Desktop 2, Desktop 3, Desktop 4.
6. End with a clean single desktop.

The judge should be able to understand this without reading logs.

## Restore Action

After the clean desktop state, show a restore action as the second major act:

`恢复工作区`

On click:

1. The clean desktop stays visible for a moment so the evaluator understands the release result.
2. Desktop 1 returns with its saved windows.
3. Desktop 2 returns with its saved windows.
4. Desktop 3 returns with its saved windows.
5. Desktop 4 returns with its saved windows.
6. Browser URL restore shows `8/8`.
7. A compact evidence strip appears:
   - Desktops after restore: 4
   - Browser args using `--new-window`: 8/8
   - Residual configured and managed close targets: 0
   - Hard Failures: None

The restore animation should be as clear and deliberate as the close animation. The product promise is not "close everything"; it is "release resources without losing the work state."

## Evidence Layer

Only after the visual flow is complete should the Demo reveal:

- Optional experiment metrics
- Screenshot placeholders
- Video placeholder
- TRAE Session ID placeholders
- Optional debug cards

The evidence layer proves the visual story. It is not the story.

Historical numbers such as 28 windows and `Hard Failures: None` may appear here, but must not drive the main interaction or first screen.

## Implementation Instruction For TRAE

Refactor the current S3 page toward this design. Prefer changing the existing HTML/CSS/JS over adding more panels.

Keep all work under:

`contest/game-demo`

Do not execute or call real PowerShell, virtual desktop, PowerToys, window, or browser APIs.
