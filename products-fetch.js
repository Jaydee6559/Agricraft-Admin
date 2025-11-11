import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDoc 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { db } from './firebaseConfig.js';

const tbody = document.getElementById('products-tbody');
const pendingEl = document.getElementById('pending-products');
const refreshBtn = document.getElementById('refresh-products');

function notifyCountsChanged() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('agri:countsChanged'));
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Get all pending products from shops subcollections
 */
async function getPendingProducts() {
  try {
    console.log('Fetching pending products...');
    
    // Get all shops
    const shopsSnapshot = await getDocs(collection(db, 'shops'));
    const pendingProducts = [];
    
    console.log(`Found ${shopsSnapshot.size} shops`);

    // Check each shop's products subcollection
    for (const shopDoc of shopsSnapshot.docs) {
      const shopId = shopDoc.id;
      const shopData = shopDoc.data();
      const productsRef = collection(db, 'shops', shopId, 'products');
      const pendingQuery = query(productsRef, where('productStatus', '==', 'pending'));
      
      try {
        const productsSnapshot = await getDocs(pendingQuery);
        console.log(`Shop ${shopId} has ${productsSnapshot.size} pending products`);

        // Add each pending product to the list
        productsSnapshot.docs.forEach(productDoc => {
          const productData = productDoc.data();
          pendingProducts.push({
            id: productDoc.id,
            shopId: shopId,
            shopName: shopData.shopName || shopData.businessName || shopData.name || 'Unnamed Shop',
            ...productData
          });
        });
      } catch (subcollectionError) {
        console.log(`No products subcollection for shop ${shopId} or error:`, subcollectionError);
      }
    }

    console.log(`Total pending products found: ${pendingProducts.length}`);
    return pendingProducts;
  } catch (err) {
    console.error('getPendingProducts error:', err);
    return [];
  }
}

/**
 * Approve a product in subcollection
 */
async function approveProductById(shopId, productId) {
  try {
    const productRef = doc(db, 'shops', shopId, 'products', productId);
    await updateDoc(productRef, {
      productStatus: 'approved',
      approvedAt: new Date().toISOString()
    });
    notifyCountsChanged();
    return true;
  } catch (err) {
    console.error('approveProductById error:', err);
    return false;
  }
}

/**
 * Delete a product from subcollection
 */
async function deleteProductById(shopId, productId) {
  try {
    const productRef = doc(db, 'shops', shopId, 'products', productId);
    await deleteDoc(productRef);
    notifyCountsChanged();
    return true;
  } catch (err) {
    console.error('deleteProductById error:', err);
    return false;
  }
}

function renderProductRow(item) {
  return `<tr data-id="${item.id}" data-shop-id="${item.shopId}">
    <td>${item.id ? item.id.substring(0, 8) + '...' : '-'}</td>
    <td>${item.shopName || '-'}</td>
    <td>${item.productName || item.name || '-'}</td>
    <td>${item.description ? (item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description) : '-'}</td>
    <td class="${item.productStatus === 'approved' ? 'status-ok' : 'status-pending'}">
      ${item.productStatus || 'pending'}
    </td>
    <td>
      <button class="btn approve">Approve</button>
      <button class="btn ghost delete">Delete</button>
    </td>
  </tr>`;
}

async function loadProducts() {
  if (!tbody) {
    console.error('Products table body not found');
    return;
  }
  
  tbody.innerHTML = '<tr><td colspan="6">Loading products…</td></tr>';
  try {
    const list = await getPendingProducts();
    
    if (pendingEl) {
      pendingEl.textContent = list.length;
    }
    
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6">No pending products found</td></tr>';
      return;
    }
    
    tbody.innerHTML = list.map(renderProductRow).join('');
    attachHandlers();
    
    console.log('Products loaded successfully:', list);
  } catch (err) {
    console.error('loadProducts error', err);
    tbody.innerHTML = `<tr><td colspan="6">Error loading products: ${err.message}</td></tr>`;
  }
}

function attachHandlers() {
  if (!tbody) return;
  
  // Approve buttons
  tbody.querySelectorAll('button.approve').forEach(btn => {
    btn.onclick = async (e) => {
      const tr = e.target.closest('tr');
      const productId = tr.dataset.id;
      const shopId = tr.dataset.shopId;
      
      if (!productId || !shopId) {
        alert('Error: Missing product or shop information');
        return;
      }
      
      e.target.disabled = true;
      e.target.textContent = 'Approving...';
      
      try {
        const ok = await approveProductById(shopId, productId);
        if (ok) {
          tr.remove();
      
          if (pendingEl) {
            const remaining = tbody.querySelectorAll('tr[data-id]').length;
            pendingEl.textContent = remaining;
          }
          alert('Product approved successfully!');
        } else {
          alert('Failed to approve product. Please try again.');
          e.target.disabled = false;
          e.target.textContent = 'Approve';
        }
      } catch (error) {
        console.error('Error approving product:', error);
        alert('An error occurred while approving the product: ' + error.message);
        e.target.disabled = false;
        e.target.textContent = 'Approve';
      }
    };
  });

  // Delete buttons
  tbody.querySelectorAll('button.delete').forEach(btn => {
    btn.onclick = async (e) => {
      const tr = e.target.closest('tr');
      const productId = tr.dataset.id;
      const shopId = tr.dataset.shopId;
      
      if (!confirm('Are you sure you want to delete this product?')) return;
      
      e.target.disabled = true;
      e.target.textContent = 'Deleting...';
      
      try {
        const ok = await deleteProductById(shopId, productId);
        if (ok) {
          tr.remove();
          // Update pending count
          if (pendingEl) {
            const remaining = tbody.querySelectorAll('tr[data-id]').length;
            pendingEl.textContent = remaining;
          }
          alert('Product deleted successfully!');
        } else {
          alert('Failed to delete product. Please try again.');
          e.target.disabled = false;
          e.target.textContent = 'Delete';
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('An error occurred while deleting the product: ' + error.message);
        e.target.disabled = false;
        e.target.textContent = 'Delete';
      }
    };
  });
}

// Refresh button
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    console.log('Refresh clicked');
    loadProducts();
  });
} else {
  console.warn('Refresh button not found');
}

// Initial load when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadProducts);
} else {
  loadProducts();
}

export async function addSystemNote(type, data = {}) {
  try {
    const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
    
    const noteTemplates = { 
      userRegistered: (data) => ` New user registered: ${data.fullName || data.email}`,
      validIdSubmitted: (data) => ` Valid ID submitted by: ${data.fullName || 'User'}`,
      validIdApproved: (data) => ` Valid ID approved for: ${data.fullName || 'User'}`,
      shopSubmitted: (data) => ` Shop registration: ${data.shopName || 'New Shop'}`,
      shopApproved: (data) => ` Shop approved: ${data.shopName || 'Shop'}`,
      productSubmitted: (data) => `🛒 Product submitted: ${data.productName || 'New Product'}`,
      productApproved: (data) => ` Product approved: ${data.productName || 'Product'}`,
      adminAction: (data) => ` Admin action: ${data.action || 'System update'}`
    };

    const message = noteTemplates[type] ? noteTemplates[type](data) : `📝 ${data.message || 'System activity'}`;

    await addDoc(collection(db, 'systemNotes'), {
      type,
      message,
      timestamp: serverTimestamp(),
      admin: data.admin || 'System',
      ...data
    });

    return true;
  } catch (err) {
    console.error('addSystemNote error:', err);
    return false;
  }
}