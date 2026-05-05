// ── AUTO-DISMISS FLASH MESSAGES ──
document.querySelectorAll('.hm-flash').forEach(el => {
  setTimeout(() => {
    el.style.transition = 'opacity .4s ease';
    el.style.opacity    = '0';
    setTimeout(() => el.remove(), 400);
  }, 4500);
});

// ── REMINDER TOAST NOTIFICATION SYSTEM ──
let lastCheckedMinute = -1;

async function pollReminders() {
  try {
    const now = new Date();
    // Use a unique ID based on HH:MM to prevent double-firing within the same minute
    const currentTick = `${now.getHours()}:${now.getMinutes()}`;
    if (currentTick === lastCheckedMinute) return;
    lastCheckedMinute = currentTick;

    const res  = await fetch('/api/reminders/check');
    if (!res.ok) return;
    const due = await res.json();

    due.forEach(rem => showReminderToast(rem));
  } catch (e) { /* silently ignore network errors */ }
}

function showReminderToast(rem) {
  const wrap  = document.getElementById('reminderToastWrap');
  if (!wrap) return;

  const toast = document.createElement('div');
  toast.className = 'rem-toast';
  toast.innerHTML = `
    <div class="rem-toast-icon">${rem.icon || '🔔'}</div>
    <div class="rem-toast-body">
      <div class="rem-toast-title">${escHtml(rem.label)}</div>
      <div class="rem-toast-sub">
        ${rem.type.charAt(0).toUpperCase() + rem.type.slice(1)} reminder · ${escHtml(rem.time)}
        ${rem.medicine ? `<br>💊 ${escHtml(rem.medicine)}` + (rem.dosage ? ` — ${escHtml(rem.dosage)}` : '') : ''}
      </div>
    </div>
    <button class="rem-toast-close" onclick="this.closest('.rem-toast').remove()">×</button>
  `;
  wrap.appendChild(toast);
  // Auto-remove after 12 seconds
  setTimeout(() => {
    toast.style.transition = 'opacity .4s, transform .4s';
    toast.style.opacity    = '0';
    toast.style.transform  = 'translateX(120%)';
    setTimeout(() => toast.remove(), 400);
  }, 12000);

  // Play a soft beep if supported
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(); osc.stop(ctx.currentTime + 0.6);
  } catch (e) { /* audio not supported */ }
}

// Poll every 60 seconds if user is logged in
if (document.getElementById('reminderToastWrap')) {
  pollReminders();                             // check immediately on page load
  setInterval(pollReminders, 30 * 1000);      // Check every 30s to catch the minute window reliably
}

// ── ACTIVITY CARD TOGGLE ──
document.querySelectorAll('.act-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.act-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });
});

// ── GOAL CARD TOGGLE ──
document.querySelectorAll('.goal-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });
});

// ── UTIL ──
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── NAVIGATION TRANSITION HINT ──
document.querySelectorAll('a:not([target="_blank"]):not([href^="#"]):not(.logout-link)').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = link.getAttribute('href');
    if (target && target.startsWith('/') && !e.metaKey && !e.ctrlKey) {
      const main = document.querySelector('.hm-main, .auth-form-wrap');
      if (main) main.style.opacity = '0.6'; // Immediate feedback before browser navigates
    }
  });
});

// ── MOBILE INPUT UX: Keyboard Awareness ──
function handleInputFocus(el) {
  if (window.innerWidth <= 991) {
    // Delay allows the virtual keyboard to begin appearing and resize the layout
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
}

document.addEventListener('focusin', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
    handleInputFocus(e.target);
  }
});

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const activeEl = document.activeElement;
    if (activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) {
      handleInputFocus(activeEl);
    }
  });
}
