const GOAL_LABELS = {
  lose:     '🔥 Lose Weight',
  maintain: '⚖ Maintain Weight',
  gain:     '💪 Gain Weight',
};

const BMI_STYLES = {
  Underweight: { text: '#3B82F6', bg: '#EFF6FF' },
  Normal:      { text: '#22C55E', bg: '#F0FDF4' },
  Overweight:  { text: '#F59E0B', bg: '#FFFBEB' },
  Obese:       { text: '#EF4444', bg: '#FEF2F2' },
};

let debounceTimer = null;

// ── GATHER FORM VALUES ──
function getFormValues() {
  return {
    age:            document.querySelector('[name="age"]')?.value       || '',
    gender:         document.querySelector('[name="gender"]')?.value    || '',
    height:         document.querySelector('[name="height"]')?.value    || '',
    weight:         document.querySelector('[name="weight"]')?.value    || '',
    activity_level: document.querySelector('[name="activity_level"]:checked')?.value || '',
    goal:           document.querySelector('[name="goal"]:checked')?.value           || '',
  };
}

function isComplete(v) {
  return v.age && v.gender && v.height && v.weight && v.activity_level && v.goal;
}

// ── CALL API AND UPDATE PREVIEW ──
async function recalculate() {
  const vals = getFormValues();
  if (!isComplete(vals)) return;

  try {
    const res  = await fetch('/api/calculate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(vals),
    });
    const data = await res.json();
    if (!data.success) return;

    // BMI value
    const bmiEl = document.getElementById('preview-bmi-val');
    if (bmiEl) bmiEl.textContent = Math.round(data.bmi);

    // Calorie target
    const calEl = document.getElementById('preview-cal-val');
    if (calEl) calEl.innerHTML = `${data.calorie_target} <small>kcal</small>`;

    // BMR
    const bmrEl = document.getElementById('preview-bmr-val');
    if (bmrEl) bmrEl.innerHTML = `${Math.round(data.bmr)} <small>kcal</small>`;

    // TDEE
    const tdeeEl = document.getElementById('preview-tdee-val');
    if (tdeeEl) tdeeEl.innerHTML = `${Math.round(data.tdee)} <small>kcal</small>`;

    // BMI category pill
    const catEl = document.getElementById('preview-bmi-cat');
    if (catEl) {
      const style = BMI_STYLES[data.bmi_category] || BMI_STYLES.Normal;
      catEl.textContent      = data.bmi_category;
      catEl.style.background = style.bg;
      catEl.style.color      = style.text;
    }

    // Goal badge
    const goalEl = document.getElementById('preview-goal');
    if (goalEl && vals.goal) goalEl.textContent = GOAL_LABELS[vals.goal] || vals.goal;

  } catch (e) { /* silently ignore during typing */ }
}

function scheduleRecalc() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(recalculate, 350);
}

// ── ATTACH LISTENERS TO ALL CALC TRIGGERS ──
document.querySelectorAll('.calc-trigger').forEach(el => {
  el.addEventListener('input',  scheduleRecalc);
  el.addEventListener('change', scheduleRecalc);
});

// ── LIVE NAME → INITIALS + DISPLAY NAME ──
const nameField = document.querySelector('[name="full_name"]');
if (nameField) {
  nameField.addEventListener('input', () => {
    const val      = nameField.value.trim();
    const initials = val
      ? val.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : '?';
    const initEl = document.getElementById('preview-initials');
    const nameEl = document.getElementById('preview-name');
    if (initEl) initEl.textContent = initials;
    if (nameEl) nameEl.textContent = val || 'Your Name';
  });
}

// ── ACTIVITY CARD: highlight selected ──
document.querySelectorAll('.act-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.act-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    scheduleRecalc();
  });
});

// ── GOAL CARD: highlight selected ──
document.querySelectorAll('.goal-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    scheduleRecalc();
  });
});
