/* filesystem-nav.js
 * Directory browser with keyboard navigation.
 * Keyboard: Arrow keys to move selection, Enter to open, Backspace to go up.
 * Mouse: click to select, double-click to open.
 */
(function () {
  'use strict';

  let _currentPath = null;
  let _entries     = [];
  let _selected    = 0;

  const body   = document.getElementById('fs-body');
  const crumbs = document.getElementById('fs-crumbs');

  const ICON = { directory: '📁', file: '📄', symlink: '🔗' };

  function render() {
    if (!body) return;
    crumbs.textContent = _currentPath || '/';

    body.innerHTML = _entries.map((e, i) => `
      <div class="fs-entry ${e.type} ${i === _selected ? 'selected' : ''}"
           data-idx="${i}" role="option"
           aria-selected="${i === _selected}"
           tabindex="${i === _selected ? 0 : -1}">
        <span class="fs-icon">${ICON[e.type] || '·'}</span>
        <span class="fs-name">${e.name}</span>
      </div>`).join('');

    body.querySelectorAll('.fs-entry').forEach((el) => {
      el.addEventListener('click', () => {
        _selected = parseInt(el.dataset.idx, 10);
        render();
      });
      el.addEventListener('dblclick', () => openSelected());
    });
  }

  async function navigate(dirPath) {
    try {
      _entries  = await window.zenoAPI.listDirectory(dirPath);
      _currentPath = dirPath;
      _selected = 0;
      // Sort: directories first, then files, alphabetically
      _entries.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
      render();
    } catch (e) {
      if (crumbs) crumbs.textContent = 'Error: ' + e.message;
    }
  }

  function openSelected() {
    const entry = _entries[_selected];
    if (!entry) return;
    if (entry.type === 'directory') {
      navigate(entry.path);
    } else {
      // For files: could open in a viewer; for now log path
      console.log('[fs-nav] selected file:', entry.path);
    }
  }

  function goUp() {
    if (!_currentPath || _currentPath === '/') return;
    const parent = _currentPath.replace(/\/[^/]+\/?$/, '') || '/';
    navigate(parent);
  }

  // Keyboard navigation (only when the panel is focused)
  if (body) {
    body.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          _selected = Math.min(_selected + 1, _entries.length - 1);
          render();
          break;
        case 'ArrowUp':
          e.preventDefault();
          _selected = Math.max(_selected - 1, 0);
          render();
          break;
        case 'Enter':
          e.preventDefault();
          openSelected();
          break;
        case 'Backspace':
          e.preventDefault();
          goUp();
          break;
      }
    });
  }

  // Initial load – home directory resolved by backend
  navigate(null);
}());
