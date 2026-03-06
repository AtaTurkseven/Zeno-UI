'use strict';

/**
 * ipc-handler.js
 * Central router that connects IPC channels to backend modules.
 * Each module exposes pure async functions; this file wires them to ipcMain.
 */

const systemStats  = require('./modules/system-stats');
const processList  = require('./modules/process-list');
const filesystem   = require('./modules/filesystem');
const ptyManager   = require('./modules/pty-manager');
const launcher     = require('./modules/launcher');
const themeManager = require('./modules/theme-manager');
const pluginLoader = require('../plugins/plugin-loader');
const hyprland     = require('./modules/hyprland-ipc');
const logStream    = require('./modules/log-stream');
const shellConfig  = require('./modules/shell-config');

/**
 * @param {Electron.IpcMain} ipcMain
 */
function register(ipcMain) {
  const senderCleanups = new Map();

  function pushSenderCleanup(sender, cleanup) {
    if (!sender || typeof cleanup !== 'function') return;
    const key = sender.id;
    if (!senderCleanups.has(key)) {
      senderCleanups.set(key, []);
      sender.once('destroyed', () => {
        const cleanups = senderCleanups.get(key) || [];
        cleanups.forEach((fn) => {
          try { fn(); } catch { /* ignore */ }
        });
        senderCleanups.delete(key);
      });
    }
    senderCleanups.get(key).push(cleanup);
  }

  // ── System stats ────────────────────────────────────────────────────────────
  ipcMain.handle('system:stats',     () => systemStats.getStats());
  ipcMain.handle('system:processes', () => processList.getProcesses());
  ipcMain.handle('system:disk',      () => systemStats.getDisk());
  ipcMain.handle('system:network',   () => systemStats.getNetwork());

  // ── Filesystem ──────────────────────────────────────────────────────────────
  ipcMain.handle('fs:list', (_event, dirPath) => filesystem.listDirectory(dirPath));
  ipcMain.handle('fs:read', (_event, filePath) => filesystem.readFile(filePath));

  // ── Terminal (PTY) ──────────────────────────────────────────────────────────
  ipcMain.handle('pty:create', (event, { cols, rows }) =>
    ptyManager.create(event.sender, cols, rows)
  );
  ipcMain.on('pty:write',  (_event, data)        => ptyManager.write(data));
  ipcMain.on('pty:resize', (_event, { cols, rows }) => ptyManager.resize(cols, rows));

  // ── App launcher ────────────────────────────────────────────────────────────
  ipcMain.handle('launcher:search', (_event, query) => launcher.search(query));
  ipcMain.handle('launcher:launch', (_event, cmd)   => launcher.launch(cmd));

  // ── Theme ────────────────────────────────────────────────────────────────────
  ipcMain.handle('theme:get',  (_event, name) => themeManager.get(name));
  ipcMain.handle('theme:list', ()             => themeManager.list());

  // ── Plugin system ────────────────────────────────────────────────────────────
  ipcMain.handle('plugins:list', ()           => pluginLoader.list());
  ipcMain.handle('plugins:load', (_event, n)  => pluginLoader.load(n));

  // ── Shell config ─────────────────────────────────────────────────────────────
  ipcMain.handle('shell:config', () => shellConfig.getConfig());

  // ── Hyprland integration ─────────────────────────────────────────────────────
  ipcMain.handle('hyprland:state', () => hyprland.getState());
  ipcMain.handle('hyprland:switch-workspace', (_event, workspaceId) =>
    hyprland.dispatch(`workspace ${workspaceId}`)
  );
  ipcMain.handle('hyprland:focus-window', (_event, address) =>
    hyprland.dispatch(`focuswindow address:${address}`)
  );

  ipcMain.on('hyprland:subscribe', (event) => {
    const sender = event.sender;
    const cleanup = hyprland.subscribe((payload) => {
      if (!sender.isDestroyed()) {
        sender.send('hyprland:event', payload);
      }
    });
    pushSenderCleanup(sender, cleanup);
  });

  // ── Live log stream ──────────────────────────────────────────────────────────
  ipcMain.on('logs:subscribe', (event) => {
    const sender = event.sender;
    const cleanup = logStream.subscribe((line) => {
      if (!sender.isDestroyed()) {
        sender.send('logs:line', line);
      }
    });
    pushSenderCleanup(sender, cleanup);
  });
}

module.exports = { register };
