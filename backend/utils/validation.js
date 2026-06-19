const { body } = require('express-validator');

const signupValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 30 }).withMessage('Full name must be between 2 and 30 characters')
    .matches(/^[A-Za-z\s]+$/).withMessage('Full name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .matches(/^[a-z0-9._]+@(gmail\.com|phinmaed\.com)$/)
    .withMessage('Email must use lowercase letters and end with @gmail.com or @phinmaed.com')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[^\s]{8,16}$/)
    .withMessage('Password must be 8-16 characters and include at least one uppercase letter, one lowercase letter, and one number. Spaces are not allowed'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .matches(/^[a-z0-9._]+@(gmail\.com|phinmaed\.com)$/)
    .withMessage('Please use a valid @gmail.com or @phinmaed.com email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .matches(/^\S+$/).withMessage('Password must not contain spaces')
];

module.exports = { signupValidation, loginValidation };