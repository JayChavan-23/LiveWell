// src/services/firebase.js
import admin from 'firebase-admin';

let app;
let firestore;
let auth;

/**
 * Decode base64-encoded JSON (used for Firebase credentials in CI/CD).
 */
function fromB64(jsonB64) {
  try {
    const json = Buffer.from(jsonB64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (err) {
    throw new Error('Failed to decode FIREBASE_CREDENTIALS_B64: ' + err.message);
  }
}

/**
 * Initialize Firebase Admin SDK (singleton)
 */
export function initFirebase() {
  if (app) return app;

  let credentialObj = null;
  if (process.env.FIREBASE_CREDENTIALS_B64) {
    credentialObj = fromB64(process.env.FIREBASE_CREDENTIALS_B64);
  } else if (process.env.FIREBASE_CONFIG) {
    credentialObj = JSON.parse(process.env.FIREBASE_CONFIG);
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    credentialObj = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  } else {
    throw new Error(
      'Firebase credentials missing. Set FIREBASE_CREDENTIALS_B64 or FIREBASE_CONFIG or split vars.'
    );
  }

  if (!credentialObj.project_id || !credentialObj.client_email || !credentialObj.private_key) {
    throw new Error('Firebase credential object missing required fields');
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(credentialObj),
  });

  firestore = admin.firestore();
  auth = admin.auth();

  console.log(`[firebase] initialized for project: ${credentialObj.project_id}`);
  return app;
}

/**
 * Singleton getters
 */
export const getAuth = () => {
  if (!auth) initFirebase();
  return auth;
};

export const getFirestore = () => {
  if (!firestore) initFirebase();
  return firestore;
};

/**
 * Health check helper for readiness probes
 */
export async function checkFirebaseHealth() {
  try {
    const db = getFirestore();
    const test = await db.collection('health').limit(1).get();
    return { ok: true, count: test.size };
  } catch (err) {
    console.error('[firebase] health check failed', err);
    return { ok: false, error: err.message };
  }
}
