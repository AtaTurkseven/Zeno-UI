'use strict';

/**
 * plugin-loader.js
 * Discovers and loads plugins from the src/plugins/ directory.
 * Each plugin is a CommonJS module that exports: { name, version, init(api) }.
 */

const fs   = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname);
const _loaded = new Map();

/**
 * List available plugin names (sub-directories with an index.js).
 * @returns {string[]}
 */
function list() {
  try {
    return fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(PLUGINS_DIR, e.name, 'index.js')))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * Load a plugin by directory name.
 * @param {string} name
 * @returns {{ name: string, version: string }}
 */
function load(name) {
  const safe = path.basename(name).replace(/[^a-zA-Z0-9_-]/g, '');
  const pluginPath = path.join(PLUGINS_DIR, safe, 'index.js');
  if (!fs.existsSync(pluginPath)) throw new Error(`Plugin "${safe}" not found`);

  if (_loaded.has(safe)) return _loaded.get(safe);

  const plugin = require(pluginPath);
  if (typeof plugin.init === 'function') plugin.init();
  _loaded.set(safe, { name: plugin.name || safe, version: plugin.version || '0.0.1' });
  return _loaded.get(safe);
}

module.exports = { list, load };
