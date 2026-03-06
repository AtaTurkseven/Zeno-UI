'use strict';

/**
 * preload.js – runs in the renderer context with Node access disabled.
 * Exposes a narrow, typed API surface to the renderer via contextBridge.
 * No touch APIs are exposed.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('zenoAPI', {
  // ── System stats ────────────────────────────────────────────────────────────
  getSystemStats: () => ipcRenderer.invoke('system:stats'),
  getProcessList: () => ipcRenderer.invoke('system:processes'),
  getDiskInfo:    () => ipcRenderer.invoke('system:disk'),
  getNetworkInfo: () => ipcRenderer.invoke('system:network'),

  // ── Filesystem ──────────────────────────────────────────────────────────────
  listDirectory:  (dirPath) => ipcRenderer.invoke('fs:list', dirPath),
  readFile:       (filePath) => ipcRenderer.invoke('fs:read', filePath),

  // ── Terminal (PTY) ──────────────────────────────────────────────────────────
  ptyCreate:  (cols, rows) => ipcRenderer.invoke('pty:create', { cols, rows }),
  ptyWrite:   (data)       => ipcRenderer.send('pty:write', data),
  ptyResize:  (cols, rows) => ipcRenderer.send('pty:resize', { cols, rows }),
  onPtyData:  (cb) => {
    const handler = (_event, data) => cb(data);
    ipcRenderer.on('pty:data', handler);
    return () => ipcRenderer.removeListener('pty:data', handler);
  },

  // ── App launcher ────────────────────────────────────────────────────────────
  searchApps:  (query) => ipcRenderer.invoke('launcher:search', query),
  launchApp:   (cmd)   => ipcRenderer.invoke('launcher:launch', cmd),

  // ── Theme ────────────────────────────────────────────────────────────────────
  getTheme:    (name) => ipcRenderer.invoke('theme:get', name),
  listThemes:  ()     => ipcRenderer.invoke('theme:list'),

  // ── Plugin system ────────────────────────────────────────────────────────────
  listPlugins:  () => ipcRenderer.invoke('plugins:list'),
  loadPlugin:   (name) => ipcRenderer.invoke('plugins:load', name),

  // ── Shell runtime config ─────────────────────────────────────────────────────
  getShellConfig: () => ipcRenderer.invoke('shell:config'),

  // ── Hyprland integration ─────────────────────────────────────────────────────
  getHyprlandState: () => ipcRenderer.invoke('hyprland:state'),
  switchWorkspace:  (workspaceId) => ipcRenderer.invoke('hyprland:switch-workspace', workspaceId),
  focusWindow:      (address) => ipcRenderer.invoke('hyprland:focus-window', address),
  subscribeHyprland: (cb) => {
    ipcRenderer.send('hyprland:subscribe');
    const handler = (_event, payload) => cb(payload);
    ipcRenderer.on('hyprland:event', handler);
    return () => ipcRenderer.removeListener('hyprland:event', handler);
  },

  // ── Log stream ───────────────────────────────────────────────────────────────
  subscribeLogs: (cb) => {
    ipcRenderer.send('logs:subscribe');
    const handler = (_event, line) => cb(line);
    ipcRenderer.on('logs:line', handler);
    return () => ipcRenderer.removeListener('logs:line', handler);
  },

  // ── Startup lifecycle ────────────────────────────────────────────────────────
  reportStartupProgress: (stage, progress) => ipcRenderer.send('shell:startup-progress', { stage, progress }),
  markShellReady: () => ipcRenderer.send('shell:ready'),
  onShellShortcut: (cb) => {
    const handler = (_event, action) => cb(action);
    ipcRenderer.on('shell:shortcut', handler);
    return () => ipcRenderer.removeListener('shell:shortcut', handler);
  },
});

contextBridge.exposeInMainWorld('zenoSplash', {
  onProgress: (cb) => {
    const handler = (_event, payload) => cb(payload);
    ipcRenderer.on('splash:progress', handler);
    return () => ipcRenderer.removeListener('splash:progress', handler);
  },
});
