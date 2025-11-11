// firebaseConfig.js - Standardized to v9.23.0
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

export const firebaseConfig = {
  apiKey: "AIzaSyASMF4JoaSVQAbbaWbRi9NGgNjjYc1KE4Q",
  authDomain: "agricraft-market.firebaseapp.com",
  projectId: "agricraft-market",
  storageBucket: "agricraft-market.appspot.com",
  messagingSenderId: "519072939525",
  appId: "1:519072939525:web:8b6b751ecfccbb2ae9e66c",
  measurementId: "G-KJJ63M068V",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);