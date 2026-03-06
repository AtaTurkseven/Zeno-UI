(function () {
  'use strict';

  function report(stage, progress) {
    if (window.zenoAPI && window.zenoAPI.reportStartupProgress) {
      window.zenoAPI.reportStartupProgress(stage, progress);
    }
  }

  async function bootShell() {
    const root = document.getElementById('desktop-root');
    const brand = document.getElementById('brand-name');

    report('Display splash screen', 8);

    const config = await window.zenoAPI.getShellConfig();
    if (brand && config.logoText) {
      brand.textContent = config.logoText;
    }

    report('Initialize desktop shell', 28);
    if (window.zenoSystemBar) {
      window.zenoSystemBar.start();
      window.zenoSystemBar.renderFallbackWorkspaces(config.workspaces || [1, 2, 3, 4, 5]);
    }

    report('Load widgets and panels', 55);
    if (window.zenoWidgetLoader) {
      await window.zenoWidgetLoader.loadScripts(config.widgets || []);
    }

    if (window.zenoSidePanel) {
      window.zenoSidePanel.startLogs();
    }

    report('Connect to Hyprland IPC', 78);
    if (window.zenoWorkspaceShell) {
      await window.zenoWorkspaceShell.start();
    }

    report('Show desktop UI', 96);
    root.classList.remove('booting');

    report('Desktop ready', 100);
    if (window.zenoAPI && window.zenoAPI.markShellReady) {
      window.zenoAPI.markShellReady();
    }
  }

  bootShell().catch((err) => {
    console.error('[shell] boot failed', err);
    report('Desktop ready (degraded mode)', 100);
    const root = document.getElementById('desktop-root');
    root.classList.remove('booting');
    if (window.zenoAPI && window.zenoAPI.markShellReady) {
      window.zenoAPI.markShellReady();
    }
  });
}());
