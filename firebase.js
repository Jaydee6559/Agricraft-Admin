
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  deleteDoc,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

import { db } from './firebaseConfig.js';

function notifyCountsChanged() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('agri:countsChanged'));
    }
  } catch (e) {

  }
}


export async function getAllDocs(collectionName) {
  try {
    const col = collection(db, collectionName);
    const snap = await getDocs(col);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('getAllDocs error', err);
    return [];
  }
}


export async function getPendingDocs(collectionName) {
  try {
    let statusField = 'status';
    if (collectionName === 'shops') statusField = 'shopStatus';
    if (collectionName === 'products') statusField = 'status';
    
    const q = query(collection(db, collectionName), where(statusField, '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error(`getPendingDocs(${collectionName}) error:`, err);
    return [];
  }
}


export async function getUserById(userId) {
  try {
    if (!userId) return null;
    const uRef = doc(db, 'users', userId);
    const snap = await getDoc(uRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error('getUserById error', err);
    return null;
  }
}


export async function getUsersByValidIdStatus(status = 'pending') {
  try {
    const col = collection(db, 'users');
    const q = query(col, where('validIdStatus', '==', status));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('getUsersByValidIdStatus error', err);
    return [];
  }
}


export async function validateUserValidId(userId, opts = {}) {
  try {
    if (!userId) throw new Error('userId required');
    const uRef = doc(db, 'users', userId);
    const payload = {
      validIdStatus: 'validated',
      validIdValidatedAt: new Date().toISOString(),
      ...opts
    };
    await updateDoc(uRef, payload);
    notifyCountsChanged();
    return true;
  } catch (err) {
    console.error('validateUserValidId error', err);
    return false;
  }
}


export async function getUsersByShopStatus(status = 'pending') {
  try {
    const col = collection(db, 'users');
    const q = query(col, where('shopStatus', '==', status));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('getUsersByShopStatus error', err);
    return [];
  }
}

export async function approveShopById(shopId) {
  try {
    const shopRef = doc(db, 'shops', shopId);
    await updateDoc(shopRef, {
      shopStatus: 'approved',
      approvedAt: new Date().toISOString()
    });
    notifyCountsChanged();
    return true;
  } catch (err) {
    console.error('approveShopById error:', err);
    return false;
  }
}


export async function approveProductById(productId) {
  try {
    const prodRef = doc(db, 'products', productId);
    await updateDoc(prodRef, {
      status: 'approved',
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
 * Delete a document by id from any collection
 */
export async function deleteDocById(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    notifyCountsChanged();
    return true;
  } catch (err) {
    console.error(`deleteDocById(${collectionName}, ${docId}) error:`, err);
    return false;
  }
}


export async function getCounts() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const pendingValidSnap = await getDocs(query(collection(db, 'users'), where('validIdStatus', '==', 'pending')));
    const shopsSnap = await getDocs(query(collection(db, 'shops'), where('shopStatus', '==', 'pending')));
    
    // Count products from subcollections
    let productCount = 0;
    const shopsSnapshot = await getDocs(collection(db, 'shops'));
    for (const shopDoc of shopsSnapshot.docs) {
      const productsRef = collection(db, 'shops', shopDoc.id, 'products');
      const pendingQuery = query(productsRef, where('productStatus', '==', 'pending'));
      try {
        const productsSnap = await getDocs(pendingQuery);
        productCount += productsSnap.size;
      } catch (err) {
        // If subcollection doesn't exist or has error, continue
        console.log(`No products subcollection for shop ${shopDoc.id} or error:`, err);
      }
    }
    
    return {
      users: usersSnap.size,
      validIds: pendingValidSnap.size,
      shops: shopsSnap.size,
      products: productCount
    };
  } catch (err) {
    console.error('getCounts error', err);
    return { users: 0, validIds: 0, shops: 0, products: 0 };
  }
}