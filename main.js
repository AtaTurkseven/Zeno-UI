'use strict';

const { app, BrowserWindow, ipcMain, globalShortcut, Menu } = require('electron');
const path = require('path');
const ipcHandler = require('./src/backend/ipc-handler');

// Disable all touch/gesture features – keyboard + mouse only
app.commandLine.appendSwitch('disable-touch-drag-drop');
app.commandLine.appendSwitch('disable-pinch');
app.commandLine.appendSwitch('touch-events', 'disabled');

let mainWindow = null;
let splashWindow = null;
let shellReady = false;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    backgroundColor: '#03070b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    show: true,
  });

  splashWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'splash.html'));
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function finishStartup() {
  if (shellReady) return;
  shellReady = true;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }

  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('splash:progress', {
      stage: 'Desktop ready',
      progress: 100,
      done: true,
    });

    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      splashWindow = null;
    }, 500);
  }
}

function sendShellAction(action) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('shell:shortcut', action);
  }
}

function registerShellShortcuts() {
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  globalShortcut.register('Control+Q', () => {
    app.quit();
  });

  globalShortcut.register('Super+Space', () => sendShellAction('toggle-launcher'));
  globalShortcut.register('Super+S', () => sendShellAction('toggle-side-panel'));

  for (let i = 1; i <= 9; i += 1) {
    globalShortcut.register(`Super+${i}`, () => sendShellAction(`workspace-${i}`));
  }
}

app.whenReady().then(() => {
  createSplashWindow();
  createWindow();
  registerShellShortcuts();

  ipcMain.on('shell:startup-progress', (_event, payload) => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.send('splash:progress', payload || {});
    }
  });

  ipcMain.once('shell:ready', () => {
    finishStartup();
  });

  // Fallback to avoid an endless splash if renderer startup hook fails.
  setTimeout(() => {
    if (!shellReady) finishStartup();
  }, 12000);
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
