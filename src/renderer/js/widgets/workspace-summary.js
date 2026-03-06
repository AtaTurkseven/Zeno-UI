(function () {
  'use strict';

  window.zenoWidgets = window.zenoWidgets || [];

  window.zenoWidgets.push(function createWorkspaceSummary() {
    const root = document.createElement('section');
    root.className = 'widget';

    const title = document.createElement('h4');
    title.textContent = 'Workspace Summary';
    root.appendChild(title);

    const body = document.createElement('div');
    body.textContent = 'Waiting for Hyprland state...';
    root.appendChild(body);

    window.addEventListener('zeno-shell-state', (event) => {
      const detail = event.detail || {};
      const wsCount = Array.isArray(detail.workspaces) ? detail.workspaces.length : 0;
      const clients = Array.isArray(detail.clients) ? detail.clients.length : 0;
      const active = detail.activeWorkspace ? (detail.activeWorkspace.id || detail.activeWorkspace.name) : 'n/a';
      body.textContent = 'Workspaces: ' + wsCount + ' | Clients: ' + clients + ' | Active: ' + active;
    });

    return root;
  });
}());
