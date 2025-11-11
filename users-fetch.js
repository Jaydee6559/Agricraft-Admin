import { getAllDocs, deleteDocById } from './firebase.js';

// auto-run when imported from users.html
const tbody = document.getElementById('users-tbody');
const totalEl = document.getElementById('total-users');
const refreshBtn = document.getElementById('refresh-users');

function userRow(u) {
  return `<tr data-id="${u.id}">
    <td>${u.id}</td>
    <td>${u.fullName ?? u.name ?? '-'}</td>
    <td>${u.phone ?? u.number ?? '-'}</td>
    <td>${u.email ?? '-'}</td>
    <td class="${(u.status === 'verified') ? 'status-ok' : 'status-pending'}">${u.status ?? '-'}</td>
    <td><button class="btn ghost delete">Delete</button></td>
  </tr>`;
}

async function loadUsers() {
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
  try {
    const list = await getAllDocs('users');
    totalEl && (totalEl.textContent = list.length);
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6">No users</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(userRow).join('');
    attachHandlers();
  } catch (err) {
    console.error('loadUsers error', err);
    tbody.innerHTML = `<tr><td colspan="6">Error: ${err.message}</td></tr>`;
  }
}

function attachHandlers() {
  tbody.querySelectorAll('button.delete').forEach(btn => {
    btn.onclick = async (e) => {
      const tr = e.target.closest('tr');
      const id = tr.dataset.id;
      if (!confirm('Delete this user?')) return;
      e.target.disabled = true;
      const ok = await deleteDocById('users', id);
      if (ok) tr.remove();
      else e.target.disabled = false;
      // update total count
      if (totalEl) {
        const remaining = tbody.querySelectorAll('tr[data-id]').length;
        totalEl.textContent = remaining;
      }
    };
  });
}

refreshBtn && refreshBtn.addEventListener('click', loadUsers);

// initial load
loadUsers();