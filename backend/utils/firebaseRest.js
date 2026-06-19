const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

if (!FIREBASE_API_KEY) {
  // This throws immediately on import so misconfig is obvious.
  throw new Error('FIREBASE_API_KEY is missing in backend/.env');
}

const base = 'https://identitytoolkit.googleapis.com/v1';

async function post(path, body) {
  const url = `${base}/${path}?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error?.message || 'Firebase REST API error';
    const err = new Error(msg);
    err.status = res.status;
    err.firebase = data?.error;
    throw err;
  }
  return data;
}

// Email/password sign up
async function signUp(email, password) {
  return post('accounts:signUp', { email, password, returnSecureToken: true });
}

// Email/password sign in
async function signInWithPassword(email, password) {
  return post('accounts:signInWithPassword', { email, password, returnSecureToken: true });
}

// Validate a Firebase ID token and fetch user profile
async function lookup(idToken) {
  return post('accounts:lookup', { idToken });
}

// Send OOB emails (VERIFY_EMAIL, PASSWORD_RESET, etc.)
async function sendOobCode(requestType, idToken, email) {
  // email is optional for some request types but supported
  return post('accounts:sendOobCode', {
    requestType,
    ...(idToken ? { idToken } : {}),
    ...(email ? { email } : {})
  });
}

// Update profile (e.g., displayName)
async function updateProfile(idToken, profile) {
  return post('accounts:update', { idToken, ...profile, returnSecureToken: true });
}

module.exports = {
  signUp,
  signInWithPassword,
  lookup,
  sendOobCode,
  updateProfile
};
