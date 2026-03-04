'use strict';

/**
 * launcher.js
 * Minimal app launcher: scans $PATH for executables and .desktop files,
 * then launches them as detached child processes.
 */

const { execFile, spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');

let _cache = null;

/**
 * Collect all executable names from $PATH directories.
 * Results are cached until next restart.
 * @returns {string[]}
 */
function buildCache() {
  if (_cache) return _cache;
  const dirs = (process.env.PATH || '').split(':').filter(Boolean);
  const names = new Set();

  for (const dir of dirs) {
    try {
      const entries = fs.readdirSync(dir);
      for (const e of entries) {
        try {
          fs.accessSync(path.join(dir, e), fs.constants.X_OK);
          names.add(e);
        } catch { /* not executable */ }
      }
    } catch { /* unreadable directory */ }
  }

  _cache = [...names].sort();
  return _cache;
}

/**
 * Search for apps matching a query string (case-insensitive prefix match).
 * @param {string} query
 * @returns {string[]}
 */
function search(query) {
  const all = buildCache();
  if (!query) return all.slice(0, 50);
  const q = query.toLowerCase();
  return all.filter((n) => n.toLowerCase().includes(q)).slice(0, 50);
}

/**
 * Launch a command as a detached child process.
 * @param {string} cmd
 * @returns {{ ok: boolean, error?: string }}
 */
function launch(cmd) {
  if (!cmd || typeof cmd !== 'string') return { ok: false, error: 'invalid command' };
  // Sanitise: only allow simple command names/paths, no shell metacharacters
  if (/[;&|`$<>]/.test(cmd)) return { ok: false, error: 'invalid characters in command' };

  const [bin, ...args] = cmd.trim().split(/\s+/);
  try {
    const child = spawn(bin, args, {
      detached: true,
      stdio:    'ignore',
      env:      process.env,
    });
    child.unref();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { search, launch };
