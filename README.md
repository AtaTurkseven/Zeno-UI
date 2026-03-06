# Zeno Shell

Minimal Linux desktop shell UI for Hyprland (Wayland), built with Electron.

## What It Provides

- Fullscreen shell UI that runs as the primary desktop layer after login
- Boot splash screen with progress stages and fade transition
- Top system bar with:
  - workspaces
  - CPU / RAM / GPU usage
  - network throughput
  - battery state
  - clock
- Rofi-style keyboard launcher (`Super+Space`)
- Workspace/window integration over Hyprland IPC
- Slide-out side panel (`Super+S`) with live logs and AI helper tools
- Dynamic widget loading from configuration

## Startup Flow

1. Display splash screen
2. Initialize desktop shell
3. Load widgets and panels
4. Connect to Hyprland IPC
5. Show desktop UI

Renderer reports these startup stages to the splash window through IPC.

## Project Structure

```text
main.js
preload.js
scripts/
  start-zeno-shell.sh            # Main launcher script for session startup
  hyprland.conf.snippet          # Hyprland startup integration snippet
src/
  backend/
    ipc-handler.js
    modules/
      hyprland-ipc.js            # Hyprland command socket + event stream
      log-stream.js              # journalctl live stream bridge
      shell-config.js            # Desktop shell runtime config loader
      system-stats.js            # CPU/RAM/GPU/Battery + disk/network metrics
      launcher.js                # Application search and process launch
      ...
  renderer/
    splash.html                  # Boot splash UI
    index.html                   # Desktop shell UI
    config/
      shell.config.json          # Shell settings + dynamic widgets
    css/
      splash.css
      main.css
    js/
      splash.js
      app.js                     # Startup orchestration
      modules/
        system-bar.js
        workspace-shell.js
        launcher-shell.js
        side-panel.js
        widget-loader.js
      widgets/
        workspace-summary.js
        resource-ticker.js
```

## Run

```bash
npm install
npm start
```

## Run As Shell In Hyprland

1. Make launcher executable:

```bash
chmod +x scripts/start-zeno-shell.sh
```

2. Add this to `~/.config/hypr/hyprland.conf`:

```ini
exec-once = /absolute/path/to/Zeno-UI/scripts/start-zeno-shell.sh
```

3. Log out and log in again to start with Zeno Shell as your desktop UI layer.

## Keyboard-First Controls

- `Super+Space`: toggle launcher
- `Super+S`: toggle side panel
- `Super+1..9`: switch workspace
- `Ctrl+K`: open launcher (fallback)
- `Esc`: close launcher/panel
- `Ctrl+Q`: quit shell

## Notes

- Hyprland IPC uses `$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE` sockets.
- If IPC is unavailable, shell runs in degraded mode and still renders UI.
- The shell does not replace Hyprland tiling behavior; it wraps and controls it via IPC.
