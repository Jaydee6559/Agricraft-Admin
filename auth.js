// Small auth wrapper used by index.html and protected pages.
import { auth, db } from './firebaseConfig.js';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  getIdTokenResult
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

export async function signIn(identifier, password) {

  const looksLikeEmail = typeof identifier === 'string' && identifier.includes('@');
  let email = identifier;

  if (!looksLikeEmail) {

    try {
      const q = query(collection(db, 'users'), where('username', '==', identifier));
      const snap = await getDocs(q);
      if (!snap.empty) {
        email = snap.docs[0].data().email;
      } else {

        const q2 = query(collection(db, 'users'), where('fullName', '==', identifier));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          email = snap2.docs[0].data().email;
        } else {
          const err = new Error('Account not found');
          err.code = 'auth/user-not-found';
          throw err;
        }
      }
    } catch (e) {

      throw e;
    }
  }

  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  return fbSignOut(auth);
}

export function onAuthChanged(cb) {
  return fbOnAuthStateChanged(auth, cb);
}

export async function currentUserIsAdmin(user) {
  if (!user) return false;
  const token = await getIdTokenResult(user,  true);
  return !!(token.claims && token.claims.admin === true);
}