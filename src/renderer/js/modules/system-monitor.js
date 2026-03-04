/* system-monitor.js
 * Polls backend for CPU/RAM/disk/network stats and updates the DOM.
 */
(function () {
  'use strict';

  const POLL_MS = 1500;

  function fmt(bytes) {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
    return (bytes / 1e3).toFixed(0) + ' KB';
  }

  function pctClass(pct) {
    if (pct >= 85) return 'danger';
    if (pct >= 60) return 'warn';
    return '';
  }

  function setBar(barId, pct) {
    const el = document.getElementById(barId);
    if (!el) return;
    el.style.width   = Math.min(100, pct) + '%';
    el.className     = 'stat-bar-fill ' + pctClass(pct);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  async function pollStats() {
    try {
      const stats = await window.zenoAPI.getSystemStats();
      const { cpu, memory } = stats;

      setText('cpu-pct', cpu.aggregate + '%');
      setBar('cpu-bar', cpu.aggregate);

      setText('mem-pct', memory.usedPct + '%');
      setBar('mem-bar', memory.usedPct);

      const swapPct = memory.swapTotal
        ? Math.round((memory.swapUsed / memory.swapTotal) * 100) : 0;
      setText('swap-pct', swapPct + '%');
      setBar('swap-bar', swapPct);

      // Per-core bars
      const coresEl = document.getElementById('cpu-cores');
      if (coresEl && cpu.cores.length) {
        coresEl.innerHTML = cpu.cores.map((pct, i) => `
          <div class="stat-label" style="font-size:10px;">
            <span>Core ${i}</span><span>${pct}%</span>
          </div>
          <div class="stat-bar" style="height:4px;">
            <div class="stat-bar-fill ${pctClass(pct)}" style="width:${Math.min(100, pct)}%"></div>
          </div>`).join('');
      }
    } catch (e) {
      // Main process not ready yet – ignore
    }
  }

  async function pollDisk() {
    try {
      const disks = await window.zenoAPI.getDiskInfo();
      const el = document.getElementById('disk-info');
      if (!el) return;
      el.innerHTML = disks.slice(0, 4).map((d) =>
        `<div style="margin-bottom:4px;">
           <div class="stat-label"><span>${d.mount}</span><span>${d.usedPct}%</span></div>
           <div class="stat-bar" style="height:4px;">
             <div class="stat-bar-fill ${pctClass(d.usedPct)}" style="width:${Math.min(100, d.usedPct)}%"></div>
           </div>
           <div style="color:var(--color-text-dim);font-size:10px;">${fmt(d.used)} / ${fmt(d.size)}</div>
         </div>`
      ).join('');
    } catch { /* ignore */ }
  }

  async function pollNet() {
    try {
      const ifaces = await window.zenoAPI.getNetworkInfo();
      const el = document.getElementById('net-info');
      if (!el) return;
      el.innerHTML = ifaces.slice(0, 3).map((n) =>
        `<div style="margin-bottom:4px;">
           <span style="color:var(--color-accent-dim);">${n.iface}</span>
           &nbsp;↓ ${fmt(n.rxSec)}/s &nbsp;↑ ${fmt(n.txSec)}/s
         </div>`
      ).join('');
    } catch { /* ignore */ }
  }

  function updateClock() {
    const el = document.getElementById('sysmon-clock');
    if (el) el.textContent = new Date().toLocaleTimeString();
  }

  // Start polling
  pollStats();
  pollDisk();
  pollNet();
  setInterval(pollStats, POLL_MS);
  setInterval(pollDisk,  10000);
  setInterval(pollNet,   3000);
  setInterval(updateClock, 1000);
  updateClock();
}());
