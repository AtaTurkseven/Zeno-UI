'use strict';

const { app, BrowserWindow, ipcMain, globalShortcut, Menu } = require('electron');
const path = require('path');
const ipcHandler = require('./src/backend/ipc-handler');

// Disable all touch/gesture features – keyboard + mouse only
app.commandLine.appendSwitch('disable-touch-drag-drop');
app.commandLine.appendSwitch('disable-pinch');
app.commandLine.appendSwitch('touch-events', 'disabled');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    // Start fullscreen; can be toggled with F11
    fullscreen: true,
    frame: false,
    backgroundColor: '#0a0e14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // No touch emulation
      enableRemoteModule: false,
    },
    // Minimise memory: disable unused Chromium features
    webSecurity: true,
    show: false,
  });

  // Remove the default application menu
  Menu.setApplicationMenu(null);

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Register global keyboard shortcuts (no touch equivalents)
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  globalShortcut.register('Control+Q', () => {
    app.quit();
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Register all IPC handlers from the backend layer
ipcHandler.register(ipcMain);
