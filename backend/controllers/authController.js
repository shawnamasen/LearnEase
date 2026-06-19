const { validationResult } = require('express-validator');
const {
  signUp,
  signInWithPassword,
  lookup,
  sendOobCode,
  updateProfile
} = require('../utils/firebaseRest');

let admin = null;
try {
  // Optional dependency: only used for metrics + robust token verification.
  // If firebase-admin is not installed or credentials are missing, we gracefully fallback.
  ({ admin } = require('../config/firebase'));
} catch (e) {
  admin = null;
}

function mapFirebaseError(code) {
  // Firebase REST errors are strings like: EMAIL_EXISTS, INVALID_PASSWORD, USER_DISABLED, etc.
  switch (code) {
    case 'EMAIL_EXISTS':
      return { status: 409, message: 'Email already registered' };
    case 'INVALID_EMAIL':
      return { status: 400, message: 'Invalid email address' };
    case 'WEAK_PASSWORD':
      return { status: 400, message: 'Password is too weak' };
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_PASSWORD':
      return { status: 401, message: 'Invalid email or password' };
    case 'USER_DISABLED':
      return { status: 403, message: 'Account has been disabled' };
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return { status: 429, message: 'Too many failed attempts. Try again later' };
    default:
      return { status: 500, message: code || 'Authentication failed' };
  }
}

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Create account
    const created = await signUp(email, password);

    // Set display name (optional)
    if (name) {
      await updateProfile(created.idToken, { displayName: name });
    }

    // Send email verification
    await sendOobCode('VERIFY_EMAIL', created.idToken);

    // Fetch user profile (to get emailVerified, displayName)
    const profile = await lookup(created.idToken);
    const user = profile?.users?.[0];

    return res.status(201).json({
      success: true,
      message: 'User created successfully. Please verify your email.',
      data: {
        uid: created.localId,
        email: user?.email || email,
        name: user?.displayName || name || null,
        emailVerified: Boolean(user?.emailVerified),
        createdAt: user?.createdAt || null
      },
      // Return a Firebase ID token so the frontend can use it immediately if needed.
      token: created.idToken,
      refreshToken: created.refreshToken,
      expiresIn: Number(created.expiresIn || 0)
    });
  } catch (error) {
    console.error('Signup error:', error);
    const fbCode = error?.firebase?.message;
    const mapped = mapFirebaseError(fbCode);
    return res.status(mapped.status).json({ success: false, error: mapped.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Sign in
    const signedIn = await signInWithPassword(email, password);

    // Lookup to check verification + displayName
    const profile = await lookup(signedIn.idToken);
    const user = profile?.users?.[0];

    if (user && user.emailVerified === false) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email before logging in',
        requiresVerification: true,
        email
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        uid: signedIn.localId,
        email: user?.email || email,
        name: user?.displayName || null,
        emailVerified: Boolean(user?.emailVerified),
        createdAt: user?.createdAt || null,
        lastLoginAt: user?.lastLoginAt || null
      },
      token: signedIn.idToken,
      refreshToken: signedIn.refreshToken,
      expiresIn: Number(signedIn.expiresIn || 0)
    });
  } catch (error) {
    console.error('Login error:', error);
    const fbCode = error?.firebase?.message;
    const mapped = mapFirebaseError(fbCode);
    return res.status(mapped.status === 500 ? 401 : mapped.status).json({
      success: false,
      error: mapped.status === 500 ? 'Login failed' : mapped.message
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerificationEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const signedIn = await signInWithPassword(email, password);
    await sendOobCode('VERIFY_EMAIL', signedIn.idToken);

    return res.status(200).json({ success: true, message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    const fbCode = error?.firebase?.message;
    const mapped = mapFirebaseError(fbCode);
    return res.status(mapped.status === 500 ? 400 : mapped.status).json({
      success: false,
      error: mapped.status === 500 ? 'Failed to send verification email' : mapped.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    await sendOobCode('PASSWORD_RESET', null, email);

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a reset link'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Always keep response generic to avoid account enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a reset link'
    });
  }
};

// @desc    Google Sign-In
// @route   POST /api/auth/google
// @access  Public
// Frontend sends a Firebase ID token from signInWithPopup().
const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: 'ID token is required' });
    }

    // Prefer Admin verification if available (more reliable than REST lookup).
    if (admin?.apps?.length) {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const record = await admin.auth().getUser(decoded.uid);

      return res.status(200).json({
        success: true,
        message: 'Google sign-in successful',
        data: {
          uid: record.uid,
          email: record.email || null,
          name: record.displayName || null,
          photoURL: record.photoURL || null,
          emailVerified: Boolean(record.emailVerified),
          createdAt: record.metadata?.creationTime || null,
          lastLoginAt: record.metadata?.lastSignInTime || null
        },
        token: idToken
      });
    }

    // Fallback: REST lookup (works without service account)
    const profile = await lookup(idToken);
    const user = profile?.users?.[0];

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired ID token' });
    }

    return res.status(200).json({
      success: true,
      message: 'Google sign-in successful',
      data: {
        uid: user.localId,
        email: user.email,
        name: user.displayName || null,
        photoURL: user.photoUrl || null,
        emailVerified: Boolean(user.emailVerified),
        createdAt: user.createdAt || null,
        lastLoginAt: user.lastLoginAt || null
      },
      token: idToken
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    const msg = error?.errorInfo?.message || error?.firebase?.message || error?.message || 'Google sign-in failed';
    return res.status(401).json({ success: false, error: msg });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  // Stateless token auth: logout is handled client-side by deleting stored token.
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
const verifyToken = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      data: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        emailVerified: Boolean(user.emailVerified)
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// @desc    Simple metrics for dashboard
// @route   GET /api/auth/metrics
// @access  Private (uses protect middleware in routes)
const metrics = async (req, res) => {
  try {
    const adminConfigured = Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

    // If Admin isn't configured, don't hard fail the dashboard—return a safe response.
    if (!admin?.apps?.length) {
      return res.status(200).json({
        success: true,
        data: {
          adminConfigured,
          totalUsers: null
        }
      });
    }

    // Count users via Admin SDK pagination.
    let totalUsers = 0;
    let nextPageToken = undefined;

    do {
      const list = await admin.auth().listUsers(1000, nextPageToken);
      totalUsers += list.users.length;
      nextPageToken = list.pageToken;
    } while (nextPageToken);

    return res.status(200).json({
      success: true,
      data: {
        adminConfigured,
        totalUsers
      }
    });
  } catch (error) {
    console.error('Metrics error:', error);
    // Still return 200 to avoid breaking the dashboard boot.
    return res.status(200).json({
      success: true,
      data: {
        adminConfigured: Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
        totalUsers: null
      }
    });
  }
};

module.exports = {
  signup,
  login,
  resendVerificationEmail,
  forgotPassword,
  googleSignIn,
  logout,
  verifyToken,
  metrics
};
