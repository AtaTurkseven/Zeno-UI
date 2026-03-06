/*
 * canvas-bg.js
 * Theme-reactive matrix rain with a light particle drift layer.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLS_CHAR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]<>/*+-#@$%&';
  const FONT_SIZE = 14;
  const FPS_TARGET = 30;
  const FRAME_MS = 1000 / FPS_TARGET;
  const PARTICLE_COUNT = 38;

  let columns = [];
  let particles = [];
  let lastTime = 0;

  let accentRgb = { r: 68, g: 215, b: 255 };

  function clamp255(n) {
    return Math.max(0, Math.min(255, n));
  }

  function hexToRgb(hex) {
    const raw = (hex || '').trim();
    const full = /^#([\da-f]{6})$/i.exec(raw);
    const short = /^#([\da-f]{3})$/i.exec(raw);

    if (full) {
      return {
        r: parseInt(full[1].slice(0, 2), 16),
        g: parseInt(full[1].slice(2, 4), 16),
        b: parseInt(full[1].slice(4, 6), 16),
      };
    }

    if (short) {
      return {
        r: parseInt(short[1][0] + short[1][0], 16),
        g: parseInt(short[1][1] + short[1][1], 16),
        b: parseInt(short[1][2] + short[1][2], 16),
      };
    }

    return null;
  }

  function rgba(alpha, boost) {
    const lift = boost || 0;
    const r = clamp255(accentRgb.r + lift);
    const g = clamp255(accentRgb.g + lift);
    const b = clamp255(accentRgb.b + lift);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function makeParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.8 + Math.random() * 1.8,
      vx: -0.18 + Math.random() * 0.36,
      vy: -0.12 + Math.random() * 0.24,
      alpha: 0.05 + Math.random() * 0.12,
    }));
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colCount = Math.floor(canvas.width / FONT_SIZE);
    while (columns.length < colCount) {
      columns.push((Math.random() * canvas.height / FONT_SIZE) | 0);
    }
    columns.length = colCount;

    makeParticles();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.fillStyle = rgba(p.alpha, 24);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw(ts) {
    requestAnimationFrame(draw);
    if (ts - lastTime < FRAME_MS) return;
    lastTime = ts;

    ctx.fillStyle = 'rgba(8, 12, 18, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawParticles();

    ctx.font = `${FONT_SIZE}px monospace`;
    ctx.fillStyle = rgba(0.22, 0);

    for (let i = 0; i < columns.length; i++) {
      const x = i * FONT_SIZE;
      const y = columns[i] * FONT_SIZE;

      const ch = COLS_CHAR[(Math.random() * COLS_CHAR.length) | 0];
      ctx.fillText(ch, x, y);

      // Brighter head gives a cleaner rain trail feeling.
      ctx.fillStyle = rgba(0.35, 38);
      ctx.fillText(ch, x, y);
      ctx.fillStyle = rgba(0.22, 0);

      if (y > canvas.height && Math.random() > 0.976) {
        columns[i] = 0;
      }
      columns[i]++;
    }
  }

  window.setBgAccentColor = function (hex) {
    const parsed = hexToRgb(hex);
    if (parsed) accentRgb = parsed;
  };

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
}());
