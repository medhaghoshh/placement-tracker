// ============================================================
// upcoming.js — grouped upcoming events by type
// ============================================================

async function initUpcoming() {
  if (!requireAuth()) return;
  initShell('upcoming');

  try {
    const items = await apiFetch('/applications/upcoming');
    document.getElementById('loading').classList.add('hidden');

    if (!items.length) {
      document.getElementById('empty').classList.remove('hidden');
      return;
    }
    document.getElementById('up-body').classList.remove('hidden');

    const assessments = items.filter(i => i.event === 'Online Assessment');
    const interviews = items.filter(i => i.event === 'Interview');
    const deadlines = items.filter(i => i.event === 'Application Deadline');

    renderSection('sec-assessments', 'fa-laptop-code', 'Upcoming assessments', assessments);
    renderSection('sec-interviews', 'fa-comments', 'Upcoming interviews', interviews);
    renderSection('sec-deadlines', 'fa-hourglass-half', 'Application deadlines', deadlines);
  } catch (err) {
    document.getElementById('loading').classList.add('hidden');
    toast(err.message, 'err');
  }
}

function renderSection(elId, icon, title, items) {
  const el = document.getElementById(elId);
  if (!items.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div class="section-label"><i class="fa-solid ${icon}"></i> ${title}</div>
    <div class="up-list">
      ${items.map(u => {
        const days = daysBetween(u.event_date);
        const r = remainingLabel(days);
        return `<div class="up-item" style="cursor:pointer" onclick="location.href='application-details.html?id=${u.id}'">
          <div class="co-logo">${escapeHtml(u.company_name.charAt(0))}</div>
          <div class="up-main">
            <div class="co">${escapeHtml(u.company_name)}</div>
            <div class="ev">${escapeHtml(u.job_role)} · ${escapeHtml(u.event)}</div>
          </div>
          <div class="up-when">
            <div class="date">${fmtDate(u.event_date)}</div>
            <span class="rem ${r.cls}">${r.text}</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('up-body')) initUpcoming();
});
