// ============================================================
// application-details.js — single application view + timeline
// ============================================================

const TIMELINE_STAGES = [
  { key: 'Application',        label: 'Applied',        icon: 'fa-paper-plane' },
  { key: 'Online Assessment', label: 'Assessment',     icon: 'fa-laptop-code' },
  { key: 'Technical Interview',label: 'Technical',      icon: 'fa-code' },
  { key: 'HR Interview',      label: 'HR Interview',    icon: 'fa-user-tie' },
  { key: 'Final Interview',   label: 'Final Round',     icon: 'fa-comments' },
  { key: 'Offer',             label: 'Offer',           icon: 'fa-trophy' },
];

let currentApp = null;

async function initDetails() {
  if (!requireAuth()) return;
  initShell(null);
  buildModal();

  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = 'applications.html'; return; }

  try {
    currentApp = await apiFetch('/applications/' + id);
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('detail-body').classList.remove('hidden');
    renderDetails(currentApp);
  } catch (err) {
    toast(err.message, 'err');
    setTimeout(() => location.href = 'applications.html', 1200);
  }

  document.getElementById('edit-btn').addEventListener('click', () =>
    openModal(currentApp, () => reloadDetails(id)));
  document.getElementById('delete-btn').addEventListener('click', () =>
    deleteApplication(id, () => location.href = 'applications.html'));
}

async function reloadDetails(id) {
  currentApp = await apiFetch('/applications/' + id);
  renderDetails(currentApp);
}

function renderDetails(a) {
  document.getElementById('d-logo').textContent = a.company_name.charAt(0);
  document.getElementById('d-company').textContent = a.company_name;
  document.getElementById('d-role').textContent = `${a.job_role} · ${a.job_type}`;
  const st = document.getElementById('d-status');
  st.textContent = a.status;
  st.className = badgeClass(a.status);

  renderTimeline(a);

  const items = [
    ['Package', a.package || '—'],
    ['Location', a.location || '—'],
    ['Job type', a.job_type],
    ['Applied on', fmtDate(a.application_date)],
    ['Deadline', fmtDate(a.application_deadline)],
    ['Current round', a.current_round],
    ['Assessment date', fmtDate(a.assessment_date)],
    ['Interview date', fmtDate(a.interview_date)],
    ['Job link', a.job_link
      ? `<a href="${escapeHtml(a.job_link)}" target="_blank" rel="noopener">Open link <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px"></i></a>`
      : '—'],
  ];
  document.getElementById('detail-grid').innerHTML = items.map(([k, v]) =>
    `<div class="detail-item"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');

  document.getElementById('notes-wrap').innerHTML = a.notes
    ? `<div class="notes-box"><b style="display:block;margin-bottom:6px;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.04em">Notes</b>${escapeHtml(a.notes)}</div>`
    : '';
}

function renderTimeline(a) {
  // If rejected, we still show progress up to where it was.
  const currentIdx = TIMELINE_STAGES.findIndex(s => s.key === a.current_round);
  const rejected = a.status === 'Rejected';
  const selected = a.status === 'Selected';

  const html = TIMELINE_STAGES.map((stage, i) => {
    let cls = 'pending';
    let icon = stage.icon;
    if (selected) {
      cls = i <= currentIdx ? 'done' : (i === TIMELINE_STAGES.length - 1 ? 'done' : 'pending');
      if (i === TIMELINE_STAGES.length - 1) cls = 'done';
    }
    if (i < currentIdx) cls = 'done';
    else if (i === currentIdx) cls = rejected ? 'done' : 'current';

    let dotContent = `<i class="fa-solid ${icon}"></i>`;
    if (cls === 'done') dotContent = `<i class="fa-solid fa-check"></i>`;

    return `<div class="tl-step ${cls}">
      <div class="tl-dot">${dotContent}</div>
      <div class="tl-name">${stage.label}</div>
    </div>`;
  }).join('');

  document.getElementById('timeline').innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('detail-body')) initDetails();
});
