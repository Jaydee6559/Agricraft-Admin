// Initialize Firebase (browser modules) and export Firestore/Auth/Storage + small helpers.
import { firebaseConfig } from './firebaseConfig.js';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
  getFirestore, collection, query, where,
  getDocs, doc, updateDoc, deleteDoc
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log('Firebase initialized for AgriCraft Admin (projectId:', firebaseConfig.projectId, ')');

/* -- Useful helper functions (import as needed) -- */
export async function getCounts() {
  const counts = { validIds: 0, shops: 0, products: 0, users: 0 };
  try {
    const qValid = query(collection(db, 'validIds'), where('status', '==', 'pending'));
    const qShop  = query(collection(db, 'shops'), where('status', '==', 'pending'));
    const qProd  = query(collection(db, 'products'), where('status', '==', 'pending'));

    const [sValid, sShop, sProd, sUsers] = await Promise.all([
      getDocs(qValid),
      getDocs(qShop),
      getDocs(qProd),
      getDocs(collection(db, 'users'))
    ]);

    counts.validIds = sValid.size;
    counts.shops = sShop.size;
    counts.products = sProd.size;
    counts.users = sUsers.size;
  } catch (err) {
    console.error('getCounts error:', err);
  }
  return counts;
}

export async function getPendingDocs(collectionName) {
  try {
    const q = query(collection(db, collectionName), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('getPendingDocs error:', err);
    return [];
  }
}

export async function getAllDocs(collectionName) {
  try {
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('getAllDocs error:', err);
    return [];
  }
}

export async function approveDoc(collectionName, docId, newStatus = 'verified') {
  try {
    const dref = doc(db, collectionName, docId);
    await updateDoc(dref, { status: newStatus, reviewedAt: new Date() });
    return true;
  } catch (err) {
    console.error('approveDoc error:', err);
    return false;
  }
}

export async function deleteDocById(collectionName, docId) {
  try {
    const dref = doc(db, collectionName, docId);
    await deleteDoc(dref);
    return true;
  } catch (err) {
    console.error('deleteDocById error:', err);
    return false;
  }
}