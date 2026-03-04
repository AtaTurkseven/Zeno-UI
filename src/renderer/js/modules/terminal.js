/* terminal.js
 * Embedded terminal using xterm.js (loaded via CDN or local copy).
 * Falls back gracefully if xterm is not available.
 *
 * Note: xterm.js is loaded via a <script> tag added dynamically here.
 * In production the file should be bundled or served locally.
 */
(function () {
  'use strict';

  const container = document.getElementById('terminal-container');
  if (!container) return;

  // Dynamically load xterm.js from the local node_modules path
  // (In the built app, these will be bundled)
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function initTerminal() {
    try {
      await loadScript('../../../node_modules/xterm/lib/xterm.js');
    } catch {
      container.innerHTML = '<div style="padding:16px;color:var(--color-text-dim);">Terminal unavailable (xterm.js not found).<br>Run <kbd>npm install</kbd> to install dependencies.</div>';
      return;
    }

    /* global Terminal */
    const term = new Terminal({
      cursorBlink:     true,
      fontFamily:      getComputedStyle(document.documentElement)
                         .getPropertyValue('--font-mono') || 'monospace',
      fontSize:        13,
      theme: {
        background:  '#0d1117',
        foreground:  '#c9d1d9',
        cursor:      '#00d4ff',
        cursorAccent:'#0a0e14',
        selection:   'rgba(0, 212, 255, 0.2)',
      },
      // Disable touch support at the xterm level
      allowProposedApi: true,
    });

    term.open(container);

    // Resize observer keeps the PTY dimensions in sync
    const ro = new ResizeObserver(() => {
      const dims = term._core._renderService.dimensions;
      if (dims) {
        window.zenoAPI.ptyResize(term.cols, term.rows);
      }
    });
    ro.observe(container);

    // Create PTY session
    const result = await window.zenoAPI.ptyCreate(term.cols, term.rows);
    if (result && result.error) {
      term.writeln('\x1b[31m[Zeno-UI] PTY error: ' + result.error + '\x1b[0m');
      return;
    }

    // Forward PTY output → xterm
    const cleanup = window.zenoAPI.onPtyData((data) => term.write(data));

    // Forward xterm key input → PTY (keyboard only – no touch input)
    term.onData((data) => window.zenoAPI.ptyWrite(data));

    term.writeln('\x1b[36m╔══════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[36m║        Zeno-UI Terminal      ║\x1b[0m');
    term.writeln('\x1b[36m╚══════════════════════════════╝\x1b[0m');
    term.writeln('');

    // Focus terminal with Ctrl+` keyboard shortcut (handled in app.js)
    window._xtermFocus = () => term.focus();

    // Clean up on unload
    window.addEventListener('unload', cleanup);
  }

  initTerminal();
}());
