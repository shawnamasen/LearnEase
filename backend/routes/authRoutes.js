const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  googleSignIn,
  logout,
  verifyToken,
  forgotPassword,
  resendVerificationEmail,
  metrics
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { signupValidation, loginValidation } = require('../utils/validation');

// Public routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/google', googleSignIn);
router.post('/forgot-password', forgotPassword);
router.post('/resend-verification', resendVerificationEmail);

// Protected routes
router.get('/verify', protect, verifyToken);
router.post('/logout', protect, logout);

// Dashboard metrics (protected)
router.get('/metrics', protect, metrics);

module.exports = router;
