/* app.js – Renderer entry point
 * Wires together all modules, registers keyboard shortcuts,
 * and applies the active theme.
 * No touch gesture handling anywhere in this file.
 */
(function () {
  'use strict';

  // ── Panel focus cycling (Ctrl+1 … Ctrl+4) ──────────────────────────────────
  const PANELS = [
    '#panel-sysmon',
    '#panel-terminal',
    '#panel-procs',
    '#panel-fs',
  ];

  function focusPanel(idx) {
    const el = document.querySelector(PANELS[idx]);
    if (!el) return;
    // Focus the first focusable element inside, or the panel itself
    const focusable = el.querySelector('input, [tabindex="0"], .panel-body');
    (focusable || el).focus();
  }

  // ── Theme loader ──────────────────────────────────────────────────────────
  async function applyTheme(name) {
    try {
      const theme = await window.zenoAPI.getTheme(name);
      const root  = document.documentElement;
      for (const [key, value] of Object.entries(theme)) {
        if (key.startsWith('--')) {
          root.style.setProperty(key, value);
        }
      }
      const sbTheme = document.getElementById('sb-theme');
      if (sbTheme) sbTheme.textContent = theme.name || name;
    } catch (e) {
      console.warn('[app] Theme load failed:', e.message);
    }
  }

  // ── Plugin status ─────────────────────────────────────────────────────────
  async function refreshPluginCount() {
    try {
      const plugins = await window.zenoAPI.listPlugins();
      const el = document.getElementById('sb-plugins');
      if (el) el.textContent = plugins.length;
    } catch { /* ignore */ }
  }

  // ── Global keyboard shortcuts (no touch equivalents) ──────────────────────
  document.addEventListener('keydown', (e) => {
    // Ctrl+1..4  → focus panel
    if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      focusPanel(parseInt(e.key, 10) - 1);
      return;
    }

    // Ctrl+` → focus terminal
    if (e.ctrlKey && e.key === '`') {
      e.preventDefault();
      if (window._xtermFocus) window._xtermFocus();
      return;
    }

    // Super+Space → open launcher
    if (e.metaKey && e.key === ' ') {
      e.preventDefault();
      if (window.zenoLauncher) window.zenoLauncher.open();
      return;
    }

    // Ctrl+Shift+T → cycle theme
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      cycleTheme();
      return;
    }
  });

  // ── Theme cycling ─────────────────────────────────────────────────────────
  let _themeList  = [];
  let _themeIdx   = 0;

  async function initThemes() {
    try {
      _themeList = await window.zenoAPI.listThemes();
    } catch {
      _themeList = ['default'];
    }
    if (_themeList.length > 0) applyTheme(_themeList[0]);
  }

  function cycleTheme() {
    if (_themeList.length === 0) return;
    _themeIdx = (_themeIdx + 1) % _themeList.length;
    applyTheme(_themeList[_themeIdx]);
  }

  // ── Boot sequence ─────────────────────────────────────────────────────────
  initThemes();
  refreshPluginCount();
}());
