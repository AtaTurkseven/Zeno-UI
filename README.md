# Zeno-UI

A futuristic, keyboard/mouse-driven Linux desktop environment shell inspired by [eDEX-UI](https://github.com/GitSquared/edex-ui), built with Electron and Node.js — **without any touchscreen support**.

---

## Features

| Panel | Description |
|---|---|
| **System Monitor** | Live CPU (aggregate + per-core), RAM, swap, disk, and network stats read directly from `/proc` and `/sys` |
| **Process Viewer** | Top 100 processes sorted by CPU time, auto-refreshed every 3 s |
| **Filesystem Navigator** | Keyboard-navigable directory browser (Arrow keys, Enter, Backspace) |
| **Terminal** | Full embedded PTY shell via `node-pty` + `xterm.js` |
| **App Launcher** | dmenu/rofi-style overlay (`Super+Space`) |

### Additional highlights
- **Animated canvas background** — matrix-rain effect at a capped 30 fps
- **JSON theme system** — swap themes at runtime with `Ctrl+Shift+T`; add your own `.json` file in `src/renderer/css/themes/`
- **Modular plugin architecture** — drop a folder with `index.js` into `src/plugins/` and load it via IPC
- **Strict security** — `contextIsolation: true`, no `nodeIntegration`, narrow `contextBridge` API
- **No touch code** — all gesture APIs disabled at the Chromium command-line level

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Super+Space` | Open app launcher |
| `Ctrl+1` – `Ctrl+4` | Focus System Monitor / Terminal / Processes / Files |
| `Ctrl+`` ` `` | Focus terminal |
| `Ctrl+Shift+T` | Cycle theme |
| `F11` | Toggle fullscreen |
| `Ctrl+Q` | Quit |

### Filesystem navigator
| Key | Action |
|---|---|
| `↑` / `↓` | Move selection |
| `Enter` | Open directory |
| `Backspace` | Go up one level |

---

## Project Structure

```
Zeno-UI/
├── main.js                          # Electron main process (window, shortcuts, IPC registration)
├── preload.js                       # contextBridge API exposed to renderer
├── package.json
├── src/
│   ├── backend/
│   │   ├── ipc-handler.js           # IPC channel router
│   │   └── modules/
│   │       ├── system-stats.js      # CPU/RAM from /proc, disk/net via systeminformation
│   │       ├── process-list.js      # Process list from /proc/<pid>/stat
│   │       ├── filesystem.js        # Safe directory listing and file reads
│   │       ├── pty-manager.js       # PTY lifecycle via node-pty
│   │       ├── launcher.js          # $PATH scanner + detached process spawner
│   │       └── theme-manager.js     # JSON theme loader
│   ├── renderer/
│   │   ├── index.html               # Main layout (CSS grid, no touch attributes)
│   │   ├── css/
│   │   │   ├── main.css             # Full UI stylesheet (CSS variables, no touch styles)
│   │   │   └── themes/
│   │   │       ├── default.json     # Cyber Blue theme
│   │   │       └── matrix.json      # Matrix Green theme
│   │   └── js/
│   │       ├── app.js               # Renderer entry: theme loading, keyboard shortcuts
│   │       ├── canvas-bg.js         # Animated matrix-rain canvas (30 fps cap)
│   │       └── modules/
│   │           ├── system-monitor.js
│   │           ├── process-viewer.js
│   │           ├── filesystem-nav.js
│   │           ├── terminal.js
│   │           └── launcher.js
│   └── plugins/
│       └── plugin-loader.js         # Discovers and loads plugins from src/plugins/
└── tests/                           # Jest unit tests (backend modules)
```

---

## Prerequisites

- Linux (X11 or Wayland)
- Node.js ≥ 18
- npm ≥ 9

---

## Build & Run

```bash
# 1. Clone the repository
git clone https://github.com/AtaTurkseven/Zeno-UI.git
cd Zeno-UI

# 2. Install dependencies
npm install

# 3. Run in development
npm start

# 4. Build a distributable AppImage / .deb
npm run build
```

### Running tests

```bash
npm test
```

---

## Creating a Theme

Add a JSON file to `src/renderer/css/themes/`:

```json
{
  "name": "My Theme",
  "--color-bg":      "#0a0a0a",
  "--color-accent":  "#ff6600",
  "--color-text":    "#dddddd"
}
```

Cycle themes with `Ctrl+Shift+T` at runtime.

---

## Writing a Plugin

Create a directory inside `src/plugins/my-plugin/` with an `index.js`:

```js
module.exports = {
  name:    'My Plugin',
  version: '1.0.0',
  init()  { console.log('plugin loaded'); },
};
```

Load it at runtime via the IPC API:

```js
await window.zenoAPI.loadPlugin('my-plugin');
```

---

## Performance Notes

- System stats are read natively from `/proc` — no external polling daemons.
- Canvas background is capped at **30 fps** to reduce GPU pressure.
- The process list returns at most **100 entries** per poll.
- Electron's `--disable-pinch` and `touch-events=disabled` flags prevent touch emulation overhead.
- Target memory footprint: **< 300 MB** (Electron base ~150 MB + renderer ~50–100 MB).

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Renderer Process              │
│  index.html + JS modules + xterm.js    │
│  (contextIsolation, no nodeIntegration) │
└───────────────┬─────────────────────────┘
                │  contextBridge (zenoAPI)
                │  IPC (ipcRenderer.invoke / ipcRenderer.on)
┌───────────────┴─────────────────────────┐
│           Main Process                  │
│  main.js → ipc-handler.js              │
│  ├── system-stats  (/proc, si)         │
│  ├── process-list  (/proc/<pid>)       │
│  ├── filesystem    (fs module)         │
│  ├── pty-manager   (node-pty)          │
│  ├── launcher      (spawn, $PATH)      │
│  ├── theme-manager (JSON files)        │
│  └── plugin-loader (require())         │
└─────────────────────────────────────────┘
```

---

## License

MIT
