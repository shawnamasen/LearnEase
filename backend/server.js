const path = require('path');
const dotenv = require('dotenv');

// Load env from backend/.env first (most important), then fallback to repo root .env if present.
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'none'"]
      }
    },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
  })
);

app.use(
  cors({
    origin: [
      process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

app.options('*', cors());

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

/* =========================
   STRICT LOGIN RATE LIMITER
========================= */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: "Too many login attempts. Try again in 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', loginLimiter);


app.get('/health', (req, res) => {
  // Lightweight health. Avoid importing firebase-admin here to prevent hard crashes if deps missing.
  const adminConfigured = Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
  res.status(200).json({
    ok: true,
    service: 'learnease-backend',
    time: new Date().toISOString(),
    adminConfigured
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
