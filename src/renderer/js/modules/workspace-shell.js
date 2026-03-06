(function () {
  'use strict';

  let state = {
    workspaces: [],
    activeWorkspace: null,
    activeWindow: null,
    clients: [],
  };

  function setWindowTitle(text) {
    const el = document.getElementById('active-window-title');
    if (el) el.textContent = text || 'No active window';
  }

  function renderClientCards() {
    const listEl = document.getElementById('window-list');
    if (!listEl) return;

    if (!Array.isArray(state.clients) || state.clients.length === 0) {
      listEl.innerHTML = '<div class="window-card"><div class="window-title">No windows tracked</div><div class="window-meta">Hyprland IPC connected but no visible clients</div></div>';
      return;
    }

    const activeAddress = state.activeWindow && state.activeWindow.address;

    listEl.innerHTML = state.clients.slice(0, 24).map((client) => {
      const active = client.address === activeAddress;
      return '<article class="window-card ' + (active ? 'active' : '') + '" data-address="' + client.address + '">'
        + '<div class="window-title">' + (client.title || client.class || 'Untitled') + '</div>'
        + '<div class="window-meta">' + (client.class || 'unknown') + ' | ws ' + (client.workspace && client.workspace.id ? client.workspace.id : '-') + '</div>'
        + '</article>';
    }).join('');

    listEl.querySelectorAll('.window-card').forEach((card) => {
      card.addEventListener('click', () => {
        const address = card.getAttribute('data-address');
        if (address) window.zenoAPI.focusWindow(address);
      });
    });
  }

  function publishState() {
    const wsId = state.activeWorkspace && (state.activeWorkspace.id || state.activeWorkspace.name);
    if (window.zenoSystemBar) {
      window.zenoSystemBar.renderWorkspaces(state.workspaces, wsId);
    }

    setWindowTitle(state.activeWindow && (state.activeWindow.title || state.activeWindow.class));
    renderClientCards();

    window.dispatchEvent(new CustomEvent('zeno-shell-state', { detail: state }));
  }

  async function refreshState() {
    const next = await window.zenoAPI.getHyprlandState();
    state = {
      workspaces: next.workspaces || [],
      activeWorkspace: next.activeWorkspace || null,
      activeWindow: next.activeWindow || null,
      clients: next.clients || [],
    };
    publishState();
  }

  function bindWorkspaceShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (!event.metaKey) return;
      if (event.key < '1' || event.key > '9') return;
      event.preventDefault();
      window.zenoAPI.switchWorkspace(event.key);
    });
  }

  function bindShellShortcuts() {
    if (!window.zenoAPI.onShellShortcut) return;
    window.zenoAPI.onShellShortcut((action) => {
      if (!action) return;

      if (action.startsWith('workspace-')) {
        const workspace = action.replace('workspace-', '');
        window.zenoAPI.switchWorkspace(workspace);
        return;
      }

      if (action === 'toggle-launcher' && window.zenoLauncherShell) {
        window.zenoLauncherShell.toggle();
      }

      if (action === 'toggle-side-panel' && window.zenoSidePanel) {
        window.zenoSidePanel.toggle();
      }
    });
  }

  function subscribeEvents() {
    return window.zenoAPI.subscribeHyprland(() => {
      refreshState().catch(() => {});
    });
  }

  window.zenoWorkspaceShell = {
    async start() {
      bindWorkspaceShortcuts();
      bindShellShortcuts();
      try {
        await refreshState();
      } catch {
        setWindowTitle('Hyprland IPC unavailable');
        renderClientCards();
      }
      return subscribeEvents();
    },
  };
}());
