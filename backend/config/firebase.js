const admin = require('firebase-admin');

function normalizePrivateKey(key) {
  if (!key) return '';
  // Accept both raw multiline and \n escaped formats.
  return String(key).replace(/\\n/g, '\n');
}

function hasAdminEnv() {
  return Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

// Initialize Admin SDK (only if env vars are present)
if (!admin.apps.length && hasAdminEnv()) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
      })
    });
    console.log('✅ Firebase Admin initialized');
  } catch (e) {
    // Don't crash the server — metrics will just be unavailable.
    console.warn('⚠️ Firebase Admin failed to initialize:', e?.message || e);
  }
} else if (!hasAdminEnv()) {
  console.log('ℹ️ Firebase Admin not configured (set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to enable metrics).');
}

module.exports = { admin };
