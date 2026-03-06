'use strict';

const fs = require('fs');
const net = require('net');
const path = require('path');
const { execFile } = require('child_process');

function getHyprRuntimeDir() {
  const runtimeDir = process.env.XDG_RUNTIME_DIR;
  const sig = process.env.HYPRLAND_INSTANCE_SIGNATURE;
  if (!runtimeDir || !sig) return null;
  return path.join(runtimeDir, 'hypr', sig);
}

function getSocketPaths() {
  const base = getHyprRuntimeDir();
  if (!base) return null;
  return {
    command: path.join(base, '.socket.sock'),
    events: path.join(base, '.socket2.sock'),
  };
}

function socketExists(socketPath) {
  return Boolean(socketPath && fs.existsSync(socketPath));
}

function runSocketCommand(command) {
  return new Promise((resolve, reject) => {
    const sockets = getSocketPaths();
    if (!sockets || !socketExists(sockets.command)) {
      reject(new Error('Hyprland IPC socket unavailable'));
      return;
    }

    let out = '';
    const conn = net.createConnection({ path: sockets.command }, () => {
      conn.write(command);
      conn.end();
    });

    conn.on('data', (chunk) => {
      out += chunk.toString('utf8');
    });

    conn.on('error', (err) => reject(err));
    conn.on('end', () => resolve(out.trim()));
  });
}

function execHyprctl(args) {
  return new Promise((resolve, reject) => {
    execFile('hyprctl', args, { timeout: 1500 }, (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }
      resolve((stdout || '').trim());
    });
  });
}

async function runJsonCommand(topic) {
  const payload = 'j/' + topic;
  try {
    const raw = await runSocketCommand(payload);
    return JSON.parse(raw || 'null');
  } catch {
    const raw = await execHyprctl(['-j', topic]);
    return JSON.parse(raw || 'null');
  }
}

async function dispatch(command) {
  try {
    await runSocketCommand('dispatch ' + command);
    return { ok: true };
  } catch {
    try {
      await execHyprctl(['dispatch', ...command.split(' ')]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
}

async function getState() {
  try {
    const [workspaces, activeWorkspace, activeWindow, clients] = await Promise.all([
      runJsonCommand('workspaces'),
      runJsonCommand('activeworkspace'),
      runJsonCommand('activewindow'),
      runJsonCommand('clients'),
    ]);

    return {
      connected: true,
      workspaces: Array.isArray(workspaces) ? workspaces : [],
      activeWorkspace: activeWorkspace || null,
      activeWindow: activeWindow || null,
      clients: Array.isArray(clients) ? clients : [],
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      workspaces: [],
      activeWorkspace: null,
      activeWindow: null,
      clients: [],
    };
  }
}

function parseEventLine(line) {
  const idx = line.indexOf('>>');
  if (idx === -1) return { type: 'raw', payload: line };
  return {
    type: line.slice(0, idx),
    payload: line.slice(idx + 2),
  };
}

let _eventSocket = null;
let _buffer = '';
const _listeners = new Set();

function notify(event) {
  _listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // Keep broadcasting even when one listener fails.
    }
  });
}

function ensureEventStream() {
  if (_eventSocket) return;

  const sockets = getSocketPaths();
  if (!sockets || !socketExists(sockets.events)) return;

  _eventSocket = net.createConnection({ path: sockets.events });

  _eventSocket.on('data', (chunk) => {
    _buffer += chunk.toString('utf8');
    const lines = _buffer.split('\n');
    _buffer = lines.pop() || '';
    lines.forEach((line) => {
      if (!line.trim()) return;
      notify(parseEventLine(line.trim()));
    });
  });

  _eventSocket.on('error', () => {
    _eventSocket = null;
    _buffer = '';
  });

  _eventSocket.on('close', () => {
    _eventSocket = null;
    _buffer = '';
    if (_listeners.size > 0) {
      setTimeout(ensureEventStream, 800);
    }
  });
}

function subscribe(listener) {
  _listeners.add(listener);
  ensureEventStream();

  return () => {
    _listeners.delete(listener);
    if (_listeners.size === 0 && _eventSocket) {
      _eventSocket.destroy();
      _eventSocket = null;
      _buffer = '';
    }
  };
}

module.exports = {
  getState,
  dispatch,
  subscribe,
  getSocketPaths,
};
