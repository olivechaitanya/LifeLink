import express from 'express';
import { registerDonor, loginDonor } from '../controllers/donor.controller.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Registration validation rules
const registerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('age').isInt({ min: 18, max: 65 }).withMessage('Age must be between 18 and 65'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('mobileNumber').matches(/^[0-9]{10}$/).withMessage('Invalid mobile number'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('location.latitude').isFloat().withMessage('Invalid latitude'),
  body('location.longitude').isFloat().withMessage('Invalid longitude'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  validate
];

// Login validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Auth routes with error handling
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    await registerDonor(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/login', loginValidation, async (req, res, next) => {
  try {
    await loginDonor(req, res);
  } catch (error) {
    next(error);
  }
});

export default router; 