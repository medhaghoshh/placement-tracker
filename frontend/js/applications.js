// ============================================================
// applications.js
// - Shared Add/Edit modal (used by dashboard + applications page)
// - Applications page: list, search, filter, sort, edit, delete
// ============================================================

const STATUSES = ['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected', 'On Hold'];
const JOB_TYPES = ['Full Time', 'Internship', 'Internship + Full Time'];
const ROUNDS = ['Application', 'Online Assessment', 'Technical Interview', 'HR Interview', 'Final Interview', 'Offer'];

// ---------- Formatting helpers ----------
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function badgeClass(status) {
  return 'badge badge-' + status.replace(/\s+/g, '');
}
function daysBetween(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}
function remainingLabel(days) {
  if (days <= 0) return { text: 'Today', cls: 'soon' };
  if (days === 1) return { text: '1 day left', cls: 'soon' };
  if (days <= 3) return { text: `${days} days left`, cls: 'soon' };
  if (days <= 7) return { text: `${days} days left`, cls: 'near' };
  return { text: `${days} days left`, cls: 'far' };
}

// ============================================================
// Shared Add / Edit modal
// ============================================================
function buildModal() {
  const root = document.getElementById('modal-root');
  if (!root || document.getElementById('app-modal')) return;

  const opt = (arr, sel) => arr.map(v =>
    `<option value="${v}"${v === sel ? ' selected' : ''}>${v}</option>`).join('');

  root.innerHTML = `
  <div class="modal-overlay" id="app-modal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-head">
        <h3 id="modal-title">Add application</h3>
        <button class="modal-close" id="modal-close" aria-label="Close">&times;</button>
      </div>
      <form id="app-form">
        <div class="modal-body">
          <div class="form-grid">
            <div>
              <label class="field-lab">Company name <span class="req">*</span></label>
              <input class="fg-input" name="company_name" required placeholder="e.g. Amazon" />
            </div>
            <div>
              <label class="field-lab">Job role <span class="req">*</span></label>
              <input class="fg-input" name="job_role" required placeholder="e.g. SDE-1" />
            </div>
            <div>
              <label class="field-lab">Job type</label>
              <select class="fg-input" name="job_type">${opt(JOB_TYPES, 'Full Time')}</select>
            </div>
            <div>
              <label class="field-lab">Location</label>
              <input class="fg-input" name="location" placeholder="e.g. Bengaluru" />
            </div>
            <div>
              <label class="field-lab">Package</label>
              <input class="fg-input" name="package" placeholder="e.g. ₹12 LPA" />
            </div>
            <div>
              <label class="field-lab">Status <span class="req">*</span></label>
              <select class="fg-input" name="status" required>${opt(STATUSES, 'Applied')}</select>
            </div>
            <div>
              <label class="field-lab">Application date <span class="req">*</span></label>
              <input class="fg-input" type="date" name="application_date" required />
            </div>
            <div>
              <label class="field-lab">Application deadline</label>
              <input class="fg-input" type="date" name="application_deadline" />
            </div>
            <div>
              <label class="field-lab">Current round</label>
              <select class="fg-input" name="current_round">${opt(ROUNDS, 'Application')}</select>
            </div>
            <div>
              <label class="field-lab">Assessment date</label>
              <input class="fg-input" type="date" name="assessment_date" />
            </div>
            <div>
              <label class="field-lab">Interview date</label>
              <input class="fg-input" type="date" name="interview_date" />
            </div>
            <div>
              <label class="field-lab">Job link</label>
              <input class="fg-input" name="job_link" placeholder="https://…" />
            </div>
            <div class="full">
              <label class="field-lab">Notes</label>
              <textarea name="notes" placeholder="Interview prep, referral details, reminders…"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" id="modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary" id="modal-save">Save application</button>
        </div>
      </form>
    </div>
  </div>`;

  // Style the injected labels/inputs to match .field styling
  const style = document.createElement('style');
  style.textContent = `
    .field-lab{display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text)}
    .fg-input{width:100%;font:inherit;font-size:14px;padding:10px 12px;border:1px solid var(--line);
      border-radius:var(--radius-sm);background:var(--surface);color:var(--text)}
    .fg-input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}`;
  document.head.appendChild(style);

  const overlay = document.getElementById('app-modal');
  const close = () => overlay.classList.remove('show');
  document.getElementById('modal-close').addEventListener('click', close);
  document.getElementById('modal-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  document.getElementById('app-form').addEventListener('submit', onModalSubmit);
}

let editingId = null;
let onSavedCallback = null;

function openModal(app = null, onSaved = null) {
  buildModal();
  const overlay = document.getElementById('app-modal');
  const form = document.getElementById('app-form');
  form.reset();
  editingId = app ? app.id : null;
  onSavedCallback = onSaved;

  document.getElementById('modal-title').textContent = app ? 'Edit application' : 'Add application';
  document.getElementById('modal-save').textContent = app ? 'Save changes' : 'Save application';

  if (app) {
    const fields = ['company_name','job_role','job_type','location','package','status',
      'current_round','job_link','notes'];
    fields.forEach(f => { if (form[f] != null && app[f] != null) form[f].value = app[f]; });
    ['application_date','application_deadline','assessment_date','interview_date'].forEach(f => {
      form[f].value = app[f] ? String(app[f]).slice(0, 10) : '';
    });
  } else {
    // Default application date to today for new entries.
    form.application_date.value = new Date().toISOString().slice(0, 10);
  }

  overlay.classList.add('show');
  setTimeout(() => form.company_name.focus(), 50);
}

async function onModalSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('modal-save');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const payload = {
    company_name: form.company_name.value.trim(),
    job_role: form.job_role.value.trim(),
    job_type: form.job_type.value,
    location: form.location.value.trim(),
    package: form.package.value.trim(),
    application_date: form.application_date.value,
    application_deadline: form.application_deadline.value,
    status: form.status.value,
    current_round: form.current_round.value,
    assessment_date: form.assessment_date.value,
    interview_date: form.interview_date.value,
    job_link: form.job_link.value.trim(),
    notes: form.notes.value.trim(),
  };

  try {
    if (editingId) {
      await apiFetch('/applications/' + editingId, { method: 'PUT', body: JSON.stringify(payload) });
      toast('Application updated successfully.');
    } else {
      await apiFetch('/applications', { method: 'POST', body: JSON.stringify(payload) });
      toast('Application added successfully.');
    }
    document.getElementById('app-modal').classList.remove('show');
    if (onSavedCallback) onSavedCallback();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

// Confirm + delete helper, reused across pages.
async function deleteApplication(id, onDone) {
  if (!confirm('Are you sure you want to delete this application?')) return;
  try {
    await apiFetch('/applications/' + id, { method: 'DELETE' });
    toast('Application deleted successfully.');
    if (onDone) onDone();
  } catch (err) {
    toast(err.message, 'err');
  }
}

// ============================================================
// Applications page
// ============================================================
let allApps = [];

function initApplicationsPage() {
  if (!requireAuth()) return;
  initShell('applications');
  buildModal();

  document.getElementById('add-btn').addEventListener('click', () => openModal(null, loadApps));

  // Wire up search + filters (all client-side after one fetch)
  ['search', 'filter-status', 'filter-type', 'sort'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', render);
  });

  loadApps();
}

async function loadApps() {
  const loading = document.getElementById('loading');
  const empty = document.getElementById('empty');
  const wrap = document.getElementById('list-wrap');
  loading.classList.remove('hidden');
  empty.classList.add('hidden');
  wrap.classList.add('hidden');

  try {
    allApps = await apiFetch('/applications');
    loading.classList.add('hidden');
    if (allApps.length === 0) {
      empty.classList.remove('hidden');
    } else {
      wrap.classList.remove('hidden');
      render();
    }
  } catch (err) {
    loading.classList.add('hidden');
    toast(err.message, 'err');
  }
}

function render() {
  const q = (document.getElementById('search').value || '').toLowerCase();
  const status = document.getElementById('filter-status').value;
  const type = document.getElementById('filter-type').value;
  const sort = document.getElementById('sort').value;

  let list = allApps.filter(a => {
    const matchQ = !q ||
      a.company_name.toLowerCase().includes(q) ||
      a.job_role.toLowerCase().includes(q);
    const matchS = status === 'All' || a.status === status;
    const matchT = type === 'All' || a.job_type === type;
    return matchQ && matchS && matchT;
  });

  list.sort((a, b) => {
    if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sort === 'upcoming') {
      const na = nextDate(a), nb = nextDate(b);
      if (!na) return 1; if (!nb) return -1;
      return na - nb;
    }
    return new Date(b.created_at) - new Date(a.created_at); // newest
  });

  const tbody = document.getElementById('table-body');
  const cards = document.getElementById('cards');
  const noResults = document.getElementById('no-results');

  if (list.length === 0) {
    tbody.innerHTML = '';
    cards.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');

  tbody.innerHTML = list.map(rowHtml).join('');
  cards.innerHTML = list.map(cardHtml).join('');

  // Attach handlers (both table + cards use data-attributes)
  document.querySelectorAll('[data-view]').forEach(el =>
    el.addEventListener('click', () => location.href = 'application-details.html?id=' + el.dataset.view));
  document.querySelectorAll('[data-edit]').forEach(el =>
    el.addEventListener('click', () => {
      const app = allApps.find(a => a.id == el.dataset.edit);
      openModal(app, loadApps);
    }));
  document.querySelectorAll('[data-del]').forEach(el =>
    el.addEventListener('click', () => deleteApplication(el.dataset.del, loadApps)));
}

// The nearest future date for "upcoming" sort.
function nextDate(a) {
  const dates = [a.assessment_date, a.interview_date, a.application_deadline]
    .filter(Boolean).map(d => new Date(d)).filter(d => d >= new Date().setHours(0,0,0,0));
  if (!dates.length) return null;
  return new Date(Math.min(...dates));
}

function rowHtml(a) {
  return `<tr>
    <td>
      <div class="co-cell">
        <div class="co-logo">${escapeHtml(a.company_name.charAt(0))}</div>
        <div><div class="co-name">${escapeHtml(a.company_name)}</div>
        <div class="muted" style="font-size:12px">${escapeHtml(a.location || a.job_type)}</div></div>
      </div>
    </td>
    <td>${escapeHtml(a.job_role)}</td>
    <td>${fmtDate(a.application_date)}</td>
    <td><span class="${badgeClass(a.status)}">${a.status}</span></td>
    <td>${escapeHtml(a.package || '—')}</td>
    <td style="text-align:right;white-space:nowrap">
      <button class="link-btn" data-view="${a.id}">View</button>
      <button class="link-btn" data-edit="${a.id}">Edit</button>
      <button class="link-btn" data-del="${a.id}" style="color:var(--st-rejected)">Delete</button>
    </td>
  </tr>`;
}

function cardHtml(a) {
  return `<div class="app-card">
    <div class="r1">
      <div class="co-logo">${escapeHtml(a.company_name.charAt(0))}</div>
      <div style="flex:1">
        <div class="co-name">${escapeHtml(a.company_name)}</div>
        <div class="muted" style="font-size:13px">${escapeHtml(a.job_role)}</div>
      </div>
      <span class="${badgeClass(a.status)}">${a.status}</span>
    </div>
    <div class="meta">
      <div><span>Location</span><br><b>${escapeHtml(a.location || '—')}</b></div>
      <div><span>Package</span><br><b>${escapeHtml(a.package || '—')}</b></div>
      <div><span>Type</span><br><b>${escapeHtml(a.job_type)}</b></div>
      <div><span>Applied</span><br><b>${fmtDate(a.application_date)}</b></div>
    </div>
    <div class="actions">
      <button class="btn btn-ghost btn-sm" data-view="${a.id}">View</button>
      <button class="btn btn-ghost btn-sm" data-edit="${a.id}">Edit</button>
      <button class="btn btn-danger btn-sm" data-del="${a.id}">Delete</button>
    </div>
  </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('applications-page')) initApplicationsPage();
});
