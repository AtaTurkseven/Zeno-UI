(function () {
  'use strict';

  function setMetric(id, label, value, level) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('warn', 'danger');
    if (level) el.classList.add(level);
    el.innerHTML = label + ' <strong>' + value + '</strong>';
  }

  function toLevel(percent) {
    if (percent >= 90) return 'danger';
    if (percent >= 70) return 'warn';
    return '';
  }

  function formatBytesPerSec(value) {
    const n = Number(value) || 0;
    if (n > 1e9) return (n / 1e9).toFixed(1) + ' GB/s';
    if (n > 1e6) return (n / 1e6).toFixed(1) + ' MB/s';
    if (n > 1e3) return (n / 1e3).toFixed(1) + ' KB/s';
    return n.toFixed(0) + ' B/s';
  }

  async function refreshStats() {
    try {
      const [stats, netList] = await Promise.all([
        window.zenoAPI.getSystemStats(),
        window.zenoAPI.getNetworkInfo(),
      ]);

      setMetric('metric-cpu', 'CPU', (stats.cpu.aggregate || 0) + '%', toLevel(stats.cpu.aggregate || 0));
      setMetric('metric-ram', 'RAM', (stats.memory.usedPct || 0) + '%', toLevel(stats.memory.usedPct || 0));
      setMetric('metric-gpu', 'GPU', (stats.gpu.usage || 0) + '%', toLevel(stats.gpu.usage || 0));

      const iface = Array.isArray(netList) ? netList[0] : null;
      if (iface) {
        const netValue = '\u2193 ' + formatBytesPerSec(iface.rxSec) + ' \u2191 ' + formatBytesPerSec(iface.txSec);
        setMetric('metric-net', 'NET', netValue);
      } else {
        setMetric('metric-net', 'NET', 'offline');
      }

      const bat = stats.battery || {};
      if (!bat.hasBattery) {
        setMetric('metric-bat', 'BAT', 'AC');
      } else {
        const suffix = bat.isCharging ? '%+' : '%';
        setMetric('metric-bat', 'BAT', String(bat.percent || 0) + suffix, toLevel(100 - (bat.percent || 0)));
      }
    } catch {
      setMetric('metric-net', 'NET', 'n/a');
    }
  }

  function refreshClock() {
    const el = document.getElementById('metric-clock');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString();
  }

  function renderWorkspaces(workspaces, activeId) {
    const listEl = document.getElementById('workspace-list');
    if (!listEl) return;

    const sorted = [...(workspaces || [])].sort((a, b) => {
      const av = Number(a.id || a.name || 0);
      const bv = Number(b.id || b.name || 0);
      return av - bv;
    });

    listEl.innerHTML = sorted.map((ws) => {
      const id = ws.id || ws.name;
      const active = Number(id) === Number(activeId);
      return '<li class="workspace-chip ' + (active ? 'active' : '') + '" data-workspace="' + id + '">' + id + '</li>';
    }).join('');

    listEl.querySelectorAll('.workspace-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const ws = chip.getAttribute('data-workspace');
        window.zenoAPI.switchWorkspace(ws);
      });
    });
  }

  window.zenoSystemBar = {
    start() {
      refreshStats();
      refreshClock();
      setInterval(refreshStats, 1800);
      setInterval(refreshClock, 1000);
    },
    renderWorkspaces,
    renderFallbackWorkspaces(workspaceIds) {
      const list = (workspaceIds || []).map((id) => ({ id }));
      renderWorkspaces(list, list[0] ? list[0].id : null);
    },
  };
}());
