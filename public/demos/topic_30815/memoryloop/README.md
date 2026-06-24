# Memory Loop

Project-level memory loop system for AI-assisted development in Trae.

## Features

- **Project Memory**: Hot/cold layer memory that persists across AI agent sessions
- **Schema-Driven**: Editable YAML schema defines memory structure
- **Auto-Compression**: Trigger compression when memory exceeds token threshold
- **Dashboard**: Apple-style web UI to view and edit memory
- **Multi-Language**: Chinese / English interface toggle
- **One-Click Install**: VS Code extension auto-starts server and initializes memory

## Usage

1. Install the extension in Trae
2. Open any project folder
3. Memory auto-initializes at `.trae/memory/`
4. Press `Ctrl+Shift+M` to open the dashboard
5. AI agent follows `SKILL.md` protocol to read/write memory

## Commands

- `Memory Loop: Open Dashboard` — Open the web UI
- `Memory Loop: Initialize Project Memory` — Create memory files
- `Memory Loop: Check Compression` — Check if compression needed
- `Memory Loop: Edit MEMORY.md` — Open memory file
- `Memory Loop: Edit Schema` — Open schema file

## Configuration

- `memoryLoop.autoInitialize`: Auto-init memory on project open (default: true)
- `memoryLoop.serverPort`: Local server port (default: 3721)
- `memoryLoop.autoOpenOnStart`: Auto-open dashboard on startup (default: false)

## License

MIT
