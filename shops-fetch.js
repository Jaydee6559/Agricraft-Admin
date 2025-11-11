import { getPendingDocs, approveShopById, deleteDocById } from './firebase.js';

const listEl = document.getElementById('list');
const refreshBtn = document.getElementById('refresh-shops');

function renderShopItem(item) {
  const el = document.createElement('div');
  el.className = 'shop-item';
  el.style = 'border:1px solid #ddd;padding:12px;margin-bottom:8px;border-radius:6px;display:flex;gap:12px;align-items:flex-start;justify-content:space-between';
  el.innerHTML = `
    <div style="flex:1">
      <div><strong>Shop Name:</strong> ${item.shopName || item.shop || item.businessName || 'Unnamed Shop'}</div>
      <div><strong>Description:</strong> ${item.description || item.shopDescription || item.businessDescription || '-'}</div>
      <div><strong>Policy:</strong> ${item.policy || '-'}</div>
      <div style="margin-top:8px"><strong>Shop Status:</strong> <span class="status">${item.shopStatus || item.status || 'pending'}</span></div>
      <div><strong>ID:</strong> ${item.id ? item.id.substring(0, 8) + '...' : '—'}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
      <button class="btn approve-shop">Approve</button>
      <button class="btn ghost delete-shop">Delete</button>
    </div>
  `;

  const btnApprove = el.querySelector('.approve-shop');
  const btnDelete = el.querySelector('.delete-shop');
  const statusSpan = el.querySelector('.status');

  btnApprove.addEventListener('click', async () => {
    btnApprove.disabled = true;
    btnApprove.textContent = 'Approving...';
    try {
      const ok = await approveShopById(item.id);
      if (ok) {
        statusSpan.textContent = 'approved';
        statusSpan.className = 'status-ok';
        btnApprove.textContent = 'Approved';
        btnApprove.disabled = true;
      } else {
        btnApprove.textContent = 'Approve';
        btnApprove.disabled = false;
        alert('Failed to approve shop. Please try again.');
      }
    } catch (err) {
      console.error('Approve error:', err);
      btnApprove.textContent = 'Approve';
      btnApprove.disabled = false;
      alert('Error approving shop: ' + err.message);
    }
  });

  btnDelete.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete this shop?')) return;
    btnDelete.disabled = true;
    btnDelete.textContent = 'Deleting...';
    try {
      const ok = await deleteDocById('shops', item.id);
      if (ok) {
        el.remove();
      } else {
        alert('Failed to delete shop. Please try again.');
        btnDelete.disabled = false;
        btnDelete.textContent = 'Delete';
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting shop: ' + err.message);
      btnDelete.disabled = false;
      btnDelete.textContent = 'Delete';
    }
  });

  return el;
}

async function loadList() {
  if (!listEl) {
    console.error('List element not found');
    return;
  }
  
  listEl.innerHTML = '<div style="padding:20px;text-align:center">Loading shops...</div>';
  try {
    const shops = await getPendingDocs('shops');
    console.log('Loaded shops:', shops);
    
    if (!shops.length) {
      listEl.innerHTML = '<div class="empty-box">No pending shops found</div>';
      return;
    }
    
    listEl.innerHTML = '';
    shops.forEach(shop => {
      console.log('Shop data:', shop);
      listEl.appendChild(renderShopItem(shop));
    });
  } catch (err) {
    console.error('loadList error:', err);
    listEl.innerHTML = `<div style="color:red;padding:20px;text-align:center">Error loading shops: ${err.message}</div>`;
  }
}


if (refreshBtn) {
  refreshBtn.addEventListener('click', loadList);
} else {
  console.warn('Refresh button not found');
}


document.addEventListener('DOMContentLoaded', loadList);