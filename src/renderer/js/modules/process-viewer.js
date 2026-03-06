/* process-viewer.js
 * Displays the top processes sorted by CPU time.
 * Supports keyboard navigation within the list.
 */
(function () {
  'use strict';

  const POLL_MS = 3000;

  function fmt(bytes) {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + 'G';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(0) + 'M';
    return (bytes / 1e3).toFixed(0) + 'K';
  }

  /** Shorten state string from /proc/<pid>/status */
  function shortState(s) {
    const map = { S: 'slp', R: 'run', D: 'dsk', Z: 'zom', T: 'stp', I: 'idl' };
    return map[s ? s[0] : ''] || s;
  }

  async function refresh() {
    try {
      const procs = await window.zenoAPI.getProcessList();
      const list  = document.getElementById('proc-list');
      const count = document.getElementById('proc-count');
      if (!list) return;

      count.textContent = procs.length + ' proc';

      list.innerHTML = procs.map((p) => `
        <div class="proc-row" data-pid="${p.pid}" role="option" tabindex="-1">
          <span class="pid">${p.pid}</span>
          <span class="pname" title="${p.cmdline}">${p.name}</span>
          <span class="pmem">${fmt(p.memory)}</span>
          <span class="pstate">${shortState(p.state)}</span>
        </div>`).join('');

      // Click to focus (no touch needed)
      list.querySelectorAll('.proc-row').forEach((row) => {
        row.addEventListener('click', () => {
          list.querySelectorAll('.proc-row').forEach((r) => {
            r.removeAttribute('aria-selected');
            r.style.removeProperty('background');
          });
          row.setAttribute('aria-selected', 'true');
        });
      });
    } catch { /* main process not ready */ }
  }

  refresh();
  setInterval(refresh, POLL_MS);
}());
