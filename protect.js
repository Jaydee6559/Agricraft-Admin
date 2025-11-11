// Place <script type="module" src="./protect.js"></script> near the end of every protected page.
import { onAuthChanged, currentUserIsAdmin, signOutUser } from './auth.js';

onAuthChanged(async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  const isAdmin = await currentUserIsAdmin(user);
  if (!isAdmin) {
    alert('You are not authorized to access the admin panel.');
    await signOutUser();
    window.location.href = 'index.html';
    return;
  }

  // inject sign-out button into topbar if present
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

<script type="module" src="./protect.js"></script>