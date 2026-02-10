// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

// Firebase config from your .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const appAuth = getAuth(app);

// Keep users signed in between refreshes
setPersistence(appAuth, browserLocalPersistence).catch(() => {});

// --- Phone auth helpers ---
export const setupRecaptcha = async (phoneNumber, recaptchaContainerId = 'recaptcha-container') => {
  const verifier = new RecaptchaVerifier(appAuth, recaptchaContainerId, { size: 'invisible' });
  return signInWithPhoneNumber(appAuth, phoneNumber, verifier);
};

// --- Email/password helpers ---
export const emailSignup = (email, password) =>
  createUserWithEmailAndPassword(appAuth, email, password);

export const emailSignin = (email, password) =>
  signInWithEmailAndPassword(appAuth, email, password);

export const signOut = () => fbSignOut(appAuth);

// --- Google Sign-In helper ---
export const googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  return signInWithPopup(appAuth, provider);
};

// --- Default export (for compatibility with old imports) ---
export default appAuth;
