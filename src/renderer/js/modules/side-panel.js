(function () {
  'use strict';

  const panel = document.getElementById('side-panel');
  const closeBtn = document.getElementById('side-panel-close');
  const logFeed = document.getElementById('log-feed');
  const aiInput = document.getElementById('ai-input');
  const aiSend = document.getElementById('ai-send');
  const aiAnswer = document.getElementById('ai-answer');

  const logLines = [];
  const MAX_LOG_LINES = 180;

  function open() {
    panel.classList.add('open');
    if (aiInput) aiInput.focus();
  }

  function close() {
    panel.classList.remove('open');
  }

  function toggle() {
    panel.classList.toggle('open');
  }

  function pushLog(line) {
    logLines.push(line);
    while (logLines.length > MAX_LOG_LINES) {
      logLines.shift();
    }
    logFeed.textContent = logLines.join('\n');
    logFeed.scrollTop = logFeed.scrollHeight;
  }

  function suggestForPrompt(prompt) {
    const p = (prompt || '').toLowerCase();
    if (p.includes('log') || p.includes('journal')) {
      return 'Try: journalctl -f -u hyprland';
    }
    if (p.includes('workspace')) {
      return 'Use Super+1..9 to switch workspace, or run: hyprctl dispatch workspace 2';
    }
    if (p.includes('window') || p.includes('focus')) {
      return 'Window focus is tracked from Hyprland events. Click a card to focus that client.';
    }
    if (p.includes('network')) {
      return 'Network metric uses live rx/tx throughput from system interfaces.';
    }
    return 'Quick tip: ask for logs, workspace actions, or Hyprland diagnostics.';
  }

  function submitAiPrompt() {
    const prompt = aiInput.value.trim();
    if (!prompt) return;
    aiAnswer.textContent = suggestForPrompt(prompt);
    aiInput.value = '';
  }

  function startLogs() {
    if (!window.zenoAPI.subscribeLogs) return;
    window.zenoAPI.subscribeLogs((line) => {
      pushLog(line);
    });
  }

  closeBtn.addEventListener('click', close);
  aiSend.addEventListener('click', submitAiPrompt);

  aiInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitAiPrompt();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.metaKey && (event.key === 's' || event.key === 'S')) {
      event.preventDefault();
      toggle();
    }

    if (event.key === 'Escape' && panel.classList.contains('open')) {
      event.preventDefault();
      close();
    }
  });

  window.zenoSidePanel = {
    open,
    close,
    toggle,
    startLogs,
  };
}());
