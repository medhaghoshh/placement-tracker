// ============================================================
// auth.js — shared helpers + login/register logic
// Loaded on every page. Provides API_BASE, token helpers,
// apiFetch(), toast(), and guards protected pages.
// ============================================================

// API base. Because the backend also serves the frontend,
// a relative path works whether you open via localhost:5000
// or the Live Server preview.
const API_BASE = (location.port === '5500' || location.port === '5501')
  ? 'http://localhost:5000/api'   // VS Code Live Server -> talk to Express
  : '/api';                        // served by Express directly

// ---------- Token helpers ----------
function getToken() { return localStorage.getItem('pt_token'); }
function getUser()  { try { return JSON.parse(localStorage.getItem('pt_user')); } catch { return null; } }
function setSession(token, user) {
  localStorage.setItem('pt_token', token);
  localStorage.setItem('pt_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('pt_token');
  localStorage.removeItem('pt_user');
}
function logout() {
  clearSession();
  window.location.href = 'login.html';
}

// ---------- Fetch wrapper (adds JWT, handles errors) ----------
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...options, headers });

  // Auto-logout on expired/invalid token.
  if (res.status === 401 && !path.includes('/auth/')) {
    clearSession();
    window.location.href = 'login.html';
    throw new Error('Unauthorized');
  }

  let data = {};
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

// ---------- Toast notifications ----------
function toast(message, type = 'ok') {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  const icon = type === 'ok' ? '✓' : '!';
  el.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

// ---------- Route guards ----------
// Call on protected pages: redirects to login if no token.
function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}
// Call on auth pages: if already logged in, skip to dashboard.
function redirectIfLoggedIn() {
  if (getToken()) window.location.href = 'dashboard.html';
}

// ---------- Small helpers ----------
function initials(name) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// Login page
// ============================================================
function initLoginPage() {
  redirectIfLoggedIn();
  const form = document.getElementById('login-form');
  const errBox = document.getElementById('form-error');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.classList.add('hidden');
    const btn = form.querySelector('button[type=submit]');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Signing in…';

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.value.trim(),
          password: form.password.value,
        }),
      });
      setSession(data.token, data.user);
      window.location.href = 'dashboard.html';
    } catch (err) {
      errBox.textContent = err.message;
      errBox.classList.remove('hidden');
      btn.disabled = false;
      btn.innerHTML = original;
    }
  });
}

// ============================================================
// Register page
// ============================================================
function initRegisterPage() {
  redirectIfLoggedIn();
  const form = document.getElementById('register-form');
  const errBox = document.getElementById('form-error');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.classList.add('hidden');

    // Client-side validation
    const password = form.password.value;
    if (password.length < 6) {
      errBox.textContent = 'Password must be at least 6 characters.';
      errBox.classList.remove('hidden');
      return;
    }

    const btn = form.querySelector('button[type=submit]');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Creating account…';

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          password: password,
          college: form.college.value.trim(),
          branch: form.branch.value.trim(),
          graduation_year: form.graduation_year.value || null,
        }),
      });
      setSession(data.token, data.user);
      toast('Account created. Welcome to PlacementTrack!');
      setTimeout(() => (window.location.href = 'dashboard.html'), 500);
    } catch (err) {
      errBox.textContent = err.message;
      errBox.classList.remove('hidden');
      btn.disabled = false;
      btn.innerHTML = original;
    }
  });
}

// ---------- Shared shell: sidebar toggle + header + logout ----------
// Called by every protected page after DOM ready.
function initShell(activePage) {
  // Fill avatar + greeting
  const user = getUser();
  const first = user ? user.name.split(' ')[0] : 'there';

  const greetEl = document.getElementById('greet-name');
  if (greetEl) {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    greetEl.textContent = `${part}, ${first}`;
  }
  document.querySelectorAll('.avatar').forEach(a => { a.textContent = initials(user && user.name); });

  // Active nav highlight
  if (activePage) {
    const link = document.querySelector(`.nav a[data-page="${activePage}"]`);
    if (link) link.classList.add('active');
  }

  // Logout buttons
  document.querySelectorAll('[data-logout]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  });

  // Mobile sidebar toggle
  const ham = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('backdrop');
  if (ham && sidebar && backdrop) {
    const open = () => { sidebar.classList.add('open'); backdrop.classList.add('show'); };
    const close = () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); };
    ham.addEventListener('click', open);
    backdrop.addEventListener('click', close);
    sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  }
}

// Auto-init auth pages by looking for their forms.
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('login-form')) initLoginPage();
  if (document.getElementById('register-form')) initRegisterPage();
});
