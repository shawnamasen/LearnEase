const { lookup } = require('../utils/firebaseRest');

// Middleware to verify Firebase ID token (no firebase-admin required)
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    const profile = await lookup(token);
    const user = profile?.users?.[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    req.user = {
      uid: user.localId,
      email: user.email,
      name: user.displayName || null,
      emailVerified: Boolean(user.emailVerified)
    };

    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

const requireEmailVerification = (req, res, next) => {
  if (!req.user?.emailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Please verify your email to access this resource',
      requiresVerification: true
    });
  }
  return next();
};

module.exports = { protect, requireEmailVerification };
