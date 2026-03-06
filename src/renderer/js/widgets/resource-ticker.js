(function () {
  'use strict';

  window.zenoWidgets = window.zenoWidgets || [];

  window.zenoWidgets.push(function createResourceTicker() {
    const root = document.createElement('section');
    root.className = 'widget';

    const title = document.createElement('h4');
    title.textContent = 'Resource Ticker';
    root.appendChild(title);

    const body = document.createElement('div');
    body.style.fontFamily = 'JetBrains Mono, Consolas, monospace';
    body.style.fontSize = '0.78rem';
    body.textContent = 'Collecting metrics...';
    root.appendChild(body);

    async function refresh() {
      try {
        const stats = await window.zenoAPI.getSystemStats();
        body.textContent = 'CPU ' + stats.cpu.aggregate + '% | RAM ' + stats.memory.usedPct + '% | GPU ' + stats.gpu.usage + '%';
      } catch {
        body.textContent = 'Metrics unavailable';
      }
    }

    refresh();
    setInterval(refresh, 2400);
    return root;
  });
}());
