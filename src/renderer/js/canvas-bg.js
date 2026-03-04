/* canvas-bg.js – animated matrix-rain / particle background
 * Runs on a <canvas> behind the UI panels.
 * Uses requestAnimationFrame; targets 30 fps to save CPU.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  const COLS_CHAR  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
  const FONT_SIZE  = 14;
  const FPS_TARGET = 30;
  const FRAME_MS   = 1000 / FPS_TARGET;

  let columns  = [];
  let lastTime = 0;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const colCount = Math.floor(canvas.width / FONT_SIZE);
    // Preserve existing columns; add new ones if needed
    while (columns.length < colCount) {
      columns.push(Math.random() * canvas.height / FONT_SIZE | 0);
    }
    columns.length = colCount;
  }

  function draw(ts) {
    requestAnimationFrame(draw);
    if (ts - lastTime < FRAME_MS) return;
    lastTime = ts;

    // Dim previous frame
    ctx.fillStyle = 'rgba(10, 14, 20, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font      = `${FONT_SIZE}px monospace`;
    ctx.fillStyle = 'rgba(0, 212, 255, 0.18)';

    for (let i = 0; i < columns.length; i++) {
      const ch = COLS_CHAR[Math.random() * COLS_CHAR.length | 0];
      ctx.fillText(ch, i * FONT_SIZE, columns[i] * FONT_SIZE);

      if (columns[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
        columns[i] = 0;
      }
      columns[i]++;
    }
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);

  // Expose a function so app.js can update the rain colour when theme changes
  window.setBgAccentColor = function (hex) {
    // hex → rgba with low alpha for subtlety
    ctx.fillStyle = hex;
  };
}());
