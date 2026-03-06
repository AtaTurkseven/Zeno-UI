(function () {
  'use strict';

  const stageEl = document.getElementById('stage');
  const barEl = document.getElementById('progress-bar');
  const rootEl = document.getElementById('splash');

  if (!window.zenoSplash || !window.zenoSplash.onProgress) {
    return;
  }

  window.zenoSplash.onProgress((payload) => {
    if (!payload) return;

    const progress = Math.max(0, Math.min(100, Number(payload.progress) || 0));
    if (barEl) {
      barEl.style.width = progress + '%';
    }

    if (stageEl && payload.stage) {
      stageEl.textContent = payload.stage;
    }

    if (payload.done && rootEl) {
      rootEl.classList.add('done');
    }
  });
}());
