'use strict';

const fs = require('fs');
const path = require('path');

const defaultConfig = {
  shellName: 'Zeno Shell',
  logoText: 'ZENO',
  workspaces: [1, 2, 3, 4, 5],
  launcherShortcut: 'Super+Space',
  sidePanelShortcut: 'Super+S',
  widgets: [
    'widgets/workspace-summary.js',
    'widgets/resource-ticker.js'
  ],
};

function getConfigPath() {
  return path.join(__dirname, '..', '..', 'renderer', 'config', 'shell.config.json');
}

function getConfig() {
  const configPath = getConfigPath();
  try {
    if (!fs.existsSync(configPath)) return defaultConfig;
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultConfig, ...parsed };
  } catch {
    return defaultConfig;
  }
}

module.exports = { getConfig, getConfigPath };
