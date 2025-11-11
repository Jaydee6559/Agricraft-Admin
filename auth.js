// Small auth wrapper used by index.html and protected pages.
import { auth } from './firebase.js';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  getIdTokenResult
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

export async function signIn(email, password) {
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
  const token = await getIdTokenResult(user, /* forceRefresh */ true);
  return !!(token.claims && token.claims.admin === true);
}