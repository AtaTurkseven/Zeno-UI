'use strict';

const { spawn } = require('child_process');

let _proc = null;
let _buffer = '';
const _listeners = new Set();

function notify(line) {
  _listeners.forEach((listener) => {
    try {
      listener(line);
    } catch {
      // Listener failures should not break stream fanout.
    }
  });
}

function startStream() {
  if (_proc || process.platform !== 'linux') return;

  _proc = spawn('journalctl', ['-f', '-n', '60', '--no-pager', '-o', 'short-iso'], {
    env: process.env,
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  _proc.stdout.on('data', (chunk) => {
    _buffer += chunk.toString('utf8');
    const lines = _buffer.split('\n');
    _buffer = lines.pop() || '';
    lines.forEach((line) => {
      if (line.trim()) notify(line);
    });
  });

  _proc.on('close', () => {
    _proc = null;
    _buffer = '';
    if (_listeners.size > 0) {
      setTimeout(startStream, 1000);
    }
  });
}

function stopStream() {
  if (_proc) {
    _proc.kill('SIGTERM');
    _proc = null;
    _buffer = '';
  }
}

function subscribe(listener) {
  _listeners.add(listener);
  startStream();

  return () => {
    _listeners.delete(listener);
    if (_listeners.size === 0) {
      stopStream();
    }
  };
}

module.exports = { subscribe };
