// ============================================================
// profile.js — view & update profile
// ============================================================

async function initProfile() {
  if (!requireAuth()) return;
  initShell('profile');

  // Inject small styling for injected labels (reuse modal input classes)
  const style = document.createElement('style');
  style.textContent = `
    .field-lab{display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text)}
    .fg-input{width:100%;font:inherit;font-size:14px;padding:10px 12px;border:1px solid var(--line);
      border-radius:var(--radius-sm);background:var(--surface);color:var(--text)}
    .fg-input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
    .fg-input:disabled{background:#f4f4f2;color:var(--muted)}`;
  document.head.appendChild(style);

  const form = document.getElementById('profile-form');

  try {
    const user = await apiFetch('/auth/profile');
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('profile-body').classList.remove('hidden');

    document.getElementById('profile-avatar').textContent = initials(user.name);
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;

    form.name.value = user.name || '';
    form.email.value = user.email || '';
    form.college.value = user.college || '';
    form.branch.value = user.branch || '';
    form.graduation_year.value = user.graduation_year || '';
  } catch (err) {
    document.getElementById('loading').classList.add('hidden');
    toast(err.message, 'err');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-profile');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name.value.trim(),
          college: form.college.value.trim(),
          branch: form.branch.value.trim(),
          graduation_year: form.graduation_year.value || null,
        }),
      });
      // Keep the header/avatar in sync with the new name.
      const user = getUser();
      user.name = form.name.value.trim();
      localStorage.setItem('pt_user', JSON.stringify(user));
      document.getElementById('profile-name').textContent = user.name;
      document.getElementById('profile-avatar').textContent = initials(user.name);
      document.querySelectorAll('.avatar').forEach(a => a.textContent = initials(user.name));
      toast('Profile updated successfully.');
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      btn.disabled = false; btn.textContent = 'Save changes';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('profile-form')) initProfile();
});
