'use strict';

/**
 * pty-manager.js
 * Manages a single pseudo-terminal session using node-pty.
 * Data is forwarded to the renderer via the sender's webContents.
 */

let pty = null;
try {
  pty = require('node-pty');
} catch {
  console.warn('[pty-manager] node-pty not available – terminal disabled');
}

const os = require('os');

let _ptyProcess = null;
let _sender     = null;

/**
 * Spawn a new PTY process (bash by default).
 * @param {Electron.WebContents} sender
 * @param {number} cols
 * @param {number} rows
 */
function create(sender, cols = 80, rows = 24) {
  if (!pty) return { error: 'node-pty not installed' };

  // Clean up any existing PTY
  if (_ptyProcess) {
    try { _ptyProcess.kill(); } catch { /* ignore */ }
  }

  _sender = sender;
  const shell = process.env.SHELL || (os.platform() === 'win32' ? 'cmd.exe' : 'bash');

  _ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd:  process.env.HOME || os.homedir(),
    env:  process.env,
  });

  _ptyProcess.onData((data) => {
    if (_sender && !_sender.isDestroyed()) {
      _sender.send('pty:data', data);
    }
  });

  _ptyProcess.onExit(() => {
    _ptyProcess = null;
    if (_sender && !_sender.isDestroyed()) {
      _sender.send('pty:data', '\r\n[Process exited]\r\n');
    }
  });

  return { ok: true };
}

function write(data) {
  if (_ptyProcess) _ptyProcess.write(data);
}

function resize(cols, rows) {
  if (_ptyProcess) _ptyProcess.resize(cols, rows);
}

module.exports = { create, write, resize };
