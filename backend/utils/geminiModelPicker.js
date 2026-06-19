// backend/utils/geminiModelPicker.js
// CommonJS module used by controllers/aiController.js

/**
 * Returns a Gemini model name that works for your app.
 * Supports both:
 *  - getWorkingModelName()  ✅ (what your controller expects)
 *  - pickGeminiModel()      ✅ (newer name)
 *
 * Env vars you can set in backend/.env:
 *  - GEMINI_MODEL (global default)
 *  - GEMINI_MODEL_FAST (fast default)
 *  - GEMINI_MODEL_PRO (heavy default)
 */
function pickGeminiModel(options = {}) {
  const {
    purpose = 'default', // 'chat' | 'quiz' | 'reviewer' | 'default'
    preferFast = true
  } = options;

  const envDefault = process.env.GEMINI_MODEL?.trim();
  const envFast = process.env.GEMINI_MODEL_FAST?.trim();
  const envPro = process.env.GEMINI_MODEL_PRO?.trim();

  // Safe fallbacks (change anytime)
  const fallbackFast = 'gemini-1.5-flash';
  const fallbackPro = 'gemini-1.5-pro';

  if (envDefault) return envDefault;

  const heavyPurposes = new Set(['reviewer', 'quiz']);
  const isHeavy = heavyPurposes.has(String(purpose).toLowerCase());

  // If heavy but preferFast=false → use PRO
  if (isHeavy && preferFast === false) {
    return envPro || fallbackPro;
  }

  // Default: fast
  return envFast || fallbackFast;
}

/**
 * Backwards-compatible function name used by some controllers.
 * If your controller calls getWorkingModelName(), this will now exist.
 */
function getWorkingModelName(purpose = 'default') {
  // Default behavior: chat = fast, reviewer/quiz = pro
  const isHeavy = ['reviewer', 'quiz'].includes(String(purpose).toLowerCase());
  return pickGeminiModel({ purpose, preferFast: !isHeavy });
}

module.exports = {
  pickGeminiModel,
  getWorkingModelName
};
