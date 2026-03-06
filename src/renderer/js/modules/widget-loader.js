(function () {
  'use strict';

  async function loadScripts(widgetList) {
    const mount = document.getElementById('widget-mount');
    if (!mount) return;

    for (const widgetPath of widgetList || []) {
      const src = 'js/' + widgetPath;
      // Dynamic script loading keeps widgets decoupled from shell core.
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.body.appendChild(script);
      });
    }

    const widgets = Array.isArray(window.zenoWidgets) ? window.zenoWidgets : [];
    widgets.forEach((factory) => {
      try {
        const node = factory();
        if (node) mount.appendChild(node);
      } catch {
        // Skip broken widgets without breaking shell startup.
      }
    });
  }

  window.zenoWidgetLoader = {
    loadScripts,
  };
}());
