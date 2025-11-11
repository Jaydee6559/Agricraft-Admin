// Place <script type="module" src="./protect.js"></script> near the end of every protected page.
import { onAuthChanged, signOutUser } from './auth.js';

const ADMIN_EMAIL = 'admin@gmail.com';

onAuthChanged(async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  if (user.email !== ADMIN_EMAIL) {
    alert('Not authorized — signing out.');
    await signOutUser();
    window.location.href = 'index.html';
    return;
  }

  const topbar = document.querySelector('.topbar');
  if (topbar && !document.getElementById('signout-btn')) {
    const btn = document.createElement('button');
    btn.id = 'signout-btn';
    btn.className = 'btn ghost';
    btn.textContent = 'Sign out';
    btn.style.marginLeft = '12px';
    btn.addEventListener('click', async () => {
      await signOutUser();
      window.location.href = 'index.html';
    });
    topbar.appendChild(btn);
  }
});