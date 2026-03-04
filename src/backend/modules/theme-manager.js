'use strict';

/**
 * theme-manager.js
 * Loads JSON theme files from src/renderer/css/themes/.
 * Themes are simple JSON objects mapping CSS variable names to values.
 */

const fs   = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '..', '..', 'renderer', 'css', 'themes');

/**
 * Return an array of available theme names (file stems).
 * @returns {string[]}
 */
function list() {
  try {
    return fs.readdirSync(THEMES_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.basename(f, '.json'));
  } catch {
    return [];
  }
}

/**
 * Load and return a theme object by name.
 * @param {string} name
 * @returns {Record<string,string>}
 */
function get(name) {
  const safe = path.basename(name).replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = path.join(THEMES_DIR, `${safe}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Theme "${safe}" not found`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

module.exports = { list, get };
