CodexJournal-Lite v1.4.2 - Interactive Demo Package
=====================================================

This is a sanitized interactive demo of CodexJournal-Lite, prepared for the
TRAE AI Creativity Competition preliminary submission.

QUICK START
-----------
  1. Extract this folder to any location on your computer.
  2. Double-click "index.html" to open it in your default browser.
  3. No installation, Node.js, or server required.

WHAT'S INSIDE
-------------
  index.html      - Modified entry point (relative paths, Demo Mode banner)
  app.js          - Original frontend application logic (unmodified)
  style.css       - Original stylesheet (unmodified)
  demo-data.js    - Fetch interceptor with all sanitized sample data
  README.txt      - This file

FEATURES YOU CAN TRY
--------------------
  - Dashboard: KPI cards, daily activity heatmap, task type chart, top
    keywords, recent activity feed, project activity breakdown.
  - Search (Ctrl+K): Global keyword search across tasks, journal files,
    and reports. Supports field syntax: source:, type:, date:, from:,
    to:, title:, keyword:, path:, "exact phrase", -exclude.
  - Journal: Browse daily journal entries by date.
  - Reports: View generated reports (dashboard, work-patterns, doctor,
    fingerprint-changes, release-readiness, idea-log-inventory, etc.).
  - Data: Browse data files (tasks.json, stats.json, patterns.json,
    search.md). Search and paginate through 328 tasks.
  - Verify: View the latest verification log.
  - Sources: See registered source adapters (Codex, Claude, etc.).
  - Actions: View the actions panel (buttons are visible but execution
    is disabled in Demo Mode).

DATA NOTICE
-----------
  All data in this demo is sanitized sample data, NOT real user data.
  - All usernames have been replaced with "demo".
  - All file paths use "C:\Users\demo" instead of real user paths.
  - No API keys, tokens, or passwords are included.
  - Session IDs and UUIDs are retained from the sanitized archive for
    realistic appearance.

LIMITATIONS
-----------
  - Actions (running commands like archive, verify, summarize) are
    disabled in Demo Mode. Clicking them will show a "Demo mode: actions
    disabled" message.
  - The Dist tab shows an empty list (no zip artifacts in demo).
  - SSE streaming for live job logs is not supported in demo mode.
  - Job history shows static sample entries.

CREDITS
-------
  CodexJournal-Lite is a daily coding journal and dashboard for Codex,
  Claude Code, and other AI coding assistant sessions.
  Version: 1.4.2
