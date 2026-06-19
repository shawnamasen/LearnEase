// aiRoutes.js
const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');

const { protect } = require('../middleware/authMiddleware');
const { 
  chat, 
  quiz, 
  reviewer,
  validateContent,
  quizFromFile 
} = require('../controllers/aiController');

// Store uploads in a temp folder inside backend
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 12 * 1024 * 1024 } // 12MB
});

router.post('/chat', protect, chat);
router.post('/quiz', protect, quiz);
router.post('/validate-content', protect, upload.single('file'), validateContent);
router.post('/quiz-from-file', protect, upload.single('file'), quizFromFile);
// multipart/form-data: file(optional), text(optional), grade(optional), subject(optional), mode(optional)
router.post('/reviewer', protect, upload.single('file'), reviewer);

module.exports = router;