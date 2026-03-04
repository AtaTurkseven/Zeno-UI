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
});
