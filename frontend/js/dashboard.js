// ============================================================
// dashboard.js — KPIs, charts, funnel, upcoming, recent table
// ============================================================

const STATUS_COLORS = {
  Applied: '#2563eb', Assessment: '#d97706', Interview: '#7c3aed',
  Selected: '#059669', Rejected: '#dc2626', 'On Hold': '#64748b',
};
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

async function initDashboard() {
  if (!requireAuth()) return;
  initShell('dashboard');
  buildModal(); // from applications.js

  // Add-application buttons
  document.getElementById('quick-add').addEventListener('click', () => openModal(null, reloadDashboard));
  const emptyAdd = document.getElementById('empty-add');
  if (emptyAdd) emptyAdd.addEventListener('click', () => openModal(null, reloadDashboard));

  loadDashboard();
}

function reloadDashboard() { loadDashboard(); }

async function loadDashboard() {
  const loading = document.getElementById('loading');
  const empty = document.getElementById('empty');
  const body = document.getElementById('dash-body');
  loading.classList.remove('hidden');
  empty.classList.add('hidden');
  body.classList.add('hidden');

  try {
    const [stats, apps, upcoming] = await Promise.all([
      apiFetch('/applications/stats'),
      apiFetch('/applications'),
      apiFetch('/applications/upcoming'),
    ]);

    loading.classList.add('hidden');

    if (stats.kpis.total === 0) {
      empty.classList.remove('hidden');
      return;
    }
    body.classList.remove('hidden');

    renderKpis(stats.kpis);
    renderStatusChart(stats.statusDistribution);
    renderFunnel(stats.funnel);
    renderMonthlyChart(stats.monthly);
    renderUpcoming(upcoming.slice(0, 5));
    renderRecent(apps.slice(0, 5));
  } catch (err) {
    loading.classList.add('hidden');
    toast(err.message, 'err');
  }
}

function renderKpis(k) {
  animateNum('kpi-total', k.total);
  animateNum('kpi-active', k.active);
  animateNum('kpi-interviews', k.interviews);
  animateNum('kpi-offers', k.offers);
}
function animateNum(id, target) {
  const el = document.getElementById(id);
  const dur = 600, start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(p * target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

let statusChart, monthlyChart;

function renderStatusChart(dist) {
  const labels = dist.map(d => d.status);
  const data = dist.map(d => d.count);
  const colors = labels.map(l => STATUS_COLORS[l] || '#94a3b8');
  const ctx = document.getElementById('statusChart');
  if (statusChart) statusChart.destroy();
  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '64%',
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true,
          font: { family: 'Inter', size: 12 }, padding: 12 } },
      },
    },
  });
}

function renderFunnel(f) {
  const rows = [
    ['Applications', f.applications],
    ['Assessments', f.assessments],
    ['Interviews', f.interviews],
    ['Offers', f.offers],
  ];
  const max = Math.max(f.applications, 1);
  document.getElementById('funnel').innerHTML = rows.map(([label, val]) => {
    const pct = Math.max((val / max) * 100, val > 0 ? 12 : 4);
    return `<div class="funnel-row">
      <div class="fl">${label}</div>
      <div class="funnel-bar"><span style="width:0%">${val}</span></div>
    </div>`;
  }).join('');
  // animate widths
  requestAnimationFrame(() => {
    document.querySelectorAll('#funnel .funnel-bar span').forEach((span, i) => {
      const val = rows[i][1];
      const pct = Math.max((val / max) * 100, val > 0 ? 12 : 4);
      span.style.width = pct + '%';
    });
  });
}

function renderMonthlyChart(monthly) {
  // Build a 12-slot array
  const counts = new Array(12).fill(0);
  monthly.forEach(m => { if (m.month) counts[m.month - 1] = m.count; });
  const ctx = document.getElementById('monthlyChart');
  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: MONTH_NAMES,
      datasets: [{
        data: counts,
        backgroundColor: '#4f46e5',
        borderRadius: 6, barThickness: 16, hoverBackgroundColor: '#7c3aed',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0, font: { family: 'Inter' } },
             grid: { color: '#eee' } },
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
      },
    },
  });
}

function renderUpcoming(items) {
  const wrap = document.getElementById('dash-upcoming');
  if (!items.length) {
    wrap.innerHTML = `<div class="muted" style="font-size:13px;padding:8px 0">No upcoming events. You're all caught up.</div>`;
    return;
  }
  wrap.innerHTML = items.map(u => {
    const days = daysBetween(u.event_date);
    const r = remainingLabel(days);
    return `<div class="up-item">
      <div class="co-logo">${escapeHtml(u.company_name.charAt(0))}</div>
      <div class="up-main">
        <div class="co">${escapeHtml(u.company_name)}</div>
        <div class="ev">${escapeHtml(u.event)}</div>
      </div>
      <div class="up-when">
        <div class="date">${fmtDate(u.event_date)}</div>
        <span class="rem ${r.cls}">${r.text}</span>
      </div>
    </div>`;
  }).join('');
}

function renderRecent(apps) {
  document.getElementById('recent-body').innerHTML = apps.map(a => `
    <tr>
      <td><div class="co-cell"><div class="co-logo">${escapeHtml(a.company_name.charAt(0))}</div>
        <span class="co-name">${escapeHtml(a.company_name)}</span></div></td>
      <td>${escapeHtml(a.job_role)}</td>
      <td>${fmtDate(a.application_date)}</td>
      <td><span class="${badgeClass(a.status)}">${a.status}</span></td>
      <td>${escapeHtml(a.package || '—')}</td>
      <td style="text-align:right">
        <button class="link-btn" onclick="location.href='application-details.html?id=${a.id}'">View</button>
      </td>
    </tr>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('dash-body')) initDashboard();
});
