(function () {
  'use strict';

  const overlay = document.getElementById('launcher');
  const input = document.getElementById('launcher-input');
  const list = document.getElementById('launcher-results');

  let items = [];
  let activeIndex = 0;

  function render() {
    if (!list) return;
    list.innerHTML = items.map((item, idx) => {
      const active = idx === activeIndex ? 'active' : '';
      return '<li class="launcher-item ' + active + '" data-idx="' + idx + '">' + item + '</li>';
    }).join('');

    list.querySelectorAll('.launcher-item').forEach((el) => {
      el.addEventListener('click', () => {
        activeIndex = Number(el.getAttribute('data-idx')) || 0;
        runActive();
      });
    });
  }

  async function search(query) {
    try {
      items = await window.zenoAPI.searchApps(query || '');
    } catch {
      items = [];
    }
    activeIndex = 0;
    render();
  }

  async function runActive() {
    const cmd = items[activeIndex];
    if (!cmd) return;
    await window.zenoAPI.launchApp(cmd);
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
    items = [];
    activeIndex = 0;
    list.innerHTML = '';
  }

  function toggle() {
    if (overlay.classList.contains('open')) {
      close();
    } else {
      open();
    }
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (overlay.classList.contains('open')) {
        event.preventDefault();
        close();
      }
      return;
    }

    if (!event.metaKey && !(event.ctrlKey && event.key.toLowerCase() === 'k')) {
      return;
    }

    if (event.metaKey && event.key === ' ') {
      event.preventDefault();
      toggle();
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      open();
    }
  });

  input.addEventListener('input', (event) => {
    search(event.target.value);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, Math.max(items.length - 1, 0));
      render();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      render();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      runActive();
    }
  });

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  window.zenoLauncherShell = {
    open,
    close,
    toggle,
  };
}());
