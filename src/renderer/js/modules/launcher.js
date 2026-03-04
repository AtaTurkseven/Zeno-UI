/* launcher.js
 * dmenu/rofi-style application launcher.
 * Opened with Super+Space (or the shortcut defined in app.js).
 * Keyboard-only navigation: type to filter, arrows to select, Enter to launch.
 */
(function () {
  'use strict';

  const overlay  = document.getElementById('launcher');
  const input    = document.getElementById('launcher-input');
  const results  = document.getElementById('launcher-results');

  let _items   = [];
  let _active  = 0;

  function highlight() {
    const items = results.querySelectorAll('li');
    items.forEach((li, i) => {
      li.classList.toggle('active', i === _active);
      if (i === _active) li.scrollIntoView({ block: 'nearest' });
    });
  }

  async function search(q) {
    try {
      _items  = await window.zenoAPI.searchApps(q);
    } catch {
      _items = [];
    }
    _active = 0;
    results.innerHTML = _items.map((name, i) =>
      `<li role="option" data-idx="${i}">${name}</li>`
    ).join('');
    highlight();

    results.querySelectorAll('li').forEach((li) => {
      li.addEventListener('click', () => {
        _active = parseInt(li.dataset.idx, 10);
        launch();
      });
    });
  }

  function launch() {
    const cmd = _items[_active];
    if (cmd) window.zenoAPI.launchApp(cmd).catch(() => {});
    close();
  }

  function open() {
    overlay.classList.add('open');
    input.value = '';
    search('');
    input.focus();
  }

  function close() {
    overlay.classList.remove('open');
    input.value = '';
    results.innerHTML = '';
  }

  // Keyboard navigation – no touch handling
  input.addEventListener('input', (e) => search(e.target.value));

  input.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        _active = Math.min(_active + 1, _items.length - 1);
        highlight();
        break;
      case 'ArrowUp':
        e.preventDefault();
        _active = Math.max(_active - 1, 0);
        highlight();
        break;
      case 'Enter':
        e.preventDefault();
        launch();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  });

  // Close on backdrop click (mouse only)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Expose open/close to app.js for keyboard shortcut binding
  window.zenoLauncher = { open, close };
}());
